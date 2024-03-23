const hre = require("hardhat");
const fs = require("fs");
const chalk = require("chalk");
const { ethers } = require("ethers");
const { log } = require("console");
const {
    ENV_KEY,
    CoinBase,
    Provider,
    DeploymentStorage,
} = require("../../scripts/utils/env");

const UpgradeableBeaconABI = require("./UpgradeableBeacon_ABI.json");

/** Implementation Slot is calculated as follow:
 * IMPLEMENTATION_SLOT = BigNumber.from(utils.keccak256(Buffer.from('eip1967.proxy.implementation'))).sub(1).toHexString()
 *
 * Output value: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
 * */
const IMPLEMENTATION_SLOT =
    "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";

/** The storage slot of the UpgradeableBeacon contract which defines the implementation for this proxy.
 * This is the keccak-256 hash of "eip1967.proxy.beacon" subtracted by 1.
 * BEACON_SLOT = BigNumber.from(utils.keccak256(Buffer.from('eip1967.proxy.beacon'))).sub(1).toHexString()
 *
 * Output value: '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50'
 * */
const BEACON_SLOT =
    "0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50";

const chainID = hre.network.config.chainId;

async function printDeploymentTime(deployer, isUpgrade = false) {
    log("====================================================");
    log("Start time: ", Date(Date.now()));

    log(
        `${!isUpgrade ? "Deploying" : "Upgrading"} contract with the account: ${
            deployer.address
        }`,
    );

    log(
        "Account balance:",
        ethers.formatEther(await Provider.getBalance(deployer.address)),
    );
    log("====================================================\n\r");
}

async function printDeploymentResult(
    deployer,
    contractName,
    contractAddress,
    isUpgrade = false,
    isBeacon = false,
) {
    let impl = contractAddress;

    log("====================================================");
    log("COMPLETED.");
    if (isUpgrade) {
        if (!isBeacon) {
            impl = await getImplementationAddress(contractAddress);
            log(
                `- ${chalk.bold.blue(contractName)} proxy address: ${chalk.bold.red(
                    contractAddress,
                )}`,
            );
        } else {
            const beaconContract = new ethers.Contract(
                contractAddress,
                UpgradeableBeaconABI,
                deployer,
            );
            impl = await beaconContract.implementation();
            log(
                `- ${chalk.bold.blue(contractName)} beacon address: ${chalk.bold.red(
                    contractAddress,
                )}`,
            );
        }
        log("- Implementation:", chalk.bold.yellow(impl));
    } else {
        log(
            `- ${chalk.bold.blue(contractName)} address: ${chalk.bold.yellow(
                impl,
            )}`,
        );
    }
    log(
        "- Account balance after deployment: ",
        chalk.bold.yellowBright(
            ethers.formatEther(await Provider.getBalance(deployer.address)),
        ),
    );
    log("====================================================");

    return impl;
}

async function writeDeploymentResult(
    contractName,
    implementationAddress,
    initializationArgs = [],
    proxyAddress = null,
    beaconAddress = null,
    isProxyUpgrade = false,
) {
    DeploymentStorage.Env[ENV_KEY] =
        DeploymentStorage.Env[ENV_KEY] !== undefined
            ? DeploymentStorage.Env[ENV_KEY]
            : {};
    if (isProxyUpgrade) {
        DeploymentStorage.Env[ENV_KEY][contractName].Impl =
            implementationAddress;
    } else {
        DeploymentStorage.Env[ENV_KEY][contractName] = {
            ChainID: chainID,
            Proxy: proxyAddress,
            Beacon: beaconAddress,
            Impl: implementationAddress,
            InitializationArgs: initializationArgs,
        };
    }

    try {
        await fs.promises.writeFile(
            DeploymentStorage.File,
            JSON.stringify(DeploymentStorage.Env, null, "\t"),
        );
        log(
            `Deployment data has been written to ${DeploymentStorage.File}.\n\r`,
        );
    } catch (err) {
        log(`Error when writing to ${DeploymentStorage.File}.\n\r`, err);
    }
}

async function getImplementationAddress(proxyAddress) {
    const impl = await Provider.getStorage(proxyAddress, IMPLEMENTATION_SLOT);
    return ethers.AbiCoder.defaultAbiCoder().decode(["address"], impl)[0];
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

BigInt.prototype.toJSON = function () {
    return this.toString();
};

async function estimateDeploy(
    contractName,
    constructorArgs = [],
    constructorArgsFile = "",
) {
    ethers.ContractFactory.getInterface;
    const factory = await hre.ethers.getContractFactory(contractName);
    let feeData;

    try {
        feeData = await Provider.getFeeData();
    } catch(err) {
        log(chalk.bold.red("Error getting fee data:", err.shortMessage));

        // fallback to default fee data
        feeData = {
            gasPrice: ethers.parseUnits("1", "gwei"),
            maxFeePerGas: ethers.parseUnits("100", "gwei"),
            maxPriorityFeePerGas: ethers.parseUnits("1", "gwei"),
        };
    }

    const args =
        constructorArgsFile != ""
            ? Object.values(require(constructorArgsFile))
            : constructorArgs;

    const deployTx = await factory.getDeployTransaction(...args);

    const estimatedGas = await hre.ethers.provider.estimateGas(deployTx);

    const networkGasPrice = feeData.gasPrice;
    const estimatedCost = ethers.formatEther(estimatedGas * networkGasPrice);

    // log(`Estimated gas: ${estimatedGas.toBigInt().toLocaleString("en-GB")}`);
    log(
        `Estimated gas: ${chalk.bold.yellow(
            estimatedGas.toLocaleString("vi-VN"),
        )}`,
    );
    log(
        `Gas price: ${chalk.bold.red(
            ethers.formatUnits(networkGasPrice, "gwei"),
        )} gwei`,
    );
    log(
        `Max fee per gas: ${chalk.bold.red(
            ethers.formatUnits(feeData.maxFeePerGas, "gwei"),
        )} gwei`,
    );
    log(
        `Estimated cost for ${chalk.bold.blueBright(
            contractName,
        )} contract deployment: ${chalk.bold.red(
            estimatedCost,
        )} ${chalk.bold.red(await CoinBase())}`,
    );

    const feeOverriding = {
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas,
        maxFeePerGas: feeData.maxFeePerGas,
        baseFeePerGas: feeData.gasPrice,
        type: 2,
    };

    return { factory, feeOverriding };
}

module.exports = {
    Libs: {
        printDeploymentTime,
        printDeploymentResult,
        writeDeploymentResult,
        getImplementationAddress,
        sleep,
        estimateDeploy,
    },
};
