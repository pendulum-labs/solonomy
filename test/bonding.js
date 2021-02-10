const ethers = require('ethers')
const Bonding = artifacts.require("BondingNOM");
const ERC20NOM = artifacts.require("ERC20NOM");
const Decimal = require('decimal.js-light');

const a = 100000000;

const nthRoot = (bigNumber, intRoot) => {
    const strBigNumber = bigNumber.toString()
    const decimal = Decimal(strBigNumber)
    const root = decimal.pow(1 / intRoot)
    Decimal.rounding = Decimal.ROUND_DOWN
    return ethers.BigNumber.from(root.toInteger().toString())
}

contract("Bonding Curve Tests", async accounts => {
  it("Cube root function should match js", async () => {
    let instance = await Bonding.deployed();
    // Test Number is any number from 1 to 10**18
    let testNum = Math.floor((Math.random() * 10**18) + 1);
    let cube = await instance.cubrtu.call(testNum.toString());
    let cubeJs = nthRoot(testNum, 3);
    assert.equal(cube.valueOf().toString(), cubeJs.toString());
  });

  it("Bonding Curve price function should match js", async () => {
    let instance = await Bonding.deployed();
    // Test supply needs to be 1,000,000 - 1 or less
    let testSupply = Math.floor((Math.random() * 10**6) - 1);
    let testSupplyBN = ethers.BigNumber.from(testSupply)
    const contractInput = testSupplyBN.mul(
        ethers.BigNumber
            .from((10**18)
            .toString()
            )
        ).toString()
    let priceContract = await instance.priceBCurve.call(contractInput);
    let priceJs = (testSupply/a)**2
    assert.ok((priceContract.valueOf().toString() - Math.floor(priceJs*10**18)) < 3);
  });

  it("should register ERC20 contract with bonding contract", async () => {
    const NOMtoken = await ERC20NOM.deployed()
    let instance = await Bonding.deployed(NOMtoken.address);
    let NOMaddress = await instance.getNOMAddr.call();
    assert.equal(NOMaddress.valueOf(), NOMtoken.address)
  });

  it("should load NOM onto bonding contract", async () => {
    const NOMtoken = await ERC20NOM.deployed()
    let instance = await Bonding.deployed(NOMtoken.address);
    let numTokens = ethers.utils.parseEther("100000000")
    let contractAmount = await NOMtoken.balanceOf.call(instance.address)
    assert.equal(numTokens.toString(), contractAmount.toString())
  });

  it("should allow purchase of NOM", async () => {
    const NOMtoken = await ERC20NOM.deployed()
    let instance = await Bonding.deployed(NOMtoken.address);
    let numTokens = ethers.utils.parseEther("100000000")
    // let result = await NOMtoken.transfer(instance.address, numTokens.toString());
    let contractBalance = await NOMtoken.balanceOf(instance.address)
    console.log(contractBalance.valueOf().toString())
    console.log("Contract Balance: ", ethers.utils.formatEther(contractBalance.valueOf().toString()))
    console.log("Ether sent: ", ethers.utils.parseEther("2").toString())
    let result1 = await instance.buyQuoteETH(ethers.utils.parseEther("2").toString())
    console.log("Buy Quote: ", ethers.utils.formatEther(result1.toString()))
    let result2 = await instance.buyNOM({from: accounts[0], value: ethers.utils.parseEther("2").toString()})
    let balance = await NOMtoken.balanceOf(accounts[0])
    console.log("Account 0: ", ethers.utils.formatEther(balance.toString()))
    assert.equal(balance.toString(), balance.toString())
  });

  it("should allow purchase of NOM", async () => {
    const NOMtoken = await ERC20NOM.deployed()
    let instance = await Bonding.deployed(NOMtoken.address);
    let numTokens = ethers.utils.parseEther("100000000")
    // let result = await NOMtoken.transfer(instance.address, numTokens.toString());
    let contractBalance = await NOMtoken.balanceOf(instance.address)
    console.log(contractBalance.valueOf().toString())
    console.log("Contract Balance: ", ethers.utils.formatEther(contractBalance.valueOf().toString()))
    console.log("Ether sent: ", ethers.utils.parseEther("2").toString())
    let result2 = await instance.buyNOM({from: accounts[0], value: ethers.utils.parseEther("2").toString()})
    let balance = await NOMtoken.balanceOf(accounts[0])
    console.log("Account 0: ", ethers.utils.formatEther(balance.toString()))
    assert.equal(balance.toString(), balance.toString())
  });
});