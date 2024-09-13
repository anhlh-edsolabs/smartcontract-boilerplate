const { ethers } = require("ethers");
const { Constants, Deployer, DeploymentStorage } = require("./env");
const { Utils } = require("./utils");

const Contracts = {}, ABIs = {};
const DeploymentInfo = DeploymentStorage.Env[Constants.ENV_KEY];
const contractNames = DeploymentInfo ? Object.keys(DeploymentInfo) : [];
for (const contractName of contractNames) {
    try {
        const { artifactName, deploymentName } =
            Utils.getContractName(contractName);

        const contractABI = require(`../../ABIs/${artifactName}_ABI.json`);
        // assign contractAddress to DeploymentInfo[contractName].Proxy
        // or DeploymentInfo[contractName].Beacon if they exist,
        // otherwise assign it to DeploymentInfo[contractName].Impl
        const contractAddress =
            DeploymentInfo[contractName].Proxy ||
            DeploymentInfo[contractName].Beacon ||
            DeploymentInfo[contractName].Impl;

        const contract = new ethers.Contract(
            contractAddress,
            contractABI,
            Deployer,
        );
        const contractAlias =
            deploymentName != "" ? deploymentName : artifactName;
        ABIs[contractAlias] = contractABI;
        Contracts[contractAlias] = contract;
    } catch (err) {
        continue;
    }
}

module.exports = { Contracts, ABIs };
