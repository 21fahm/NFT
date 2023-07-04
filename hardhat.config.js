require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
require("hardhat-deploy");
require("@nomiclabs/hardhat-ethers");

/** @type import('hardhat/config').HardhatUserConfig */

const url = process.env.RPC_URL;
const key = process.env.PRIV_KEY;
const etherscan = process.env.ETHERSCAN_API_KEY;
const marketCap = process.env.COINMARTKETCAP_API_KEY;

module.exports = {
  solidity: {
    compilers: [
      { version: "0.8.18" },
      { version: "0.8.0" },
      { version: "0.6.6" },
    ],
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    sepolia: {
      url: url,
      accounts: [key],
      chainId: 11155111,
      blockConfirmation: 6,
    },
  },
  localhost: {
    url: "http://127.0.0.1:8545/",
    chainId: 31337,
  },
  etherscan: {
    apiKey: etherscan,
  },
  gasReporter: {
    enabled: false,
    currency: "KES",
    coinmarketcap: marketCap,
    outputFile: "gas_report.txt",
    noColors: true,
    token: "MATIC",
    gasPriceApi:
      "https://api.polygonscan.com/api?module=proxy&action=eth_gasPrice",
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    player: {
      default: 1,
    },
  },
  mocha: {
    timeout: 200000,
  },
};
