const hre = require("hardhat");
const fs = require("fs");
const chalk = require("chalk");
const { log } = require("console");
const { Libs } = require("./libs");
const { Utils } = require("../../scripts/utils/utils");
const {
    Constants: { ENV_KEY },
    DeploymentStorage,
} = require("../../scripts/utils/env");

const proxyOptions = { kind: "uups" };

async function upgrade(
    contractNameV1,
    contractNameV2 = contractNameV1,
    implConstructorArgs = [],
    implForceDeploy = false,
    skipStorageCheck = false,
) {
    const [deployer] = await hre.ethers.getSigners();

    const PROXY_ADDRESS = DeploymentStorage.Env[ENV_KEY][contractNameV1].Proxy;

    await Libs.printDeploymentTime(deployer, true);

    let { artifactName: artifactNameV1, deploymentName: deploymentNameV1 } =
        Utils.getContractName(contractNameV1);
    let { artifactName: artifactNameV2, deploymentName: deploymentNameV2 } =
        Utils.getContractName(contractNameV2);

    const previousImpl = await Libs.getImplementationAddress(PROXY_ADDRESS);
    log(
        `Upgrading ${chalk.bold.blue(
            deploymentNameV1 != "" ? deploymentNameV1 : artifactNameV1,
        )} at proxy: ${chalk.bold.red(PROXY_ADDRESS)}`,
    );
    console.log(
        `Current implementation address: ${chalk.bold.yellow(previousImpl)}`,
    );

    const { factory: factoryV2, feeOverriding } = await Libs.estimateDeploy(
        artifactNameV2,
        implConstructorArgs,
    );

    if (implConstructorArgs.length > 0) {
        proxyOptions.constructorArgs = implConstructorArgs;
    }

    if (implForceDeploy) {
        proxyOptions.redeployImplementation = "always";
    }

    if (skipStorageCheck) {
        proxyOptions.unsafeSkipStorageCheck = skipStorageCheck;
    }

    proxyOptions.txOverrides = feeOverriding;

    // const factoryV2 = await hre.ethers.getContractFactory(CONTRACT_NAME_V2);
    const deploymentV2 = await hre.upgrades.upgradeProxy(
        PROXY_ADDRESS,
        factoryV2,
        proxyOptions,
    );

    // const contractV2 = await deploymentV2.waitForDeployment();
    await Libs.sleep(3000);

    const implAddress = await Libs.printDeploymentResult(
        deployer,
        deploymentNameV2 != "" ? deploymentNameV2 : artifactNameV2,
        PROXY_ADDRESS,
        true,
    );

    await Libs.writeDeploymentResult(
        deploymentNameV2 != ""
            ? `${artifactNameV2}$${deploymentNameV2}`
            : artifactNameV2,
        implAddress,
        [],
        PROXY_ADDRESS,
        null,
        previousImpl,
        true,
    );

    return deploymentV2;
}

module.exports = { upgrade };
