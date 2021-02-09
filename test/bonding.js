const ethers = require('ethers')
const Bonding = artifacts.require("BondingNOM");
const ERC20NOM = artifacts.require("ERC20NOM");
const Decimal = require('decimal.js-light');

const a = 100000000;

const nthRoot = (bigNumber, intRoot) => {
    const strBigNumber = bigNumber.toString()
    const decimal = Decimal(strBigNumber)
    const root = decimal.pow(1 / intRoot)
    console.log("Root: ", root.toString())
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
    console.log("Test Number: ", testNum);
    console.log("Contract Cube: ", cube.valueOf().toString());
    console.log("JS Cube: ", cubeJs.toString());
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
    console.log("Contract Input: ", contractInput)
    let priceContract = await instance.priceBCurve.call(contractInput);
    let priceJs = (testSupply/a)**2
    console.log("Test Number: ", testSupply);
    console.log("Contract Price: ", priceContract.valueOf().toNumber());
    console.log("JS Price: ", Math.floor(priceJs * 10**18));
    assert.ok((priceContract.valueOf().toString() - Math.floor(priceJs*10**18)) < 3);
  });

  it("should register ERC20 contract", async () => {
    const NOMtoken = await ERC20NOM.deployed()
    let instance = await Bonding.deployed(NOMtoken.address);
    let NOMaddress = await instance.getNOMAddr.call();
    assert.equal(NOMaddress.valueOf(), NOMtoken.address)
  });

  it("should register ERC20 contract", async () => {
    const NOMtoken = await ERC20NOM.deployed()
    let instance = await Bonding.deployed(NOMtoken.address);
    let NOMaddress = await instance.getNOMAddr.call();
    assert.equal(NOMaddress.valueOf(), NOMtoken.address)
  });
});