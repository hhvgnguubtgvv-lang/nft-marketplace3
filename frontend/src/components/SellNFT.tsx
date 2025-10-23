import React, { useState } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESSES, PAYMENT_TOKEN, NFT_CONTRACT } from '../utils/constants';
import { ERC721_ABI, MARKETPLACE_ABI } from '../utils/marketplaceABI';

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface SellNFTProps {
  onListingCreated?: () => void;
}

const SellNFT: React.FC<SellNFTProps> = ({ onListingCreated }) => {
  const [tokenId, setTokenId] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState('');
  const [status, setStatus] = useState<string>('');

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
      setStatus('✅ Кошелек подключен');
    } catch (error) {
      alert('Ошибка подключения кошелька: ' + error);
    }
  };

  const listNFT = async () => {
    if (!window.ethereum) {
      alert('MetaMask не установлен!');
      return;
    }

    if (!account) {
      alert('Сначала подключите кошелек!');
      return;
    }

    if (!tokenId || !price) {
      alert('Заполните все поля!');
      return;
    }

    // Проверяем что цена адекватная
    const priceNumber = parseFloat(price);
    if (priceNumber <= 0) {
      alert('Цена должна быть больше 0');
      return;
    }

    if (priceNumber > 1000000) {
      alert('Цена слишком большая');
      return;
    }

    setLoading(true);
    setStatus('🔄 Начинаем процесс листинга...');

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const marketplaceAddress = CONTRACT_ADDRESSES[137];
      
      // 1. Проверяем владение NFT
      setStatus('🔍 Проверяем владение NFT...');
      const nft = new ethers.Contract(NFT_CONTRACT, ERC721_ABI, signer);
      
      try {
        const owner = await nft.ownerOf(tokenId);
        if (owner.toLowerCase() !== account.toLowerCase()) {
          throw new Error(`Вы не владелец этого NFT! Владелец: ${owner}`);
        }
        setStatus('✅ Владение подтверждено');
      } catch (error: any) {
        if (error.message.includes('nonexistent token')) {
          throw new Error(`NFT с ID ${tokenId} не существует!`);
        }
        throw error;
      }

      // 2. Даем разрешение маркетплейсу
      setStatus('🔐 Даем разрешение маркетплейсу...');
      const isApproved = await nft.isApprovedForAll(account, marketplaceAddress);
      
      if (!isApproved) {
        setStatus('📝 Отправляем транзакцию разрешения...');
        const approveTx = await nft.setApprovalForAll(marketplaceAddress, true);
        setStatus(`⏳ Ждем подтверждения разрешения... ${approveTx.hash}`);
        await approveTx.wait();
        setStatus('✅ Разрешение подтверждено');
      } else {
        setStatus('✅ Разрешение уже есть');
      }

      // 3. Выставляем NFT на продажу
      setStatus('💰 Создаем листинг...');
      const marketplace = new ethers.Contract(marketplaceAddress, MARKETPLACE_ABI, signer);
      
      // Конвертируем цену в wei
      const priceInWei = ethers.parseUnits(price, PAYMENT_TOKEN.decimals);
      
      console.log('💰 Данные листинга:', {
        nftContract: NFT_CONTRACT,
        tokenId: tokenId,
        price: price,
        priceInWei: priceInWei.toString(),
        priceBack: ethers.formatUnits(priceInWei, PAYMENT_TOKEN.decimals)
      });

      setStatus(`📤 Отправляем транзакцию листинга...`);
      const listTx = await marketplace.listNFT(NFT_CONTRACT, tokenId, priceInWei, {
        gasLimit: 300000
      });
      
      setStatus(`⏳ Транзакция отправлена! Ждем подтверждения... ${listTx.hash}`);
      console.log('📫 Транзакция листинга:', listTx);
      
      // Ждем подтверждения
      const receipt = await listTx.wait();
      console.log('✅ Транзакция подтверждена:', receipt);
      
      setStatus('🎉 NFT успешно выставлен на продажу!');

      alert(`🎉 NFT выставлен на продажу!\n\n✅ Token ID: ${tokenId}\n💰 Цена: ${price} LEX\n\nТеперь он появится в разделе "Buy NFTs"`);

      // Сброс формы
      setTokenId('');
      setPrice('');

      // Уведомляем родительский компонент
      if (onListingCreated) {
        onListingCreated();
      }

    } catch (error: any) {
      console.error('❌ Ошибка:', error);
      setStatus(`❌ Ошибка: ${error.message}`);
      
      if (error.message?.includes('user rejected')) {
        alert('❌ Вы отменили транзакцию');
      } else if (error.message?.includes('insufficient funds')) {
        alert('❌ Недостаточно MATIC для комиссии');
      } else if (error.reason) {
        alert(`❌ Ошибка: ${error.reason}`);
      } else {
        alert(`❌ Ошибка: ${error.message || 'Неизвестная ошибка'}`);
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
            <p>🖼️ <strong>NFT Контракт:</strong> {NFT_CONTRACT.slice(0, 6)}...{NFT_CONTRACT.slice(-4)}</p>
            <p>💰 <strong>Токен оплаты:</strong> {PAYMENT_TOKEN.symbol}</p>
          </div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>ID токена NFT:</label>
            <input
              type="number"
              placeholder="1"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
            />
            <small style={{ color: '#666' }}>Введите ID NFT который хотите продать</small>
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Цена (в {PAYMENT_TOKEN.symbol}):</label>
            <input
              type="number"
              placeholder="100"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              min="0.001"
              step="0.001"
              style={{ width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
            />
            <small style={{ color: '#666' }}>Например: 100, 50.5, 0.1</small>
          </div>
          
          <button 
            onClick={listNFT} 
            disabled={!tokenId || !price || loading}
            style={{ 
              width: '100%', 
              padding: '15px', 
              backgroundColor: (!tokenId || !price || loading) ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              fontSize: '18px',
              fontWeight: 'bold',
              cursor: (!tokenId || !price || loading) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '⏳ Создаем листинг...' : `🎯 Выставить за ${price} ${PAYMENT_TOKEN.symbol}`}
          </button>

          {status && (
            <div style={{ 
              marginTop: '20px', 
              padding: '15px', 
              background: status.includes('❌') ? '#f8d7da' : 
                         status.includes('✅') ? '#d1ecf1' : 
                         status.includes('🎉') ? '#d4edda' : '#fff3cd',
              color: status.includes('❌') ? '#721c24' : 
                     status.includes('✅') ? '#0c5460' : 
                     status.includes('🎉') ? '#155724' : '#856404',
              borderRadius: '5px',
              textAlign: 'center',
              border: status.includes('❌') ? '1px solid #f5c6cb' : 
                      status.includes('✅') ? '1px solid #bee5eb' : 
                      status.includes('🎉') ? '1px solid #c3e6cb' : '1px solid #ffeaa7'
            }}>
              {status}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default SellNFT;

