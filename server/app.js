const http = require('http')
const fs = require('fs')
const { Server } = require('socket.io');
const axios = require('axios')
// run function app when ready
var Datastore = require('nedb');
const io = new Server(3001, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
      }
});


var db = {};

var settings = {
    "teamNumber" : undefined,
    "compCode" : "demo",
    "timeToGet" : 60
}


function removeAllMatches(){
    db.matches.remove({}, { multi: true }, function (err, numRemoved) {
        
    });
}

function addDemoMatches(){
    for(var i = 1; i <= 20; i++){
        var newMatch = {
            n : i,
            comp : "demo",
            teams : [1,2,3,4,5,6],
            status : "pending",
            winner : undefined,
            rankingPoints : [false,false],
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

    //removeAllMatches();
    //setTimeout(addDemoMatches, 1000);
    
    io.on('connection', (socket) => {
        console.log("New Connection")
        socket.on('notif', (type) => {
          if(type.length != undefined){
            type = type[0];
          }
            console.log(type)
            io.emit('notif_s', type)
        });
        socket.on('getTeam', () => {
            socket.emit('team', settings["teamNumber"])
            io.emit('log', {request : "getTeam", data : settings["teamNumber"]})
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

        socket.on('getMatches', () => {

        });

        socket.on("changeSetting", (setting, value) => {
          if(setting.length != undefined){
            value = setting[1]
            setting = setting[0]
          }
            settings[setting] = value;
            console.log("Setting " + setting + " to " + value);
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


  // available at localhost:3000

  server.listen(3000)
}
module.exports = app;