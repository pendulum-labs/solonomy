const fs = require('fs');

const ERC20NOM = artifacts.require("./ERC20NOM.sol");
const BondNOM = artifacts.require("./BondingNOM.sol");

module.exports = function(deployer) {
  deployer.then( async() => {
    await deployer.deploy(ERC20NOM);
    const NOMtoken = await ERC20NOM.deployed()
    console.log('\n*************************************************************************\n')
    console.log(`NOM ERC20 Contract Address: ${NOMtoken.address}`)
    console.log('\n*************************************************************************\n')
    
    await deployer.deploy(BondNOM, NOMtoken.address);
    const BondingNOM = await ERC20NOM.deployed()
    console.log('\n*************************************************************************\n')
    console.log(`NOM Bonding Contract Address: ${BondingNOM.address}`)
    console.log('\n*************************************************************************\n')

    const contAddrs = {
      NOMERC20: NOMContractInstance.address,
    }

    const contAddrsJSON = JSON.stringify(contAddrs)
    
    fs.writeFile('NOMAddrs.json', contAddrsJSON, function(err) {
      if (err) {
          console.log(err);
      }
    });
    console.log('\n\n*************************************************************************\n')
    console.log(`Contract address saved to json`)
    console.log('\n*************************************************************************\n')

  });
};