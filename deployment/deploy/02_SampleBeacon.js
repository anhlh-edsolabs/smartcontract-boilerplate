const { DeployHelper } = require("../utils");

async function main() {
    const CONTRACT_NAME = "<Contract Name>";
    const IMPL_CONSTRUCTOR_ARGS = ["<Param1>", "<Param2>"];

    await DeployHelper.deployBeacon(
        CONTRACT_NAME,
        IMPL_CONSTRUCTOR_ARGS,
        false,
    );
}

main()
    .then(() => {})
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });
