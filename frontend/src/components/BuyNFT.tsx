import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, PAYMENT_TOKEN, NFT_CONTRACT } from '../utils/constants';
import { MARKETPLACE_ABI, ERC20_ABI } from '../utils/marketplaceABI';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface Listing {
  seller: string;
  price: bigint;
  active: boolean;
  nftAddress: string;
  tokenId: bigint;
}

interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes?: Array<{
    trait_type: string;
    value: string;
  }>;
}

// 🎯 ХАРДКОД МЕТАДАННЫХ ДЛЯ КАЖДОГО TOKEN ID
const NFT_METADATA_MAP: { [key: number]: NFTMetadata } = {
  1: {
    name: "NFT #1",
    description: "Первое уникальное NFT",
    image: "https://ipfs.io/ipfs/bafybeihdgjfd3g5htim54uwsetp2omhlva5sfcuwfwtqqce2kjddmpktpm/1.png"
  },
  2: {
    name: "NFT #2", 
    description: "Второе эксклюзивное NFT",
    image: "https://ipfs.io/ipfs/bafybeihdgjfd3g5htim54uwsetp2omhlva5sfcuwfwtqqce2kjddmpktpm/2.png"
  },
  3: {
    name: "NFT #3",
    description: "Третье редкое NFT",
    image: "https://tse1.mm.bing.net/th/id/OIP.UCwRVKFQAChAAikc2JN5WwHaEK?cb=12&rs=1&pid=ImgDetMain&o=7&rm=3"
  },
  4: {
    name: "NFT #4",
    description: "Четвертое коллекционное NFT",
    image: "https://ipfs.io/ipfs/bafybeihdgjfd3g5htim54uwsetp2omhlva5sfcuwfwtqqce2kjddmpktpm/4.png"
  },
  5: {
    name: "NFT #5",
    description: "Пятое особое NFT",
    image: "https://ipfs.io/ipfs/bafybeihdgjfd3g5htim54uwsetp2omhlva5sfcuwfwtqqce2kjddmpktpm/5.png"
  }
  // Добавь остальные tokenId по мере необходимости
};

