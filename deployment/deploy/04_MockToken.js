const { DeployHelper } = require("../utils");

async function main() {
    const CONTRACT_NAME = "MockToken";
    const tokens = [
        {
            deploymentName: "MockUSDT",
            name: "Test USDT",
            symbol: "TUSDT",
            decimals: 6,
        },
        {
            deploymentName: "MockUSDC",
            name: "Test USDC",
            symbol: "TUSDC",
            decimals: 6,
        },
    ];
    for (const token of tokens) {
        const INITIALIZATION_ARGS = [token.name, token.symbol, token.decimals];
        const IMPL_CONSTRUCTOR_ARGS = [];

        await DeployHelper.deploy(
            `${CONTRACT_NAME}$${token.deploymentName}`,
            INITIALIZATION_ARGS,
            true,
            IMPL_CONSTRUCTOR_ARGS,
        );
    }
}

main()
    .then(() => {})
    .catch((error) => {
        console.error(("Error:", error));
        process.exit(1);
    });
