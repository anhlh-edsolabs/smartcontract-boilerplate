const { Provider } = require("./env");

async function advanceBlockToTimestamp(timestamp) {
    await Provider.send("evm_setNextBlockTimestamp", [timestamp]);
    await Provider.send("evm_mine");
}

async function getBlockTimestamp(receipt) {
    const block = await Provider.getBlock(receipt.blockNumber);

    return block.timestamp;
}

async function getLastestBlockTimestamp() {
    const block = await Provider.getBlock("latest");
    return block.timestamp;
}

module.exports = {
    BlockHelper: {
        advanceBlockToTimestamp,
        getBlockTimestamp,
        getLastestBlockTimestamp,
    },
};
