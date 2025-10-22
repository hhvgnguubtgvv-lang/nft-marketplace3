
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, PAYMENT_TOKEN } from '../utils/constants';

declare global {
  interface Window {
    ethereum?: any;
  }
}

// ABI для чтения листингов
const MARKETPLACE_ABI = [
  "function getListing(uint256 _listingId) external view returns (tuple(uint256 listingId, address tokenOwner, address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved) listing)",
  "function totalListings() external view returns (uint256)"
];

interface Listing {
  listingId: number;
  tokenOwner: string;
  assetContract: string;
  tokenId: number;
  quantity: number;
  currency: string;
  pricePerToken: string;
  active: boolean;
}

const BuyNFT: React.FC = () => {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState('');

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Установите MetaMask!');
      return;
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      setAccount(accounts[0]);
      loadListings();
    } catch (error) {
      alert('Ошибка подключения кошелька: ' + error);
    }
  };

  // Загрузка ВСЕХ активных листингов
  const loadListings = async () => {
    if (!window.ethereum) return;

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const marketplaceAddress = CONTRACT_ADDRESSES[137];
      
      console.log('🔍 Загружаем листинги с адреса:', marketplaceAddress);
      
      const marketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI, provider);
      
      // Получаем общее количество листингов
      const totalListings = await marketplace.totalListings();
      console.log('📊 Всего листингов в контракте:', totalListings.toString());

      const activeListings: Listing[] = [];

      // Загружаем каждый листинг
      for (let i = 1; i <= Number(totalListings); i++) {
        try {
          const listingData = await marketplace.getListing(i);
          console.log(`📝 Листинг ${i}:`, listingData);

          // Проверяем что листинг активен
          if (listingData.active) {
            const listing: Listing = {
              listingId: Number(listingData.listingId),
              tokenOwner: listingData.tokenOwner,
              assetContract: listingData.assetContract,
              tokenId: Number(listingData.tokenId),
              quantity: Number(listingData.quantity),
              currency: listingData.currency,
              pricePerToken: ethers.formatUnits(listingData.pricePerToken, 18),
              active: listingData.active
            };

            console.log(`✅ Активный листинг ${i}:`, listing);
            activeListings.push(listing);
          } else {
            console.log(`❌ Листинг ${i} не активен`);
          }
        } catch (error) {
          console.log(`⚠️ Листинг ${i} не существует или ошибка:`, error);
        }
      }

      console.log('🎯 Все активные листинги:', activeListings);
      setListings(activeListings);

    } catch (error) {
      console.error('❌ Ошибка загрузки листингов:', error);
    } finally {
      setLoading(false);
    }
  };

  // Покупка NFT
  const buyNFT = async (listingId: number, price: string) => {
    if (!window.ethereum || !account) {
      alert('Подключите кошелек!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const marketplaceAddress = CONTRACT_ADDRESSES[137];
      
      // ABI для покупки
      const buyABI = [
        "function buyFromListing(uint256 listingId, address buyFor, uint256 quantity, address currency, uint256 totalPrice) external payable"
      ];
      
      const marketplace = new ethers.Contract(marketplaceAddress, buyABI, signer);
      
      const totalPrice = ethers.parseUnits(price, 18);
      
      console.log('🛒 Покупаем NFT...', { 
        listingId, 
        price: price,
        totalPrice: totalPrice.toString(),
        currency: PAYMENT_TOKEN.address 
      });
      
      const tx = await marketplace.buyFromListing(
        listingId,
        account, // покупатель
        1, // количество
        PAYMENT_TOKEN.address, // валюта (LEX)
        totalPrice // общая цена
      );
      
      console.log('📫 Транзакция отправлена:', tx.hash);
      alert(`✅ Транзакция покупки отправлена!\nХэш: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log('🎉 Покупка подтверждена:', receipt);
      alert('🎉 NFT успешно куплен!');
      
      // Обновляем список листингов
      loadListings();
      
    } catch (error: any) {
      console.error('❌ Ошибка покупки:', error);
      
      if (error.message?.includes('user rejected')) {
        alert('❌ Вы отменили транзакцию');
      } else if (error.message?.includes('insufficient funds')) {
        alert('❌ Недостаточно LEX токенов для покупки');
      } else if (error.reason) {
        alert(`❌ Ошибка: ${error.reason}`);
      } else {
        alert(`❌ Ошибка покупки: ${error.message || 'Неизвестная ошибка'}`);
      }
    }
  };

  useEffect(() => {
    if (window.ethereum) {
      loadListings();
    }
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>🛍️ Купить NFT за {PAYMENT_TOKEN.symbol}</h2>
      
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
        {!account ? (
          <button 
            onClick={connectWallet}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            🔗 Подключить кошелек
          </button>
        ) : (
          <span>✅ Кошелек: {account.slice(0, 6)}...{account.slice(-4)}</span>
        )}
        
        <button 
          onClick={loadListings}
          disabled={loading}
          style={{ 
            padding: '10px 20px', 
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '🔄 Загрузка...' : '🔄 Обновить листинги'}
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <p>🔄 Загружаем листинги из блокчейна...</p>
          <p>Проверяем {listings.length > 0 ? `${listings.length} листингов` : 'все листинги'}...</p>
        </div>
      ) : listings.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: '#f8f9fa', borderRadius: '10px' }}>
          <h3>😔 NFT для покупки не найдены</h3>
          <p>Попробуйте:</p>
          <ul style={{ textAlign: 'left', display: 'inline-block' }}>
            <li>Обновить страницу</li>
            <li>Проверить что вы в сети Polygon Mainnet</li>
            <li>Убедиться что NFT были выставлены на продажу</li>
          </ul>
        </div>
      ) : (
        <div>
          <h3>🎯 Найдено {listings.length} NFT для покупки</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
            {listings.map((listing) => (
              <div key={listing.listingId} style={{ 
                border: '1px solid #ddd', 
                borderRadius: '10px', 
                padding: '20px',
                background: 'white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h4>NFT #{listing.tokenId}</h4>
                <p><strong>Контракт:</strong> {listing.assetContract.slice(0, 6)}...{listing.assetContract.slice(-4)}</p>
                <p><strong>Владелец:</strong> {listing.tokenOwner.slice(0, 6)}...{listing.tokenOwner.slice(-4)}</p>
                <p><strong>Цена:</strong> {listing.pricePerToken} {PAYMENT_TOKEN.symbol}</p>
                <p><strong>Количество:</strong> {listing.quantity}</p>
                <p><strong>ID листинга:</strong> {listing.listingId}</p>
                
                <button 
                  onClick={() => buyNFT(listing.listingId, listing.pricePerToken)}
                  disabled={!account}
                  style={{ 
                    width: '100%',
                    padding: '12px',
                    backgroundColor: account ? '#dc3545' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    fontSize: '16px',
                    cursor: account ? 'pointer' : 'not-allowed',
                    marginTop: '10px'
                  }}
                >
                  {account ? `🛒 Купить за ${listing.pricePerToken} ${PAYMENT_TOKEN.symbol}` : 'Подключите кошелек'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', background: '#e7f3ff', borderRadius: '5px' }}>
        <h4>💡 Отладочная информация:</h4>
        <p><strong>Адрес маркетплейса:</strong> {CONTRACT_ADDRESSES[137]}</p>
        <p><strong>Токен оплаты:</strong> {PAYMENT_TOKEN.symbol} ({PAYMENT_TOKEN.address})</p>
        <p><strong>Найдено листингов:</strong> {listings.length}</p>
        <button 
          onClick={() => {
            console.log('Все листинги:', listings);
            console.log('Конфигурация:', {
              marketplace: CONTRACT_ADDRESSES[137],
              paymentToken: PAYMENT_TOKEN
            });
          }}
          style={{ 
            padding: '5px 10px', 
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          📋 Показать в консоли
        </button>
      </div>
    </div>
  );
};

export default BuyNFT;
