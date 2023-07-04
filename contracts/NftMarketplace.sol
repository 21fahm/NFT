// SPDX-License-Identifier: SEE LICENSE IN LICENSE
pragma solidity ^0.8.18;

error NftMarketPlace__PRICEISZERO();
error NftMarketPlace__NOTAPPROVED();
error NftMarketPlace__ALREADYLISTED(address nftAddress, uint256 tokenId);
error NftMarketPlace__NOTOWNER(
    address nftAddress,
    uint256 tokenId,
    address owner
);
error NftMarketPlace__NOTLISTED(address contractAddress, uint256 tokenId);
error NftMarketPlace__PRICENOTMET(address nftAddress, uint256 tokenId);
error NftMarketPlace__NOTENOUGHPROCEEDS();
error NftMarketPlace__TRANSACTIONFAILED();

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NftMarketPlace is ReentrancyGuard {
    //Keep track of listed NFT
    mapping(address => mapping(uint256 => Listing)) private s_Listings;
    //Keep track of the amount user has in contract
    //When people buy NFT
    mapping(address => uint) private s_proceeds;

    struct Listing {
        uint price;
        address seller;
    }

    /**
     * @dev The event below is emited when an NFT is listed.
     * @param seller seller of a NFT
     * @param nftContract Contract address of the NFT
     * @param tokenId Unique identifier for an NFT
     * @param price The price the seller wants to sell NFT
     */

    event ItemListed(
        address indexed seller,
        address indexed nftContract,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemBought(
        address indexed newOwner,
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 price
    );

    event ItemCancelled(
        address indexed nftAddress,
        uint256 indexed tokenId,
        address indexed owner
    );

    event ItemUpdated(
        address indexed nftAddress,
        uint256 indexed tokenId,
        uint256 indexed newPrice
    );

    modifier listed(address contractAddress, uint256 tokenId) {
        if (s_Listings[contractAddress][tokenId].price > 0) {
            revert NftMarketPlace__ALREADYLISTED(contractAddress, tokenId);
        }
        _;
    }

    modifier notOwner(
        address nftAddress,
        uint256 tokenId,
        address owner
    ) {
        if (IERC721(nftAddress).ownerOf(tokenId) != msg.sender) {
            revert NftMarketPlace__NOTOWNER(nftAddress, tokenId, owner);
        }
        _;
    }

    modifier notListed(address contractAddress, uint256 tokenId) {
        if (s_Listings[contractAddress][tokenId].price <= 0) {
            revert NftMarketPlace__NOTLISTED(contractAddress, tokenId);
        }
        _;
    }

    /**
     * @dev The following function serves as a way for a NFT to
     * be listed on MarketPlace.
     * @param nftAddress Contract address of the NFT
     * @param tokenId Unique identifier for an NFT
     * @param price The price the seller wants to sell NFT
     */

    function listItem(
        address nftAddress,
        uint256 tokenId,
        uint256 price
    )
        external
        listed(nftAddress, tokenId)
        notOwner(nftAddress, tokenId, msg.sender)
    {
        if (price <= 0) {
            revert NftMarketPlace__PRICEISZERO();
        }

        IERC721 nft = IERC721(nftAddress);
        if (nft.getApproved(tokenId) != address(this)) {
            revert NftMarketPlace__NOTAPPROVED();
        }
        s_Listings[nftAddress][tokenId] = Listing(price, msg.sender);
        emit ItemListed(msg.sender, nftAddress, tokenId, price);
    }

    function buyItem(
        address nftAddress,
        uint256 tokenId
    ) external payable nonReentrant notListed(nftAddress, tokenId) {
        if (s_Listings[nftAddress][tokenId].price > msg.value) {
            revert NftMarketPlace__PRICENOTMET(nftAddress, tokenId);
        }
        s_proceeds[s_Listings[nftAddress][tokenId].seller] += msg.value;
        delete s_Listings[nftAddress][tokenId];
        IERC721(nftAddress).safeTransferFrom(
            s_Listings[nftAddress][tokenId].seller,
            msg.sender,
            tokenId
        );
        emit ItemBought(
            msg.sender,
            nftAddress,
            tokenId,
            s_Listings[nftAddress][tokenId].price
        );
    }

    function cancelListing(
        address nftAddress,
        uint256 tokenId
    )
        external
        notOwner(nftAddress, tokenId, msg.sender)
        notListed(nftAddress, tokenId)
    {
        delete s_Listings[nftAddress][tokenId];
        emit ItemCancelled(nftAddress, tokenId, msg.sender);
    }

    function updateListing(
        address nftAddress,
        uint256 tokenId,
        uint256 newPrice
    )
        external
        notOwner(nftAddress, tokenId, msg.sender)
        notListed(nftAddress, tokenId)
    {
        s_Listings[nftAddress][tokenId].price = newPrice;
        emit ItemUpdated(nftAddress, tokenId, newPrice);
    }

    function withdraw() external {
        uint proceeds = s_proceeds[msg.sender];
        if (s_proceeds[msg.sender] <= 0) {
            revert NftMarketPlace__NOTENOUGHPROCEEDS();
        }
        s_proceeds[msg.sender] = 0;
        (bool success, ) = payable(msg.sender).call{value: proceeds}("");
        if (!success) {
            revert NftMarketPlace__TRANSACTIONFAILED();
        }
    }

    function getListings(
        address nftAddress,
        uint256 tokenId
    ) public view returns (Listing memory) {
        return s_Listings[nftAddress][tokenId];
    }

    function getProceeds(address nftAddress) public view returns (uint256) {
        return s_proceeds[nftAddress];
    }
}
