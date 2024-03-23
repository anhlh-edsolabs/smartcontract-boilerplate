// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import {RoleUtils, CommonValidation} from "../libs/Utils.sol";

abstract contract Base is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    MulticallUpgradeable
{
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function __Base_init(address initialAdmin) internal onlyInitializing {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Multicall_init();

        __Base_init_unchained(initialAdmin);
    }

    function __Base_init_unchained(
        address initialAdmin
    ) internal onlyInitializing {
        CommonValidation._noZeroAddress(
            initialAdmin,
            "Base: Initial Admin address must not be the zero address"
        );

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    /** Role definitions */
    function UPGRADER() public view returns (bytes32) {
        return RoleUtils._calculateRoleHash("UPGRADER");
    }

    function _authorizeUpgrade(
        address
    ) internal virtual override onlyRole(UPGRADER()) {}
}
