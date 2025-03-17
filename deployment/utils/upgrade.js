require("@openzeppelin/hardhat-upgrades");
const hre = require("hardhat");
const fs = require("fs");
const chalk = require("chalk");
const { log } = require("console");
const {
    Libs,
    chainID,
    proxyOptions,
    defenderDefaultOptions,
} = require("./libs");
const { Utils } = require("../../scripts/utils/utils");
const {
    Constants: { ENV_KEY },
    DeploymentStorage,
} = require("../../scripts/utils/env");

async function upgrade(
    contractNameV1,
    contractNameV2 = contractNameV1,
    implConstructorArgs = [],
    reinitializer = "" | {},
    implForceDeploy = false,
    skipStorageCheck = false,
    writeDeploymentResult = true,
    gasLimit = 0,
    defenderOptions = undefined,
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

    if (gasLimit > 0) {
        feeOverriding.gasLimit = gasLimit;
    }

    const proxyOpts = {
        ...proxyOptions,
        constructorArgs:
            implConstructorArgs.length > 0 ? implConstructorArgs : undefined,
        call:
            reinitializer != "" && reinitializer != {}
                ? reinitializer
                : undefined,
        redeployImplementation: implForceDeploy ? "always" : "onchange",
        unsafeSkipStorageCheck: skipStorageCheck,
        txOverrides: feeOverriding,
        ...Libs.getDefenderOptions(defenderOptions),
    };

    const deploymentV2 = await hre.upgrades.upgradeProxy(
        PROXY_ADDRESS,
        factoryV2,
        proxyOpts,
    );

    // wait for the upgrade to be completed
    await deploymentV2.waitForDeployment();

    const implAddress = await Libs.printDeploymentResult(
        deployer,
        deploymentNameV2 != "" ? deploymentNameV2 : artifactNameV2,
        PROXY_ADDRESS,
        true,
    );

    if (writeDeploymentResult) {
        await Libs.writeDeploymentResult(
            deploymentNameV2 ? contractNameV2 : artifactNameV2,
            implAddress,
            [],
            PROXY_ADDRESS,
            null,
            previousImpl,
            contractNameV1,
            true,
        );
    }

    return deploymentV2;
}

module.exports = { upgrade };
