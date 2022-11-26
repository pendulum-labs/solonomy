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

    const {ethers} = hre;

    const noBytecode = process.env.NOBYTECODE === 'true'
    if (noBytecode) {
        console.log('\nRunning the deployment with no bytecode')
    }

    const noVerification = process.env.NOVERIFICATION === 'true'
    if (noVerification) {
        console.log('\nRunning the deployment with no verification')
    }

    if (!noBytecode) {
        const BNOMtokenFactory = await ethers.getContractFactory("ERC20BNOM");
        const BNOMtoken = await BNOMtokenFactory.deploy();

        await BNOMtoken.deployed();

        console.log('\n*************************************************************************\n')
        console.log(`BNOM ERC20 Contract Address: ${BNOMtoken.address}`)
        console.log('\n*************************************************************************\n')

        /**
         await deployer.deploy(Gravity, BNOMtoken.address);
         const gBridge = await Gravity.deployed()
         console.log('\n*************************************************************************\n')
         console.log(`Onomy-Gravity Bridge Contract Address: ${gBridge.address}`)
         console.log('\n*************************************************************************\n')
         */

        const BondNOMFactory = await ethers.getContractFactory("BondingNOM");
        const BondingNOM = await BondNOMFactory.deploy(BNOMtoken.address);

        await BondingNOM.deployed();

        let numTokens = ethers.BigNumber.from(10).pow(18).mul('100000000')
        await BNOMtoken.transfer(BondingNOM.address, numTokens.toString());
        let balance = await BNOMtoken.balanceOf(BondingNOM.address)

        do {
            console.log("BNOM Bonding Curve Contract Balance: ", balance.toString())
            await timeout(5000)
            balance = await BNOMtoken.balanceOf(BondingNOM.address)
        } while (balance != 10 ** 18 * 100000000)

        console.log('\n*************************************************************************\n')
        console.log(`BNOM Bonding Contract Address: ${BondingNOM.address}`)
        console.log(`BNOM Bonding Contract BNOM Balance: ${balance}`)
        console.log('\n*************************************************************************\n')

        const contAddrs = {
            BNOMERC20: BNOMtoken.address,
            BondingNOM: BondingNOM.address
        }

        const contAddrsJSON = JSON.stringify(contAddrs)
        console.log("Contract Addresses: ", contAddrsJSON)

        fs.writeFileSync('compiled/chain-' + hre.network.name + '-NOMAddrs.json', contAddrsJSON)

        fs.copyFileSync('./artifacts/contracts/BondingNOM.sol/BondingNOM.json', 'compiled/BondingNOM.json')

        fs.copyFileSync('./artifacts/contracts/ERC20BNOM.sol/ERC20BNOM.json', 'compiled/ERC20BNOM.json')

        console.log('\n\n*************************************************************************\n')
        console.log(`Contract address saved to json`)
        console.log('\n*************************************************************************\n');

    }

    if (!noVerification) {

        console.log('\n***************************Verifying Contracts**************************\n')

        let rawdata = fs.readFileSync('compiled/chain-' + hre.network.name + '-NOMAddrs.json')
        let contAddrs = JSON.parse(rawdata);

        console.log("Contract Addresses: ", JSON.stringify(contAddrs))

        try {
            await hre.run("verify:verify", {
                address: contAddrs.BNOMERC20,
                constructorArguments: [],
            })
        } catch (err) {
            if (err.message.includes("Reason: Already Verified")) {
                console.log("Contract is already verified!");
            }
        }

        try {
            await hre.run("verify:verify", {
                address: contAddrs.BondingNOM,
                constructorArguments: [
                    contAddrs.BNOMERC20
                ],
            })
        } catch (err) {
            if (err.message.includes("Reason: Already Verified")) {
                console.log("Contract is already verified!");
            }
        }

        console.log('\n*************************~Successfully Verified~*************************\n')
    }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
