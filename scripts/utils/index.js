const {
    Constants,
    Provider,
    Deployer,
    DeploymentStorage,
    CoinBase,
} = require("./env");

const { Utils } = require("./utils");

const { Contracts, ABIs } = require("./artifacts");

const { log } = require("console");

module.exports = {
    log,
    Constants,
    Provider,
    Deployer,
    DeploymentStorage,
    CoinBase,
    Contracts,
    ABIs,
    Utils,
};
