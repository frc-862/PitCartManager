var notificationOut = false;


function displayStatus(reason) {
    switch (reason) {
        case "practice":
            showNotif("We are at the practice field", "reddim");
            break;
        case "match":
            socket.emit("showScheduleView");
            showNotif("We are on the field!", "reddim");
            break;
        case "strategy":
            showNotif("We are with strategy", "reddim");
            break;
        case "lunch":
            showNotif("We are at lunch!", "reddim");
            break;
        case "done":
            showNotif("We are done for the day!", "reddim");
            break;
        case "cancel":
            hideNotif();
            break;
        default:
            showNotif("We are somewhere else right now...", "reddim");
            break;
    }
}

function showNotif(content, color){
    if(notificationOut){
        hideNotif();
        setTimeout(function(){
            notificationOut = false;
            showNotif(content, color);
        }, 500);
        return;
    }
    if(color == "red"){
        document.getElementById("notificationBox").style.backgroundColor = "#ff3636";
    }else if(color == "reddim"){
        document.getElementById("notificationBox").style.backgroundColor = "#a12222";
    }else if(color == "blue"){
        document.getElementById("notificationBox").style.backgroundColor = "#3679ff";
    }else if(color == "bluedim"){
        document.getElementById("notificationBox").style.backgroundColor = "#2450a6";
    }else if(color == "success"){
        document.getElementById("notificationBox").style.backgroundColor = "#1fcc87";
    }else if(color == "successdim"){
        document.getElementById("notificationBox").style.backgroundColor = "#199e69";
    }
    else if(color == "default"){
        document.getElementById("notificationBox").style.backgroundColor = "#003573";
    }
    document.getElementById("notificationBox").style.bottom = "20px";
    document.getElementById("notificationText").innerHTML = content;
    notificationOut = true;
}

function hideNotif(){
    document.getElementById("notificationBox").style.bottom = "-200px";
    notificationOut = false;
}