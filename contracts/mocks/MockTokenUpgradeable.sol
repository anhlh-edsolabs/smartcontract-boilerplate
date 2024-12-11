// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract CurrencyUpgradeable is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    ERC20Upgradeable
{
    /// @custom:oz-upgrades-unsafe-allow state-variable-immutable
    uint8 private immutable _decimals;

    function initialize(
        string memory name_,
        string memory symbol_,
        address initialOwner
    ) public initializer {
        __ERC20_init(name_, symbol_);

        initialOwner = initialOwner == address(0) ? _msgSender() : initialOwner;
        __Ownable_init(initialOwner);
    }

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(uint8 decimals_) {
        _disableInitializers();

        _decimals = decimals_;
    }

    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }

    function decimals() public view override returns (uint8) {
        return _decimals;
    }

    function _authorizeUpgrade(address) internal virtual override onlyOwner {}
}
