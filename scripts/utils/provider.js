const ethers = require("ethers");
const { Utils } = require("./utils");

ethers.JsonRpcProvider.prototype.getNetwork = async function () {
    return await this.send("eth_chainId");
}

ethers.JsonRpcProvider.prototype.getRevertReason = async function (txHash) {
    const txn = await this.getTransaction(txHash);
    const result = await this.call(txn, txn.blockNumber);
    let message = result;

    if (result != "0x" && ethers.dataLength(result) >= 4) {
        const errorSignature = ethers.dataSlice(result, 0, 4);
        if (errorSignature == "0x08c379a0") {
            const errorData = ethers.dataSlice(result, 4);
            message = ethers.AbiCoder.defaultAbiCoder().decode(["string"], errorData)[0];
        }
    }

    return "Revert reason:", message;
}

ethers.JsonRpcProvider.prototype.getImplementationAddress = async function (proxyAddress) {
    const slot = Utils.erc1967Slot.Implementation;
    const impl = await this.getStorage(proxyAddress, slot);
    return ethers.AbiCoder.defaultAbiCoder().decode(["address"], impl)[0];
}