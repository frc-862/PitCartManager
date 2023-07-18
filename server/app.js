const http = require('http')
const fs = require('fs')
const { Server } = require('socket.io');
const { exec } = require('child_process');
const axios = require('axios');
const tba = require('./tba.js');
var Datastore = require('nedb');
require('dotenv').config()

const currentVersionStr = "v2023.7-DEV";
const eventPresets = ["2023inmis", "2023misal", "2023mibb"]

const io = new Server(3001, {
    cors: {
        origin: "http://localhost",
        methods: ["GET", "POST"]
      }
});

var ip = undefined;
const { networkInterfaces } = require('os');

const nets = networkInterfaces();
// const results = Object.create(null);
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (net.family === 'IPv4' && !net.internal) {
        console.log(net.address);
        ip = net.address;
      }
  }
}

var shiftData = [];
fs.readFile("shifts.json", "UTF-8", function(err, data){
  shiftData = JSON.parse(data);
});


var settings = {
  "teamNumber" : process.env.TEAM,
    "compCode" : process.env.COMP_CODE,
    "password": process.env.SETTINGS_PASSWORD ? process.env.SETTINGS_PASSWORD : "",
    "timeToGet" : 60,
    "year" : process.env.COMP_YEAR,
    "matchType" : "Qualification",
    "streamCode": process.env.STREAM_CODE,
    "serverMode": process.env.SERVER_MODE,
    "tbaMode": false,
}

var db = {};
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
  try {
    if (!settings.tbaMode) {
      axios.get("https://scout.robosmrt.com/api/quick/state", {
        headers: {
          "Authorization": getAuthToken()
        }
      }).then(function(response){
        var data = response.data;
        
        currentlyKnownInfo = {
          currentMatch: data.currentMatch,
          currentlyRunning: data.currentlyRunning,
          currentMatchType: data.matchType
        }
        // console.log(currentlyKnownInfo);
        io.emit('log', {request : "eventUpdate", data : currentlyKnownInfo})
        io.emit('eventInfo', currentlyKnownInfo);
      }).catch(function(err){
        console.log(err)
        //io.emit('log', {request : "getMatches", data : "[API] Error, Invalid Match Code..."})
      });
    } else {
      // TODO: later add TBA info?
      currentlyKnownInfo = {
        currentMatch: "?",
        currentlyRunning: "?",
        currentMatchType: settings.matchType
      }
      io.emit('log', {request : "eventUpdate", data : currentlyKnownInfo})
      io.emit('eventInfo', currentlyKnownInfo);
    }
  } catch {
    currentlyKnownInfo = {
      currentMatch: -1,
      currentlyRunning: -1,
      currentMatchType: settings.matchType
    }
    io.emit('eventInfo', currentlyKnownInfo)
  }
}

var elimMatches = [];
async function recvMatches(create){
  db.matches.remove({comp:settings["year"] + settings["compCode"]}, {multi: true}, async function(err, rem){
    try{
      var playoffs = !settings.tbaMode ? (await axios.get("https://scout.robosmrt.com/api/quick/state", {
        headers: {
          "Authorization": getAuthToken()
        }
      })).data["matches"].filter(m => m.matchType == "Playoff") : (await tba.getAllPlayoffs(settings["year"] + settings["compCode"], process.env.TBA_AUTH));
      // console.log(playoffs);
      elimMatches = createMatches(playoffs, true);
      var matches = !settings.tbaMode ? (await axios.get("https://scout.robosmrt.com/api/quick/matches?teamNumber=" + settings["teamNumber"], {
        headers: {
          "Authorization": getAuthToken()
        }
      })).data["matches"] : (await tba.getMatches(settings["teamNumber"], settings["year"] + settings["compCode"], process.env.TBA_AUTH, settings.matchType == "Qualification" ? ["qm"] : ["sf", "f"]));
      // console.log(matches)
      createMatches(matches);
    } catch (err) {
      console.log("Error getting stormcloud data!")
      console.log(err)
    }
  });
}

