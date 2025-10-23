import React, { useState } from 'react';
import { useWeb3 } from './hooks/useWeb3';
import { SUPPORTED_CHAINS } from './utils/constants';
import Header from './components/Header';
import SellNFT from './components/SellNFT';
import BuyNFT from './components/BuyNFT';
import './styles/App.css';
import './styles/components.css';

function App() {
  const { account, chainId, isConnected } = useWeb3();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [refreshBuyKey, setRefreshBuyKey] = useState(0);

  const isSupportedNetwork = chainId in SUPPORTED_CHAINS;

  const handleListingCreated = () => {
    console.log('🎉 Новый листинг создан!');
    
    // Обновляем компонент BuyNFT
    setRefreshBuyKey(prev => prev + 1);
    
    // Автоматически переключаем на вкладку покупок
    setActiveTab('buy');
  };

  return (
    <div className="App">
      <Header />
      
      <main className="main-content">
        {!isConnected ? (
          <div className="connect-prompt">
            <div className="prompt-card">
              <h2>Welcome to NFT Marketplace</h2>
              <p>Connect your wallet to start trading NFTs on Polygon</p>
              <div className="requirements">
                <h4>Requirements:</h4>
                <ul>
                  <li>MetaMask wallet</li>
                  <li>MATIC for gas fees</li>
                  <li>LEX tokens for trading</li>
                </ul>
              </div>
            </div>
          </div>
        ) : !isSupportedNetwork ? (
          <div className="network-warning">
            <h2>Unsupported Network</h2>
            <p>Please switch to Polygon Mainnet</p>
            <p>Current network: {chainId}</p>
          </div>
        ) : (
          <>
            <nav className="app-tabs">
              <button 
                className={`tab-button ${activeTab === 'buy' ? 'active' : ''}`}
                onClick={() => setActiveTab('buy')}
              >
                🛒 Buy NFTs
              </button>
              <button 
                className={`tab-button ${activeTab === 'sell' ? 'active' : ''}`}
                onClick={() => setActiveTab('sell')}
              >
                💰 Sell NFT
              </button>
            </nav>

            <div className="tab-content">
              {activeTab === 'buy' ? (
                <BuyNFT key={refreshBuyKey} />
              ) : (
                <SellNFT onListingCreated={handleListingCreated} />
              )}
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>NFT Marketplace • Built on Polygon • Trading with LEX tokens</p>
      </footer>
    </div>
  );
}

export default App;