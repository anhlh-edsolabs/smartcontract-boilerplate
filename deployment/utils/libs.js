const hre = require("hardhat");
const fs = require("fs");
const chalk = require("chalk");
const { ethers } = require("ethers");
const { log } = require("console");
const {
    Constants: { ENV_KEY },
    CoinBase,
    Provider,
    DeploymentStorage,
} = require("../../scripts/utils/env");
const { Utils } = require("../../scripts/utils/utils");

const UpgradeableBeaconABI = require("./UpgradeableBeacon_ABI.json");

const chainID = hre.network.config.chainId;

const proxyOptions = {
    kind: "uups",
    timeout: 0,
    pollingInterval: 20000,
};

const beaconOptions = {
    kind: "beacon",
    timeout: 0,
    pollingInterval: 20000,
};

const defenderDefaultOptions = {
    salt: "0x0000000000000000000000000000000000000000000000000000000000000000",
};

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
    // wait for 3 seconds before fetching the implementation address
    await sleep(3000);

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
    previousImplAddress = null,
    previousContractName = contractName,
    isProxyUpgrade = false,
) {
    DeploymentStorage.Env[ENV_KEY] =
        DeploymentStorage.Env[ENV_KEY] !== undefined
            ? DeploymentStorage.Env[ENV_KEY]
            : {};
    if (isProxyUpgrade) {
        if (contractName != previousContractName) {
            // deep cloning the object for previous contract
            DeploymentStorage.Env[ENV_KEY][contractName] = JSON.parse(
                JSON.stringify(
                    DeploymentStorage.Env[ENV_KEY][previousContractName],
                ),
            );

            // delete the object for previous contract
            delete DeploymentStorage.Env[ENV_KEY][previousContractName];

            const previousContractNames = DeploymentStorage.Env[ENV_KEY][
                contractName
            ]["PreviousContractNames"]
                ? DeploymentStorage.Env[ENV_KEY][contractName][
                      "PreviousContractNames"
                  ]
                : [];
            DeploymentStorage.Env;
            previousContractNames.push(previousContractName);

            DeploymentStorage.Env[ENV_KEY][contractName][
                "PreviousContractNames"
            ] = previousContractNames;
        }

        const previousImplAddresses = DeploymentStorage.Env[ENV_KEY][
            contractName
        ]["PreviousImplementations"]
            ? DeploymentStorage.Env[ENV_KEY][contractName][
                  "PreviousImplementations"
              ]
            : [];

        previousImplAddresses.push(previousImplAddress);

        DeploymentStorage.Env[ENV_KEY][contractName]["Proxy"] = proxyAddress;
        DeploymentStorage.Env[ENV_KEY][contractName]["Beacon"] = beaconAddress;
        DeploymentStorage.Env[ENV_KEY][contractName]["Impl"] =
            implementationAddress;
        DeploymentStorage.Env[ENV_KEY][contractName][
            "PreviousImplementations"
        ] = previousImplAddresses;
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
    const impl = await Provider.getStorage(
        proxyAddress,
        Utils.erc1967Slot.Implementation(),
    );
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
    const factory = await hre.ethers.getContractFactory(contractName);
    let feeData;

    try {
        feeData = await Provider.getFeeData();
    } catch (err) {
        log(chalk.bold.red("Error getting fee data:", err.shortMessage));

        // fallback to default fee data
        feeData = {
            gasPrice: ethers.parseUnits("1", "gwei"),
            maxFeePerGas: ethers.parseUnits("20", "gwei"),
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
    const maxFeePerGas =
        feeData.maxFeePerGas || (networkGasPrice * 110n) / 100n; // set the MaxFeePerGas to 10% higher than gas price
    const maxPriorityFeePerGas =
        feeData.maxPriorityFeePerGas || ethers.parseUnits("1", "gwei");

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
            ethers.formatUnits(maxFeePerGas, "gwei"),
        )} gwei`,
    );
    log(
        `Estimated cost for ${chalk.bold.blueBright(
            contractName,
        )} contract deployment: ${chalk.bold.red(
            estimatedCost,
        )} ${chalk.bold.red(await CoinBase())}`,
    );

    const feeOverriding =
        chainID == 97
            ? { gasLimit: Number(estimatedGas) }
            : {
                  maxPriorityFeePerGas: Number(maxPriorityFeePerGas),
                  maxFeePerGas: Number(maxFeePerGas),
                  baseFeePerGas: Number(networkGasPrice),
                  type: 2,
              };

    return { factory, feeOverriding };
}

function getDefenderOptions(defenderOptions) {
    if (!defenderOptions) return {};

    const {
        useDefenderDeploy = true,
        verifySourceCode = false,
        useCreate2,
        salt,
    } = defenderOptions;

    const options = { useDefenderDeploy };

    if (useDefenderDeploy) {
        options.verifySourceCode = verifySourceCode;
        if (useCreate2) {
            options.salt = salt ?? defenderDefaultOptions.salt;
        }
    }

    return options;
}

module.exports = {
    Libs: {
        printDeploymentTime,
        printDeploymentResult,
        writeDeploymentResult,
        getImplementationAddress,
        sleep,
        estimateDeploy,
        getDefenderOptions,
    },
    chainID,
    proxyOptions,
    beaconOptions,
    defenderDefaultOptions,
};