function createMatches(matches, noDb = false){
  if (noDb) noDbMatches = []; // used for getting all playoffs
  matches.forEach(match => {
    var newMatch = {
      n : match.matchNumber,
      comp : settings["year"] + settings["compCode"],
      teams : settings.tbaMode ? [...match.teams.red, ...match.teams.blue] : [match.teams[0].team, match.teams[1].team, match.teams[2].team, match.teams[3].team, match.teams[4].team, match.teams[5].team],
      status : !match.results.finished ? "pending" : "finished",
      winner : settings.tbaMode ? match.winner : match.results.finished ? determineWinner([match.results.red], [match.results.blue], settings["matchType"]) : undefined,
      level : settings["matchType"],
      // rankingPoints : [false,false,false,false],
      scores : [match.results.red, match.results.blue],
      api: settings.tbaMode ? "tba" : "cloud",
      playoffNum: settings.tbaMode ? match.playoffNum : match.matchNumber,
      d: currentlyKnownInfo.currentMatchType + " " + currentlyKnownInfo.currentMatch
    }
    if (noDb) {
      newMatch.teams = settings.tbaMode ? [match.teams.red, match.teams.blue] : [match.teams.filter((t) => t.color == "Red").map((t) => t.team), match.teams.filter((t) => t.color == "Blue").map((t) => t.team)];
      noDbMatches.push(newMatch);
      // console.log(newMatch)
    } else {
      newMatch.rawType = settings.tbaMode ? match.rawType : null;
      db.matches.insert(newMatch, function (err, newDoc) {});
    }
  });
  if (noDb) return noDbMatches;

  setTimeout(function(){
    db.matches.find({comp:settings["year"] + settings["compCode"]}, function (err, docs) {
        io.emit('matches', {docs:docs, playoffs: elimMatches, currentMatch: currentlyKnownInfo.currentMatch, currentlyRunning: currentlyKnownInfo.currentlyRunning, currentMatchType: currentlyKnownInfo.currentMatchType});
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
        socket.on('getProdMode', () => {
          io.emit("recieve_getProdMode", {state : settings["serverMode"], version: currentVersionStr, password: settings.password, eventPresets: eventPresets, currentEvent: settings.year + settings.compCode});
        });
        socket.on('getShiftInfo', () => {
          io.emit("recieve_shiftInfo", shiftData);
        });
        socket.on("setConfig", (eventCode, matchType, useTBA) => {
          if(!(eventCode == undefined || eventCode == "")){
            settings["compCode"] = eventCode.substring(4);
          }

          settings["matchType"] = matchType;
          // console.log(matchType)
          settings.tbaMode = useTBA != undefined ? useTBA : settings.tbaMode;
          console.log("Setting config to " + settings["compCode"] + " " + settings["matchType"] + " " + settings.tbaMode);
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
        socket.on("getMatches", () => {;
            db.matches.find({}, function (err, docs) {
                socket.emit("matches", {docs: docs, playoffs: elimMatches, currentMatch: currentlyKnownInfo.currentMatch, currentlyRunning: currentlyKnownInfo.currentlyRunning, currentMatchType: currentlyKnownInfo.currentMatchType})
                io.emit('log', {request : "getMatches", data : docs})
            });
        });
        socket.on('changeLock', (locked, mode) => {
          if(locked.length != undefined){
            locked = locked[0];
          }
            io.emit('lock', locked, mode ? mode : false);
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

        socket.on("outerNavShift", (route, arg) => {
          if (route == "stream.html") { arg = settings["streamCode"] }
          io.emit('outerNavShift', route, arg)
        })

        socket.on('reloadStream', () => {
          io.emit('reloadStream');
        });
        
        socket.on('unmuteStream', () => {
          io.emit('unmuteStream');
        });

        socket.on('changeStreamQuality', (quality) => {
          io.emit('changeStreamQuality', quality);
        });

        socket.on('readyStreamControls', (a) => {
          io.emit('readyStreamControls', a);
        });

        socket.on('setting_scheduleView', (setting, value) => {
          io.emit('setting_scheduleView', setting, value);
        })

        socket.on('gitPull', () => {
          // io.emit('gitCommandOutput', `Updating 69a47ce..191d79d
          // Fast-forward
          //  README.md | 2 +-
          //  1 file changed, 1 insertion(+), 1 deletion(-)`);
          exec(`git pull`, (err, stdout, stderr) => {
            if (stdout) {
              io.emit('gitCommandOutput', stdout, stderr);
            } else {
              io.emit('gitCommandOutput', "", stderr);
            }
          });
        });

        socket.on('gitStashAndPop', () => {
          setTimeout(() => {
            io.emit('gitStashOutput', "Testing", "");
          }, 1500);
          // TODO: this command shouldn't work so fix it sometime please????
          // exec(`git stash && git stash pop`, (err, stdout, stderr) => {
          //   if (stdout) {
          //     io.emit('gitStashOutput', stdout, stderr);
          //   } else {
          //     io.emit('gitStashOutput', "", stderr);
          //   }
          // });
        });

        socket.on('restartApp', () => {
          if (pid == undefined) return;
          exec(`echo ${pid}`, (err, stdout, stderr) => {
            io.emit('gitCommandOutput', "Killing process " + stdout);
          });
          setTimeout(() => {
            process.kill(pid, 9)
          }, 1250);
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
        if(req.url.startsWith("/stream.html")){ // url parameters
          req.url = "/stream.html";
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
      
    } else{
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
