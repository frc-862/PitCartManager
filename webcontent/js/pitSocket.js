const socket = io("ws://localhost:3001", {
    cors: {
        origin: "http://localhost",
        methods: ["GET", "POST"]
    }
});
var teamNum = undefined;


socket.on('disconnect', function(){
    showNotif("Oops! We're Disconnected...", "reddim");
});

socket.on('connect', function(){
    hideNotif();
    
    console.log("Successfully connected to server");
    socket.emit("getTeam");
});

socket.on('notif_s', (status) => displayStatus(status));

socket.on("team", function(val){
    teamNum = parseInt(val);
    if(teamNum == undefined){
        showNotif("Currently Awaiting Setup...", "red");
    }else{
        socket.emit("getMatches");
        hideNotif();
    }
    updateLock();
})

socket.on('outerNavShift', function(route, arg){
    if (route == window.location.pathname.substring(1)) { return; }
    if (route == "stream.html") {
        window.location.href = `/stream.html?code=${arg}`;
    } else {
        window.location.href = `/${route}`;
    }
});