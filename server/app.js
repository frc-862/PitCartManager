const http = require('http')
const fs = require('fs')
const { Server } = require('socket.io');
require('dotenv').config()
const axios = require('axios')
// run function app when ready
var Datastore = require('nedb');
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
    "teamNumber" : undefined,
    "compCode" : "micmp1",
    "timeToGet" : 60,
    "year" : 2022,
    "matchType" : "qual"
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

function infoAboutComp(){
  axios.get("https://frc-api.firstinspires.org/v2.0/2022/events?eventCode=" + settings["compCode"], {
        auth:{
          username: process.env.API_USER,
          password: process.env.API_PASS
        }
      }).then(function(response){
        
        var objects = response.data;
        //console.log(objects)
        var events = objects["Events"];
        if(events.length < 1){
          console.log("[API] Error, Invalid Event Code...")
          return;
        }
        events.forEach(function(e){
          if(e["code"] == settings["compCode"].toUpperCase()){
            currentlyKnownInfo = e;
          }
        });
        //console.log(currentlyKnownInfo);
        io.emit('log', {request : "eventUpdate", data : currentlyKnownInfo})
        io.emit('eventInfo', currentlyKnownInfo);
      }).catch(function(err){
        console.log(err)
        //io.emit('log', {request : "getMatches", data : "[API] Error, Invalid Match Code..."})
      });
}

function recvMatches(create){
  db.matches.remove({comp:settings["compCode"]}, {multi: true}, function(err, rem){
    axios.get("https://frc-api.firstinspires.org/v2.0/2022/schedule/" + settings["compCode"] + "/" + settings["matchType"] + "/hybrid", {
        auth:{
          username: process.env.API_USER,
          password: process.env.API_PASS
        }
      }).then(function(response){
        
        var objects = response.data;
        //console.log(objects)

          createMatches(objects["Schedule"])

        

        //io.emit('log', {request : "getMatches", data : objects})
      }).catch(function(err){
        console.log(err)
        //io.emit('log', {request : "getMatches", data : "[API] Error, Invalid Match Code..."})
      });
  });
}

function createMatches(matches){
  matches.forEach(match => {
    var newMatch = {
      n : match.matchNumber,
      d : match.description,
      comp : settings["compCode"],
      teams : [match.teams[0].teamNumber, match.teams[1].teamNumber, match.teams[2].teamNumber, match.teams[3].teamNumber, match.teams[4].teamNumber, match.teams[5].teamNumber],
      status : match.postResultTime == null ? "pending" : "finished",
      winner : (match.postResultTime == null ? "pending" : "finished") == "finished" ? determineWinner([match.scoreRedFinal, match.scoreRedFoul, match.scoreRedAuto], [match.scoreBlueFinal, match.scoreBlueFoul, match.scoreBlueAuto], "qual") : undefined,
      level : "qual",
      rankingPoints : [false,false,false,false],
      time : match.startTime,
      scores : [match.scoreRedFinal, match.scoreBlueFinal]
    } 

    db.matches.insert(newMatch, function (err, newDoc) {

    });

  });
  setTimeout(function(){
    db.matches.find({comp:settings["compCode"]}, function (err, docs) {
        io.emit('matches', docs);
        io.emit('log', {request : "getMatches", data : docs})
    });
  }, 5000);
}

function updateMatches(matches){
    matches.forEach(match => {
      db.matches.findOne({n:match.matchNumber, comp:settings["compCode"]}, function(err, doc){
        if(doc != undefined){
          var newStatus = match.postResultTime == null ? "pending" : "finished";
          var winner = newStatus == "finished" ? determineWinner([match.scoreRedFinal, match.scoreRedFoul, match.scoreRedAuto], [match.scoreBlueFinal, match.scoreBlueFoul, match.scoreBlueAuto], "qual") : undefined;
          //console.log(match.scoreBlueFinal + " " + match.scoreRedFinal + " >> " + winner);
          db.matches.update({n:doc.n, comp:doc.compCode, _id: doc._id}, {
            $set: {
              status: newStatus,
              winner: winner
            }
          }, {}, function(err, numReplaced){
            //console.log("Updated Match " + match.matchNumber);
          });
        }
      });

    });
    setTimeout(function(){
      db.matches.find({comp:settings["compCode"]}, function (err, docs) {
          io.emit("matches", docs)
          io.emit('log', {request : "getMatches", data : docs})
      });
    }, 5000);
}

function removeAllMatches(){
    db.matches.remove({}, { multi: true }, function (err, numRemoved) {
      
    });
}

function addDemoMatches(){
    for(var i = 1; i <= 82; i++){
        var newMatch = {
            n : i,
            comp : "mimcc",
            teams : [1,2,3,4,5,6],
            status : "pending",
            winner : undefined,
            level : "qual",
            rankingPoints : [false,false,false,false],
            time : new Date()
        }
        db.matches.insert(newMatch, function (err, newDoc) {
            console.log("Added Match " + newDoc.n);
        });

    }
}

async function app() {
    
    db.matches = new Datastore({ filename: 'storage/matches.db', autoload: true });
    db.matches.loadDatabase();

    removeAllMatches();
    //setTimeout(addDemoMatches, 1000);
    recvMatches();
    infoAboutComp();
    
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
            settings["compCode"] = eventCode;
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
                socket.emit("matches", docs)
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
