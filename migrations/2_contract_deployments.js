const fs = require('fs');

const NOMContract = artifacts.require("./ERC20NOM.sol");

module.exports = function(deployer) {
  deployer.then( async() => {
    await deployer.deploy(NOMContract);
    const accountContractInstance = await NOMContract.deployed()
    console.log('\n*************************************************************************\n')
    console.log(`NOM ERC20 Contract Address: ${NOMContractInstance.address}`)
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