// SPDX-License-Identifier: MIT
pragma solidity 0.7.6;

import "@openzeppelin/contracts/token/ERC20/ERC20Burnable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "abdk-libraries-solidity/ABDKMath64x64.sol";

interface ERC20Token {
  function allowance(address, address) external returns (uint256);
  function balanceOf(address) external returns (uint256);
  function totalSupply() external returns (uint256);
  function transferFrom(address, address, uint256) external returns (bool);
  function transfer(address, uint256) external returns (bool);
}

contract BondingNOM is Ownable {
    ERC20Token nc; // NOM contract (nc)

    // Address of the nc (NOM ERC20 Contract)
    address public NOMTokenContract;
    
    uint256 public supplyNOM = 0;
    uint256 public burnedNOM = 0;
    uint256 public priceBondCurve;
    uint128 private constant MAX_64x64 = 0x7FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
    uint8 public decimals = 18;
    // Bonding Curve parameter
    uint256 public a = SafeMath.mul(100000000, 10**decimals);

    constructor (address NOMContAddr) {
        // Add in the NOM ERC20 contract address
        NOMTokenContract = NOMContAddr;
        nc = ERC20Token(NOMContAddr);
    }

    function getNOMAddr() public view returns (address) {
        return NOMTokenContract;
    }

    // Conversion from token at 18 decimals to 64x64
    function tokToF64(uint256 token) public view returns(int128) {
        return ABDKMath64x64.divu(token, 10**uint256(decimals));
    }

    // Convert Fixed Point 64 to Token UInt256
    function f64ToTok(int128 fixed64) public view returns(uint256) {
        return ABDKMath64x64.mulu(fixed64, 10**uint256(decimals));
    }

    // ETH/NOM = (#NOM Sold/(a*decimals))^2
    function priceBCurve(uint256 _supplyNOM) public view returns(uint64) {
        return ABDKMath64x64.mulu(
            ABDKMath64x64.divu(
                _supplyNOM,
                a
            ),
            1
        );
    }

    // #NOM Sold = sqrt(ETH/NOM) * a
    // Input 64.64 fixed point number
    function supplyAtPrice(uint256 price) public view returns (uint256) {
        return  SafeMath.mul(
            ABDKMath64x64.toUInt(
                ABDKMath64x64.sqrt(
                    ABDKMath64x64.fromUInt(price)
                )
            ),
            a
        );
    }

    // NOM supply range to ETH
    // Integrate over curve to get amount of ETH needed to buy amount of NOM
    // ETH = a/3((supplyNOM_Top/a)^3 - (supplyNOM_Bot/a)^3)
    function NOMsupplyETH(uint256 supplyTop, uint256 supplyBot) public view returns(uint256) {
        return f64ToTok(
            ABDKMath64x64.mul(
            // a/3
                ABDKMath64x64.divu(a, uint256(3)),
                    // ((NomSold_Top/a)^3 - (supplyNOM_Bot/a)^3)
                    ABDKMath64x64.sub(
                        // (NomSold_Top/a)^3
                        ABDKMath64x64.pow(ABDKMath64x64.divu(supplyTop, a), uint256(3)),
                        // (NomSold_Bot/a)^3
                        ABDKMath64x64.pow(ABDKMath64x64.divu(supplyBot, a), uint256(3))
                    )
                )

        );
    }
                
    
    // Returns Buy Quote for a particular amount of NOM (Dec 18) in ETH (Dec 18)
    // 1. Determine supply range based on spread and current curve price based on supplyNOM
    // 2. Integrate over curve to get amount of ETH needed to buy amount of NOM
    // ETH = a/3((supplyNOM_Top/a)^3 - (supplyNOM_Bot/a)^3)
    // Parameters:
    // Input
    // uint256 buyAmount: amount of NOM to be purchased in 18 decimal
    // Output
    // uint256: amount of ETH needed in Wei or ETH 18 decimal
    function buyQuoteNOM(uint256 amountNOM) public view returns(uint256) {
        uint256 priceBot = SafeMath.add(
                                        priceBondCurve, 
                                        SafeMath.div(priceBondCurve, uint256(100))
                                    );
        uint256 supplyBot = supplyAtPrice(priceBot);
        uint256 supplyTop = supplyBot + amountNOM;
        return  NOMsupplyETH(supplyTop, supplyBot);
    }

    /**
    * Calculate cube root cubrtu (x) rounding down, where x is unsigned 256-bit integer
    * number.
    *
    * @param x unsigned 256-bit integer number
    * @return unsigned 256-bit integer number
    */
    function cubrtu (uint256 x) public pure returns (uint256) {
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
        return r;
        }
    }

    // Returns Buy Quote for the purchase of NOM based on amount of ETH (Dec 18)
    // 1. Determine supply bottom
    // 2. Integrate over curve, and solve for supply top
    // supplyNOM_Top = (3*ETH/a + (supplyNOM_Bot/a)^3)^(1/3)
    // 3. Subtract supply bottom from top to get #NOM for ETH
    // Parameters:
    // Input
    // uint256 amountETH: amount of ETH in 18 decimal
    // Output
    // uint256: amount of NOM in 18 decimal
    function buyQuoteETH(uint256 amountETH) public view returns(uint256) {
        uint256 priceBot = SafeMath.add(
                                priceBondCurve, 
                                SafeMath.div(priceBondCurve, uint256(100))
                            );
        
        uint256 supplyBot = supplyAtPrice(priceBot);

        uint256 supplyTop = // a*(3*ETH/a + (supplyNOM_Bot/a)^3)^(1/3)
                            SafeMath.mul(
                                cubrtu(
                                    f64ToTok(
                                        // 3*ETH/a + (supplyNOM_Bot/a)^3
                                        ABDKMath64x64.add(
                                            // 3*ETH/a
                                            ABDKMath64x64.mul(
                                                // ETH/a
                                                ABDKMath64x64.div(
                                                    tokToF64(amountETH), 
                                                    ABDKMath64x64.fromUInt(a)
                                                ),
                                                ABDKMath64x64.fromUInt(uint256(3))
                                            ),
                                            // (supplyNOM_Bot/a)^3
                                            ABDKMath64x64.pow(
                                                // supplyNOM_Bot/a
                                                ABDKMath64x64.div(
                                                    tokToF64(supplyBot), 
                                                    ABDKMath64x64.fromUInt(a)
                                                ),
                                                uint256(3)
                                            )
                                        )
                                    )
                                ), 
                                a*10**6
                            );
        return (supplyTop - supplyBot);
    }

    function buyNOM() public payable {
        require(msg.value > 0, "No ETH");
        uint256 amountNOM = buyQuoteETH(msg.value);

        // Update total supply released by Bonding Curve
        supplyNOM = SafeMath.add(supplyNOM, amountNOM);
        // Update current bond curve price
        priceBondCurve = priceBCurve(supplyNOM);

        nc.transfer(msg.sender, amountNOM);
    }

    // Returns Sell Quote: NOM for ETH (Dec 18)
    // 1. Determine supply top: priceBondCurve - 1% = Top Sale Price
    // 2. Integrate over curve to find ETH
    // ETH = a/3((supplyNOM_Top/a)^3 - (supplyNOM_Bot/a)^3)
    // 3. Subtract supply bottom from top to get #NOM for ETH
    // Parameters:
    // Input
    // uint256 amountNOM: amount of NOM to be sold (18 decimal)
    // Output
    // uint256: amount of ETH paid in Wei or ETH (18 decimal)
    function sellQuoteNOM(uint256 amountNOM) public view returns(uint256) {
        uint256 priceTop = SafeMath.sub(
                                priceBondCurve, 
                                SafeMath.div(priceBondCurve, uint256(100))
                            );
        uint256 supplyTop = supplyAtPrice(priceTop);
        uint256 supplyBot = supplyTop - amountNOM;
        return NOMsupplyETH(supplyTop, supplyBot);
    }

    function sellNOM(uint256 amountNOM) external {
        require(nc.allowance(msg.sender, address(this)) >= amountNOM, "sender has not enough allowance");
    
        uint256 priceTop = SafeMath.sub(
                                priceBondCurve, 
                                SafeMath.div(priceBondCurve, uint256(100))
                            );
        uint256 supplyTop = supplyAtPrice(priceTop);
        uint256 supplyBot = SafeMath.sub(supplyTop, amountNOM);
        uint256 paymentETH = NOMsupplyETH(supplyTop, supplyBot);

        // Transfer NOM to contract
        nc.transferFrom(msg.sender, address(this), amountNOM);
        
        // Update persistent contract state variables
        // Update total supply released by Bonding Curve
        supplyNOM = SafeMath.sub(supplyNOM, amountNOM);
        // Update current bond curve price
        priceBondCurve = priceBCurve(supplyNOM);
        
        // Transfer ETH to Sender
        payable(msg.sender).transfer(paymentETH);
    }

    function withdraw() public onlyOwner returns(bool success) {
        // Determine available ETH for payment
        // 1. Calculate amount ETH to cover all current NOM outstanding
        //    based on bonding curve integration.
        burnedNOM = SafeMath.sub(supplyNOM, nc.totalSupply());
        uint256 lockedETH = NOMsupplyETH(supplyNOM, burnedNOM);
        // 2. Subtraction lockedETH from Contract Balance to get amount 
        //    available for withdrawal.
        uint256 paymentETH = SafeMath.sub(address(this).balance, lockedETH);
        // Transfer ETH to Owner
        payable(msg.sender).transfer(paymentETH);
        return true;
    }

}


