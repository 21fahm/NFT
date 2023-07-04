const { network, ethers } = require("hardhat");
const {
  mockOnThisNetworks,
  networkConfig,
} = require("../helper-hardhat-config");
const { storeToPinata, storeMetadata } = require("../utils/uploadToPinata");
require("dotenv").config();
const { verify } = require("../utils/verify");

const imageLocation = "./Images/randomnft/";

const metaData = {
  name: "",
  descriprion: "",
  image: "",
};

let tokenUri = [
  "ipfs://QmQziqZDyXpQnXdgbGWV7dYmyVP7rJx9t3ctmCzgBLkV4L",
  "ipfs://QmZdPiwWdSUptiF8NzHMzd4sQ9aTZV4XHBUdeG29sJbqeT",
  "ipfs://QmXxrwEGF2e2huyZxxNw6eFA2oAGhwRZ1SFqNZP8DdSofy",
];

const FUND_AMOUNT = ethers.utils.parseEther("1");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = await deployments;
  const chainId = network.config.chainId;

  if (process.env.TOKEN_URI == "true") {
    tokenUri = await getTokenUri();
  }

  log("\n ------------------------------");

  let vrfCoordinatorAddress, subId, vrfCoordinator;

  if (mockOnThisNetworks.includes(network.name)) {
    vrfCoordinator = await ethers.getContract("VRFCoordinatorV2Mock");
    vrfCoordinatorAddress = vrfCoordinator.address;
    const tx = await vrfCoordinator.createSubscription();
    const txReceipt = await tx.wait(1);
    subId = txReceipt.events[0].args.subId;
    await vrfCoordinator.fundSubscription(subId, FUND_AMOUNT);
  } else {
    vrfCoordinatorAddress = networkConfig[chainId].vrfCoordinatorV2;
    subId = networkConfig[chainId].subId;
  }

  const args = [
    subId,
    vrfCoordinatorAddress,
    networkConfig[chainId].gasLane,
    networkConfig[chainId].callbackGasLimit,
    tokenUri,
    networkConfig[chainId].etherAmount,
  ];
  const contract = await deploy("RandomNFT", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmation || 1,
  });

  if (mockOnThisNetworks.includes(network.name)) {
    await vrfCoordinator.addConsumer(subId, contract.address);
    log("Consumer is added");
  }

  if (
    !mockOnThisNetworks.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(contract.address, args);
  }

  log("\n------------------");
  log("All done deploying RandomNft!!!😃");
};

async function getTokenUri() {
  tokenUri = [];
  const { resolve: imageUri, file } = await storeToPinata(imageLocation);
  const tokenUriMetadata = { ...metaData };
  for (resolveIndex in imageUri) {
    tokenUriMetadata.name = file[resolveIndex].replace(".png", "");
    tokenUriMetadata.descriprion = `This is a ${tokenUriMetadata.name} card`;
    tokenUriMetadata.image = `ipfs://${imageUri[resolveIndex].IpfsHash}`;
    console.log(`Uploading ${tokenUriMetadata.name}`);
    const metadataResponse = await storeMetadata(tokenUriMetadata);
    tokenUri.push(`ipfs://${metadataResponse.IpfsHash}`);
  }
  console.log("Token URI Uploaded😀");
  console.log(tokenUri);
  return tokenUri;
}

module.exports.tags = ["all", "randomnft", "main"];
