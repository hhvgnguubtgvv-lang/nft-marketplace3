import React, { useState } from 'react';
import { useWeb3 } from './hooks/useWeb3';
import { SUPPORTED_CHAINS } from './utils/constants';
import Header from './components/Header';
import NFTList from './components/NFTList';
import SellNFT from './components/SellNFT';
import './styles/App.css';
import './styles/components.css';

function App() {
  const { account, chainId, isConnected } = useWeb3();
  const [activeTab, setActiveTab] = useState<'browse' | 'sell'>('browse');

  const isSupportedNetwork = chainId in SUPPORTED_CHAINS;

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
                  <li>ERC20 tokens for purchases</li>
                </ul>
              </div>
            </div>
          </div>
        ) : !isSupportedNetwork ? (
          <div className="network-warning">
            <h2>Unsupported Network</h2>
            <p>Please switch to Polygon Mainnet or Mumbai Testnet</p>
            <p>Current network: {chainId}</p>
          </div>
        ) : (
          <>
            <nav className="app-tabs">
              <button 
                className={`tab-button ${activeTab === 'browse' ? 'active' : ''}`}
                onClick={() => setActiveTab('browse')}
              >
                🏠 Browse NFTs
              </button>
              <button 
                className={`tab-button ${activeTab === 'sell' ? 'active' : ''}`}
                onClick={() => setActiveTab('sell')}
              >
                💰 Sell NFT
              </button>
            </nav>

            <div className="tab-content">
              {activeTab === 'browse' ? <NFTList /> : <SellNFT />}
            </div>
          </>
        )}
      </main>

      <footer className="app-footer">
        <p>NFT Marketplace • Built on Polygon • For demonstration purposes</p>
      </footer>
    </div>
  );
}

export default App;
