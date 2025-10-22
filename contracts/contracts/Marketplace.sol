// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./IERC20.sol";

contract NFTMarketplace is ReentrancyGuard {
    using Counters for Counters.Counter;
    
    address public owner;
    IERC20 public paymentToken;
    Counters.Counter private _listingIds;
    
    struct Listing {
        uint256 listingId;
        address seller;
        address nftContract;
        uint256 tokenId;
        uint256 price;
        bool active;
        uint256 createdAt;
    }
    
    mapping(uint256 => Listing) public listings;
    mapping(address => mapping(uint256 => bool)) public nftTransferred;
    mapping(address => mapping(uint256 => uint256)) public nftToListingId;
    
    event NFTListed(
        uint256 indexed listingId,
        address indexed seller,
        address indexed nftContract,
        uint256 tokenId,
        uint256 price
    );
    
    event NFTSold(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        address nftContract,
        uint256 tokenId,
        uint256 price
    );
    
    event NFTTransferredToMarketplace(
        address indexed from,
        address indexed nftContract,
        uint256 indexed tokenId
    );
    
    event ListingCancelled(
        uint256 indexed listingId,
        address indexed seller
    );
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _paymentToken) {
        owner = msg.sender;
        paymentToken = IERC20(_paymentToken);
    }
    
    function transferNFTToMarketplace(address nftContract, uint256 tokenId) external {
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not NFT owner");
        require(nft.getApproved(tokenId) == address(this), "Marketplace not approved");
        
        nft.transferFrom(msg.sender, address(this), tokenId);
        nftTransferred[nftContract][tokenId] = true;
        
        emit NFTTransferredToMarketplace(msg.sender, nftContract, tokenId);
    }
    
    function listNFT(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external {
        require(nftTransferred[nftContract][tokenId], "NFT not transferred to marketplace");
        require(price > 0, "Price must be > 0");
        
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == address(this), "NFT not owned by marketplace");
        require(nftToListingId[nftContract][tokenId] == 0, "NFT already listed");
        
        _listingIds.increment();
        uint256 listingId = _listingIds.current();
        
        listings[listingId] = Listing({
            listingId: listingId,
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true,
            createdAt: block.timestamp
        });
        
        nftToListingId[nftContract][tokenId] = listingId;
        
        emit NFTListed(listingId, msg.sender, nftContract, tokenId, price);
    }
    
    function buyNFT(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "NFT not for sale");
        require(listing.seller != msg.sender, "Cannot buy your own NFT");
        require(paymentToken.balanceOf(msg.sender) >= listing.price, "Insufficient balance");
        require(paymentToken.allowance(msg.sender, address(this)) >= listing.price, "Insufficient allowance");
        
        // Transfer payment tokens from buyer to seller
        require(paymentToken.transferFrom(msg.sender, listing.seller, listing.price), "Payment failed");
        
        // Transfer NFT from marketplace to buyer
        IERC721 nft = IERC721(listing.nftContract);
        nft.transferFrom(address(this), msg.sender, listing.tokenId);
        
        listing.active = false;
        nftTransferred[listing.nftContract][listing.tokenId] = false;
        nftToListingId[listing.nftContract][listing.tokenId] = 0;
        
        emit NFTSold(listingId, msg.sender, listing.seller, listing.nftContract, listing.tokenId, listing.price);
    }
    
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender, "Not seller");
        require(listing.active, "Listing not active");
        
        // Return NFT to seller
        IERC721 nft = IERC721(listing.nftContract);
        nft.transferFrom(address(this), msg.sender, listing.tokenId);
        
        listing.active = false;
        nftTransferred[listing.nftContract][listing.tokenId] = false;
        nftToListingId[listing.nftContract][listing.tokenId] = 0;
        
        emit ListingCancelled(listingId, msg.sender);
    }
    
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
    
    function getActiveListings(uint256 from, uint256 to) external view returns (Listing[] memory) {
        require(to <= _listingIds.current(), "Invalid range");
        uint256 activeCount = 0;
        
        // First count active listings
        for (uint256 i = from; i <= to; i++) {
            if (listings[i].active) {
                activeCount++;
            }
        }
        
        // Then populate array
        Listing[] memory activeListings = new Listing[](activeCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = from; i <= to; i++) {
            if (listings[i].active) {
                activeListings[currentIndex] = listings[i];
                currentIndex++;
            }
        }
        
        return activeListings;
    }
    
    function getListingsBySeller(address seller) external view returns (Listing[] memory) {
        uint256 totalCount = 0;
        
        // Count seller's listings
        for (uint256 i = 1; i <= _listingIds.current(); i++) {
            if (listings[i].seller == seller) {
                totalCount++;
            }
        }
        
        Listing[] memory sellerListings = new Listing[](totalCount);
        uint256 currentIndex = 0;
        
        for (uint256 i = 1; i <= _listingIds.current(); i++) {
            if (listings[i].seller == seller) {
                sellerListings[currentIndex] = listings[i];
                currentIndex++;
            }
        }
        
        return sellerListings;
    }
}