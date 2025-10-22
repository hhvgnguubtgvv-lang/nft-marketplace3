export interface NFTListing {
  listingId: number;
  seller: string;
  nftContract: string;
  tokenId: number;
  price: string;
  active: boolean;
  createdAt: number;
  metadata?: NFTMetadata;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

export interface SearchFilters {
  priceMin: string;
  priceMax: string;
  collection: string;
  seller: string;
  tokenId: string;
  sortBy: 'price' | 'date' | 'name';
  sortOrder: 'asc' | 'desc';
}

export interface Web3State {
  provider: any;
  signer: any;
  account: string;
  chainId: number;
  isConnected: boolean;
}