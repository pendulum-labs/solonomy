const ethers = require('ethers')
const Bonding = artifacts.require("BondingNOM");
const ERC20NOM = artifacts.require("ERC20NOM");
const bondingMath = require('../utils/bondingMath')

const a = 100000000;

contract("Bonding Curve Tests", async accounts => {
  it("Cube root function should match js", async () => {
    let bondCont = await Bonding.deployed();
    // Test Number is any number from 1 to 10**50 (2^256)
    let testNum = ethers.BigNumber.from(
      (Math.floor(Math.random()*10**20))
        .toString())
        .mul(ethers.BigNumber.from(10).pow(1)
    );
    let cubeCont = await bondCont.cubrtu.call(testNum.toString());
    let cubeJs = bondingMath.cubeRoot(testNum);
    console.log("** Cube Root Test **")
    console.log("Test input: ", testNum.toString())
    console.log("Contract output: ", cubeCont.toString())
    console.log("JS cube output: ", cubeJs.toString())
    assert.equal(cubeCont.valueOf().toString(), cubeJs.toString());
  });

  it("Bonding Curve price function should match js", async () => {
    let bondCont = await Bonding.deployed();
    // Test supply needs to be 100,000,000 - 1 or less
    let testSupply = Math.floor((Math.random() * 10**8) - 1);
    const inputCont = ethers.utils.parseEther(testSupply.toString())
    let priceCont = await bondCont.priceAtSupply.call(inputCont.toString());
    let priceJs = bondingMath.priceAtSupply(testSupply)
    console.log("** Bonding Curve Price Function Test **")
    console.log("Test input: ", inputCont.toString())
    console.log("Contract price: ", ethers.utils.formatEther(priceCont.toString()))
    console.log("JS price: ", priceJs.toString())
    assert.ok(
      Math.abs(
        ethers.utils.formatEther(priceCont.valueOf().toString()) - priceJs.toString()
      ) < 10^(-7));
  });

  it("Bonding Curve supply function should match js", async () => {
    let bondCont = await Bonding.deployed();
    // Test price needs to be 1 ETH or les
    let testPrice = Math.random();
    let inputCont = ethers.utils.parseEther(testPrice.toString())
    let supplyCont = await bondCont.supplyAtPrice.call(inputCont.toString());
    let supplyJs = bondingMath.supplyAtPrice(testPrice.toString())
    console.log("** Bonding Curve Supply Function Test **")
    console.log("Test input: ", testPrice.toString())
    console.log("Contract supply: ", ethers.utils.formatEther(supplyCont.toString()))
    console.log("JS supply: ", supplyJs.toString())
    assert.ok(
      Math.abs(
        ethers.utils.formatEther(supplyCont.valueOf().toString()) - supplyJs.toString()
      ) < 10^(-10));
  });

  it("should give ETH representing a range of NOM supply", async () => {
    const tokenCont = await ERC20NOM.deployed()
    let bondCont = await Bonding.deployed(tokenCont.address);
    let supplyTop = Math.random()*100000000;
    const supplyBot = Math.random()*supplyTop;
    const inputContTop = ethers.utils.parseEther(supplyTop.toString())
    const inputContBot = ethers.utils.parseEther(supplyBot.toString())
    console.log("** NOM Supply to ETH Test **");
    // console.log("Contract Balance: ", ethers.utils.formatEther(contractBalance.valueOf().toString()))
    console.log("Test Input Top: ", inputContTop.toString())
    console.log("Test Input Bottom: ", inputContBot.toString())
    let resJs = bondingMath.NOMSupToETH(supplyTop, supplyBot);
    console.log("JS ETH: ", resJs);
    let resCont = await bondCont.NOMSupToETH.call(inputContTop, inputContBot);
    console.log("Contract ETH: ", ethers.utils.formatEther(resCont.toString()));
    assert.ok(
      Math.abs(
        ethers.utils.formatEther(resCont.valueOf().toString()) - resJs.toString()
      ) < 10^(-8));
  });

  it("should register ERC20 contract with bonding contract", async () => {
    const tokenCont = await ERC20NOM.deployed()
    let bondCont = await Bonding.deployed(tokenCont.address);
    let NOMaddress = await bondCont.getNOMAddr.call();
    assert.equal(NOMaddress.valueOf(), tokenCont.address)
  });

  it("should load NOM onto bonding contract", async () => {
    const tokenCont = await ERC20NOM.deployed()
    let bondCont = await Bonding.deployed(tokenCont.address);
    let numTokens = ethers.utils.parseEther("100000000")
    let contractAmount = await tokenCont.balanceOf.call(bondCont.address)
    assert.equal(numTokens.toString(), contractAmount.toString())
  });

  it("should give amount of ETH needed for a given amount of NOM", async () => {
    const tokenCont = await ERC20NOM.deployed()
    let bondCont = await Bonding.deployed(tokenCont.address);
    let testAmount = Math.random()*10**8;
    const inputCont = ethers.utils.parseEther(testAmount.toString())
    let supplyNOM = await bondCont.getSupplyNOM.call();
    let quoteCont = await bondCont.quoteNOM.call(inputCont.toString());
    let quoteJs = bondingMath.quoteNOM(testAmount, supplyNOM.toString());
    console.log("** Buy Quote given NOM Test **");
    console.log("Test Input: ", inputCont.toString());
    console.log("Quote Contract: ", ethers.utils.formatEther(quoteCont.toString()));
    console.log("Quote JS: ", quoteJs.toString());
    assert.ok(
      Math.abs(
        ethers.utils.formatEther(quoteCont.valueOf().toString()) - quoteJs.toString()
      ) < 10^(-9));
  });

  it("should give purchase amount of NOM for an amount of ETH", async () => {
    const tokenCont = await ERC20NOM.deployed()
    let bondCont = await Bonding.deployed(tokenCont.address);
    let amountETH = Math.random()*10**5;
    let inputCont = ethers.utils.parseEther(amountETH.toString())
    // let result = await tokenCont.transfer(instance.address, numTokens.toString());
    let contractBalance = await tokenCont.balanceOf.call(bondCont.address);
    let supplyNOM = await bondCont.getSupplyNOM.call();
    console.log("** Buy Quote given ETH test **");
    console.log("Contract Balance: ", ethers.utils.formatEther(contractBalance.valueOf().toString()))
    console.log("NOM Issued by contract: ", supplyNOM.toString());
    console.log("Ether sent: ", inputCont.toString())
    let quoteCont = await bondCont.buyQuoteETH.call(inputCont.toString());
    console.log("Contract NOM: ", ethers.utils.formatEther(quoteCont.valueOf().toString()))
    let quoteJs = bondingMath.buyQuoteETH(amountETH, ethers.utils.formatEther(supplyNOM.toString()).toString())
    console.log("JS NOM: ", quoteJs.toString())
    console.log("Difference: ", Math.abs(
      ethers.utils.formatEther(quoteCont.valueOf().toString()) - quoteJs.toString()
    ))
    assert.ok(
      Math.abs(
        ethers.utils.formatEther(quoteCont.valueOf().toString()) - quoteJs.toString()
      ) < 10^(-9)
    );
  });

  it("should allow purchase of NOM", async () => {
    const tokenCont = await ERC20NOM.deployed()
    let bondCont = await Bonding.deployed(tokenCont.address);
    let amountETH = Math.random()*10**5;
    let inputCont = ethers.utils.parseEther(amountETH.toString())
    // let result = await tokenCont.transfer(instance.address, numTokens.toString());
    let contractBalance = await tokenCont.balanceOf.call(bondCont.address);
    console.log("** Purchase NOM Test **");
    console.log("Contract Balance: ", ethers.utils.formatEther(contractBalance.valueOf().toString()))
    console.log("Ether sent: ", inputCont.toString())
    let result1 = await bondCont.buyQuoteETH.call(inputCont.toString());
    console.log("Buy Quote: ", ethers.utils.formatEther(result1.toString()))
    let result2 = await bondCont.buyNOM({from: accounts[0], value: ethers.utils.parseEther(inputCont.toString()).toString()})
    let balance = await tokenCont.balanceOf(accounts[0])
    console.log("Account 0: ", ethers.utils.formatEther(balance.toString()))
    assert.equal(balance.toString(), balance.toString())
  });
});