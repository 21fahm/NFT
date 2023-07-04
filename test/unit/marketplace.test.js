const { assert, expect } = require("chai");
const { getNamedAccounts, deployments, ethers, network } = require("hardhat");
const { mockOnThisNetworks } = require("../../helper-hardhat-config");

mockOnThisNetworks.includes(network.name)
  ? describe("NftMarketPlace", () => {
      let contract, deployer, nftContract, player, connectContract, connectNft;
      const PRICE = ethers.utils.parseEther("0.1");
      let TOKEN_ID;
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer;
        const accounts = await ethers.getSigners();
        player = accounts[1];
        await deployments.fixture(["market", "nft"]);
        contract = await ethers.getContract("NftMarketPlace");
        connectContract = await contract.connect(deployer);
        nftContract = await ethers.getContract("BasicNFT");
        connectNft = await nftContract.connect(deployer);
        TOKEN_ID = await connectNft.getCounter();
        await nftContract.mintNFT();
        await nftContract.approve(contract.address, TOKEN_ID);
      });
      describe("List item", () => {
        it("should not list if price is zero", async () => {
          expect(async () => {
            await connectContract.listItem(connectNft.address, TOKEN_ID, "0");
          }).to.be.revertedWith("NftMarketPlace__PRICEISZERO");
        });
        it("Should list item when listed", async () => {
          expect(async () => {
            await contract.listItem(
              nftContract.address,
              0,
              ethers.utils.parseEther("0.01")
            );
          }).to.be.emit(contract, "ItemListed");
        });
        it("should update listings", async () => {
          await connectContract.listItem(nftContract.address, 0, PRICE);
          const listing = await connectContract.getListings(
            connectNft.address,
            TOKEN_ID
          );
          assert(listing.price.toString() == PRICE.toString());
          assert(listing.seller.toString() == deployer.address);
        });
        it("should not list if listed", async () => {
          await contract.listItem(connectNft.address, TOKEN_ID, PRICE);
          expect(async () => {
            await contract.listItem(connectNft.address, TOKEN_ID, PRICE);
          }).to.be.revertedWith("NftMarketPlace__ALREADYLISTED");
        });
      });
      describe("Buy Item", () => {
        it("Should revert if price is not met", async () => {
          await contract.listItem(
            nftContract.address,
            0,
            ethers.utils.parseEther("0.1")
          );
          expect(async () => {
            await contract.buyItem(nftContract.address, 0, {
              value: ethers.utils.parseEther("0.01"),
            });
          }).to.be.revertedWith("NftMarketPlace__PRICENOTMET");
        });
        it("Should emit event if bought", async () => {
          await contract.listItem(
            nftContract.address,
            0,
            ethers.utils.parseEther("0.1")
          );
          expect(async () => {
            await contract.buyItem(nftContract.address, 0, {
              value: ethers.utils.parseEther("0.1"),
            });
          }).to.be.emit(contract, "ItemBought");
        });
        it("Should increase proceeds", async () => {
          await contract.listItem(
            nftContract.address,
            0,
            ethers.utils.parseEther("0.1")
          );

          const connectPlayer = contract.connect(player);
          await connectPlayer.buyItem(nftContract.address, 0, {
            value: ethers.utils.parseEther("0.1"),
          });
          const proceeds = await contract.getProceeds(deployer.address);
          assert.equal(
            proceeds.toString(),
            ethers.utils.parseEther("0.1").toString()
          );
        });
      });
      describe("Updating", async () => {
        it("should update price", async () => {
          await contract.listItem(
            nftContract.address,
            0,
            ethers.utils.parseEther("0.1")
          );
          expect(async () => {
            await contract.updateListing(
              nftContract.address,
              0,
              ethers.utils.parseEther("0.2")
            );
          }).to.be.emit(contract, "ItemUpdated");
        });
      });
      describe("Cancel", async () => {
        it("should cancel listing", async () => {
          await connectContract.listItem(connectNft.address, TOKEN_ID, PRICE);
          expect(async () => {
            await connectContract.cancelListing(connectNft.address, TOKEN_ID);
          }).to.be.emit(contract, "ItemCancelled");
          const listingRemoved = await connectContract.getListings();
          assert(listingRemoved.price.toString() == "0");
        });
      });
      describe("withdraw", () => {
        it("Should revert if no proceeds available", async () => {
          expect(async () => {
            await contract.withdraw();
          }).to.be.revertedWith("NftMarketPlace__NOTENOUGHPROCEEDS");
        });
        it("should show proceeds", async () => {
          await contract.listItem(
            nftContract.address,
            0,
            ethers.utils.parseEther("0.1")
          );

          const playerBuying = contract.connect(player);
          await playerBuying.buyItem(nftContract.address, 0, {
            value: ethers.utils.parseEther("0.1"),
          });
          const updateProceeds = await contract.getProceeds(deployer.address);
          // assert.equal((await nftContract.ownerOf(0).toString()), player.address);
          assert.equal(
            updateProceeds.toString(),
            ethers.utils.parseEther("0.1").toString()
          );
        });
      });
    })
  : describe.skip;
