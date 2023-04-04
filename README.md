# Lightning Robotics Pit Cart Manager
This pit cart manager offers a solution to further integrate the Pit Carts into the match preparation during competitions in the future. It is comprised of two main components: the **technician team controller** and the **pit display controller**.
## Requirements
* A Raspberry Pi 3 or 4
* Raspbien OS or another OS that supports Chromium and X server
* 1 (or 2) touch screen monitors for the technician controller
* 1 non-touch monitor for the pit display
* 2 HDMI Cables
* Ethernet Cable
* Power Supply for Raspberry Pi
## Language
This repository is developed in Vanilla JS, HTML, and ran with NodeJS
## Starting
There are npm scripts to run the app, but one must first make sure that NodeJS is installed and that all of the appropriate packages are installed...
1. Run `npm i` in the downloaded directory
2. Run `npm start` to launch the application instance
3. Traverse in Chromium / Chrome to `localhost:3000` to get to the schedule (or `localhost:3000/tech.html` to get to the tech screen)
