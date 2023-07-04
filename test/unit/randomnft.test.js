const { ethers, getNamedAccounts, network } = require("hardhat");
const { assert, expect } = require("chai");
const { mockOnThisNetworks } = require("../../helper-hardhat-config");

mockOnThisNetworks.includes(network.name)
  ? describe("Random Nft Test", () => {
      let contract, deployer, vrfCoordinatorMock;
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        await deployments.fixture(["all"]);
        contract = await ethers.getContract("RandomNFT", deployer);
        vrfCoordinatorMock = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        );
      });
      describe("constructor", () => {
        it("should return the mint fee and token uri", async () => {
          const mintFee = await contract.getMintFee();
          const breedUri = await contract.getBreedUri(0);
          assert.equal(mintFee.toString(), ethers.utils.parseEther("0.01"));
          assert.equal(
            breedUri,
            "ipfs://QmQziqZDyXpQnXdgbGWV7dYmyVP7rJx9t3ctmCzgBLkV4L"
          );
        });
      });
      describe("requestNft", () => {
        it("should revert if no mint fee sent", async () => {
          expect(async () => {
            await contract.requestNft();
          }).to.be.revertedWith("RandomNFT__SENDMOREETH");
        });
        it("Should revert if not enough eth sent", async () => {
          const fee = await contract.getMintFee();
          expect(async () => {
            await contract.requestNft({
              value: fee.sub(ethers.utils.parseEther("0.001")),
            });
          }).to.be.revertedWith("RandomNFT__SENDMOREETH");
        });
        it("it should emit that the mint has kicked off", async () => {
          const fee = await contract.getMintFee();
          expect(async () => {
            await contract.requestNft({
              value: fee.toString(),
            });
          }).to.be.emit(contract, "NftRequested");
        });
      });
      describe("fulfillRandomWords", () => {
        it("mints nft after a random word is returned", async () => {
          await new Promise(async (resolve, reject) => {
            contract.once("NftMinted", async () => {
              console.log("Fount the event!!!");
              try {
                const breedUri = await contract.getBreedUri(0);
                const counter = await contract.getCounter();
                assert.equal(
                  breedUri,
                  "ipfs://QmQziqZDyXpQnXdgbGWV7dYmyVP7rJx9t3ctmCzgBLkV4L"
                );
                assert.equal(counter.toString(), "1");
                resolve();
              } catch (e) {
                console.log(e);
                reject(e);
              }
            });
            try {
              const fee = await contract.getMintFee();
              const tx = await contract.requestNft({
                value: fee.toString(),
              });
              const txReceipt = await tx.wait(1);
              await vrfCoordinatorMock.fulfillRandomWords(
                txReceipt.events[1].args.requestId,
                contract.address
              );
            } catch (e) {
              console.log(e);
            }
          });
        });
      });
      describe("getRarity", () => {
        it("should return PUG if rarity if between 0-10", async () => {
          const rariry = await contract.getRarity(9);
          assert.equal(rariry.toString(), "0");
        });
        it("should return shiba if rarity if between 10-40", async () => {
          const rariry = await contract.getRarity(39);
          assert.equal(rariry.toString(), "1");
        });
        it("should return st-bernard if rarity if between 40-100", async () => {
          const rariry = await contract.getRarity(71);
          assert.equal(rariry.toString(), "2");
        });
      });
    })
  : describe.skip;
