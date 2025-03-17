const { ethers } = require("hardhat");
const { upgrade } = require("contract-deploy-helper");

async function main() {
    const CONTRACT_NAME_V1 = "ContractCreate2V2";
    const CONTRACT_NAME_V2 = "ContractCreate2V2";

    await upgrade({
        contractNameV1: CONTRACT_NAME_V1,
        contractNameV2: CONTRACT_NAME_V2,
        implConstructorArgs: ["0x0000000000000000000000000000000000000000000000000000000000000003"],
        reinitializer: {
            fn: "initializeV2",
            args: [4]
        }
    });
}

main()
    .then(() => {})
    .catch((error) => {
        console.error(("Error:", error));
        process.exit(1);
    });
