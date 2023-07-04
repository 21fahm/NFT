const { mockOnThisNetworks } = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = await deployments;

  log("---------------------------------------");

  const args = [];
  const basicNft = await deploy("BasicNFT", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmation: network.config.blockConfirmation || 1,
  });

  log("NFT successfully deployed");

  if (
    !mockOnThisNetworks.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(basicNft.address, args);
  } else {
    log("Local environment detected😬");
  }
};

module.exports.tags = ["all", "nft", "main"];
