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
    

    // Define the Bonding Curve functions
    uint256 public a = 100000000;

    // Conversion from token to 64x64
    function TokToF64(uint256 token) public view returns(int128) {
        require(div(token, 10**uint256(decimals)) < MAX_64x64);
        return abdk64.divu(token, 10**uint256(decimals));
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
                        // #NOM Sold/(a*decimals)
                        abdk.divu(numNOMSold,
                            // (a*decimals)
                            safeMath.mul(a, uint256(decimals))),
                        // ()^2
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
    
    // Returns Buy Quote for a particular amount of NOM (Dec 18) in ETH (Dec 18)
    // 1. Determine supply range based on spread and current curve price based on numNOMSold
    // 2. Integrate over curve to get amount of ETH needed to buy amount of NOM
    // ETH = a/3((numNomSold_Top/a)^3 - (numNOMSold_Bot/a)^3)
    // Parameters:
    // Input
    // uint256 buyAmount: amount of NOM to be purchased in 18 decimal
    // Output
    // uint256: amount of ETH needed in Wei or ETH 18 decimal
    function buyQuoteNOM(uint256 amountNOM) returns(uint256) {
        uint256 bottomPrice = safeMath.add(bCurvePrice, 
                                           safeMath.div(bondCurvePrice(), uint256(100))
                                          );
        uint256 bottomSupply = supplyAtPrice(bottomPrice);
        uint256 topSupply = bottomSupply + amountNOM;
        return  f64toTok(
                    abdk.mul(
                        // a/3
                        abdk.divu(a, uint256(a)),
                        // ((NomSold_Top/a)^3 - (numNOMSold_Bot/a)^3)
                        abdk.sub(
                            // (NomSold_Top/a)^3
                            abdk.pow(abdk.divu(topSupply, a), uint256(3)),
                            // (NomSold_Bot/a)^3
                            abdk.pow(abdk.divu(bottomSupply, a), uint256(3))
                        )
                    )

                );
    }

    /**
    * Calculate cube root cubrtu (x) rounding down, where x is unsigned 256-bit integer
    * number.
    *
    * @param x unsigned 256-bit integer number
    * @return unsigned 128-bit integer number
    */
    function cubrtu (uint256 x) private pure returns (uint128) {
        if (x == 0) return 0;
        else {
        uint256 xx = x;
        uint256 r = 1;
        
        if (xx >= 0x1000000000000000000000000000000000000) { xx >>= 144; r <<= 48; }
        if (xx >= 0x1000000000000000000) { xx >>= 72; r <<= 24; }
        if (xx >= 0x1000000000) { xx >>= 36; r <<= 12; }
        if (xx >= 0x40000) { xx >>= 18; r <<= 6; }
        if (xx >= 0x1000) { xx >>= 12; r <<= 4; }
        if (xx >= 0x200) { xx >>= 9; r <<= 3; }
        if (xx >= 0x40) { xx >>= 6; r <<= 2; }
        if (xx >= 0x8) { r <<= 1; }
        r = (x/(r**2) + 2*r)/3;
        r = (x/(r**2) + 2*r)/3;
        r = (x/(r**2) + 2*r)/3;
        r = (x/(r**2) + 2*r)/3;
        r = (x/(r**2) + 2*r)/3;
        r = (x/(r**2) + 2*r)/3;
        r = (x/(r**2) + 2*r)/3; // Seven iterations should be enough
        uint256 r1 = x / r;
        return uint128 (r < r1 ? r : r1);
        }
    }

    // Returns Buy Quote for the purchase of NOM based on amount of ETH (Dec 18)
    // 1. Determine supply bottom
    // 2. Integrate over curve, and solve for supply top
    // numNOMSold_Top = (3*ETH/a + (numNOMSold_Bot/a)^3)^(1/3)
    // 3. Subtract supply bottom from top to get #NOM for ETH
    // Parameters:
    // Input
    // uint256 buyAmount: amount of NOM to be purchased in 18 decimal
    // Output
    // uint256: amount of ETH needed in Wei or ETH 18 decimal
    function buyQuoteETH(uint256 amountETH) returns(uint256) {
        uint256 bottomPrice = safeMath.add(bCurvePrice, 
                                           safeMath.div(bondCurvePrice(), uint256(100))
                                          );
        uint256 bottomSupply = supplyAtPrice(bottomPrice);
        return f64toTok(
            abdk64.add(
                abdk64.mulu(abdk64.divu(amountETH, a), uint256(3))
            )
        )

    }


}


