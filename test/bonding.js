const bondingMath = require('../utils/bondingMath')
const assert = require('assert');

describe("Bonding Curve Tests", function () {
  const a = 100000000;
  let accounts;
  let contAddrs = {};
  let NOMtoken, BondingNOM;

  before(async function () {
    accounts = await ethers.getSigners();
    // Get the ContractFactory and Signers here.
    const NOMtokenFactory = await ethers.getContractFactory("ERC20NOM");
    NOMtoken = await NOMtokenFactory.deploy();

    await NOMtoken.deployed();

    console.log('\n*************************************************************************\n')
    console.log(`NOM ERC20 Contract Address: ${NOMtoken.address}`)
    console.log('\n*************************************************************************\n')

    /**
    await deployer.deploy(Gravity, NOMtoken.address);
    const gBridge = await Gravity.deployed()
    console.log('\n*************************************************************************\n')
    console.log(`Onomy-Gravity Bridge Contract Address: ${gBridge.address}`)
    console.log('\n*************************************************************************\n')
     */

    const BondNOMFactory = await ethers.getContractFactory("BondingNOM");
    BondingNOM = await BondNOMFactory.deploy(NOMtoken.address);
    await BondingNOM.deployed();

    let numTokens = ethers.BigNumber.from(10).pow(18).mul('100000000')
    await NOMtoken.transfer(BondingNOM.address, numTokens.toString());
    console.log('\n*************************************************************************\n')
    console.log(`NOM Bonding Contract Address: ${BondingNOM.address}`)
    console.log('\n*************************************************************************\n')

    contAddrs = {
      NOMERC20: NOMtoken.address,
      BondingNOM: BondingNOM.address
    }
  });

  it("The Bonding NOM Contract should contain 100000000 NOM", async () => {
   let balance = await NOMtoken.balanceOf(BondingNOM.address)
   assert.equal(balance.toString(), "100000000000000000000000000");
  });
  it("Cube root function should match js", async () => {
    // Test Number is any number from 1 to 10**50 (2^256)
    let testNum = ethers.BigNumber.from(
      (Math.floor(Math.random()*10**20))
        .toString())
        .mul(ethers.BigNumber.from(10).pow(1)
    );

    let cubeCont = await BondingNOM.cubrtu(testNum.toString());
    let cubeJs = bondingMath.cubeRoot(testNum);
    console.log("** Cube Root Test **")
    console.log("Test input: ", testNum.toString())
    console.log("Contract output: ", cubeCont.toString())
    console.log("JS cube output: ", cubeJs.toString())
    assert.equal(cubeCont.valueOf().toString(), cubeJs.toString());
  });

  it("Bonding Curve price function should match js", async () => {
    // Test supply needs to be 100,000,000 - 1 or less
    let testSupply = Math.floor((Math.random() * 10**8) - 1);
    const inputCont = ethers.utils.parseEther(testSupply.toString())
    let priceCont = await BondingNOM.priceAtSupply(inputCont.toString());
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
    // Test price needs to be 1 ETH or les
    let testPrice = Math.random();
    let inputCont = ethers.utils.parseEther(testPrice.toString())
    let supplyCont = await BondingNOM.supplyAtPrice(inputCont.toString());
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
    let resCont = await BondingNOM.NOMSupToETH(inputContTop, inputContBot);
    console.log("Contract ETH: ", ethers.utils.formatEther(resCont.toString()));
    assert.ok(
      Math.abs(
        ethers.utils.formatEther(resCont.valueOf().toString()) - resJs.toString()
      ) < 10^(-8));
  });

  it("should register ERC20 contract with bonding contract", async () => {
    let NOMaddress = await BondingNOM.getNOMAddr();
    assert.equal(NOMaddress.valueOf(), NOMtoken.address)
  });

  it("should load NOM onto bonding contract", async () => {
    let numTokens = ethers.utils.parseEther("100000000")
    let contractAmount = await NOMtoken.balanceOf(BondingNOM.address)
    assert.equal(numTokens.toString(), contractAmount.toString())
  });

  it("should give amount of ETH needed for a given amount of NOM", async () => {
    let testAmount = Math.random()*10**8;
    const inputCont = ethers.utils.parseEther(testAmount.toString())
    let supplyNOM = await BondingNOM.getSupplyNOM();
    let quoteCont = await BondingNOM.buyQuoteNOM(inputCont.toString());
    let quoteJs = bondingMath.buyQuoteNOM(testAmount, supplyNOM.toString());
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
    let amountETH = Math.random()*10**5;
    let inputCont = ethers.utils.parseEther(amountETH.toString())
    // let result = await NOMtoken.transfer(instance.address, numTokens.toString());
    let contractBalance = await NOMtoken.balanceOf(BondingNOM.address);
    let supplyNOM = await BondingNOM.getSupplyNOM();
    console.log("** Buy Quote given ETH test **");
    console.log("Contract Balance: ", ethers.utils.formatEther(contractBalance.valueOf().toString()))
    console.log("NOM Issued by contract: ", supplyNOM.toString());
    console.log("Ether sent: ", inputCont.toString())
    let quoteCont = await BondingNOM.buyQuoteETH(inputCont.toString());
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
    let amountETH = 1;
    let inputCont = ethers.utils.parseEther(amountETH.toString())
    // let result = await NOMtoken.transfer(instance.address, numTokens.toString());
    let contractBalance = await NOMtoken.balanceOf(BondingNOM.address);
    console.log('BondingNOM address: ', BondingNOM.address)
    console.log("** Purchase NOM Test **");
    console.log("Ether sent: ", inputCont.toString())
    let result1 = await BondingNOM.buyQuoteETH(inputCont.toString());
    console.log("Buy Quote: ", ethers.utils.formatEther(result1.toString()))

    let result2 = await BondingNOM.connect(accounts[1]).buyNOM({value: inputCont})

    let balance = await NOMtoken.balanceOf(accounts[1].address)
    console.log("Account 0 NOM: ", balance.toString())
    let balContNOM = await NOMtoken.balanceOf(BondingNOM.address)
    console.log("Contract NOM Before: ", ethers.utils.formatEther(contractBalance.valueOf().toString()))
    console.log("Contract NOM After: ", ethers.utils.formatEther(balContNOM.toString()))
    let balContETH = await ethers.provider.getBalance(BondingNOM.address)
    console.log("Contract ETH: ", ethers.utils.formatEther(balContETH.toString()))
    assert.equal(balance.toString(), balance.toString())

    let balTeamETH = await BondingNOM.teamBalance();
    console.log("Team ETH: ", ethers.utils.formatEther(balTeamETH.toString()))
  });

  it("should give sell quote for NOM in ETH", async () => {
    let amountETH = 1;
    let inputCont = ethers.utils.parseEther(amountETH.toString())
    // let result = await NOMtoken.transfer(instance.address, numTokens.toString());
    let contractBalance = await NOMtoken.balanceOf(BondingNOM.address);
    console.log("** Purchase NOM Test **");
    
    console.log("Ether sent: ", inputCont.toString())
    let result1 = await BondingNOM.buyQuoteETH(inputCont.toString());
    console.log("Buy Quote: ", ethers.utils.formatEther(result1.toString()))
    let result2 = await BondingNOM.connect(accounts[1]).buyNOM({value: inputCont})
    let balance = await NOMtoken.balanceOf(accounts[1].address)
    console.log("Account 0 NOM: ", ethers.utils.formatEther(balance.toString()))
    let balContNOM = await NOMtoken.balanceOf(BondingNOM.address)
    console.log("Contract NOM Before: ", ethers.utils.formatEther(contractBalance.valueOf().toString()))
    console.log("Contract NOM After: ", ethers.utils.formatEther(balContNOM.toString()))
    let balContETH = await ethers.provider.getBalance(BondingNOM.address)
    console.log("Contract ETH: ", ethers.utils.formatEther(balContETH.toString()))
    assert.equal(balance.toString(), balance.toString())
    let balTeamETH = await BondingNOM.teamBalance()
    console.log("Team ETH: ", ethers.utils.formatEther(balTeamETH.toString()))

    console.log("** Sell NOM Quote Test **")
    let supplyNOM = await BondingNOM.getSupplyNOM()
    console.log("SupplyNOM: ", ethers.utils.formatEther(supplyNOM.valueOf().toString()))
    let balance2 = await NOMtoken.balanceOf(accounts[1].address)
    console.log("Account NOM Before: ", ethers.utils.formatEther(balance2.toString()))
    let result3 = await BondingNOM.sellQuoteNOM(balance2.toString());
    console.log("Sell Quote NOM Contract: ", ethers.utils.formatEther(result3.toString()))
    let result4 = bondingMath.sellQuoteNOM(balance2.toString(), supplyNOM.toString())
    console.log("Sell Quote NOM JS: ", result4.toString())
    
    assert.ok(
      Math.abs(
        ethers.utils.formatEther(result3.valueOf().toString()) - result4.toString()
      ) < 10^(-9)
    );

  })

  it("should allow purchase and sale of NOM", async () => {
    let amountETH = 1;
    let inputCont = ethers.utils.parseEther(amountETH.toString())
    // let result = await NOMtoken.transfer(instance.address, numTokens.toString());
    let contractBalance = await NOMtoken.balanceOf(BondingNOM.address);
    console.log("** Purchase NOM Test **");
    
    console.log("Ether sent: ", inputCont.toString())
    let result1 = await BondingNOM.buyQuoteETH(inputCont.toString());
    console.log("Buy Quote: ", ethers.utils.formatEther(result1.toString()))
    let result2 = await BondingNOM.connect(accounts[1]).buyNOM({value: inputCont})
    let balance = await NOMtoken.balanceOf(accounts[1].address)
    console.log("Account 1 NOM: ", ethers.utils.formatEther(balance.toString()))
    let balContNOM = await NOMtoken.balanceOf(BondingNOM.address)
    console.log("Contract NOM Before: ", ethers.utils.formatEther(contractBalance.valueOf().toString()))
    console.log("Contract NOM After: ", ethers.utils.formatEther(balContNOM.toString()))
    let balContETH = await ethers.provider.getBalance(BondingNOM.address)
    console.log("Contract ETH: ", ethers.utils.formatEther(balContETH.toString()))
    assert.equal(balance.toString(), balance.toString())
    let balTeamETH = await BondingNOM.teamBalance()
    console.log("Team ETH: ", ethers.utils.formatEther(balTeamETH.toString()))
    
    console.log("** Sell NOM Test **")
    let balContNOM2 = await NOMtoken.balanceOf(BondingNOM.address)
    console.log("Contract NOM Before: ", ethers.utils.formatEther(balContNOM2.valueOf().toString()))
    let balance2 = await NOMtoken.balanceOf(accounts[1].address)
    console.log("Account NOM Before: ", ethers.utils.formatEther(balance2.toString()))
    let result3 = await BondingNOM.sellQuoteNOM(balance2.toString());
    console.log("Sell Quote: ", ethers.utils.formatEther(result3.toString()))

    let result4 = await NOMtoken.connect(accounts[1]).increaseAllowance(BondingNOM.address, balance2.toString())
    let result5 = await NOMtoken.allowance(accounts[1].address, BondingNOM.address);
    console.log("Account NOM Allowance: ", result5.toString())
    let result6 = await BondingNOM.connect(accounts[1]).sellNOM(balance2.toString())
    let balance3 = await NOMtoken.balanceOf(accounts[1].address)
    console.log("Account NOM After: ", ethers.utils.formatEther(balance3.toString()))
    let balContNOM3 = await NOMtoken.balanceOf(BondingNOM.address)
    console.log("Contract NOM After: ", ethers.utils.formatEther(balContNOM3.toString()))
    let balContETH2 = await ethers.provider.getBalance(BondingNOM.address)
    console.log("Contract ETH: ", ethers.utils.formatEther(balContETH2.toString()))
    let balTeamETH2 = await BondingNOM.teamBalance()
    console.log("Team ETH: ", ethers.utils.formatEther(balTeamETH2.toString()))
    let balAcctETH1 = await ethers.provider.getBalance(accounts[0].address)
    console.log("Account 0 ETH Before: ", balAcctETH1)
    let result7 = await BondingNOM.connect(accounts[0]).withdraw();
    let balAcctETH2 = await ethers.provider.getBalance(accounts[0].address)
    console.log("Account 0 ETH After: ", balAcctETH2)
    let balance1 = await NOMtoken.balanceOf(accounts[0].address)
    assert.equal(balance3.toString(), "0")
  });
});
