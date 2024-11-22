// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

library RoleUtils {
    function calculateRoleHash(
        string memory roleName
    ) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(address(this), roleName));
    }
}

library Validation {
    error NoZeroAddress();
    error NoZeroAmount();
    error NoZeroAddressWithMessage(string message);

    function noZeroAddress(address account) internal pure {
        if (account == address(0)) {
            revert NoZeroAddress();
        }
    }

    function noZeroAddress(
        address account,
        string memory message
    ) internal pure {
        message = bytes(message).length > 0
            ? message
            : "Setting to the zero address";

        if (account == address(0)) {
            revert NoZeroAddressWithMessage(message);
        }
    }

    function noZeroAmount(uint256 amount) internal pure {
        if (amount == 0) {
            revert NoZeroAmount();
        }
    }
}

library StringUtils {
    function bytes32toString(
        bytes32 value
    ) internal pure returns (string memory result) {
        uint8 length = 0;

        while (length < 32 && value[length] != 0) {
            length++;
        }

        assembly {
            result := mload(0x40)
            // new "memory end" including padding (the string isn't larger than 32 bytes)
            mstore(0x40, add(result, 0x40))
            // store length in memory
            mstore(result, length)
            // write actual data
            mstore(add(result, 0x20), value)
        }
    }

    // https://ethereum.stackexchange.com/a/126928
    function bytesToHexstring(bytes memory input) internal pure returns (string memory) {

        // Fixed `input` size for hexadecimal convertion
        bytes memory converted = new bytes(input.length * 2);

        bytes memory _base = "0123456789abcdef";

        for (uint256 i = 0; i < input.length; i++) {
            converted[i * 2] = _base[uint8(input[i]) / _base.length];
            converted[i * 2 + 1] = _base[uint8(input[i]) % _base.length];
        }

        return string(abi.encodePacked("0x", converted));
    }
}

library BoolUtils {
    /**
     * @dev Converts a boolean value to bytes32.
     * @param value The boolean value to be converted.
     * @return result The bytes32 representation of the boolean value.
     */
    function toBytes32(bool value) internal pure returns (bytes32 result) {
        // Sets the value of `result` to `value` using assembly
        assembly {
            result := value
        }
    }

    /**
     * @dev Converts a bytes32 value to a boolean value.
     * @param value The bytes32 value to be converted.
     * @return The boolean value.
     */
    function bytes32ToBool(bytes32 value) internal pure returns (bool) {
        return value != bytes32(0);
    }
}
