const path = require("path");
const { Constants, DeploymentStorage } = require("./env");

const Addresses = {};
const EnvDeployment = DeploymentStorage.Env[Constants.ENV_KEY];
for (let contract in EnvDeployment) {
    if (EnvDeployment.hasOwnProperty(contract)) {
        Addresses[contract] =
            EnvDeployment[contract].Proxy !== null
                ? EnvDeployment[contract].Proxy
                : EnvDeployment[contract].Impl;
    }
}

module.exports = {
    Addresses,
};
