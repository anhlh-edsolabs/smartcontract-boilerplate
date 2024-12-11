require("dotenv").config();
const ethers = require("ethers");
const hre = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { init } = require("./fixtures/fixture.ContractCreate2");

describe("ContractCreate2", function () {
    describe("Post deployment verification", function () {
        it("Should deploy ContractCreate2", async function () {
            const { contractCreate2 } = await loadFixture(init);

            expect(contractCreate2.target).to.properAddress;

            expect(await hre.ethers.provider.getCode(contractCreate2.target)).to
                .not.be.empty;
        });

        it("TokenFactory should be able to create a new token", async function () {
            const { deployer, TokenFactory } = await loadFixture(init);

            const token = await hre.upgrades.deployProxy(
                TokenFactory,
                ["Currency", "CUR", deployer.address],
                {
                    kind: "uups",
                    constructorArgs: [6],
                },
            );

            await token.waitForDeployment();

            expect(token.target).to.properAddress;
            expect(await hre.ethers.provider.getCode(token.target)).to.not.be
                .empty;
            expect(await token.name()).to.equal("Currency");
            expect(await token.symbol()).to.equal("CUR");
            expect(await token.decimals()).to.equal(6);
            expect(await token.owner()).to.equal(deployer.address);
        });
    });

    describe("Proxy deployment", function () {
        it("Should compute the correct address for the proxy", async function () {
            const {
                deployer,
                contractCreate2,
                TokenFactory,
                ERC1967ProxyFactory,
            } = await loadFixture(init);

            const salt = ethers.zeroPadValue("0x01", 32); //0x0000000000000000000000000000000000000000000000000000000000000001

            const token = await TokenFactory.deploy(6);
            await token.waitForDeployment();

            const tokenAddress = token.target;

            console.log("Token address:", tokenAddress);

            // const tokenInitCode = ethers.solidityPackedKeccak256(
            //     ["bytes", "uint8"],
            //     [TokenFactory.bytecode, 6],
            // );

            // console.log("Token init code:", tokenInitCode);

            const tokenInitArgs = ["Currency", "CUR", deployer.address];
            const tokenEncodedInitializationCall =
                TokenFactory.interface.encodeFunctionData(
                    "initialize",
                    tokenInitArgs,
                );

            const proxyInitCode = ethers.AbiCoder.defaultAbiCoder().encode(
                ["address", "bytes"],
                [tokenAddress, tokenEncodedInitializationCall],
            );

            const proxyInitCodeHash = ethers.solidityPackedKeccak256(
                ["bytes", "bytes"],
                [ERC1967ProxyFactory.bytecode, proxyInitCode],
            );

            console.log("Proxy init code hash:", proxyInitCodeHash);

            // compute the address of the proxy using ethers.js
            const precomputedAddress = ethers.getCreate2Address(
                contractCreate2.target,
                salt,
                proxyInitCodeHash,
            );

            console.log("Precomputed address:", precomputedAddress);

            const [creationCode, initCodeHash, computedAddress] =
                await contractCreate2.computeProxyAddress(
                    salt,
                    tokenAddress,
                    tokenEncodedInitializationCall,
                );

            console.log(
                "ContractCreate2 Computed proxy address:",
                computedAddress,
            );
            console.log(
                "ContractCreate2 Computed init code hash:",
                initCodeHash,
            );
            console.log(
                "ContractCreate2 Computed creation code:",
                creationCode,
            );

            expect(computedAddress).to.equal(precomputedAddress);
        });

        it("Should compute the correct address for the implementation contract", async () => {
            const {
                deployer,
                contractCreate2,
                TokenFactory,
                ERC1967ProxyFactory,
            } = await loadFixture(init);

            const salt = ethers.zeroPadValue("0x01", 32); //0x0000000000000000000000000000000000000000000000000000000000000001

            const tokenEncodedConstructorArgs =
                ethers.AbiCoder.defaultAbiCoder().encode(["uint8"], [6]);

            const tokenInitCodeHash = ethers.solidityPackedKeccak256(
                ["bytes", "bytes"],
                [TokenFactory.bytecode, tokenEncodedConstructorArgs],
            );

            console.log("Token init code hash:", tokenInitCodeHash);

            const precomputedTokenAddress = ethers.getCreate2Address(
                contractCreate2.target,
                salt,
                tokenInitCodeHash,
            );

            console.log("Precomputed token address:", precomputedTokenAddress);

            const implAddress = await contractCreate2.computeImplAddress(
                salt,
                TokenFactory.bytecode,
                tokenEncodedConstructorArgs,
            );

            console.log("ContractCreate2 Computed impl address:", implAddress);

            expect(implAddress).to.equal(precomputedTokenAddress);
        });
    });
});
