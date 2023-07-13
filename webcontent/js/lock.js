var locked = false;
var specialLockMode = false;

function updateLock(){
    element = document.getElementById(specialLockMode ? "dvd" : "lockScreen");
    if(locked || teamNum == undefined){
        element.style.display = "";
        setTimeout(function(){
            element.style.opacity = "1";
        }, 10);
        
    }else{
        element.style.opacity = "0";
        setTimeout(function(){
            element.style.display = "none";
        }, 550);
    }
}

socket.on('lock', function(n, mode){
    locked = n;
    specialLockMode = mode
    if(teamNum != undefined){
        updateLock();
    }
});

const images = [
    "images/password/dav.png",
    "images/password/dowling.png",
    "images/password/fritz.png",
    "images/password/joe.png",
    "images/password/john2.jpg",
    "images/password/jusnoor.png",
    "images/password/mike.png",
    "images/password/sinclair.png",
    "images/password/weesh.png"
]
var index = 4;
function changeImage(){
    if(index == 8){
        index = 0;
    }else{
        index++;
    }
    document.getElementById("dvdImage").src = images[index];
}

var lasthitX = false;
var lasthitY = false;
const usableWidth = $(window).width() * 0.86;
const usableHeight = $(window).height() * 0.77;
setInterval(function() {
    if (!specialLockMode) return;

    pos = $('#dvdImage').position();
    var calcXPos = Math.abs(usableWidth - pos.left);
    var calcYPos = Math.abs(usableHeight - pos.top);

    // console.log(calcXPos, pos.left, calcYPos, pos.top);
    // console.log(lasthitX, lasthitY);
    if (calcXPos < 10 || pos.left < 10) {
        if (lasthitX) {
            lasthitX = false;
        } else {
            lasthitX = true;
            changeImage();
        }
    } else if (lasthitX && calcXPos > 10 && pos.left > 10) {
        lasthitX = false;
    }
    if (calcYPos < 10 || pos.top < 10) {
        if (lasthitY) {
            lasthitY = false;
        } else {
            lasthitY = true;
            changeImage();
        }
    } else if (lasthitY && calcYPos > 10 && pos.top > 10) {
        lasthitY = false;
    }
}, 30);