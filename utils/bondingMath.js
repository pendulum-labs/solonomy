const ethers = require('ethers')
const Decimal = require('decimal.js');
const BigNumber = require('bignumber.js');
const a = 100000000;
const aBig = ethers.utils.parseEther("100000000");
const aBigNum = BigNumber(aBig.toString())


Decimal.set({ precision: 80 });

// nthRoot using the decimal.js library
function cubeRoot(bigNumber) {
    const strBigNumber = bigNumber.toString()
    const decimal = Decimal(strBigNumber)
    const root = decimal.cbrt()
    Decimal.rounding = Decimal.ROUND_DOWN
    return ethers.BigNumber.from(root.round().toString())
}

// Supply entered as NOM
function priceAtSupply(supply) {
    return (supply/a)**2
}

// Bonding curve price at specified supply
function supplyAtPrice(price) {
    return Math.sqrt(price) * a;
}

// NOM supply range to ETH
// Integrate over curve to get amount of ETH needed to buy amount of NOM
// ETH = a/3((supplyNOM_Top/a)^3 - (supplyNOM_Bot/a)^3)
function NOMSupToETH(supplyTop, supplyBot) {
    return (a/3)*((supplyTop/a)**3 - (supplyBot/a)**3)
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
function buyQuoteNOM(amountNOM, supplyNOM) {
    supplyTop = supplyNOM + amountNOM;
    return  NOMSupToETH(supplyTop, supplyNOM)*(.99);
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
function buyQuoteETH(amountETH, supplyNOM) {
    amountNet = amountETH * .99
    const supplyTop = a*(3*amountNet/a + supplyNOM**3/a**3)**(1/3)
    return (supplyTop - supplyNOM);
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
function sellQuoteNOM(amountNOM, supplyNOM) {
    supplyBot = supplyNOM - amountNOM;
    amountETH = NOMSupToETH(supplyNOM, supplyBot);
    return amountETH*.99;
}

module.exports = { cubeRoot, priceAtSupply, supplyAtPrice, NOMSupToETH, buyQuoteNOM, buyQuoteETH, sellQuoteNOM }