const hre = require("hardhat");
const fs = require("fs");
const chalk = require("chalk");
const { log } = require("console");
const { Libs } = require("./libs");
const { ENV_KEY, DeploymentStorage } = require("../../scripts/utils/env");

const proxyOptions = { kind: "uups" };

async function upgrade(
    CONTRACT_NAME_V1,
    CONTRACT_NAME_V2 = CONTRACT_NAME_V1,
    implConstructorArgs = [],
    implForceDeploy = false
) {
    const [deployer] = await hre.ethers.getSigners();

    const PROXY_ADDRESS =
        DeploymentStorage.Env[ENV_KEY][CONTRACT_NAME_V1].Proxy;

    await Libs.printDeploymentTime(deployer, true);

    const implV1 = await Libs.getImplementationAddress(PROXY_ADDRESS);
    log(
        `Upgrading ${chalk.bold.blue(
            CONTRACT_NAME_V1
        )} at proxy: ${chalk.bold.red(PROXY_ADDRESS)}`
    );
    console.log(`Current implementation address: ${chalk.bold.yellow(implV1)}`);

    const { factory: factoryV2, feeOverriding } = await Libs.estimateDeploy(
        CONTRACT_NAME_V2,
        implConstructorArgs
    );

    if (implConstructorArgs.length > 0) {
        proxyOptions.constructorArgs = implConstructorArgs;
    }

    if(implForceDeploy) {
        proxyOptions.redeployImplementation = "always";
    }

    proxyOptions.txOverrides = feeOverriding;

    // const factoryV2 = await hre.ethers.getContractFactory(CONTRACT_NAME_V2);
    const deploymentV2 = await hre.upgrades.upgradeProxy(
        PROXY_ADDRESS,
        factoryV2,
        proxyOptions
    );

    // const contractV2 = await deploymentV2.waitForDeployment();
    await Libs.sleep(3000);

    const implAddress = await Libs.printDeploymentResult(
        deployer,
        CONTRACT_NAME_V2,
        PROXY_ADDRESS,
        true
    );

    await Libs.writeDeploymentResult(
        CONTRACT_NAME_V2,
        implAddress,
        [],
        PROXY_ADDRESS,
        true
    );

    return deploymentV2;
}

module.exports = { upgrade };
