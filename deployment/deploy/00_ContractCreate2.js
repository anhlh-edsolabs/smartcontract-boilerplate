const { deploy } = require("contract-deploy-helper");

async function main() {
    const CONTRACT_NAME = "ContractCreate2";

    const INITIALIZATION_ARGS = [];
    const IMPL_CONSTRUCTOR_ARGS = [];

    await deploy({
        contractName: CONTRACT_NAME,
        initializationArgs: INITIALIZATION_ARGS,
        isUpgradeable: true,
        implConstructorArgs: IMPL_CONSTRUCTOR_ARGS,
    });
}

main()
    .then(() => {})
    .catch((error) => {
        console.error(("Error:", error));
        process.exit(1);
    });
