#!/bin/bash

# install dependencies using yarn
yarn install

# update submodules
git submodule update --init --recursive

# install FoundryUp
curl -L https://foundry.paradigm.xyz | bash

# reload .bashrc
source ~/.zshenv

# install foundry
foundryup

# install forge libraries
forge install --no-commit foundry-rs/forge-std

# copy the .env file
if [ -f ".env" ]; then
    echo ".env file already exists, skipping copy."
else
    cp .env.sample .env
fi