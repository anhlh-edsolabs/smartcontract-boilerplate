const path = require("path");
const { Constants, DeploymentStorage } = require("./env");
const { Utils } = require("./utils");

const Addresses = {};
const EnvDeployment = DeploymentStorage.Env[Constants.ENV_KEY];
for (let contract in EnvDeployment) {
    if (EnvDeployment.hasOwnProperty(contract)) {
        const { artifactName, deploymentName } =
            Utils.getContractName(contract);
        const contractAlias =
            deploymentName != "" ? deploymentName : artifactName;

        Addresses[contractAlias] =
            EnvDeployment[contract].Proxy ?? EnvDeployment[contract].Impl;
    }
}

module.exports = {
    Addresses,
};
