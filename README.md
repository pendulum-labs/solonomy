# SolOnomy: Onomy Ethereum Smart Contract Deployment

Hardhat is used to manage smart contract deployment and testing.

## Prerequisites
- `yarn install | npm run install` : To install all packages and plugins  
- `.env` : Check the `.env.exmaple`
- `.secret` : Where your **memonic** needs to be

## Available Scripts
- `yarn test` : Test scripts will be executed from `/test`
- `yarn deploy:${network}` : Aviable networks `mainnet`, `rinkeyby`, `localhost`. For custom network it's configurable on `hardhat.config.js`  Deploy Script will automatically verify the contract
- `yarn compile` : Compile the contracts from `/contracts`
- `yarn run-node` : Running a node instance on the local network. We use this to obeserving the events and transactions.