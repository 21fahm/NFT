const { network, ethers } = require("hardhat");
const {
  mockOnThisNetworks,
  networkConfig,
} = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts }) => {
  const { deployer } = await getNamedAccounts();

  //Basic nft
  const basicNft = await ethers.getContract("BasicNFT", deployer);
  await basicNft.mintNFT();

  const tokenUri = await basicNft.tokenURI(await basicNft.getCounter());

  console.log(`Basic NFT tokenURI is ${tokenUri.toString()}`);

  //RandomNft
  const randomNft = await ethers.getContract("RandomNFT", deployer);
  const mintFee = await randomNft.getMintFee();

  await new Promise(async (resolve, reject) => {
    setTimeout(resolve, 500000);
    randomNft.once("NftMinted", async () => {
      resolve();
    });

    const randomMint = await randomNft.requestNft({
      value: mintFee.toString(),
    });
    if (mockOnThisNetworks.includes(network.name)) {
      const vrfCoordinator = await ethers.getContract(
        "VRFCoordinatorV2Mock",
        deployer
      );
      const vrfCoordinatorReceipt = await randomMint.wait(1);
      await vrfCoordinator.fulfillRandomWords(
        vrfCoordinatorReceipt.events[1].args.requestId,
        randomNft.address
      );
    }
  });
  console.log(`Random NFT tokenURI is ${await randomNft.tokenURI(0)}`);

  //dynamic
  const dynamicNft = await ethers.getContract("SvgNFT", deployer);
  const highValue = ethers.utils.parseEther("40000");
  await dynamicNft.mintNft(highValue.toString());
  const tokenId = await dynamicNft.getTokenId();
  console.log(
    `SvgNFT tokenURI is ${(
      await dynamicNft.tokenURI(tokenId.toString())
    ).toString()}`
  );
};

module.exports.tags = ["all", "mint"];
