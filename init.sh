#!/bin/bash

# install dependencies using yarn
yarn install

# update submodules
git submodule update --init --recursive

# install FoundryUp
curl -L https://foundry.paradigm.xyz | bash

# install foundry
foundryup

# install forge libraries
forge install --no-commit foundry-rs/forge-std

# copy the .env file
# cp .env.example .env