import { ethers } from 'ethers';

// Правильный ABI для ThirdWeb Marketplace V3
export const MARKETPLACE_ABI = [
  // Direct Listings функции
  "function createListing((address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved) _params) external returns (uint256 listingId)",
  "function buyFromListing(uint256 listingId, address buyFor, uint256 quantity, address currency, uint256 totalPrice) external payable",
  
  // English Auctions функции
  "function createAuction((address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 minimumBidAmount, uint256 buyoutBidAmount, uint64 timeBufferInSeconds, uint64 bidBufferBps, uint64 startTimestamp, uint64 endTimestamp) _params) external returns (uint256 auctionId)",
  
  // Просмотр листингов
  "function getListing(uint256 _listingId) external view returns ((uint256 listingId, address tokenOwner, address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved))",
  "function totalListings() external view returns (uint256)",
  
  // Проверки approval
  "function isBuyerApprovedForListing(uint256 _listingId, address _buyer) external view returns (bool)",
  
  // События
  "event NewListing(address indexed listingCreator, uint256 indexed listingId, address indexed assetContract, (uint256 listingId, address tokenOwner, address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved) listing)",
  "event NewSale(address indexed listingCreator, uint256 indexed listingId, address indexed assetContract, uint256 tokenId, address buyer, uint256 quantityBought, uint256 totalPricePaid)"
];

export const ERC721_ABI = [
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function getApproved(uint256 tokenId) external view returns (address)"
];

export const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
];
