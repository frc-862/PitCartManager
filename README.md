# Lightning Robotics Pit Cart Manager
This pit cart manager offers a solution to further integrate the Pit Carts into the match preparation during competitions in the future. It is comprised of two main components: the **pit crew controller** and the **outer pit display**, which both work in sync with a node backend server to get accurate results for current match data on the field.

## Requirements
* A Raspberry Pi 4 or higher (or older with 2 displays)
* Raspbian OS or another OS that supports Chromium on X server, NodeJS, and a touchscreen display
* 1 touch screen display for the controller
* 1 non-touch display for the pit display
* A wired internet connection (cell network or equivalent)

## Language
This repository is developed with vanilla web JS + HTML, as well as NodeJS for the server.

## Starting
There are npm scripts to run the app, but make sure that NodeJS is installed (with NVM) and that all of the appropriate packages are installed
1. Run `npm i` in the downloaded directory to init libraries
2. Run `npm start` to launch the application instance
3. Traverse in Chromium to `localhost:3000` to get to the schedule (or `localhost:3000/tech.html` to get to the controller)

## .env Setup
A few flags you need to set in the project .env to get started are:
- _~~PORT (recommended `3000`)~~_ **Ignored, will always be 3000**
- _~~SOCKET_PORT (recommended `3001`)~~_ **Ignored, will always be 3001**
- TEAM (number)
- COMP_YEAR (ex. `2023`) *May be overriden by settings until next boot*
- COMP_CODE (usually can get from TBA ommitting the year; ex. `2023misal` would be just `misal`) *May be overriden by settings until next boot*
- STREAM_CODE (ex. `firstinspires1`) *May be overriden by settings until next boot*
- SETTINGS_PASSWORD (string of numbers 0-8 for indexes of settings password. ex. "012" str can be length 0 to 9)

