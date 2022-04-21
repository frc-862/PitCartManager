#!/bin/bash

# TODO: find way to install nvm & source node
# TODO: create .xinitrc with inputted webpage

if [[ ! -f "~/.bash_profile"]]; then
    echo "Creating ~/.bash_profile..."
    echo "source ~/.bashrc\nif [[ -z \$DISPLAY ]] && [[ $(tty) == /dev/tty1 ]]; then\n  cd ~/PitCartManager\n  git pull\n  /root/.nvm/node" > test