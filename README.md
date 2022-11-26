# SolOnomy: Onomy Bonding Curve Ethereum Smart Contract Deployment

Hardhat is used to manage smart contract deployment and testing.

## Prerequisites
- `yarn install | npm run install` : To install all packages and plugins  
- `.env` : Check the `.env.exmaple`
- `.secret` : Where your **memonic** needs to be

## Available Scripts
- `yarn test` : Test scripts will be executed from `/test`
- `yarn compile` : Compile the contracts from `/contracts`
- `yarn deploy:${network}` : Available networks `mainnet`, `rinkeyby`, `goerli`, `localhost`. For custom network it's configurable on `hardhat.config.js`  Deploy Script will automatically verify the contract
- `yarn run-node` : Running a node instance on the local network. We use this to obeserving the events and transactions.

## Mainnet deployment
### Preparation

* Install `node` of the version `18` and `yarn`
* Run `yarn install`
* Modify the `contracts/BondingNOM.sol` by adding few `.`somewhere in the comments.
* Modify the `contracts/ERC20BNOM.sol` by adding few `.`somewhere in the comments.
* Add the `.env` file with the `ETHERSCAN_API_KEY=your-api-key`
* Add `.secret` file with the mnemonic of the deployer, pay attention that will be used the default account generated from the mnemonic

### Bytecode deployment

* Run the command 
```
NOVERIFICATION=true NOBYTECODE=false yarn hardhat run ./scripts/deployContracts.js --network mainnet
```

The command will deploy the bytecode of both of the contract to the mainnet and will save the addresses in the `compiled`
folder. 

* Open the Etherscan and check that contracts are present, but you can't Read or Write.

* !!! Commit the changes including the changes in the contracts !!!

### ABI deployment

!!! The ABI deployment should be done only after the release !!!

* Run the command
```
NOVERIFICATION=false NOBYTECODE=true yarn hardhat run ./scripts/deployContracts.js --network mainnet
```

* Open the Etherscan and check that contracts are present, and you can Read or Write.

## Troubleshooting 

Error:
```
 ...
 code: 'ERR_OSSL_EVP_UNSUPPORTED'
```

Solution:
```bash
export NODE_OPTIONS=--openssl-legacy-provider
```


