// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "abdk-libraries-solidity/ABDKMath64x64.sol" as abdk64;

contract BondingNOM {
    uint256 public numNOMSold;
    uint256 public ETHearned;
    uint256 public ETHDispensed;

    // Token decimals
    uint8 public decimals = 18;
    // Fixed point precision
    uint16 public prec = 64;
    uint256 precisionReuse = 

    // Define the Bonding Curve functions
    uint256 public a = 100000000;

    // Conversion from token to 64x64
    function tokenToFixed64(uint256 token) public view returns(int128) {
        return int128(token)*10**(int128(prec) - int128(decimals))
    }

    // Convert Fixed Point 64 to Token UInt256
    function fixed64ToToken(int128 fixed64) public view returns(uin256) {
        return uint256(fixed64/10**(int128(prec) - int128(decimals)))
    }

    // ETH/NOM = (#NOM Sold/a)^2
    function bondCurvePrice() public view returns(uint256) {
        return fixed64ToToken(pow(div(tokenToFixed65(numNOMSold)/abdk64.fromUInt(a))),uint256(2));
    }

    // #NOM Sold = sqrt(ETH/NOM) * a
    // Input 64.64 fixed point number
    function supplyAtPrice(uint256 price) return(uint256) {
        return abdk64.sqrt(abdk64.fromUINT(price >> (uint256(prec) - uint256(decimals))))*fromUINT(a)
    }

    // Integrate over curve to get amount of ETH
    // ETH = a(#NomSold/a)^3/3 + C
    function buyQuote(uint256 buyAmount) returns(uint256) {
    
    }
}


