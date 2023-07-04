# Lightning Robotics Pit Cart Manager
This pit cart manager offers a solution to further integrate the Pit Carts into the match preparation during competitions in the future. It is comprised of two main components: the **pit crew controller** and the **outer pit display**.

## Requirements
* A Raspberry Pi 3 or 4
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
- SERVER_MODE (always `1`)

## If you are using a Raspberry Pi with Debian Buster/Bullseye you can setup scripts to autorun
#### `~/.bash_profile`
The chromium window showing the screen must have the flag `--autoplay-policy=no-user-gesture-required` set in order to allow the twitch stream to be unmuted
...
#### `~/.xinitrc`
You may need to modify the flags at the start of the script depending on what screen configuration you are using, however `xinput` should read and configure your screen properly.
...

## Future Plans
- [x] Pit Shift replacing ready checklist
- [ ] add status on outer screen when locked
- [ ] View of current stats of comp including OPR's and current RPs (have current team at top with rankings shown)
- [ ] Better chaning of comp code (literally dont know what i wrote here i must have been sleepy)
- [ ] launch a new debug screen for rpi controls?
- [ ] grey out match buttosn when reached a limit
- [ ] highlight match gap when is 3 or less
- [ ] robot functions that popup when detecting rio (maybe showing ip and stuff)
- [ ] add debug options to toggles
- [ ] feature to reload tech screen on server reconnect