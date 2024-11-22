// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import {RoleUtils, Validation} from "../libs/Utils.sol";

abstract contract Base is
    Initializable,
    UUPSUpgradeable,
    AccessControlUpgradeable,
    MulticallUpgradeable,
    PausableUpgradeable
{
    /** Role definitions */
    bytes32 public constant UPGRADER = keccak256("UPGRADER");
    bytes32 public constant PAUSER = keccak256("PAUSER");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function __Base_init(address initialAdmin) internal onlyInitializing {
        __UUPSUpgradeable_init();
        __AccessControl_init();
        __Multicall_init();
        __Pausable_init();

        __Base_init_unchained(initialAdmin);
    }

    function __Base_init_unchained(
        address initialAdmin
    ) internal onlyInitializing {
        Validation.noZeroAddress(initialAdmin);

        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(UPGRADER, initialAdmin);
        _grantRole(PAUSER, initialAdmin);
    }

    function pause() public onlyRole(PAUSER) {
        _pause();
    }

    function unpause() public onlyRole(PAUSER) {
        _unpause();
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view virtual override(AccessControlUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _authorizeUpgrade(
        address
    ) internal virtual override onlyRole(UPGRADER) {}
}
