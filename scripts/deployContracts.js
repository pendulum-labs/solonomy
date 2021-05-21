// We require the Hardhat Runtime Environment explicitly here. This is optional 
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
const hre = require("hardhat");
const fs = require('fs');

function timeout(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile 
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy

  const { ethers } = hre;

  const NOMtokenFactory = await ethers.getContractFactory("ERC20NOM");
  const NOMtoken = await NOMtokenFactory.deploy();

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
  const BondingNOM = await BondNOMFactory.deploy(NOMtoken.address);

  await BondingNOM.deployed();

  let numTokens = ethers.BigNumber.from(10).pow(18).mul('100000000')
  await NOMtoken.transfer(BondingNOM.address, numTokens.toString());
  let balance = await NOMtoken.balanceOf(BondingNOM.address)
  
  do {
    console.log("NOM Bonding Curve Contract Balance: ", balance.toString())
    await timeout(5000)
    balance = await NOMtoken.balanceOf(BondingNOM.address)
  } while (balance !=  10**18*100000000)
  
  console.log('\n*************************************************************************\n')
  console.log(`NOM Bonding Contract Address: ${BondingNOM.address}`)
  console.log(`NOM Bonding Contract NOM Balance: ${balance}`)
  console.log('\n*************************************************************************\n')

  const contAddrs = {
    NOMERC20: NOMtoken.address,
    BondingNOM: BondingNOM.address
  }

  const contAddrsJSON = JSON.stringify(contAddrs)
  console.log("Contract Addresses: ", contAddrsJSON)

  console.log('\n***************************Verifying Contracts**************************\n')
  await hre.run("verify:verify", {
    address: NOMtoken.address,
    constructorArguments: [],
  })

  await hre.run("verify:verify", {
    address: BondingNOM.address,
    constructorArguments: [
      NOMtoken.address
    ],
  })
  console.log('\n*************************~Successfully Verified~*************************\n')

  fs.writeFileSync('./NOMAddrs.json', contAddrsJSON)

  fs.writeFileSync('../otrust/src/context/chain/NOMAddrs.json', contAddrsJSON)

  fs.copyFileSync('./artifacts/contracts/BondingNOM.sol/BondingNOM.json', '../otrust/src/context/chain/BondingNOM.json')

  fs.copyFileSync('./artifacts/contracts/ERC20NOM.sol/ERC20NOM.json', '../otrust/src/context/chain/ERC20NOM.json')

  console.log('\n\n*************************************************************************\n')
  console.log(`Contract address saved to json`)
  console.log('\n*************************************************************************\n');
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
