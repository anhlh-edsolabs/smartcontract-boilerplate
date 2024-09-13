const { ethers } = require("ethers");
const abiCoder = ethers.AbiCoder.defaultAbiCoder();

/**
 * Formula: bytes32(uint256(keccak256('eip1967.proxy.implementation')) - 1)
 * Output value: '0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc'
 *
 * @returns The computed implementation slot for ERC1967
 */
function erc1967ImplSlot() {
    return _erc1967Slot("eip1967.proxy.implementation");
}

/**
 * The storage slot of the UpgradeableBeacon contract which defines the implementation for this proxy.
 * This is the keccak-256 hash of "eip1967.proxy.beacon" subtracted by 1.
 * Formula: bytes32(uint256(keccak256('eip1967.proxy.beacon')) - 1)
 *
 * Output value: '0xa3f0ad74e5423aebfd80d3ef4346578335a9a72aeaee59ff6cb3582b35133d50'
 *
 * @returns The computed beacon slot for ERC1967
 */
function erc1967BeaconSlot() {
    return _erc1967Slot("eip1967.proxy.beacon");
}

/**
 * The storage slot of the UpgradeableBeacon contract which defines the admin for this proxy.
 * This is the keccak-256 hash of "eip1967.proxy.beacon" subtracted by 1.
 * Formula: bytes32(uint256(keccak256('eip1967.proxy.admin')) - 1)
 *
 * Output value: '0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103'
 *
 * @returns The computed admin slot for ERC1967
 */
function erc1967AdminSlot() {
    return _erc1967Slot("eip1967.proxy.admin");
}

function _erc1967Slot(name) {
    return ethers.toQuantity(BigInt(ethers.keccak256(Buffer.from(name))) - 1n);
}

/**
 * Compute the ERC7201 storage namespace hash
 * Formula: keccak256(abi.encode(uint256(keccak256("namespaceId")) - 1)) & ~bytes32(uint256(0xff))
 * @param {string} namespaceId
 * @returns {string} ERC7201 storage namespace hash as a bytes32 hex string
 */
function erc7201(namespaceId) {
    return ethers.toBeHex(
        BigInt(
            ethers.keccak256(
                abiCoder.encode(
                    ["uint256"],
                    [BigInt(ethers.keccak256(Buffer.from(namespaceId))) - 1n],
                ),
            ),
        ) &
            (~BigInt("0xff") & ethers.MaxUint256),
    );
}

/**
 * Iterates over the inputs array and returns a comma-separated string of input types.
 * If an input type is a tuple or an array of tuples, it recursively iterates over the components and appends the result.
 * @param {Array} inputs - The array of input objects.
 * @returns {string} - A comma-separated string of input types.
 */
function iterateInputs(inputs) {
    let result = [];

    for (let input of inputs) {
        if (input.type === "tuple" || input.type === "tuple[]") {
            let childResult = iterateInputs(input.components);
            result.push(
                `tuple(${childResult})` +
                    (input.type === "tuple[]" ? "[]" : ""),
            );
        } else {
            result.push(input.type);
        }
    }

    return result.join(",");
}

/**
 * Retrieves the artifact name and deployment name from a compound contract name.
 *
 * @param {string} contractNameCompound - The compound contract name in the format `contractName$deploymentName`.
 * @returns {Object} - An object containing the artifact name and deployment name.
 */
function getContractName(contractNameCompound) {
    let artifactName = contractNameCompound;
    let deploymentName = "";

    if (String(contractNameCompound).includes("$")) {
        const [_artifactName, _deploymentName] =
            String(contractNameCompound).split("$");
        artifactName = _artifactName.trim();
        deploymentName = _deploymentName.trim();
    }

    return { artifactName, deploymentName };
}

module.exports = {
    Utils: {
        erc7201,
        erc1967Slot: {
            Implementation: erc1967ImplSlot,
            Beacon: erc1967BeaconSlot,
            Admin: erc1967AdminSlot,
        },
        iterateInputs,
        getContractName,
    },
};
