const io = require("socket.io-client");
const prompt = require('prompt-sync')();

const socket = io("ws://localhost:3001");

socket.on("connect", () => {
    console.log("[SOCKET] Successfully Connected to Server... Starting Prompt");
    foreverDoThis();
});

socket.on('log', (data) => {
    console.log(data);
});

function foreverDoThis(){
        console.log("Please Enter Your Request... ([command] *[arguments])");
        var request = prompt(" : ");
        var command = request.split(" ")[0];
        var args = request.split(" ").slice(1);

        socket.emit(command, args);
        setTimeout(foreverDoThis, 500);
}




