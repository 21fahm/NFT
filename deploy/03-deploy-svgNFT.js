const { network, ethers } = require("hardhat");
const {
  mockOnThisNetworks,
  networkConfig,
} = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const fs = require("fs");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();
  let chainId = network.config.chainId;

  let priceFeed;

  if (mockOnThisNetworks.includes(network.name)) {
    priceFeed = (await ethers.getContract("MockV3Aggregator")).address;
  } else {
    priceFeed = networkConfig[chainId].ethUsdPriceFeed;
  }

  const lowImage = fs.readFileSync("./Images/dynamic/frown.svg", {
    encoding: "utf8",
  });
  const highImage = fs.readFileSync("./Images/dynamic/happy.svg", {
    encoding: "utf8",
  });

  const args = [lowImage, highImage, priceFeed];
  const contract = await deploy("SvgNFT", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmation || 1,
  });

  if (
    !mockOnThisNetworks.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(contract.address, args);
  }

  log("\n------------------");
  log("All done deploying svgNFT!!!😃");
};

module.exports.tags = ["all", "svgnft", "main"];
