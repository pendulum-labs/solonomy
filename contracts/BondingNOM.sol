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
    uint256 public priceBondCurve = 0;
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

    function getSupplyNOM() public view returns (uint256) {
        return supplyNOM;
    }

    function getBondPrice() public view returns (uint256) {
        return priceBondCurve;
    }

    // Conversion from token at 18 decimals to 64x64
    function tokToF64(uint256 token) public view returns(int128) {
        return ABDKMath64x64.divu(token, 10**uint256(decimals));
    }

    // Convert Fixed Point 64 to Token UInt256
    function f64ToTok(int128 fixed64) public view returns(uint256) {
        return ABDKMath64x64.mulu(fixed64, 10**uint256(decimals));
    }

    // ETH/NOM = (#NOM Sold/(a))^2
    function priceAtSupply(uint256 _supplyNOM) public view returns(uint256) {
        return  f64ToTok(
            ABDKMath64x64.pow(
                ABDKMath64x64.div(
                    tokToF64(_supplyNOM), 
                    tokToF64(a)
                ),
                uint256(2)
            )
        );  
    }

    // #NOM Sold = sqrt(ETH/NOM) * a
    // Input 64.64 fixed point number
    function supplyAtPrice(uint256 price) public view returns (uint256) {
        return f64ToTok(  
            ABDKMath64x64.mul(
                ABDKMath64x64.sqrt(
                    tokToF64(price)
                ),
                tokToF64(a)
            )
        );
    }

    // NOM supply range to ETH
    // Integrate over curve to get amount of ETH needed to buy amount of NOM
    // ETH = a/3((supplyNOM_Top/a)^3 - (supplyNOM_Bot/a)^3)
    function NOMSupToETH(uint256 supplyTop, uint256 supplyBot) public view returns(uint256) {
        require(supplyTop > supplyBot, "Supply Top is not greater than Supply Bot");
        return f64ToTok(
            ABDKMath64x64.mul(
                // a/3
                ABDKMath64x64.div(
                    tokToF64(a), 
                    ABDKMath64x64.fromUInt(uint256(3))
                ),
                // ((NomSold_Top/a)^3 - (supplyNOM_Bot/a)^3)
                ABDKMath64x64.sub(
                    // (NomSold_Top/a)^3
                    ABDKMath64x64.pow(
                        ABDKMath64x64.div(
                            tokToF64(supplyTop), 
                            tokToF64(a)
                        ), 
                        uint256(3)
                    ),
                    // (NomSold_Bot/a)^3
                    ABDKMath64x64.pow(
                        ABDKMath64x64.div(
                            tokToF64(supplyBot), 
                            tokToF64(a)
                        ), 
                        uint256(3)
                    )
                )
            )
        );
    }
                
    
    // Returns quote for a particular amount of NOM (Dec 18) in ETH (Dec 18)
    // 1. Determine supply range based on spread and current curve price based on supplyNOM
    // 2. Integrate over curve to get amount of ETH needed to buy amount of NOM
    // ETH = a/3((supplyNOM_Top/a)^3 - (supplyNOM_Bot/a)^3)
    // Parameters:
    // Input
    // uint256 buyAmount: amount of NOM to be purchased in 18 decimal
    // Output
    // uint256: amount of ETH needed in Wei or ETH 18 decimal
    function buyQuoteNOM(uint256 amountNOM) public view returns(uint256) {
        uint256 supplyTop = SafeMath.add(supplyNOM, amountNOM);
        uint256 amountETH = NOMSupToETH(supplyTop, supplyNOM);
        return SafeMath.sub(amountETH, SafeMath.div(amountETH, uint256(100)));
    }

    /**
    * Calculate cubrt (x) rounding down.  Revert if x < 0.
    *
    * @param x signed 64.64-bit fixed point number
    * @return signed 64.64-bit fixed point number
    */
    function cubrt (int128 x) public pure returns (int128) {
        require (x >= 0);
        return int128 (cubrtu (uint256 (x) << 64));
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
    // supplyNOM_Top = a*(3*ETH/a + (supplyNOM_Bot/a)^3)^(1/3)
    // 3. Subtract supply bottom from top to get #NOM for ETH
    // Parameters:
    // Input
    // uint256 amountETH: amount of ETH in 18 decimal
    // Output
    // uint256: amount of NOM in 18 decimal
    function buyQuoteETH(uint256 amountETH) public view returns(uint256) {
        uint256 amountNet = SafeMath.sub(amountETH, SafeMath.div(amountETH, uint256(100)));
        
        
        uint256 supplyTop = // supplyNOM_Top = (a^2*(3*ETH + (supplyNOM_Bot/a)^2*supplyNOM_Bot))^(1/3)
            cubrtu(
                SafeMath.mul(
                    // a^2               
                    SafeMath.mul(a, a),    
                    // (3*ETH + (supplyNOM_Bot/a)^2*supplyNOM_Bot)
                    f64ToTok(
                        ABDKMath64x64.add(    
                            ABDKMath64x64.mul(
                                ABDKMath64x64.fromUInt(uint256(3)),
                                tokToF64(amountNet)
                            ),
                            ABDKMath64x64.mul(
                                ABDKMath64x64.pow(
                                    ABDKMath64x64.div(
                                        tokToF64(supplyNOM),
                                        tokToF64(a)
                                    ),
                                    uint256(2)
                                ),
                                tokToF64(supplyNOM)
                            )
                        )
                    )
                )
                
            );
        
        
        return supplyTop - supplyNOM;
    }

    function buyNOM() public payable {
        require(msg.value > 0, "No ETH");
        uint256 amountNOM = buyQuoteETH(msg.value);

        // Update total supply released by Bonding Curve
        supplyNOM = SafeMath.add(supplyNOM, amountNOM);

        // Update current bond curve price
        priceBondCurve = priceAtSupply(supplyNOM);

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
        uint256 supplyBot = supplyNOM - amountNOM;
        uint256 amountETH = NOMSupToETH(supplyNOM, supplyBot);
        return SafeMath.sub(amountETH, SafeMath.div(amountETH, uint256(100)));
    }

    function sellNOM(uint256 amountNOM) public {
        require(nc.allowance(msg.sender, address(this)) >= amountNOM, "sender has not enough allowance");

        uint256 amountETH = sellQuoteNOM(amountNOM);

        // Transfer NOM to contract
        nc.transferFrom(msg.sender, address(this), amountNOM);
        
        // Update persistent contract state variables
        // Update total supply released by Bonding Curve
        supplyNOM = SafeMath.sub(supplyNOM, amountNOM);
        // Update current bond curve price
        priceBondCurve = priceAtSupply(supplyNOM);
        
        // Transfer ETH to Sender
        payable(msg.sender).transfer(amountETH);
    }

    function teamBalance() public returns(uint256) {
        if (supplyNOM == 0) {
            return address(this).balance;
        }
        // Determine available ETH for payment
        // 1. Calculate amount ETH to cover all current NOM outstanding
        //    based on bonding curve integration.
        uint256 burnedNOM = SafeMath.sub(a, nc.totalSupply());
        uint256 lockedETH = NOMSupToETH(supplyNOM, burnedNOM);
        // 2. Subtraction lockedETH from Contract Balance to get amount 
        //    available for withdrawal.
        return SafeMath.sub(address(this).balance, lockedETH);
    }

    function withdraw() public onlyOwner returns(bool success) {
        if (supplyNOM == 0) {
            payable(msg.sender).transfer(address(this).balance);
            return true;
        }
        // Determine available ETH for payment
        // 1. Calculate amount ETH to cover all current NOM outstanding
        //    based on bonding curve integration.
        uint256 burnedNOM = SafeMath.sub(a, nc.totalSupply());
        uint256 lockedETH = NOMSupToETH(supplyNOM, burnedNOM);
        // 2. Subtraction lockedETH from Contract Balance to get amount 
        //    available for withdrawal.
        uint256 paymentETH = SafeMath.sub(address(this).balance, lockedETH);
        // Transfer ETH to Owner
        payable(msg.sender).transfer(paymentETH);
        return true;
    }

}


