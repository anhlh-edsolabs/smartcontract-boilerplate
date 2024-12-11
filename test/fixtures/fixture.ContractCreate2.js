require("dotenv").config();
require("@openzeppelin/hardhat-upgrades");
const hre = require("hardhat");
const { log } = require("console");

async function init(printOutput = true) {
    const [deployer] = await hre.ethers.getSigners();

    const TokenFactory = await hre.ethers.getContractFactory("CurrencyUpgradeable");
    const ERC1967ProxyFactory = await hre.ethers.getContractFactory("ERC1967Proxy");

    const ContractCreate2Factory =
        await hre.ethers.getContractFactory("ContractCreate2");

    const contractCreate2 = await hre.upgrades.deployProxy(
        ContractCreate2Factory,
        [],
    );

    await contractCreate2.waitForDeployment();

    if (printOutput) {
        log("ContractCreate2 deployed to:", contractCreate2.address);
    }

    return { deployer, contractCreate2, TokenFactory, ERC1967ProxyFactory };
}

module.exports = { init };
