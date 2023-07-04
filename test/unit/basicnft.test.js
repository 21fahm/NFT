const { ethers, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const { mockOnThisNetworks } = require("../../helper-hardhat-config");

mockOnThisNetworks.includes(network.name)
  ? describe("Basic Nft Test", () => {
      let contract, deployer;
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        contract = await ethers.getContract("BasicNFT", deployer);
      });
      describe("constuctor", () => {
        it("should set counter", async () => {
          const counter = await contract.getCounter();
          assert.equal(counter.toString(), "0");
        });
      });
      describe("mint", () => {
        it("counter id and uri exists", async () => {
          const mintNft = await contract.mintNFT();
          await mintNft.wait(1);
          const tokenUri = await contract.tokenURI(0);
          assert.equal(tokenUri, await contract.TOKEN_URI());
          const counter = await contract.getCounter();
          assert.equal(counter.toString(), "1");
        });
      });
    })
  : describe.skip;
