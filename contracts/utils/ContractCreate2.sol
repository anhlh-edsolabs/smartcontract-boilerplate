// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Base} from "../base/Base.sol";
import {Validation, BoolUtils} from "../libs/Utils.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

contract ContractCreate2 is Base {
    event Deployed(address addr, bytes32 salt);

    error FailedDeployment();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        __Base_init(_msgSender());
    }

    function computeProxyAddress(
        bytes32 salt,
        address impl,
        bytes calldata _data
    )
        external
        view
        returns (
            bytes memory creationCode,
            bytes32 initCodeHash,
            address computedAddress
        )
    {
        creationCode = type(ERC1967Proxy).creationCode;
        initCodeHash = keccak256(
            abi.encodePacked(
                type(ERC1967Proxy).creationCode,
                abi.encode(impl, _data)
            )
        );

        computedAddress = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            address(this),
                            salt,
                            initCodeHash
                        )
                    )
                )
            )
        );
    }

    function computeImplAddress(
        bytes32 salt,
        bytes calldata deployedBytecode,
        bytes calldata encodedConstructorArgs
    ) external view returns (address implAddress) {
        bytes32 initCodeHash = keccak256(
            abi.encodePacked(deployedBytecode, encodedConstructorArgs)
        );

        implAddress = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            address(this),
                            salt,
                            initCodeHash
                        )
                    )
                )
            )
        );
    }

    function deployProxy(
        bytes32 salt,
        address impl,
        bytes calldata _data
    ) external payable returns (address proxy) {
        bytes memory initCode = abi.encodePacked(
            type(ERC1967Proxy).creationCode,
            abi.encode(impl, _data)
        );

        proxy = _deploy(msg.value, salt, initCode, true);
    }

    function deployImpl(
        bytes32 salt,
        bytes calldata deployedBytecode,
        bytes calldata encodedConstructorArgs
    ) external payable returns (address impl) {
        bytes memory initCode = abi.encodePacked(
            deployedBytecode,
            encodedConstructorArgs
        );

        impl = _deploy(msg.value, salt, initCode, true);
    }

    function _deploy(
        uint256 amount,
        bytes32 salt,
        bytes memory initCode,
        bool useCreate2
    ) internal returns (address addr) {
        if (useCreate2) {
            assembly ("memory-safe") {
                addr := create2(
                    amount,
                    add(initCode, 0x20),
                    mload(initCode),
                    salt
                )

                if iszero(extcodesize(addr)) {
                    revert(0, 0)
                }
            }
        } else {
            assembly ("memory-safe") {
                addr := create(amount, add(initCode, 0x20), mload(initCode))

                if iszero(addr) {
                    revert(0, 0)
                }
            }
        }

        if (addr == address(0)) {
            revert FailedDeployment();
        }

        emit Deployed(addr, salt);
    }
}
