const { run } = require("hardhat");

const verify = async (contractAddress, args) => {
  console.log("Verifying...");
  try {
    await run("verify:verify", {
      address: contractAddress,
      constructorArguments: args,
    });
    console.log("\nVerified!!!");
  } catch (e) {
    console.log(e);
  }
};

module.exports = {
  verify,
};
