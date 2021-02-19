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

// Bonding curve price at specified supply
function supplyAtPrice(price) {
    return Math.sqrt(price) * a;
}

// Supply entered as NOM
function priceAtSupply(supply) {
    return (supply/a)**2
}

// NOM supply range to ETH
function NOMsupplyETH(supplyTop, supplyBot) {
    // Integrate over curve to get amount of ETH needed to buy amount of NOM
    // ETH = a/3((supplyNOM_Top/a)^3 - (supplyNOM_Bot/a)^3)
    return (a/3)*((supplyTop/a)**3 - (supplyBot/a)**3)
}

// Returns Buy Quote for the purchase of NOM based on amount of ETH
// Parameters:
// Input
// amount: amount of ETH
// Output
// output: amount of NOM
function ETHtoNOM(amount, supply) {
  const price = priceAtSupply(supply)
  // 1. Determine supply bottom
  // Price bottom is 1% above priceBondCurve
  const priceBot = price * 1.01
  const supplyBot = supplyAtPrice(priceBot);
  // 2. Integrate over curve, and solve for supply top
  // (3*ETH/a + (supplyNOM_Bot/a)^3)^(1/3)
  const supplyTop = a*(3*amount/a + supplyBot**3/a**3)**(1/3)
  console.log("supply top: ", supplyTop)
  // 3. Subtract supply bottom from top to get amount NOM for amount ETH
  const diff = supplyTop - supplyBot
  console.log("diff", diff)
  return { supplyBot, supplyTop, diff }
}

// NOM supply range to ETH
// Integrate over curve to get amount of ETH needed to buy amount of NOM
// ETH = a/3((supplyNOM_Top/a)^3 - (supplyNOM_Bot/a)^3)
function NOMSupToETH(supplyTop, supplyBot) {
    return (a/3)*((supplyTop/a)**3 - (supplyBot/a)**3)
}

module.exports = { cubeRoot, priceAtSupply, ETHtoNOM, supplyAtPrice, NOMSupToETH }