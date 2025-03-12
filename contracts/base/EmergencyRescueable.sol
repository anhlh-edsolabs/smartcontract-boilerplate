// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Validation} from "../libs/Utils.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

abstract contract EmergencyRescueable {
    using SafeERC20 for IERC20;

    error NativeCoinIsNotSupported();

    event FundRescued(
        address token,
        address recipient,
        uint256 amount,
        uint256 timestamp
    );

    function rescue(
        address token,
        address recipient,
        uint256 amount
    ) external virtual {
        _authorizeRescue();
        Validation.noZeroAddress(token);
        Validation.noZeroAddress(recipient);
        Validation.noZeroAmount(amount);

        amount = amount == type(uint256).max
            ? IERC20(token).balanceOf(address(this))
            : amount;

        IERC20(token).safeTransfer(recipient, amount);

        emit FundRescued(token, recipient, amount, block.timestamp);
    }

    function _authorizeRescue() internal virtual;

    receive() external virtual payable {
        _fallback();
    }

    fallback() external virtual payable {
        _fallback();
    }

    function _fallback() internal pure {
        revert NativeCoinIsNotSupported();
    }
}
