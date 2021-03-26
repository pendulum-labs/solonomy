require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
const fs = require('fs');
const mnemonic = fs.readFileSync(".secret").toString().trim() || '';

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      uri: "http://127.0.0.1:8545",
    },
    mainnet: {
      url: "https://mainnet.infura.io/v3/a9087b23250f4140b83f7cb3682cf30b",
      chainID: 1,
      accounts: {
        mnemonic: mnemonic,
      },
    },
    rinkeby: {
      url: 'https://rinkeby.infura.io/v3/a9087b23250f4140b83f7cb3682cf30b',
      chainID: 4, // rinkeby's id
      accounts: {
        mnemonic: mnemonic,
      }
    },
    hardhat: {
      // @note Uncomment the below codes to fork the mainnet to localnetwork
      //       While testing on the mainnet forked network we can interact with other contracts
      //       Which are available on mainnet
      // forking: {
      //   url: "https://mainnet.infura.io/v3/a9087b23250f4140b83f7cb3682cf30b",
      // },
      // accounts: {
      //   mnemonic: mnemonic,
      //   accountsBalance: "10000000000000000000000",
      // },
    },
  },
  solidity: {
    version: "0.7.6",
    // settings: {
    //   optimizer: {
    //     enabled: true,
    //     runs: 200,
    //   },
    // },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 300000,
  },
};
