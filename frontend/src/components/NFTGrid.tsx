import React from 'react';
import { NFTListing } from '../types';

interface NFTGridProps {
  listings: NFTListing[];
  onBuy: (listingId: number) => void;
  currentAccount: string;
  loading: boolean;
}

const NFTGrid: React.FC<NFTGridProps> = ({ listings, onBuy, currentAccount, loading }) => {
  if (loading) {
    return (
      <div className="loading-grid">
        <div className="loading-spinner"></div>
        <p>Loading NFTs...</p>
      </div>
    );
  }

  if (listings.length === 0) {
    return (
      <div className="empty-state">
        <h3>No NFTs found</h3>
        <p>Try adjusting your search filters</p>
      </div>
    );
  }

  return (
    <div className="nft-grid">
      {listings.map((listing) => (
        <div key={listing.listingId} className="nft-card">
          <div className="nft-image">
            {listing.metadata?.image ? (
              <img src={listing.metadata.image} alt={listing.metadata.name} />
            ) : (
              <div className="image-placeholder">🎨</div>
            )}
          </div>
          
          <div className="nft-info">
            <h4>{listing.metadata?.name || `NFT #${listing.tokenId}`}</h4>
            <p className="nft-description">
              {listing.metadata?.description || 'No description'}
            </p>
            
            <div className="nft-details">
              <div className="detail">
                <span>Price:</span>
                <strong>{listing.price} {PAYMENT_TOKEN.symbol}</strong>
              </div>
              <div className="detail">
                <span>Seller:</span>
                <span className="address">
                  {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                </span>
              </div>
              <div className="detail">
                <span>Collection:</span>
                <span className="address">
                  {listing.nftContract.slice(0, 6)}...{listing.nftContract.slice(-4)}
                </span>
              </div>
            </div>

            <button
              onClick={() => onBuy(listing.listingId)}
              disabled={listing.seller.toLowerCase() === currentAccount.toLowerCase()}
              className={`buy-btn ${listing.seller.toLowerCase() === currentAccount.toLowerCase() ? 'own-nft' : ''}`}
            >
              {listing.seller.toLowerCase() === currentAccount.toLowerCase() 
                ? 'Your NFT' 
                : 'Buy Now'
              }
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NFTGrid;