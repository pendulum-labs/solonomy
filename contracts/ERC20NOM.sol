// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";

contract ERC20NOM is ERC20Burnable {
    
    string public name = "Onomy";
    string public symbol = "NOM";
    uint8 public decimals = 18;

    // 100 million initial supply
    uint256 public constant INITIAL_SUPPLY = 100000000;

    constructor () public {
        _mint(msg.sender, INITIAL_SUPPLY * (10 ** uint256(decimals)));
    }
}
