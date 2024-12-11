const hre = require("hardhat");
const { log } = require("console");
const { Libs, proxyOptions, beaconOptions } = require("./libs");
const { Utils } = require("../../scripts/utils/utils");

async function deploy(
    contractName,
    initializationArgs = [],
    isUpgradeable = false,
    implConstructorArgs = [],
    implForceDeploy = false,
    writeDeploymentResult = true,
    gasLimit = 0,
    defenderOptions = undefined,
) {
    const [deployer] = await hre.ethers.getSigners();
    await Libs.printDeploymentTime(deployer);

    const { artifactName, deploymentName } =
        Utils.getContractName(contractName);
    const { factory, feeOverriding } = await Libs.estimateDeploy(
        artifactName,
        implConstructorArgs,
    );

    if (gasLimit > 0) {
        feeOverriding.gasLimit = gasLimit;
    }

    let deployment;
    if (isUpgradeable) {
        // construct proxy deployment options
        const proxyOpts = {
            ...proxyOptions,
            constructorArgs:
                implConstructorArgs.length > 0
                    ? implConstructorArgs
                    : undefined,
            redeployImplementation: implForceDeploy ? "always" : "never",
            txOverrides: feeOverriding,
            ...Libs.getDefenderOptions(defenderOptions),
        };

        deployment = await hre.upgrades.deployProxy(
            factory,
            initializationArgs,
            proxyOpts,
        );
    } else {
        deployment = await factory.deploy(
            ...implConstructorArgs,
            feeOverriding,
        );
    }
    // log("Deployment data:", deployment);

    // Deploy contract
    const deployedContract = await deployment.waitForDeployment();
    const contractAddress = await deployedContract.getAddress();

    const implAddress = await Libs.printDeploymentResult(
        deployer,
        deploymentName || artifactName,
        contractAddress,
        isUpgradeable,
    );

    if (writeDeploymentResult) {
        await Libs.writeDeploymentResult(
            deploymentName ? `${artifactName}$${deploymentName}` : artifactName,
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
        deploymentName != ""
            ? `${artifactName}$${deploymentName}`
            : artifactName,
        implAddress,
        implConstructorArgs,
        null,
        beaconAddress,
    );

    return beaconDeployment;
}

module.exports = { deploy, deployBeacon };
