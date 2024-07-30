const { ethers } = require("ethers");
const { Constants, Deployer, DeploymentStorage } = require("./env");

const Contracts = {};
const ABIs = {};
const DeploymentInfo = DeploymentStorage.Env[Constants.ENV_KEY];
const contractNames = DeploymentInfo ? Object.keys(DeploymentInfo) : [];
for (const contractName of contractNames) {
    try {
        const contractABI = require(`../../ABIs/${contractName}_ABI.json`);
        const contractAddress =
            DeploymentStorage.Env[Constants.ENV_KEY][contractName].Proxy ||
            DeploymentStorage.Env[Constants.ENV_KEY][contractName].Beacon;
        const contract = new ethers.Contract(
            contractAddress,
            contractABI,
            Deployer,
        );
        ABIs[contractName] = contractABI;
        Contracts[contractName] = contract;
    } catch (err) {
        continue;
    }
}

module.exports = { Contracts, ABIs };
