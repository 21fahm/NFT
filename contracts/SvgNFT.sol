// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "hardhat/console.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

contract SvgNFT is ERC721 {
    uint256 private s_tokenId;

    string private i_lowImageUri;
    string private i_highImageUri;
    string private constant svgPrefix = "data:image/svg+xml;base64,";
    AggregatorV3Interface internal immutable i_priceFeed;
    mapping(uint => int) public s_tokenIdToHighValue;

    event CreatedNFT(uint256 indexed tokenId, int256 indexed highValue);

    constructor(
        string memory lowSvg,
        string memory highSvg,
        address priceFeedAggregator
    ) ERC721("Smile", "SML") {
        s_tokenId = 0;
        i_lowImageUri = svgToImageUri(lowSvg);
        i_highImageUri = svgToImageUri(highSvg);
        i_priceFeed = AggregatorV3Interface(priceFeedAggregator);
    }

    function mintNft(int256 highValue) public {
        s_tokenId += 1;
        s_tokenIdToHighValue[s_tokenId] = highValue;
        _safeMint(msg.sender, s_tokenId);
        emit CreatedNFT(s_tokenId, highValue);
    }

    function svgToImageUri(
        string memory svg
    ) public pure returns (string memory) {
        string memory base64Encoded = Base64.encode(
            bytes(string(abi.encodePacked(svg)))
        );
        return string(abi.encodePacked(svgPrefix, base64Encoded));
    }

    function _baseURI() internal pure override returns (string memory) {
        return "data:application/json;base64,";
    }

    function tokenURI(
        uint256 tokenId
    ) public view override returns (string memory) {
        require(_exists(tokenId), "Token id doesn't exist");

        (, int256 price, , , ) = i_priceFeed.latestRoundData();
        string memory imageURI = i_lowImageUri;
        if (price >= s_tokenIdToHighValue[tokenId]) {
            imageURI = i_highImageUri;
        }

        return
            string(
                abi.encodePacked(
                    _baseURI(),
                    Base64.encode(
                        bytes(
                            abi.encodePacked(
                                '{"name":"',
                                name(),
                                '", "description": "An NFT that changes images when switched",',
                                '"attributes": [{"trait_type": "coolness", "value": 100}] ,"image":"',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            );
    }

    function getTokenId() public view returns (uint256) {
        return s_tokenId;
    }

    function getLowSvg() public view returns (string memory) {
        return i_lowImageUri;
    }

    function getHighSvg() public view returns (string memory) {
        return i_highImageUri;
    }

    function getPriceFeed() public view returns (AggregatorV3Interface) {
        return i_priceFeed;
    }
}
