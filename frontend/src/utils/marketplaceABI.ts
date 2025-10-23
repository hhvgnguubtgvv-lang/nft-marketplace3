// ABI для кастомного маркетплейса NFT
export const MARKETPLACE_ABI = [
  // Основные функции
  "function listNFT(address nftAddress, uint256 tokenId, uint256 price) external",
  "function buyNFT(address nftAddress, uint256 tokenId) external",
  "function cancelListing(address nftAddress, uint256 tokenId) external",
  
  // Геттеры
  "function getListing(address nftAddress, uint256 tokenId) external view returns (address seller, uint256 price, bool active)",
  "function paymentToken() external view returns (address)",
  
  // События
  "event NFTListed(address indexed nftAddress, uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event NFTSold(address indexed nftAddress, uint256 indexed tokenId, address indexed buyer, uint256 price)",
  "event ListingCancelled(address indexed nftAddress, uint256 indexed tokenId, address indexed seller)"
] as const;

// ABI для ERC20 токена (LEX)
export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)"
] as const;

// ABI для ERC721 NFT
export const ERC721_ABI = [
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function balanceOf(address owner) external view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)"
] as const;

export interface Listing {
  seller: string;
  price: bigint;
  active: boolean;
  nftAddress: string;
  tokenId: bigint;
}

// Для обратной совместимости
export const DIRECT_LISTINGS_ABI = MARKETPLACE_ABI;