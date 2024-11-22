const hre = require("hardhat");
const { Libs } = require("./libs");
const { log } = require("console");
const { Utils } = require("../../scripts/utils/utils");

const proxyOptions = { kind: "uups" };

async function deploy(
    contractName,
    initializationArgs = [],
    isUpgradeable = false,
    implConstructorArgs = [],
    implForceDeploy = false,
    isWriteDeploymentResult = true,
) {
    const [deployer] = await hre.ethers.getSigners();

    await Libs.printDeploymentTime(deployer);

    let { artifactName, deploymentName } = Utils.getContractName(contractName);

    const { factory, feeOverriding } = await Libs.estimateDeploy(
        artifactName,
        implConstructorArgs,
    );

    let deployment;
    if (isUpgradeable) {
        if (implConstructorArgs.length > 0) {
            proxyOptions.constructorArgs = implConstructorArgs;
        }

        if (implForceDeploy) {
            proxyOptions.redeployImplementation = "always";
        }

        proxyOptions.txOverrides = feeOverriding;

        deployment = await hre.upgrades.deployProxy(
            factory,
            initializationArgs,
            proxyOptions,
        );
    } else {
        deployment = await factory.deploy(...initializationArgs, feeOverriding);
    }
    // log("Deployment data:", deployment);

    // Deploy contract
    const deployedContract = await deployment.waitForDeployment();
    const contractAddress = await deployedContract.getAddress();

    await Libs.sleep(3000);

    const implAddress = await Libs.printDeploymentResult(
        deployer,
        deploymentName != "" ? deploymentName : artifactName,
        contractAddress,
        isUpgradeable,
    );

    if (isWriteDeploymentResult) {
        await Libs.writeDeploymentResult(
            deploymentName != "" ? `${artifactName}$${deploymentName}` : artifactName,
            implAddress,
            initializationArgs,
            isUpgradeable ? contractAddress : null,
        );
    }

    return deployedContract;
}

async function deployBeacon(
    contractName,
    implConstructorArgs = [],
    implForceDeploy = false,
) {
    const [deployer] = await hre.ethers.getSigners();

    await Libs.printDeploymentTime(deployer);

    let { artifactName, deploymentName } = Utils.getContractName(contractName);

    // const { factory, feeOverriding } = await Libs.estimateDeploy(
    //     contractName,
    //     implConstructorArgs
    // );
    const factory = await hre.ethers.getContractFactory(artifactName);

    const beaconOptions = {
        kind: "beacon",
        timeout: 0,
        pollingInterval: 20000,
    };

    if (implConstructorArgs.length > 0) {
        beaconOptions.constructorArgs = implConstructorArgs;
    }

    if (implForceDeploy) {
        beaconOptions.redeployImplementation = "always";
    }

    // proxyOptions.txOverrides = feeOverriding;

    const beaconDeployment = await hre.upgrades.deployBeacon(
        factory,
        beaconOptions,
    );

    const deployedBeacon = await beaconDeployment.waitForDeployment();

    const beaconAddress = await deployedBeacon.getAddress();

    // await Libs.sleep(3000);

    const implAddress = await Libs.printDeploymentResult(
        deployer,
        deploymentName != "" ? deploymentName : artifactName,
        beaconAddress,
        true,
        true,
    );

    await Libs.writeDeploymentResult(
        deploymentName != "" ? `${artifactName}$${deploymentName}` : artifactName,
        implAddress,
        implConstructorArgs,
        null,
        beaconAddress,
    );

    return beaconDeployment;
}

module.exports = { deploy, deployBeacon };
