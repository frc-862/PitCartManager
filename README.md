# Lightning Robotics Pit Cart Manager
This pit cart manager offers a solution to further integrate the Pit Carts into the match preparation during competitions in the future. It is comprised of two main components: the **pit crew controller** and the **outer pit display**.

## Requirements
* A Raspberry Pi 3B or higher
* Raspbian OS or another OS that supports Chromium on X server, NodeJS, and a touchscreen display
* 1 touch screen display for the controller
* 1 non-touch display for the pit display

## Language
This repository is developed in Vanilla JS, HTML, and ran with NodeJS

## Starting
There are npm scripts to run the app, but one must first make sure that NodeJS is installed and that all of the appropriate packages are installed...
1. Run `npm i` in the downloaded directory
2. Run `npm start` to launch the application instance
3. Traverse in Chromium / Chrome to `localhost:3000` to get to the schedule (or `localhost:3000/tech.html` to get to the tech screen)

## .env Setup
A few flags you need to set in the project .env to get started are:
- PORT (recommended `3000`)
- SOCKET_PORT (recommended `3001`)
- TEAM (number)
- COMP_YEAR (ex. `2023`)
- COMP_CODE (usually can get from TBA ommitting the year; ex. `2023misal` would be just `misal`)
- STREAM_CODE (ex. `firstinspires1`)
- SETTINGS_PASSWORD (string of numbers 0-8 for indexes of pit screen password. ex. "012" str can be length 0 to 9)

## Autorun scripts for Raspberry Pi Buster/Bullseye
#### `~/.bash_profile`
The chromium window showing the screen must have the flag `--autoplay-policy=no-user-gesture-required` set in order to allow the twitch stream to be unmuted
```bash
source ~/.profile
if [[ -z $DISPLAY ]] && [[ $(tty) = /dev/tty1 ]]; then
  cd ~/PitCartManager/
  if [[ $NODESTARTED -eq "0" ]]; then
    sleep 3
    sudo /root/.nvm/versions/node/v17.9.0/bin/node . $$ &
    #export NODESTARTED=1
  fi
  startx -- -nocursor
fi
```

#### `~/.xinitrc`
You may need to modify the flags at the start of the script depending on what screen configuration you are using, however `xinput` should read and configure your screen properly.
Note: The screen size used was `1360x768` for the non-touch and `800x1280` for the touch screen
```bash
xrandr --output HDMI-1 --rotate right

xset s noblank
xset s off
xset -dpms

export HDMI2SIZEX=$(xrandr | grep HDMI-2 | cut -c18-21 | tr -dc '[:alnum:]\n\r')
export HDMI2SIZEY=$(xrandr | grep HDMI-2 | cut -c23-26 | tr -dc '[:alnum:]\n\r')

# only map touch mouse to first display
xinput map-to-output $(xinput | grep 'ILITEK-TP Mouse' | cut -c55) HDMI-1
xinput map-to-output $(xinput | grep 'ILITEK-TP' | grep -v 'Mouse' | cut -c55) HDMI-1

xinput set-prop $(xinput | grep 'ILITEK-TP Mouse' | cut -c55) 'Coordinate Transformation Matrix' "0,1,0,-1,0,1,0,0,1"
xinput set-prop $(xinput | grep 'ILITEK-TP' | grep -v 'Mouse' | cut -c55) 'Coordinate Transformation Matrix' "0,1,0,-1,0,1,0,0,1"

chromium-browser --kiosk http://localhost/tech.html --user-data-dir='/home/pi/cb-user-data/Default' --disable-infobars --window-position=0,0 --start-fullscreen --window-size=800,1280 --new-window --disable-pinch &

sleep 2

chromium-browser --kiosk http://localhost --user-data-dir='/home/pi/cb-user-data/Profile 1' --new-window --disable-infobars --window-position=1280,0 --start-fullscreen --window-size=$HDMI2SIZEX,$HDMI2SIZEY --autoplay-policy=no-user-gesture-required
```

## Future Plans
- [x] [should be fixed i think] orange color is never set back when switching matches
- [x] improve stream code changing
- [ ] maybe add an option for world champs (changes bracket.html and changes stream presets)
- [ ] View of current stats of comp including OPR's and current RPs (have current team at top with rankings shown)
- [ ] robot functions that popup when detecting rio (maybe showing ip and stuff)
- [ ] add debug options to toggles
- [ ] enlarge match on field text
- [ ] implement some type of scrolling for outer screen matches
- [ ] DOCS DOCS DOCS THERE IS 0 DOCUMENTATION FOR THIS PROJECT
- [ ] better error handling of shifts (like when switching from qual to playoff mode)
- [ ] manual data loading mode from usb (ex. we dont have cell service)
- [ ] disable brack and alliances buttons when in not in playoff mode and add new displays for qual mode mode
- [ ] remove password on settings and use password system on lock screen instead?
- [ ] why is there a locked variable and a function to check if locked?
- [ ] convert toggle buttons to switches
- [ ] pull from event schedule and show current event on match screen header
- [ ] detect when stormcloud throws a 502 and show a message on the screen
- [ ] fix match 917 bug cuz stormcloud silly
- [ ] dvd screen sometimes shifts images twice not in corner
- [ ] show correct playoff match text on touch screen
- [ ] reformat tba notice and make it friendly (maybe place a little icon next to match arrows showing tba/cloud status)
- [ ] test git stash feature on production
- [ ] make gray class color a little less bright
- [ ] on match schedule screen during playoffs using stormcloud api something funky happens with match indexes (displays fine with tba)
- [ ] global color scheme modification (moving color values to style.css)
- [ ] prolly should remove the different shift types cuz its confusing and unnecessary

#### Doulbe Elim Bracket Plans
- [x] winner box not displaying while in TBA mode bug
- [ ] during middle of finals, show team next position in bracket
- [ ] show alliance numbers next to r1 match alliances
- [ ] show dq
