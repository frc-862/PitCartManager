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
- SERVER_MODE (always `1` \[was used for debugging])

## Autorun scripts for Raspberry Pi Buster/Bullseye
#### `~/.bash_profile`
The chromium window showing the screen must have the flag `--autoplay-policy=no-user-gesture-required` set in order to allow the twitch stream to be unmuted
<br/>...
#### `~/.xinitrc`
You may need to modify the flags at the start of the script depending on what screen configuration you are using, however `xinput` should read and configure your screen properly.
<br/>...

## Future Plans
- [x] double elim brackets for playoffs
- [x] screensaver with lightning robot themed dvd screen?
- [x] TBA integration
- [x] git stash+drop button
- [x] add status on outer screen when locked
- [ ] View of current stats of comp including OPR's and current RPs (have current team at top with rankings shown)
- [ ] improve changing the comp code (maybe select from a preset loaded by json or smth?)
- [ ] launch a new debug ~~screen~~ overlay for rpi controls?
- [ ] robot functions that popup when detecting rio (maybe showing ip and stuff)
- [ ] add debug options to toggles
- [ ] move lock passwords to env
- [ ] alliance selection teams
- [ ] enlarge match on field text
- [ ] implement some type of scrolling for outer screen matches
- [ ] quit to console option in restart app dialog and option to restart pi
- [ ] DOCS DOCS DOCS THERE IS 0 DOCUMENTATION FOR THIS PROJECT
- [ ] better error handling of shifts (like when switching from qual to playoff mode)
- [ ] manual data loading mode from usb (ex. we dont have cell service)
- [ ] disable brack and alliances buttons when in not in playoff mode and add new displays for qual mode mode
- [ ] remove password on settings and use password system on lock screen instead?
- [ ] why is there a locked variable and a function to check if locked?
- [ ] convert toggle buttons to switches
- [ ] pull from event schedule and show current event on match screen header
- [ ] orange color is never set back when switching matches
- [ ] detect when stormcloud throws a 502 and show a message on the screen
- [ ] fix match 917 bug cuz stormcloud silly
- [ ] dvd screen sometimes shifts images twice not in corner
- [ ] show correct playoff match text on touch screen
- [ ] reformat tba notice and make it friendly (maybe place a little icon next to match arrows showing tba/cloud status)
- [ ] test git stash feature on production

### Doulbe Elim Bracket Plans
- [x] add conclusion box below tiebreaker showing results
- [x] make lines orange to connect current team with their matches
- [ ] add time and status (where in bracket a team is) somehow
- [ ] add scores to left/right of match name for finals only
- [ ] during middle of finals, show team next position in bracket
- [ ] add animations
