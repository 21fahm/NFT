const { network, ethers } = require("hardhat");

const DECIMALS = "18";
const INITIAL_ANSWER = ethers.utils.parseEther("1930");

const BASE_FEE = "250000000000000000"; // 0.25 is this the premium in LINK?
const GAS_PRICE_LINK = 1e9; // link per gas, is this the gas lane? // 0.000000001 LINK per gas

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts();
  const { deploy, log } = deployments;
  const chainId = network.config.chainId;

  log("`----------------------------");

  if (chainId == 31337) {
    log("\nLocal development environment detected!");
    const args = [BASE_FEE, GAS_PRICE_LINK];
    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      args: args,
      log: true,
    });

    await deploy("MockV3Aggregator", {
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
      from: deployer,
    });
  }

  log("\n-------------");
  log("Mocks deployed😄");
};

module.exports.tags = ["all", "mocks"];
