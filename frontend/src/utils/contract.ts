import { ethers } from 'ethers';

export const MARKETPLACE_ABI = [
  "function listNFT(address nftContract, uint256 tokenId, uint256 price) external",
  "function buyNFT(address nftContract, uint256 tokenId) external",
  "function transferNFTToMarketplace(address nftContract, uint256 tokenId) external",
  "function cancelListing(address nftContract, uint256 tokenId) external",
  "function getListing(address nftContract, uint256 tokenId) external view returns (tuple(address seller, address nftContract, uint256 tokenId, uint256 price, bool active))",
  "function listings(address, uint256) external view returns (address seller, address nftContract, uint256 tokenId, uint256 price, bool active)",
  "function nftTransferred(address, uint256) external view returns (bool)",
  "function paymentToken() external view returns (address)",
  "event NFTListed(address indexed seller, address indexed nftContract, uint256 indexed tokenId, uint256 price)",
  "event NFTSold(address indexed buyer, address indexed seller, address indexed nftContract, uint256 tokenId, uint256 price)",
  "event NFTTransferredToMarketplace(address indexed from, address indexed nftContract, uint256 indexed tokenId)"
];

export const ERC721_ABI = [
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function tokenURI(uint256 tokenId) external view returns (string)"
];

export const ERC20_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)"
];

export const MARKETPLACE_ADDRESS = "0x..."; // Адрес deployed контракта