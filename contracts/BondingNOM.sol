// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol" as safeMath;
import "abdk-libraries-solidity/ABDKMath64x64.sol" as abdk64;

interface ERC20Token {
  function allowance(address, address) external returns (uint256);
  function balanceOf(address) external returns (uint256);
  function transferFrom(address, address, uint) external returns (bool);
}

contract BondingNOM {
    uint256 public numNOMSold;
    uint256 public bCurvePrice;
    uint256 public ETHearned;
    uint256 public ETHDispensed;
    ERC20Token nc; // NOM contract (nc)

    
    uint128 private constant MAX_64x64 = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

    // Token decimals
    uint8 public decimals = 18;
    // Fixed point precision
    uint16 public prec = 20;
    

    // Define the Bonding Curve functions
    uint256 public a = 100000000;

    constructor (NOMERC20 token) public {
        _token = token;
    }

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

    // NOM supply range to ETH
    // Integrate over curve to get amount of ETH needed to buy amount of NOM
    // ETH = a/3((numNomSold_Top/a)^3 - (numNOMSold_Bot/a)^3)
    function NOMsupplyETH(uint256 supplyTop, uint256 supplyBot) returns(uint256) {
        return f64toTok(
            abdk.mul(
            // a/3
                abdk.divu(a, uint256(3)),
                    // ((NomSold_Top/a)^3 - (numNOMSold_Bot/a)^3)
                    abdk.sub(
                        // (NomSold_Top/a)^3
                        abdk.pow(abdk.divu(supplyTop, a), uint256(3)),
                        // (NomSold_Bot/a)^3
                        abdk.pow(abdk.divu(supplyBot, a), uint256(3))
                    )
                )

        );
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
        uint256 priceBot = safeMath.add(
                                        bCurvePrice, 
                                        safeMath.div(bCurvePrice, uint256(100))
                                    );
        uint256 supplyBot = supplyAtPrice(priceBot);
        uint256 supplyTop = supplyBot + amountNOM;
        return  NOMsupplyETH(supplyTop, supplyBot)
    }

    /**
    * Calculate cube root cubrtu (x) rounding down, where x is unsigned 256-bit integer
    * number.
    *
    * @param x unsigned 256-bit integer number
    * @return unsigned 256-bit integer number
    */
    function cubrtu (uint256 x) private pure returns (uint256) {
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
        return uint256 (r < r1 ? r : r1);
        }
    }

    // Returns Buy Quote for the purchase of NOM based on amount of ETH (Dec 18)
    // 1. Determine supply bottom
    // 2. Integrate over curve, and solve for supply top
    // numNOMSold_Top = (3*ETH/a + (numNOMSold_Bot/a)^3)^(1/3)
    // 3. Subtract supply bottom from top to get #NOM for ETH
    // Parameters:
    // Input
    // uint256 amountETH: amount of ETH in 18 decimal
    // Output
    // uint256: amount of NOM in 18 decimal
    function buyQuoteETH(uint256 amountETH) returns(uint256) {
        uint256 priceBot = safeMath.add(
                                bCurvePrice, 
                                safeMath.div(bondCurvePrice(), uint256(100))
                            );
        
        uint256 supplyBot = supplyAtPrice(priceBot);

        uint256 supplyTop = // (3*ETH/a + (numNOMSold_Bot/a)^3)^(1/3)
                            cubrtu(
                                f64ToTok(
                                    // 3*ETH/a + (numNOMSold_Bot/a)^3
                                    abdk64.add(
                                        // 3*ETH/a
                                        abdk64.mul(
                                            // ETH/a
                                            abdk64.div(
                                                TokToF64(amountETH), 
                                                abdk64.fromInt(uint256(a))
                                            ),
                                            abdk64.fromInt(uint256(3))
                                        ),
                                        // (numNOMSold_Bot/a)^3
                                        abdk64.pow(
                                            // numNOMSold_Bot/a
                                            abdk64.divu(supplyBot, a),
                                            uint256(3)
                                        )
                                    )
                                )
                            )
        return supplyTop - supplyBot
    }

    function buyNOM() public payable {
        require(msg.value > 0, "No ETH");
        uint256 amountNOM = buyQuoteETH(msg.value);
        numNOMSold = safeMath.sub(numNomSold, amountNOM);
        nc.transfer(msg.sender, address(this), amountNOM);
    }

    // Returns Sell Quote: NOM for ETH (Dec 18)
    // 1. Determine supply top: BondcurvePrice - 10% = Top Sale Price
    // 2. Integrate over curve to find ETH
    // ETH = a/3((numNomSold_Top/a)^3 - (numNOMSold_Bot/a)^3)
    // 3. Subtract supply bottom from top to get #NOM for ETH
    // Parameters:
    // Input
    // uint256 amountNOM: amount of NOM to be sold (18 decimal)
    // Output
    // uint256: amount of ETH paid in Wei or ETH (18 decimal)
    function sellQuoteNOM(uint256 amountNOM) public view returns(uint256) {
        uint256 priceTop = safeMath.sub(
                                bCurvePrice, 
                                safeMath.div(bCurvePrice, uint256(100))
                            );
        uint256 supplyTop = supplyAtPrice(priceBot);
        uint256 supplyBot = supplyTop - amountNOM;
        return NOMsupplyETH(supplyTop, supplyBot)
    }

    function sellNOM(uint256 amountNOM) external {
        require(nc.allowance(msg.sender, address(this)) >= amountNOM, "sender has not enough allowance");
        uint256 paymentETH = sellQuoteNOM(amountNOM);
        nc.transferFrom(msg.sender, address(this), amountNOM);
        address(msg.sender).transfer(paymentETH)
    }
}


