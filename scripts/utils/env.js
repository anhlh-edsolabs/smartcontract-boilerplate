require("dotenv").config();
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const ENV_KEY = process.env.DEPLOYMENT_ENV;

const RPC_URL = process.env["RPC_PROVIDER_" + ENV_KEY];
const DEPLOYER_ADDR = process.env["DEPLOYER_" + ENV_KEY];
const DEPLOYER_PK = process.env["DEPLOYER_PK_" + ENV_KEY];

const Provider = new ethers.JsonRpcProvider(RPC_URL, undefined, {
    polling: true,
    pollingInterval: 10000,
    // staticNetwork: true,
});

const Deployer = new ethers.Wallet(DEPLOYER_PK, Provider);

const DEPLOYMENT_DATA_DIR = "deployment";
const DEPLOYMENT_DATA_FILENAME = ".deployment_data.json";

const DeploymentPath = path.join(DEPLOYMENT_DATA_DIR, DEPLOYMENT_DATA_FILENAME);
const DeploymentFile = path.resolve(DeploymentPath);

let DeploymentData;
if (fs.existsSync(DeploymentPath) && fs.existsSync(DeploymentFile))
    DeploymentData = require(DeploymentFile);
else DeploymentData = {};

const CoinBase = async () => {
    const chainID = parseInt((await Provider.getNetwork()).chainId);
    let coinbase;
    switch (chainID) {
        case 1:
        case 4:
        case 11155111:
            coinbase = "ETH";
            break;
        case 56:
        case 97:
            coinbase = "BNB";
            break;
        case 137:
        case 80001:
            coinbase = "MATIC";
            break;
        default:
            coinbase = "ETH";
    }

    return coinbase;
};

module.exports = {
    Constants: {
        ENV_KEY,
        RPC_URL,
        DEPLOYER_PK,
        DEPLOYER_ADDR,
    },
    CoinBase,
    Provider,
    Deployer,
    DeploymentStorage: { Env: DeploymentData, File: DeploymentFile },
};
