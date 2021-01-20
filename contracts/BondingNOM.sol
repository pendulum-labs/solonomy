// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol" as safeMath;
import "abdk-libraries-solidity/ABDKMath64x64.sol" as abdk64;

contract BondingNOM {
    uint256 public numNOMSold;
    uint256 public bCurvePrice;
    uint256 public ETHearned;
    uint256 public ETHDispensed;

    
    uint128 private constant MAX_64x64 = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

    // Token decimals
    uint8 public decimals = 18;
    // Fixed point precision
    uint16 public prec = 20;
    uint256 precisionReuse = 

    // Define the Bonding Curve functions
    uint256 public a = 100000000;

    // Conversion from token to 64x64
    function TokToF64(uint256 token) public view returns(int128) {
        require(div(token, 10**uint256(decimals)) < MAX_64x64)
        return abdk64.divu(token, 10**uint256(decimals))
    }

    // Convert Fixed Point 64 to Token UInt256
    function f64ToTok(int128 fixed64) public view returns(uint256) {
        return abdk64.mulu(fixed64, 10**uint256(decimals))
    }

    // ETH/NOM = (#NOM Sold/(a*decimals))^2
    // At 18 decimal precision in ETH
    function bondCurvePrice() public view returns(uint256) {
        return  f64ToTok(
                    abdk.pow(
                        abdk.divu(numNOMSold,safeMath.mul(a, uint256(decimals))),
                        uint256(2)
                    )
                )
    }

    // #NOM Sold = sqrt(ETH/NOM) * a
    // Input 64.64 fixed point number
    function supplyAtPrice(uint256 price) return(uint256) {
        return  f64toTok(
                    abdk64.sqrt(
                        abdk64.divu(price, 10**uint256(decimals))
                    )
                )*fromUINT(a));
    }

    // Integrate over curve to get amount of ETH
    // ETH = a/3((NomSold_Top/a)^3 - (numNOMSold_Bot/a)^3)
    // Returns in Wei
    function buyQuote(uint256 buyAmount) returns(uint256) {
        uint256 bottomPrice = bondCurvePrice() + div(bondCurvePrice(), uint256(100));
        uint256 bottomSupply = supplyAtPrice(bottomPrice);
        uint256 topSupply = bottomSupply + buyAmount;
        return  f64toTok(
                    abdk.mul(
                        abdk.divu(a, uint256(a)),
                        abdk.sub(
                            abdk.pow(abdk.divu(topSupply, a), uint256(3)),
                            abdk.pow(absk.divu(bottomSupply, a), uint256(3))
                        )
                    )

                )
    }
}


