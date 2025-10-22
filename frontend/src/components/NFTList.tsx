import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../hooks/useWeb3';
import { NFTListing, SearchFilters as SearchFiltersType } from '../types';
import { MARKETPLACE_ABI, ERC20_ABI, ERC721_ABI } from '../utils/contracts';
import { CONTRACT_ADDRESSES, PAYMENT_TOKEN } from '../utils/constants';
import SearchFiltersComponent from './SearchFilters';
import NFTGrid from './NFTGrid';

const NFTList: React.FC = () => {
  const { signer, account, chainId } = useWeb3();
  const [listings, setListings] = useState<NFTListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SearchFiltersType>({
    priceMin: '',
    priceMax: '',
    collection: '',
    seller: '',
    tokenId: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const loadNFTs = async () => {
    setLoading(true);
    
    // ВРЕМЕННО: используем мок-данные
    setTimeout(() => {
      const mockNFTs = [
        {
          listingId: 1,
          seller: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          nftContract: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
          tokenId: 1,
          price: '1.5',
          active: true,
          metadata: {
            name: "Awesome NFT #1",
            description: "This is a beautiful test NFT",
            image: "https://picsum.photos/400/400"
          }
        },
        {
          listingId: 2,
          seller: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
          nftContract: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
          tokenId: 2,
          price: '2.3',
          active: true,
          metadata: {
            name: "Rare Digital Art",
            description: "Limited edition digital artwork",
            image: "https://picsum.photos/400/401"
          }
        }
      ];
      setListings(mockNFTs);
      setLoading(false);
    }, 1000);
  };

  const buyNFT = async (listingId: number) => {
    if (!signer || !account) {
      alert('Please connect your wallet first');
      return;
    }

    try {
      const marketplaceAddress = CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES];
      if (!marketplaceAddress || marketplaceAddress === '0x0000000000000000000000000000000000000000') {
        alert('Marketplace contract not deployed on this network');
        return;
      }

      // Находим листинг
      const listing = listings.find(l => l.listingId === listingId);
      if (!listing) {
        alert('Listing not found');
        return;
      }

      // Проверяем баланс ERC20 токена
      const erc20 = new ethers.Contract(PAYMENT_TOKEN.address, ERC20_ABI, signer);
      const balance = await erc20.balanceOf(account);
      const priceInWei = ethers.parseEther(listing.price);
      
      if (balance < priceInWei) {
        alert(`Insufficient ${PAYMENT_TOKEN.symbol} balance. You need ${listing.price} ${PAYMENT_TOKEN.symbol}`);
        return;
      }

      // Проверяем allowance
      const allowance = await erc20.allowance(account, marketplaceAddress);
      if (allowance < priceInWei) {
        // Запрашиваем approve
        const approveTx = await erc20.approve(marketplaceAddress, priceInWei);
        await approveTx.wait();
        alert(`Approved ${PAYMENT_TOKEN.symbol} for marketplace`);
      }

      // Покупаем NFT
      const marketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI, signer);
      const tx = await marketplace.buyNFT(listingId);
      await tx.wait();
      
      alert(`NFT purchased successfully for ${listing.price} ${PAYMENT_TOKEN.symbol}!`);
      loadNFTs(); // Reload listings
      
    } catch (error: any) {
      console.error('Error buying NFT:', error);
      alert(`Error: ${error.message || 'Failed to buy NFT'}`);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (filters.priceMin && parseFloat(listing.price) < parseFloat(filters.priceMin)) return false;
    if (filters.priceMax && parseFloat(listing.price) > parseFloat(filters.priceMax)) return false;
    if (filters.collection && !listing.nftContract.toLowerCase().includes(filters.collection.toLowerCase())) return false;
    if (filters.seller && !listing.seller.toLowerCase().includes(filters.seller.toLowerCase())) return false;
    if (filters.tokenId && listing.tokenId.toString() !== filters.tokenId) return false;
    return true;
  });

  useEffect(() => {
    loadNFTs();
  }, [signer, chainId]);

  return (
    <div className="nft-list-page">
      <div className="page-header">
        <h2>Browse NFTs - Pay with {PAYMENT_TOKEN.symbol}</h2>
        <button onClick={loadNFTs} className="refresh-btn">
          🔄 Refresh
        </button>
      </div>

      <div className="content-layout">
        <aside className="filters-sidebar">
          <SearchFiltersComponent filters={filters} onFiltersChange={setFilters} />
        </aside>

        <main className="listings-main">
          <div className="results-info">
            <p>Found {filteredListings.length} NFTs - All prices in {PAYMENT_TOKEN.symbol}</p>
          </div>
          
          <NFTGrid
            listings={filteredListings}
            onBuy={buyNFT}
            currentAccount={account}
            loading={loading}
          />
        </main>
      </div>
    </div>
  );
};

export default NFTList;
