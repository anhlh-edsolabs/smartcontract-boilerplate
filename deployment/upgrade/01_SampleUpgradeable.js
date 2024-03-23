const { ethers } = require("ethers");
const hre = require("hardhat");

const { DeployHelper } = require("../utils");

const CONTRACT_NAME = "<Contract Name>";
const IMPL_CONSTRUCTOR_ARGS = ["<Param1>", "<Param2>", "<Param3>"];

async function main() {
    await DeployHelper.upgrade(
        CONTRACT_NAME,
        CONTRACT_NAME,
        IMPL_CONSTRUCTOR_ARGS,
        true,
    );
}

main()
    .then(() => {})
    .catch((error) => {
        console.error(("Error:", error));
        process.exit(1);
    });
