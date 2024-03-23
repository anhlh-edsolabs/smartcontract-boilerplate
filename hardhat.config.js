require("dotenv").config();
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-foundry");
require("@nomicfoundation/hardhat-verify");
require("@nomiclabs/hardhat-solhint");
require("@openzeppelin/hardhat-upgrades");

require("solidity-coverage");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require("hardhat-extended-tasks");

const { dot } = require("node:test/reporters");
const {
    RPC_URL,
    DEPLOYER,
    DEPLOYER_PK,
    CoinBase,
    log,
} = require("./scripts/utils");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        console.log(account.address);
    }
});

task("balance", "Prints an account's balance")
    .addParam("account", "The account's address")
    .setAction(async (taskArgs, hre) => {
        const balance = await ethers.provider.getBalance(taskArgs.account);

        console.log(ethers.utils.formatEther(balance), await CoinBase());
    });
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    defaultNetwork: "hardhat",
    networks: {
        hardhat: {
            accounts: {
                count: 100,
            },
        },
        sepolia: {
            url: process.env.RPC_PROVIDER_DEV,
            chainId: 11155111,
            // gasPrice: GAS_PRICE * GAS_UNIT * 2,
            accounts: [DEPLOYER_PK],
            from: DEPLOYER,
        },
        mumbai: {
            url: process.env.MUMBAI_PROVIDER_DEV,
            chainId: 80001,
            accounts: [DEPLOYER_PK],
            from: DEPLOYER,
            gasPrice: 1e9,
            minGasPrice: 1e9,
            initialBaseFeePerGas: 1e9,
        },
        // mainnet: {
        //     url: process.env.MAINNET_PROVIDER,
        //     chainId: 1,
        //     accounts: [process.env.MAINNET_DEPLOYER_PK],
        //     from: process.env.MAINNET_DEPLOYER_ADDRESS,
        //     gasPrice: 27e9,
        //     minGasPrice: 25e9,
        //     initialBaseFeePerGas: 24e9,
        // },
    },
    etherscan: {
        apiKey: {
            mainnet: process.env.ETHERSCAN_API_KEY,
            sepolia: process.env.ETHERSCAN_API_KEY,
            polygonMumbai: process.env.POLYGONSCAN_API_KEY,
        },
    },
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    // paths: {
    //     sources: "./contracts",
    //     tests: "./test",
    //     cache: "./cache",
    //     artifacts: "./artifacts",
    // },
    mocha: {
        timeout: 600000,
    },
    contractSizer: {
        alphaSort: true,
        disambiguatePaths: true,
        runOnCompile: false,
        strict: true,
    },
};
