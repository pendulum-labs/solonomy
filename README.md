# SolOnomy: Onomy Ethereum Smart Contract Deployment

Hardhat is used to manage smart contract deployment and testing.

## Prerequisites
`harhat-cli` https://www.npmjs.com/package/hardhat

## Available Scripts
- `yarn test` : Test scripts will be executed from `/test`
- `yarn deploy:${network}` : Aviable networks `mainnet`, `rinkeyby`, `localhost`. For custom network it's configurable on `hardhat.config.js`
- `yarn compile` : Compile the contracts from `/contracts`
- `yarn run-node` : Running a node instance on the local network. We use this to obeserving the events and transactions.