const BuyNFT: React.FC = () => {
  const [listings, setListings] = useState<(Listing & { metadata?: NFTMetadata })[]>([]);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState('');
  const [error, setError] = useState('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebug = (message: string) => {
    console.log(`🔍 ${message}`);
    setDebugInfo(prev => [...prev.slice(-10), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      alert('Установите MetaMask!');
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      setError('');
      addDebug('✅ Кошелек подключен');
    } catch (error) {
      alert('Ошибка подключения кошелька: ' + error);
    }
  };

  // 🔥 ПРОСТАЯ ФУНКЦИЯ - БЕРЕМ МЕТАДАННЫЕ ИЗ ХАРДКОДА
  const getNFTMetadata = (tokenId: bigint): NFTMetadata | null => {
    const id = Number(tokenId);
    
    if (NFT_METADATA_MAP[id]) {
      addDebug(`✅ Методанные для TokenID ${id} найдены в коде`);
      return NFT_METADATA_MAP[id];
    } else {
      // Fallback для неизвестных tokenId
      addDebug(`⚠️ TokenID ${id} нет в коде, используем fallback`);
      return {
        name: `NFT #${id}`,
        description: "Эксклюзивное цифровое искусство",
        image: `https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=NFT+${id}`
      };
    }
  };

  const getListings = async () => {
    if (!window.ethereum) return;
    
    setLoading(true);
    setError('');
    setDebugInfo([]);
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const marketplaceAddress = CONTRACT_ADDRESSES[137];
      
      addDebug(`🔍 Подключаемся к маркетплейсу: ${marketplaceAddress}`);
      addDebug(`🖼️ NFT контракт: ${NFT_CONTRACT}`);

      const marketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI, provider);
      
      const allListings: (Listing & { metadata?: NFTMetadata })[] = [];
      
      addDebug('🔎 Ищем активные листинги...');
      
      // Проверяем токены из нашего хардкода + несколько дополнительных
      const tokenIdsToCheck = [...Object.keys(NFT_METADATA_MAP).map(Number), 6, 7, 8, 9, 10];
      
      for (const tokenId of tokenIdsToCheck) {
        try {
          const listingData = await marketplace.getListing(NFT_CONTRACT, tokenId);
          const [seller, price, active] = listingData;
          
          if (active) {
            const listing: Listing = {
              seller,
              price,
              active,
              nftAddress: NFT_CONTRACT,
              tokenId: BigInt(tokenId)
            };
            
            // 🔥 Берем метаданные из хардкода - МГНОВЕННО!
            const metadata = getNFTMetadata(BigInt(tokenId));
            
            allListings.push({
              ...listing,
              metadata
            });
            
            addDebug(`✅ Найден листинг: TokenID ${tokenId} - ${ethers.formatUnits(price, 18)} LEX`);
          }
        } catch (error) {
          // Токен не существует или не выставлен - пропускаем
          continue;
        }
      }

      setListings(allListings);
      addDebug(`📈 ИТОГИ: ${allListings.length} активных листингов`);

      if (allListings.length === 0) {
        setError('Нет активных листингов для этого NFT контракта');
      }

    } catch (error: any) {
      console.error('❌ Ошибка загрузки:', error);
      addDebug(`❌ Ошибка: ${error.message}`);
      setError(`Ошибка загрузки: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const buyNFT = async (listing: Listing) => {
    if (!window.ethereum || !account) {
      alert('Подключите кошелек!');
      return;
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const marketplaceAddress = CONTRACT_ADDRESSES[137];
      
      addDebug(`🛒 Покупаем TokenID ${listing.tokenId}...`);

      // 1. Проверяем баланс LEX
      const tokenContract = new ethers.Contract(PAYMENT_TOKEN.address, ERC20_ABI, provider);
      const balance = await tokenContract.balanceOf(account);
      
      if (balance < listing.price) {
        throw new Error(`Недостаточно LEX. Нужно: ${ethers.formatUnits(listing.price, 18)}, есть: ${ethers.formatUnits(balance, 18)}`);
      }

      // 2. Даем разрешение на трату LEX
      addDebug('🔐 Даем разрешение на трату LEX...');
      const tokenContractWithSigner = new ethers.Contract(PAYMENT_TOKEN.address, ERC20_ABI, signer);
      
      const approveTx = await tokenContractWithSigner.approve(marketplaceAddress, listing.price);
      addDebug(`✅ Транзакция approve отправлена: ${approveTx.hash}`);
      await approveTx.wait();
      addDebug('✅ Разрешение подтверждено');

      // 3. Покупаем NFT
      addDebug('💰 Совершаем покупку...');
      const marketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI, signer);
      
      const buyTx = await marketplace.buyNFT(listing.nftAddress, listing.tokenId);
      addDebug(`✅ Транзакция покупки отправлена: ${buyTx.hash}`);
      
      await buyTx.wait();
      addDebug('🎉 Покупка подтверждена!');

      alert('🎉 NFT успешно куплен!');
      
      // Обновляем список листингов
      await getListings();
      
    } catch (error: any) {
      console.error('❌ Ошибка покупки:', error);
      addDebug(`❌ Ошибка покупки: ${error.message}`);
      alert(`❌ Ошибка покупки: ${error.message}`);
    }
  };

  useEffect(() => {
    if (account) {
      getListings();
    }
  }, [account]);

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2>🛒 Купить NFT</h2>
      
      {!account ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <button onClick={connectWallet} style={{
            padding: '15px 30px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '18px',
            cursor: 'pointer'
          }}>
            🔗 Подключить MetaMask
          </button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button onClick={getListings} disabled={loading} style={{
              padding: '10px 20px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}>
              {loading ? '⏳ Загрузка...' : '🔄 Обновить'}
            </button>
            <span>Листингов: {listings.length}</span>
            <span style={{ fontSize: '14px', color: '#666' }}>
              💡 Кошелек: {account.slice(0, 6)}...{account.slice(-4)}
            </span>
          </div>

          {/* Отладка */}
          {debugInfo.length > 0 && (
            <div style={{ 
              marginBottom: '20px',
              padding: '15px', 
              background: '#1a1a1a', 
              color: '#00ff00',
              borderRadius: '5px',
              fontSize: '12px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong>🚀 ОТЛАДКА:</strong>
                <button 
                  onClick={() => setDebugInfo([])}
                  style={{ padding: '2px 8px', fontSize: '10px', background: '#ff4444', color: 'white' }}
                >
                  Очистить
                </button>
              </div>
              {debugInfo.map((line, index) => (
                <div key={index} style={{ 
                  marginBottom: '2px',
                  color: line.includes('❌') ? '#ff4444' : 
                         line.includes('✅') ? '#00ff00' : 
                         line.includes('🎉') ? '#ffaa00' : '#cccccc'
                }}>
                  {line}
                </div>
              ))}
            </div>
          )}

          {error && (
            <div style={{
              background: '#f8d7da',
              color: '#721c24',
              padding: '15px',
              borderRadius: '5px',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '20px'
          }}>
            {listings.map((listing, index) => (
              <div key={index} style={{
                border: '2px solid #28a745',
                borderRadius: '15px',
                padding: '20px',
                background: 'white',
                position: 'relative',
                boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                transition: 'transform 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  background: '#28a745',
                  color: 'white',
                  padding: '5px 10px',
                  borderRadius: '15px',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}>
                  LEX ✅
                </div>
                
                {/* Изображение NFT */}
                {listing.metadata?.image ? (
                  <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                    <img 
                      src={listing.metadata.image} 
                      alt={listing.metadata.name}
                      style={{
                        width: '100%',
                        height: '200px',
                        objectFit: 'cover',
                        borderRadius: '10px',
                        border: '1px solid #ddd'
                      }}
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=Image+Error';
                      }}
                    />
                  </div>
                ) : (
                  <div style={{
                    width: '100%',
                    height: '200px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    marginBottom: '15px',
                    flexDirection: 'column',
                    fontWeight: 'bold'
                  }}>
                    <div>🎨 NFT #{listing.tokenId.toString()}</div>
                    <div style={{ fontSize: '12px', marginTop: '5px', opacity: 0.8 }}>Изображение</div>
                  </div>
                )}
                
                <h3 style={{ margin: '0 0 10px 0', fontSize: '18px', color: '#333' }}>
                  {listing.metadata?.name || `NFT #${listing.tokenId.toString()}`}
                </h3>
                
                {listing.metadata?.description && (
                  <p style={{ 
                    color: '#666', 
                    fontSize: '14px', 
                    marginBottom: '10px',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {listing.metadata.description}
                  </p>
                )}
                
                <div style={{ 
                  background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)', 
                  padding: '12px', 
                  borderRadius: '8px',
                  marginBottom: '15px',
                  border: '1px solid #dee2e6'
                }}>
                  <p style={{ margin: '5px 0', fontWeight: 'bold', color: '#28a745', fontSize: '16px' }}>
                    💰 {ethers.formatUnits(listing.price, 18)} LEX
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '13px', color: '#495057' }}>
                    <strong>👤 Продавец:</strong> {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '13px', color: '#495057' }}>
                    <strong>🆔 Token ID:</strong> {listing.tokenId.toString()}
                  </p>
                </div>
                
                <button 
                  onClick={() => buyNFT(listing)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    background: 'linear-gradient(135deg, #007bff 0%, #0056b3 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    transition: 'all 0.3s',
                    boxShadow: '0 2px 4px rgba(0,123,255,0.3)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                >
                  🛒 Купить за {ethers.formatUnits(listing.price, 18)} LEX
                </button>
              </div>
            ))}
          </div>

          {listings.length === 0 && !loading && (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <p style={{ fontSize: '18px', marginBottom: '10px' }}>🤷‍♂️ Нет активных листингов</p>
              <p>Перейдите во вкладку "Sell NFT" чтобы создать первый листинг</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default BuyNFT;