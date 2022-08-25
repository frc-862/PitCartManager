#!/bin/bash -

mkdir ~/cb-user-data
mkdir ~/cb-user-data/Default

echo "
source ~/.profile
if [[ -z $DISPLAY ]] && [[ $(tty) == /dev/tty1 ]]; then
  cd ~/PitCartManager/
#  git stash
  git pull
#  if [[ $NODESTARTED -eq "0" ]]; then
  sudo /root/.nvm/versions/node/v17.9.0/bin/node . &
#      export NODESTARTED=1
  fi
  startx -- -nocursor
fi
" > ~/.bash_profile

echo "
# rotate the tech screen to portrait (cables coming out right side)
xrandr --output HDMI-1 --rotate right

# disable screen saver to prevent from powering off
xset s noblank
xset s off
xset -dpms

# get hdmi 2 screen size
export HDMI2SIZEX=$(xrandr | grep HDMI-2 | cut -c18-21 | tr -dc '[:alnum:]\n\r')
export HDMI2SIZEY=$(xrandr | grep HDMI-2 | cut -c23-26 | tr -dc '[:alnum:]\n\r')

# gets IDs of touch screen device and tells X to only map it to the touch display
xinput map-to-output $(xinput | grep 'ILITEK-TP Mouse' | cut -c55) HDMI-1
xinput map-to-output $(xinput | grep 'ILITEK-TP' | grep -v 'Mouse' | cut -c55) HDMI-1

# tech screen launch
chromium-browser --kiosk http://localhost/tech.html --user-data-dir='/home/pi/cb-user-data/Default' --disable-infobars --window-position=0,0 --start-fullscreen --window-size=800,1280 --new-window --disable-pinch &

# wait until the first chromium window has started before starting the second one
sleep 2

# match screen launch
chromium-browser --kiosk http://localhost --user-data-dir='/home/pi/cb-user-data/Profile 1' --new-window --disable-infobars --window-position=1280,0 --start-fullscreen --window-size=$HDMI2SIZEX,$HDMI2SIZEY
" > ~/.xinitrc