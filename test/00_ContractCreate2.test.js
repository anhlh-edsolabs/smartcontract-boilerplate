require("dotenv").config();
const ethers = require("ethers");
const hre = require("hardhat");
const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { Utils } = require("../scripts/utils/utils");
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

    describe("Contract address computation", function () {
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

            expect(creationCode).to.equal(ERC1967ProxyFactory.bytecode);
            expect(initCodeHash).to.equal(proxyInitCodeHash);
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

            const tokenInitCode = ethers.solidityPacked(
                ["bytes", "bytes"],
                [TokenFactory.bytecode, tokenEncodedConstructorArgs],
            )

            console.log("Token init code:", tokenInitCode);

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

    describe("Contract deployment", function () {
        it("Should deploy a new token using the ContractCreate2 contract", async function () {
            const { contractCreate2, TokenFactory } = await loadFixture(init);

            const salt = ethers.zeroPadValue("0x01", 32); //0x0000000000000000000000000000000000000000000000000000000000000001
            const tokenEncodedConstructorArgs =
                ethers.AbiCoder.defaultAbiCoder().encode(["uint8"], [6]);

            const tokenInitCodeHash = ethers.solidityPackedKeccak256(
                ["bytes", "bytes"],
                [TokenFactory.bytecode, tokenEncodedConstructorArgs],
            );

            const precomputedTokenAddress = ethers.getCreate2Address(
                contractCreate2.target,
                salt,
                tokenInitCodeHash,
            );

            console.log(
                "Precomputed token implementation address:",
                precomputedTokenAddress,
            );

            const tokenImplAddress = await contractCreate2.computeImplAddress(
                salt,
                TokenFactory.bytecode,
                tokenEncodedConstructorArgs,
            );

            await expect(
                contractCreate2.deployImpl(
                    salt,
                    TokenFactory.bytecode,
                    tokenEncodedConstructorArgs,
                ),
            )
                .to.emit(contractCreate2, "Deployed")
                .withArgs(tokenImplAddress, salt);

            const events = await contractCreate2.queryFilter(
                "Deployed",
                "latest",
            );
            expect(events.length).to.equal(1);

            const deployedTokenAddress = events[0].args[0];

            expect(events[0].args[0]).to.properAddress;
            expect(events[0].args[0]).to.deep.equal(precomputedTokenAddress);
            expect(events[0].args[0]).to.deep.equal(tokenImplAddress);

            expect(await hre.ethers.provider.getCode(deployedTokenAddress)).to
                .not.be.empty;
        });

        it("Should deploy a new proxy using the ContractCreate2 contract", async function () {
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

            const tokenImplAddress = await contractCreate2.computeImplAddress(
                salt,
                TokenFactory.bytecode,
                tokenEncodedConstructorArgs,
            );

            await expect(
                contractCreate2.deployImpl(
                    salt,
                    TokenFactory.bytecode,
                    tokenEncodedConstructorArgs,
                ),
            )
                .to.emit(contractCreate2, "Deployed")
                .withArgs(tokenImplAddress, salt);

            const events = await contractCreate2.queryFilter(
                "Deployed",
                "latest",
            );
            expect(events.length).to.equal(1);

            const deployedTokenAddress = events[0].args[0];

            expect(await hre.ethers.provider.getCode(deployedTokenAddress)).to
                .not.be.empty;

            const tokenEncodedInitializationCall =
                TokenFactory.interface.encodeFunctionData("initialize", [
                    "Currency",
                    "CUR",
                    deployer.address,
                ]);

            const proxyInitCodeHash = ethers.solidityPackedKeccak256(
                ["bytes", "bytes"],
                [
                    ERC1967ProxyFactory.bytecode,
                    ethers.AbiCoder.defaultAbiCoder().encode(
                        ["address", "bytes"],
                        [deployedTokenAddress, tokenEncodedInitializationCall],
                    ),
                ],
            );

            const precomputedProxyAddress = ethers.getCreate2Address(
                contractCreate2.target,
                salt,
                proxyInitCodeHash,
            );

            console.log("Precomputed proxy address:", precomputedProxyAddress);

            const [, , computedAddress] =
                await contractCreate2.computeProxyAddress(
                    salt,
                    deployedTokenAddress,
                    tokenEncodedInitializationCall,
                );

            expect(precomputedProxyAddress).to.equal(computedAddress);

            await expect(
                contractCreate2.deployProxy(
                    salt,
                    deployedTokenAddress,
                    tokenEncodedInitializationCall,
                ),
            )
                .to.emit(contractCreate2, "Deployed")
                .withArgs(precomputedProxyAddress, salt);

            const proxyEvents = await contractCreate2.queryFilter(
                "Deployed",
                "latest",
            );
            expect(proxyEvents.length).to.equal(1);

            const deployedProxyAddress = proxyEvents[0].args[0];
            expect(deployedProxyAddress).to.properAddress;
            expect(deployedProxyAddress).to.deep.equal(precomputedProxyAddress);

            expect(await hre.ethers.provider.getCode(deployedProxyAddress)).to
                .not.be.empty;

            const tokenProxy = TokenFactory.attach(deployedProxyAddress);

            expect(await tokenProxy.name()).to.equal("Currency");
            expect(await tokenProxy.symbol()).to.equal("CUR");
            expect(await tokenProxy.decimals()).to.equal(6);
            expect(await tokenProxy.owner()).to.equal(deployer.address);

            const readImplSlot = await hre.ethers.provider.getStorage(
                deployedProxyAddress,
                Utils.erc1967Slot.Implementation(),
            );

            const implAddressFromStorage =
                ethers.AbiCoder.defaultAbiCoder().decode(
                    ["address"],
                    readImplSlot,
                )[0];

            expect(implAddressFromStorage).to.equal(deployedTokenAddress);
        });
    });
});
