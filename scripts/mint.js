const { ethers, getNamedAccounts } = require("hardhat");

const PRICE = ethers.utils.parseEther("0.1");

async function main() {
  console.log("Starting");
  const deployer = (await getNamedAccounts()).deployer;
  const martketPlace = await ethers.getContract("NftMarketPlace", deployer);
  const basicNft = await ethers.getContract("BasicNFT", deployer);

  console.log("Minting...");

  const minting = await basicNft.mintNFT();
  const txReceipts = await minting.wait(1);
  const tokenId = txReceipts.events[0].args.tokenId;

  console.log("Approving...");

  const approve = await basicNft.approve(
    martketPlace.address,
    tokenId.toString()
  );
  await approve.wait(1);

  console.log("Listing...");

  const listing = await martketPlace.listItem(
    basicNft.address,
    tokenId.toString(),
    PRICE
  );
  await listing.wait(1);

  console.log("Listed!");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch(() => {
    process.exit(1);
  });
