// frontend/src/components/NFTGrid.tsx
import React from 'react';

// Добавьте эту константу если нет в constants.ts
const PAYMENT_TOKEN = 'MATIC';

interface NFTGridProps {
  nfts: any[];
  onAction: (nft: any) => void;
  actionLabel: string;
}

const NFTGrid: React.FC<NFTGridProps> = ({ nfts, onAction, actionLabel }) => {
  // ЗАЩИТА ОТ UNDEFINED - добавьте эту проверку
  if (!nfts || !Array.isArray(nfts)) {
    return <div>No NFTs found or data is loading...</div>;
  }

  if (nfts.length === 0) {
    return <div>No NFTs found</div>;
  }

  return (
    <div className="nft-grid">
      {nfts.map((nft, index) => (
        <div key={index} className="nft-card">
          <h3>Token ID: {nft.tokenId?.toString() || 'N/A'}</h3>
          {nft.price && (
            <p>Price: {nft.price.toString()} {PAYMENT_TOKEN}</p>
          )}
          <button onClick={() => onAction(nft)}>
            {actionLabel}
          </button>
        </div>
      ))}
    </div>
  );
};

export default NFTGrid;