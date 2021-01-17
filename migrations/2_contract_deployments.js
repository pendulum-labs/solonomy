const fs = require('fs');

const AccountContract = artifacts.require("./Accounts.sol");

module.exports = function(deployer) {
  deployer.then( async() => {
    await deployer.deploy(AccountContract);
    const accountContractInstance = await AccountContract.deployed()
    console.log('\n*************************************************************************\n')
    console.log(`Account Contract Address: ${accountContractInstance.address}`)
    console.log('\n*************************************************************************\n')
      
    const contAddrs = {
      account: accountContractInstance.address,
    }

    const contAddrsJSON = JSON.stringify(contAddrs)
    
    fs.writeFile('../hsocial/src/loom/havenAddrs.json', contAddrsJSON, function(err) {
      if (err) {
          console.log(err);
      }
    });
    console.log('\n\n*************************************************************************\n')
    console.log(`Contract address saved to hsocial`)
    console.log('\n*************************************************************************\n')

  });
};