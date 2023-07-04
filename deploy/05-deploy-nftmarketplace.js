const { network } = require("hardhat");
const { mockOnThisNetworks } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = deployments;

  log("Deploying Marketplace...");
  const contract = await deploy("NftMarketPlace", {
    from: deployer,
    args: [],
    log: true,
    waitConfirmations: network.config.blockConfirmation || 1,
  });

  if (
    !mockOnThisNetworks.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(contract.address, []);
  }
};

module.exports.tags = ["all", "market"];
