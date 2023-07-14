var lastUpdated = new Date();

setInterval(function(){
    var d =  new Date();
    var diffSec = (d.getTime()-lastUpdated.getTime())/1000;
    diffSec = Math.round(diffSec);
    document.getElementById("lastUpdated").innerHTML = `Last Update ` + diffSec + "s ago";


    var h = d.getHours();
    var m = d.getMinutes();
    var s = d.getSeconds();
    var pmFlag = "AM";
    if(h >= 12){
        if (h != 12) {
            h -= 12;
        }
        pmFlag = "PM";
    } else if (h == 0) {
        h = 12;
    }
    document.getElementById("currentTime").innerHTML = h.toString() + ":" + m.toString().padStart(2, "0") + ":" + s.toString().padStart(2, "0") + " " + pmFlag;
}, 200)