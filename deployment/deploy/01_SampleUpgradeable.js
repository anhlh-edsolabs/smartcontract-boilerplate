const { DeployHelper } = require("../utils");

async function main() {
    const CONTRACT_NAME = "<Contract Name>";

    const INITIALIZATION_ARGS = ["<Param1>", "<Param2>"];
    const IMPL_CONSTRUCTOR_ARGS = ["<Param1>", "<Param2>", "<Param3>"];

    await DeployHelper.deploy(
        CONTRACT_NAME,
        INITIALIZATION_ARGS,
        true,
        IMPL_CONSTRUCTOR_ARGS,
    );
}

main()
    .then(() => {})
    .catch((error) => {
        console.error(("Error:", error));
        process.exit(1);
    });
