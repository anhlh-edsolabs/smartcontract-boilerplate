const { DeployHelper } = require("../utils");

async function main() {
    const CONTRACT_NAME = "MockUSDC";

    const INITIALIZATION_ARGS = [];
    const IMPL_CONSTRUCTOR_ARGS = [];

    await DeployHelper.deploy(
        CONTRACT_NAME,
        INITIALIZATION_ARGS,
        false,
        IMPL_CONSTRUCTOR_ARGS,
    );
}

main()
    .then(() => {})
    .catch((error) => {
        console.error(("Error:", error));
        process.exit(1);
    });
