const http = require('http')
const fs = require('fs')
const { Server } = require('socket.io');
const { exec } = require('child_process');
const axios = require('axios');
var Datastore = require('nedb');
require('dotenv').config()

const io = new Server(3001, {
    cors: {
        origin: "http://localhost",
        methods: ["GET", "POST"]
      }
});

var ip = undefined;
const { networkInterfaces } = require('os');

const nets = networkInterfaces();
const results = Object.create(null);
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        console.log(net.address);
        ip = net.address;
          
      }
  }
}


var parseSettings = {};
fs.readFile("server/parseSettings.json", "UTF-8", function(err, data){
  parseSettings = JSON.parse(data);
});

var db = {};

var settings = {
    "teamNumber" : process.env.TEAM,
    "compCode" : process.env.COMP_CODE,
    "timeToGet" : 60,
    "year" : process.env.COMP_YEAR,
    "matchType" : "Qualification",
    "streamCode": process.env.STREAM_CODE
}

var currentlyKnownInfo = {};

function determineWinner(red, blue, type){
  // [final, fouls, auton]
  if(red[0] > blue[0]){
    return "red";
  }
  if(blue[0] > red[0]){
    return "blue";
  }
  return "tie";

}

function getAuthToken(){
  return "Basic " + process.env.FRC_API;
}

function infoAboutComp(){
  axios.get("https://scout.robosmrt.com/api/quick/state", {
        headers: {
          "Authorization": getAuthToken()
        }
      }).then(function(response){
        
        var data = response.data;
        //console.log(objects)

        // data.rankings
         // team
         // rank
         // rp
         // tiebreaker
         // .record
          // wins
          // losses
          // ties

        currentlyKnownInfo = {
           currentMatch: data.currentMatch,
           currentlyRunning: data.currentlyRunning,
           currentMatchType: data.matchType
        }
        //console.log(currentlyKnownInfo);
        io.emit('log', {request : "eventUpdate", data : currentlyKnownInfo})
        io.emit('eventInfo', currentlyKnownInfo);
      }).catch(function(err){
        console.log(err)
        //io.emit('log', {request : "getMatches", data : "[API] Error, Invalid Match Code..."})
      });
}

async function recvMatches(create){
  db.matches.remove({comp:settings["year"] + settings["compCode"]}, {multi: true}, async function(err, rem){
      var matches = (await axios.get("https://scout.robosmrt.com/api/quick/matches?teamNumber=" + settings["teamNumber"], {
        headers: {
          "Authorization": getAuthToken()
        }
      })).data["matches"];
      

      createMatches(matches);
  });
}

function createMatches(matches){
  matches.forEach(match => {
    var newMatch = {
      n : match.matchNumber,
      comp : settings["year"] + settings["compCode"],
      teams : [match.teams[0].team, match.teams[1].team, match.teams[2].team, match.teams[3].team, match.teams[4].team, match.teams[5].team],
      status : !match.results.finished ? "pending" : "finished",
      winner : match.results.finished ? determineWinner([match.results.red], [match.results.blue], settings["matchType"]) : undefined,
      level : settings["matchType"],
      rankingPoints : [false,false,false,false],
      scores : [match.results.red, match.results.blue],
      d: currentlyKnownInfo.currentMatchType + " " + currentlyKnownInfo.currentMatch
    } 

    db.matches.insert(newMatch, function (err, newDoc) {

    });
  });

  setTimeout(function(){
    db.matches.find({comp:settings["year"] + settings["compCode"]}, function (err, docs) {
        io.emit('matches', {docs:docs, currentMatch: currentlyKnownInfo.currentMatch, currentlyRunning: currentlyKnownInfo.currentlyRunning, currentMatchType: currentlyKnownInfo.currentMatchType});
        io.emit('log', {request : "getMatches", data : docs})
    });
  }, 5000);
}

function removeAllMatches(){
    db.matches.remove({}, { multi: true }, function (err, numRemoved) {});
}

setInterval(function(){
  infoAboutComp();
  recvMatches();
}, 60000);

