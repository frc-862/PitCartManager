#!/bin/bash

if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root" 1>&2
   exit 1
fi

source ~/.profile
export NVM_DIR=$HOME/.nvm
source $NVM_DIR/nvm.sh
# this doesnt work
if [[ ! -f "$HOME/.nvm" ]]; then
    echo "NVM is not installed!"
    # wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
    source ~/.profile
fi

# this does
if [[ ! -f "~/.nvm/versions/node/v17.9.0/bin/node" ]]; then
    echo "Node v17.9.0 found, continuing"
else
    echo "NVM is installed but incorrect node version found"
    ~/.nvm/install.sh install 17.9.0
    source ~/.profile
fi

if [[ ! -f "~/.bash_profile" ]]; then
    echo "Creating ~/.bash_profile..."
    echo "#!/bin/bash
source ~/.profile
if [[ -z \$DISPLAY ]] && [[ \$(tty) == /dev/tty1 ]]; then
    cd ~/PitCartManager
    git pull
    sudo /root/.nvm/versions/node/v17.9.0/bin/npm start
    startx -- -nocursor
fi" > ~/.bash_profile
fi

if [[ ! -f "~/.xinitrc" ]]; then
    echo "Creating ~/.xinitrc..."
    echo "Starting configuration. Press enter for the default option"
    # TODO: implement handling
    echo "What kind of touch does the first screen provide (mouse_emulation/other) [default mouse_emulation] "
    read -f touch_type
    echo "Orientation of first (touch) display (normal/left/right/inverted) [default normal] "
    read -r f_rot
    echo "Orientation of second display (normal/left/right/inverted) [default normal] "
    read -r s_rot
    echo "" >
fi
