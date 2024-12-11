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

const { Constants, CoinBase, log } = require("./scripts/utils");
const { OZResolver } = require("hardhat-gas-reporter/dist/lib/resolvers/oz");

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
    const accounts = await hre.ethers.getSigners();

    for (const account of accounts) {
        log(account.address);
    }
});

task("balance", "Prints an account's balance")
    .addParam("account", "The account's address")
    .setAction(async (taskArgs, hre) => {
        const balance = await ethers.provider.getBalance(taskArgs.account);

        log(ethers.utils.formatEther(balance), await CoinBase());
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
        local: {
            url: "http://127.0.0.1:8545/",
            chainId: 31337,
            accounts: [process.env.DEPLOYER_PK_DEV1],
        },
        sepolia: {
            url: process.env.RPC_PROVIDER_DEV1,
            chainId: 11155111,
            // gasPrice: GAS_PRICE * GAS_UNIT * 2,
            accounts: [process.env.DEPLOYER_PK_DEV1],
            from: process.env.DEPLOYER_DEV1,
        },
        polygonAmoy: {
            url: process.env.RPC_PROVIDER_DEV2,
            chainId: 80002,
            accounts: [process.env.DEPLOYER_PK_DEV2],
            from: process.env.DEPLOYER_DEV2,
        },
        bscTestnet: {
            url: process.env.RPC_PROVIDER_DEV3,
            chainId: 97,
            accounts: [process.env.DEPLOYER_PK_DEV3],
            from: process.env.DEPLOYER_DEV3,
        },
        mainnet: {
            url: process.env.RPC_PROVIDER_PROD1,
            chainId: 1,
            accounts: [process.env.DEPLOYER_PK_PROD1],
            from: process.env.DEPLOYER_PROD1,
        },
        polygon: {
            url: process.env.RPC_PROVIDER_PROD2,
            chainId: 137,
            accounts: [process.env.DEPLOYER_PK_PROD3],
            from: process.env.DEPLOYER_PK_PROD3,
        },
        bsc: {
            url: process.env.RPC_PROVIDER_PROD3,
            chainId: 56,
            accounts: [process.env.DEPLOYER_PK_PROD3],
            from: process.env.DEPLOYER_PK_PROD3,
        }
    },
    defender: {
        apiKey: process.env.DEFENDER_API_KEY,
        apiSecret: process.env.DEFENDER_API_SECRET,        
    },
    etherscan: {
        apiKey: {
            mainnet: process.env.ETHERSCAN_API_KEY,
            sepolia: process.env.ETHERSCAN_API_KEY,
            polygon: process.env.POLYGONSCAN_API_KEY,
            polygonAmoy: process.env.POLYGONSCAN_API_KEY,
            bsc: process.env.BSCSCAN_API_KEY,
            bscTestnet: process.env.BSCSCAN_API_KEY,
        },
        customChains: [
            {
                network: "polygonAmoy",
                chainId: 80002,
                urls: {
                    apiURL: "https://api-amoy.polygonscan.com/api",
                    browserURL: "https://amoy.polygonscan.com/",
                },
            },
            {
                network: "bscTestnet",
                chainId: 97,
                urls: {
                    apiURL: "https://api-testnet.bscscan.com/api",
                    browserURL: "https://testnet.bscscan.com/",
                },
            }
        ],
    },
    solidity: {
        version: "0.8.28",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200,
            },
        },
    },
    paths: {
        sources: "./contracts",
        tests: "./test",
        cache: "./cache",
        artifacts: "./artifacts",
    },
    mocha: {
        timeout: 600000,
    },
    contractSizer: {
        alphaSort: true,
        disambiguatePaths: true,
        runOnCompile: false,
        strict: true,
    },
    gasReporter: {
        currency: "USD",
        coinmarketcap: process.env.COINMARKETCAP_API_KEY,
        enabled: process.env.REPORT_GAS ? true : false,
        L1: "ethereum",
        L1Etherscan: `${process.env.ETHERSCAN_API_KEY}`,
        currencyDisplayPrecision: 5,
        includeIntrinsicGas: true,
        proxyResolver: new OZResolver(),
        showTimeSpent: true,
        showMethodSig: true,
        token: "ETH",
        reportFormat: "markdown",
        outputFile: "./gasReport/ethereum.md",
        forceTerminalOutput: true,
        forceTerminalOutputFormat: "terminal",
    },
    sourcify: {
        enabled: false,
    },
};
