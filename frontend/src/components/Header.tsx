import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3 } from '../hooks/useWeb3';
import { SUPPORTED_CHAINS, PAYMENT_TOKEN } from '../utils/constants';
import { ERC20_ABI } from '../utils/contracts';

const Header: React.FC = () => {
  const { account, chainId, isConnected, connectWallet, disconnectWallet } = useWeb3();
  const [tokenBalance, setTokenBalance] = useState('0');

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnectClick = () => {
    if (typeof window.ethereum === 'undefined') {
      alert('MetaMask is not installed! Please install MetaMask to use this marketplace.');
      window.open('https://metamask.io/download/', '_blank');
    } else {
      connectWallet();
    }
  };

  const getTestTokens = async () => {
    if (!window.ethereum || !account) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const erc20 = new ethers.Contract(PAYMENT_TOKEN.address, ERC20_ABI, signer);
      
      // Проверяем есть ли функция mint
      const tx = await erc20.mint(account, ethers.parseEther("1000"));
      await tx.wait();
      alert(`Received 1000 ${PAYMENT_TOKEN.symbol}!`);
      
      // Обновляем баланс
      const balance = await erc20.balanceOf(account);
      setTokenBalance(ethers.formatEther(balance));
    } catch (error: any) {
      console.error('Error getting test tokens:', error);
      if (error.message.includes('mint')) {
        alert(`Token doesn't have mint function. Use existing ${PAYMENT_TOKEN.symbol} tokens.`);
      } else {
        alert('Error getting test tokens');
      }
    }
  };

  useEffect(() => {
    const fetchBalance = async () => {
      if (isConnected && account && window.ethereum) {
        try {
          const provider = new ethers.BrowserProvider(window.ethereum);
          const erc20 = new ethers.Contract(PAYMENT_TOKEN.address, ERC20_ABI, provider);
          const balance = await erc20.balanceOf(account);
          setTokenBalance(ethers.formatEther(balance));
        } catch (error) {
          console.error('Error fetching token balance:', error);
        }
      }
    };

    fetchBalance();
  }, [isConnected, account]);

  return (
    <header className="header">
      <div className="header-content">
        <h1>🎨 NFT Marketplace</h1>
        
        <div className="wallet-info">
          {isConnected ? (
            <div className="connected-wallet">
              <span className="network-badge">
                {SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS] || 'Unknown Network'}
              </span>
              <span className="token-balance">
                {tokenBalance} {PAYMENT_TOKEN.symbol}
              </span>
              <span className="address">{formatAddress(account)}</span>
              <button onClick={getTestTokens} className="get-tokens-btn">
                Get Test {PAYMENT_TOKEN.symbol}
              </button>
              <button onClick={disconnectWallet} className="disconnect-btn">
                Disconnect
              </button>
            </div>
          ) : (
            <button onClick={handleConnectClick} className="connect-btn">
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
