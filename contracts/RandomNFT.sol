// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

error RandomNFT__UNBOUND();
error RandomNFT__SENDMOREETH();
error RandomNFT__NOTOWNER();

contract RandomNFT is VRFConsumerBaseV2, ERC721URIStorage, Ownable {
    enum Breed {
        PUG,
        SHIBA_INU,
        OWINO
    }

    event NftRequested(uint256 indexed requestId, address requester);
    event NftMinted(Breed dogBreed, address minter);

    uint64 private immutable i_subscriptionId;
    VRFCoordinatorV2Interface private immutable i_vrfCoordinator;
    uint16 private constant REQUESTCONFIRMATION = 3;
    uint32 private immutable i_callbackGasLimit;
    uint32 private constant NUMWORDS = 3;
    bytes32 private immutable i_gasLane;
    uint internal immutable i_mintFee;

    mapping(uint256 => address) private dogOwner;
    uint256 private s_counter;
    uint256 internal constant MAX_CHANCE_VALUE = 100;
    string[] internal s_breedUri;

    constructor(
        uint64 subscriptionId,
        address vrfCoordinator,
        bytes32 gasLane,
        uint32 gasLimit,
        string[3] memory breedUri,
        uint minFee
    ) VRFConsumerBaseV2(vrfCoordinator) ERC721("Doggie", "DOGE") {
        i_vrfCoordinator = VRFCoordinatorV2Interface(vrfCoordinator);
        i_subscriptionId = subscriptionId;
        i_gasLane = gasLane;
        i_callbackGasLimit = gasLimit;
        s_breedUri = breedUri;
        i_mintFee = minFee;
    }

    function requestNft() public payable returns (uint256 requestId) {
        if (msg.value < i_mintFee) {
            revert RandomNFT__SENDMOREETH();
        }
        requestId = i_vrfCoordinator.requestRandomWords(
            i_gasLane,
            i_subscriptionId,
            REQUESTCONFIRMATION,
            i_callbackGasLimit,
            NUMWORDS
        );
        dogOwner[requestId] = msg.sender;
        emit NftRequested(requestId, msg.sender);
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        address nftOwner = dogOwner[_requestId];
        uint256 newTokenId = s_counter;

        uint256 moddedRng = _randomWords[0] % MAX_CHANCE_VALUE; // value will be between 0-99

        Breed dogBreed = getRarity(moddedRng);
        s_counter += 1;
        _safeMint(nftOwner, newTokenId);
        _setTokenURI(newTokenId, s_breedUri[uint256(dogBreed)]);
        emit NftMinted(dogBreed, nftOwner);
    }

    function getRarity(uint256 moddedRng) public pure returns (Breed) {
        uint256 cumulative = 0;
        uint256[3] memory chance = getChanceArray();
        for (uint i = 0; i < chance.length; i++) {
            if (moddedRng >= cumulative && moddedRng < cumulative + chance[i]) {
                return Breed(i);
            }
            cumulative += chance[i];
        }
        revert RandomNFT__UNBOUND();
    }

    function getChanceArray() public pure returns (uint256[3] memory) {
        return [10, 40, MAX_CHANCE_VALUE];
    }

    function ownerWithdraw() public onlyOwner {
        uint256 amount = address(this).balance;
        (bool success, ) = payable(msg.sender).call{value: amount}("");
        if (!success) {
            revert RandomNFT__NOTOWNER();
        }
    }

    function getMintFee() public view returns (uint256) {
        return i_mintFee;
    }

    function getBreedUri(uint256 index) public view returns (string memory) {
        return s_breedUri[index];
    }

    function getCounter() public view returns (uint256) {
        return s_counter;
    }
}