async function app(pid = undefined) {
    db.matches = new Datastore({ filename: 'storage/matches.db', autoload: true });
    db.matches.loadDatabase();
    infoAboutComp();
    removeAllMatches();
    //setTimeout(addDemoMatches, 1000);
    recvMatches();
    
    io.on('connection', (socket) => {
        console.log("New Connection")
        socket.on('notif', (type) => {
          if(type.length == 1){
            type = type[0];
          }
            console.log(type)
            io.emit('notif_s', type)
        });
        socket.on("getEventInfo" , () => {
          socket.emit('eventInfo', currentlyKnownInfo);
        });
        socket.on('getTeam', () => {
            socket.emit('team', settings["teamNumber"])
            io.emit('log', {request : "getTeam", data : settings["teamNumber"]})
        });
        socket.on("createMatches", () => {
          recvMatches();
        });
        socket.on('getIp', () => {
          socket.emit('ip', ip)
          io.emit('log', {request : "getIp", data : ip})
        });
        socket.on("setConfig", (eventCode, matchType) => {
          if(!(eventCode == undefined || eventCode == "")){
            settings["compCode"] = eventCode.substring(4);
          }

          settings["matchType"] = matchType;
          removeAllMatches();
          recvMatches();
          infoAboutComp();
        });
        socket.on("setTeam", (num) => {
          if(num.length != undefined){
            num = num[0];
          }
            settings["teamNumber"] = num;
            console.log("Setting team to " + num);
            io.emit('team', settings["teamNumber"])
            io.emit('log', {request : "setTeam", data : settings["teamNumber"]})
        });
        socket.on("getMatches", () => {
            db.matches.find({}, function (err, docs) {
                socket.emit("matches", {docs: docs, currentMatch: currentlyKnownInfo.currentMatch, currentlyRunning: currentlyKnownInfo.currentlyRunning, currentMatchType: currentlyKnownInfo.currentMatchType})
                io.emit('log', {request : "getMatches", data : docs})
            });
            
        });
        socket.on('changeLock', (locked) => {
          if(locked.length != undefined){
            locked = locked[0];
          }
            io.emit('lock', locked);
            io.emit('log', {request : "get", data : locked})
        })

        socket.on('getMatches_API', () => {
          removeAllMatches();
          //setTimeout(addDemoMatches, 1000);
          recvMatches();
          infoAboutComp();
        });

        socket.on("changeSetting", (setting, value) => {
          if(setting.length != undefined){
            value = setting[1]
            setting = setting[0]
          }
            settings[setting] = value;
            console.log("Setting " + setting + " to " + value);
            infoAboutComp();
            io.emit('allSettings', settings)
            io.emit('log', {request : "changeSetting", data : settings})
        });

        socket.on("getSettings", () => {
            socket.emit('allSettings', settings)
            io.emit('log', {request : "getSettings", data : settings})
        });

        socket.on("switchStreamView", () => {
          io.emit('switchStreamView')
        });

        socket.on("showScheduleView", () => {
          io.emit('showScheduleView')
        });

        socket.on('reloadStream', () => {
          io.emit('reloadStream');
        });

        socket.on('gitPull', () => {
          exec(`git pull`, (err, stdout, stderr) => {
            io.emit('gitCommandOutput', stdout);
          });
        });

        socket.on('restartApp', () => {
          if (pid == undefined) return;
          exec(`echo ${pid}`, (err, stdout, stderr) => {
            io.emit('gitCommandOutput', "Killing process " + stdout + "...");
          });
          setTimeout(() => {
            exec(`kill -n 9 ${pid}`, (err, stdout, stderr) => {});
          }, 1500);
        });
        
    });

    
  const server = http.createServer((req, res) => {

    // check if request is a GET request to get data or HTML
    if(req.method == "GET"){

      // If the request is not going to the API, return the HTML file
      if(req.url.includes("/api")){
        // data needs to be gotten from api

        // all API data is JSON
        res.writeHead(200, { 'content-type': 'application/json' });

        // first condition checking if API is looking for battery being signed out
        if(req.url.includes("isBatteryOut")){
          
          // get the battery raw # and then turn it into a proper
          var batRaw = req.url.split("/")[req.url.split("/").length - 1];
          if(batRaw.length != 4){
            res.end(JSON.stringify({valid : false}));
          }
          var batNum = batRaw.substring(0,2) + "." + batRaw.substring(2,4);
          batNum = parseFloat(batNum);
          // run the implemented function and handle the result back to the page

        }
        
        
      }else{

        // if default path, set back to michael
        if(req.url == "/"){
          req.url = "/schedule.html";
        }
        res.setHeader("Content-Type", "text/html");
        if(req.url.includes("svg")){
            res.setHeader("Content-Type", "image/svg+xml");
        }else if(req.url.includes("png")){
            res.setHeader("Content-Type", "image/png");
        }
        // get static file from folder
        fs.readFile("webcontent" + req.url, function(err, data) {
          // must specify diff. content type
          
          res.writeHead(200);
          res.end(data);

        });
        
      }
      
    }else{
      // Otherwise, request must be a POST
      // all post data is JSON
      res.writeHead(200, { 'content-type': 'application/json' });
      
      // checking if the request is to submit data
      if(req.url.includes("/submitsign")){
        // needs to get chunks of data before ending the request
        const chunks = [];
        req.on('data', chunk => chunks.push(chunk));
        req.on('end', () => {
          // on end, parse the data
          
          
        })
      }else{
        res.end(JSON.stringify({message : "Not Implemented"}));
      }
      
    }
    

    
  })


  // available at localhost:80

  server.listen(80);
}
module.exports = app;