## Raspberry Pi Buster/Bullseye Setup
Use the Debian 12 (Bookworm) desktop image from [the official raspberry pi site](https://raspberrypi.org/software) and install it.
<br/>Once the desktop is configured, go to terminal and type `sudo raspi-config` and set the following:
- 1 System Options -> Update host name as nessesary
- 1 System Options -> S5 Boot/Auto Login -> B2 Console Autologin
- 3 Interface Options -> I2 SSH -> Yes
- 5 Localisation Options -> L3 Keyboard -> Press enter on each screen except select yes on CTRL+ALT+BKSP dialog
- Reboot

### Installing Node via NVM
Type `sudo su` then type `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash`.
<br/>
Check the home directory is right by typing `nano /root/.bashrc` and make sure the `$NVM_DIR` flag is set to `/root/.nvm` and change it if needed.
<br/>
Type `nvm install 18` (reload session if needed)
<br/>
Exit root by typing `exit` and then type `git clone https://github.com/frc-862/PitCartManager.git` in your home directory (non root). CD into the new directory and type `npm i` to update the packages.

### Mock Chrome Profiles
Chromium does not allow multiple instances of the same profile to be open at once, so we need to create fake profiles to get around this. Run `mkdir ~/cb-user-data/ && mkdir ~/cb-user-data/Default && mkdir ~/cb-user-data/Profile\ 1`.

### Startup Scripts
These scripts are used to start the application on boot. They should be located in the home directory of the default user.
#### `~/.bash_profile`
```bash
source ~/.profile
if [[ -z $DISPLAY ]] && [[ $(tty) = /dev/tty1 ]]; then # Check if there is a display and is on TTY1
  cd ~/PitCartManager/ # enter project directory
  sleep 2 # may not be needed, but included here
  sudo /root/.nvm/versions/node/v18.17.0/bin/node . $$ & # start the main node as root
  startx -- -nocursor # start X server without cursor
fi
```

#### `~/.xinitrc`
You may need to modify the flags at the start of the script depending on what screen configuration you are using, however `xinput` should read and configure your screen properly.
Note: The screen size used was `1360x768` for the non-touch and `800x1280` for the touch screen
```bash
xrandr --output HDMI-1 --rotate right # rotate screen 1 (touch) 90 degrees

# prevent screensaver
xset s noblank
xset s off
xset -dpms

# get screen 2 size pin pixels
export HDMI2SIZEX=$(xrandr | grep HDMI-2 | cut -c18-21 | tr -dc '[:alnum:]\n\r')
export HDMI2SIZEY=$(xrandr | grep HDMI-2 | cut -c23-26 | tr -dc '[:alnum:]\n\r')

# map mouse input to screen 1 only
xinput map-to-output $(xinput | grep 'ILITEK-TP Mouse' | cut -c55) HDMI-1
xinput map-to-output $(xinput | grep 'ILITEK-TP' | grep -v 'Mouse' | cut -c55) HDMI-1

# rotate mouse input to match screen 1 rotation
xinput set-prop $(xinput | grep 'ILITEK-TP Mouse' | cut -c55) 'Coordinate Transformation Matrix' "0,1,0,-1,0,1,0,0,1"
xinput set-prop $(xinput | grep 'ILITEK-TP' | grep -v 'Mouse' | cut -c55) 'Coordinate Transformation Matrix' "0,1,0,-1,0,1,0,0,1"

# launch screen 1 window
chromium-browser --kiosk http://localhost/tech.html --user-data-dir='/home/cart/cb-user-data/Default' --disable-infobars --window-position=0,0 --start-fullscreen --window-size=800,1280 --new-window --disable-pinch &

# launch screen 2 window
chromium-browser --kiosk http://localhost --user-data-dir='/home/cart/cb-user-data/Profile 1' --new-window --disable-infobars --window-position=1280,0 --start-fullscreen --window-size=$HDMI2SIZEX,$HDMI2SIZEY --autoplay-policy=no-user-gesture-required
```

## Future Plans
- [x] [should be fixed i think] orange color is never set back when switching matches
- [ ] maybe add an option for world champs (changes bracket.html and changes stream presets)
- [ ] View of current stats of comp including OPR's and current RPs (have current team at top with rankings shown)
- [ ] ~~robot functions that popup when detecting rio (maybe showing ip and stuff)~~
- [ ] ~~add debug options to toggles~~
- [ ] enlarge match on field text
- [ ] implement some type of scrolling for outer screen matches
- [ ] DOCS DOCS DOCS THERE IS 0 DOCUMENTATION FOR THIS PROJECT
- [ ] manual data loading mode from usb (ex. we dont have cell service)
- [ ] disable brack and alliances buttons when in not in playoff mode and add new displays for qual mode mode
- [ ] ~~remove password on settings and use password system on lock screen instead?~~
- [ ] why is there a locked variable and a function to check if locked?
- [ ] [not urgent] convert toggle buttons to switches
- [ ] pull from event schedule and show current event on match screen header
- [ ] detect when stormcloud throws a 502 and show a message on the screen
- [ ] fix match 917 bug cuz stormcloud silly
- [ ] ~~dvd screen sometimes shifts images twice not in corner~~
- [ ] show correct playoff match text on touch screen
- [ ] ~~reformat tba notice and make it friendly (maybe place a little icon next to match arrows showing tba/cloud status)~~
- [ ] ~~test git stash feature on production~~
- [ ] make gray class color a little less bright
- [ ] on match schedule screen during playoffs using stormcloud api something funky happens with match indexes (displays fine with tba)
- [ ] global color scheme modification (moving color values to style.css)
- [ ] everything is kinda laggy and i have no clue why lmao
- [ ] when stream false offlines make the sync button a bright color or something (maybe add text)

#### Doulbe Elim Bracket Plans
- [x] debug spacing problems on prod
- [ ] during middle of finals, show team next position in bracket
- [ ] show alliance numbers next to r1 match alliances
- [ ] show dq
