const fs = require("fs");
const path = require("path");
const pinataSDK = require("@pinata/sdk");
require("dotenv").config();

const apiKey = process.env.PINATA_API_KEY;
const apiSecret = process.env.PINATA_API_SECRET;
const pinata = new pinataSDK(apiKey, apiSecret);

const storeToPinata = async (imageLocation) => {
  const imagePath = path.resolve(imageLocation);
  const file = fs.readdirSync(imagePath);
  const resolve = [];
  let readableStreamFile, options;
  console.log("Working on pinata....");
  for (fileIndex in file) {
    console.log(`Working on ${file[fileIndex]}...`);
    readableStreamFile = fs.createReadStream(`${imagePath}/${file[fileIndex]}`);
    options = {
      pinataMetadata: {
        name: file[fileIndex],
      },
    };
    try {
      await pinata
        .pinFileToIPFS(readableStreamFile, options)
        .then((response) => {
          resolve.push(response);
        })
        .catch((e) => console.log(e));
    } catch (e) {
      console.log(e);
    }
  }

  return { resolve, file };
};

async function storeMetadata(metadata) {
  const options = {
    pinataMetadata: {
      name: metadata.name,
    },
  };
  try {
    const response = await pinata.pinJSONToIPFS(metadata, options);
    return response;
  } catch (error) {
    console.log(error);
  }
  return null;
}

module.exports = { storeToPinata, storeMetadata };
