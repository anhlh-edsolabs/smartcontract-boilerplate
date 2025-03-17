// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "./ContractCreate2.sol";

contract ContractCreate2V2 is ContractCreate2 {
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    bytes32 public immutable salt;

    /** Storage */
    /// @custom:storage-location erc7201:mitl.storage.ContractCreate2V2Storage
    struct ContractCreate2V2Storage {
        uint64 _version;
    }

    // keccak256(abi.encode(uint256(keccak256("mitl.storage.ContractCreate2V2Storage")) - 1)) & ~bytes32(uint256(0xff))
    bytes32 private constant ContractCreate2V2StorageSlot =
        0x99ac1752988a82533d3805504545a6e9b43ab52b6d9cbe2fd970962dd7e89300;

    /** Read storage slot */
    function _getContractCreate2V2Storage()
        internal
        pure
        returns (ContractCreate2V2Storage storage $)
    {
        assembly {
            $.slot := ContractCreate2V2StorageSlot
        }
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(bytes32 _salt) {
        salt = _salt;
    }

    function initializeV2(uint64 version) external reinitializer(version) {
        ContractCreate2V2Storage storage $ = _getContractCreate2V2Storage();
        $._version = version;
    }

    function getVersion() external view returns (uint64) {
        return _getContractCreate2V2Storage()._version;
    }
}
