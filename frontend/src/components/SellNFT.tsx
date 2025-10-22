
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, PAYMENT_TOKEN } from '../utils/constants';
import { ERC721_ABI } from '../utils/contracts';

declare global {
  interface Window {
    ethereum?: any;
  }
}

const SellNFT: React.FC = () => {
  const [nftContract, setNftContract] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState('');

  // ABI для вызова через DirectListings extension
  const DIRECT_LISTINGS_ABI = [
    // Основная функция создания листинга
    "function createListing((address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved) _params) external returns (uint256 listingId)",
    "function totalListings() external view returns (uint256)"
  ];

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
      alert(`Кошелек подключен: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
    } catch (error) {
      alert('Ошибка подключения кошелька: ' + error);
    }
  };

  const createListing = async () => {
    if (!window.ethereum) {
      alert('MetaMask не установлен!');
      return;
    }

    if (!account) {
      alert('Сначала подключите кошелек!');
      return;
    }

    if (!nftContract || !tokenId || !price) {
      alert('Заполните все поля!');
      return;
    }

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const marketplaceAddress = CONTRACT_ADDRESSES[137];
      
      console.log('🔍 Начинаем процесс продажи...');

      // 1. Проверяем владение NFT
      const nft = new ethers.Contract(nftContract, ERC721_ABI, signer);
      console.log('🔍 Проверяем владение NFT...');
      
      const owner = await nft.ownerOf(tokenId);
      if (owner.toLowerCase() !== account.toLowerCase()) {
        alert('❌ Вы не владелец этого NFT!');
        return;
      }
      console.log('✅ Владение подтверждено');

      // 2. Даем разрешение маркетплейсу
      console.log('🔐 Даем разрешение маркетплейсу...');
      const isApproved = await nft.isApprovedForAll(account, marketplaceAddress);
      
      if (!isApproved) {
        console.log('⏳ Отправляем транзакцию approve...');
        const approveTx = await nft.setApprovalForAll(marketplaceAddress, true);
        await approveTx.wait();
        console.log('✅ Разрешение дано');
      } else {
        console.log('✅ Разрешение уже есть');
      }

      // 3. Пробуем разные способы вызова:
      
      // Способ A: Прямой вызов через основной контракт с правильным ABI
      console.log('🔄 Способ A: Прямой вызов...');
      const marketplaceABI = [
        "function createListing(tuple(address assetContract, uint256 tokenId, uint256 quantity, address currency, uint256 pricePerToken, uint128 startTimestamp, uint128 endTimestamp, bool reserved) _params) external returns (uint256 listingId)"
      ];
      
      const marketplace = new ethers.Contract(marketplaceAddress, marketplaceABI, signer);
      
      const listingParams = {
        assetContract: nftContract,
        tokenId: tokenId,
        quantity: 1,
        currency: PAYMENT_TOKEN.address,
        pricePerToken: ethers.parseUnits(price, 18),
        startTimestamp: Math.floor(Date.now() / 1000),
        endTimestamp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 30), // 30 дней
        reserved: false
      };

      console.log('📤 Параметры листинга:', listingParams);
      
      // Пробуем отправить с большим лимитом газа
      const tx = await marketplace.createListing(listingParams, {
        gasLimit: 500000 // Увеличиваем лимит газа
      });
      
      console.log('📫 Транзакция отправлена:', tx.hash);
      alert(`✅ Транзакция отправлена!\nХэш: ${tx.hash}\n\nЖдем подтверждения...`);
      
      const receipt = await tx.wait();
      console.log('🎉 Транзакция подтверждена:', receipt);
      
      alert(`🎉 NFT успешно выставлен на продажу за ${price} ${PAYMENT_TOKEN.symbol}!`);

      // Сброс формы
      setNftContract('');
      setTokenId('');
      setPrice('');

    } catch (error: any) {
      console.error('❌ Ошибка:', error);
      
      if (error.message?.includes('user rejected')) {
        alert('❌ Вы отменили транзакцию');
      } else if (error.message?.includes('insufficient funds')) {
        alert('❌ Недостаточно MATIC для комиссии');
      } else if (error.reason) {
        alert(`❌ Ошибка: ${error.reason}`);
      } else if (error.data?.message) {
        alert(`❌ Ошибка: ${error.data.message}`);
      } else {
        // Показываем более детальную информацию об ошибке
        alert(`❌ Транзакция не удалась. Возможные причины:\n\n1. Контракт требует вызов через определенный модуль\n2. Неправильные параметры функции\n3. Контракт не активирован\n\nПопробуйте через ThirdWeb Dashboard: https://thirdweb.com/`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>🎨 Продать NFT за {PAYMENT_TOKEN.symbol}</h2>
      
      {!account ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <button 
            onClick={connectWallet}
            style={{ 
              padding: '15px 30px', 
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '18px',
              cursor: 'pointer'
            }}
          >
            🔗 Подключить MetaMask
          </button>
        </div>
      ) : (
        <>
          <div style={{ background: '#d4edda', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <p>✅ <strong>Кошелек подключен:</strong> {account.slice(0, 6)}...{account.slice(-4)}</p>
            <p>🏪 <strong>Маркетплейс:</strong> {CONTRACT_ADDRESSES[137]?.slice(0, 10)}...</p>
            <p>💡 <strong>Статус:</strong> Контракт отвечает (1 листинг)</p>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Адрес контракта NFT:</label>
            <input
              type="text"
              placeholder="0x..."
              value={nftContract}
              onChange={(e) => setNftContract(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
            />
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ID токена:</label>
            <input
              type="number"
              placeholder="123"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Цена (в {PAYMENT_TOKEN.symbol}):</label>
            <input
              type="number"
              placeholder="100"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0"
              step="0.001"
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
            />
          </div>
          
          <button 
            onClick={createListing} 
            disabled={!nftContract || !tokenId || !price || loading}
            style={{ 
              width: '100%', 
              padding: '15px', 
              backgroundColor: (!nftContract || !tokenId || !price || loading) ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: (!nftContract || !tokenId || !price || loading) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Выставляем на продажу...' : `🎯 Выставить за ${price} ${PAYMENT_TOKEN.symbol}`}
          </button>

          <div style={{ marginTop: '20px', padding: '15px', background: '#fff3cd', borderRadius: '5px' }}>
            <h4 style={{ marginTop: 0 }}>💡 Рекомендация:</h4>
            <p>Если транзакция продолжает откатываться, попробуйте создать листинг через ThirdWeb Dashboard:</p>
            <a 
              href={`https://thirdweb.com/polygon/${CONTRACT_ADDRESSES[137]}/direct-listings`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#007bff', textDecoration: 'underline' }}
            >
              Открыть ThirdWeb Dashboard →
            </a>
          </div>
        </>
      )}
    </div>
  );
};

export default SellNFT;

