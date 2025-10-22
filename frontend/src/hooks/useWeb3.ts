import { useState, useEffect } from 'react';
import { web3Service } from '../utils/web3';
import { Web3State } from '../types';

export const useWeb3 = () => {
  const [web3State, setWeb3State] = useState<Web3State>({
    provider: null,
    signer: null,
    account: '',
    chainId: 0,
    isConnected: false
  });

  const connectWallet = async () => {
    try {
      const account = await web3Service.connectWallet();
      const provider = web3Service.getProvider();
      const signer = web3Service.getSigner();
      const chainId = await web3Service.getChainId();

      setWeb3State({
        provider,
        signer,
        account,
        chainId,
        isConnected: true
      });

      // Listen for account changes
      window.ethereum?.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setWeb3State(prev => ({ ...prev, account: accounts[0] }));
        }
      });

      // Listen for chain changes
      window.ethereum?.on('chainChanged', (chainId: string) => {
        window.location.reload();
      });

    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  };

  const disconnectWallet = () => {
    web3Service.disconnect();
    setWeb3State({
      provider: null,
      signer: null,
      account: '',
      chainId: 0,
      isConnected: false
    });
  };

  useEffect(() => {
    // Check if wallet is already connected
    const checkConnection = async () => {
      if (window.ethereum?.selectedAddress) {
        try {
          await connectWallet();
        } catch (error) {
          console.error('Error reconnecting wallet:', error);
        }
      }
    };

    checkConnection();
  }, []);

  return { ...web3State, connectWallet, disconnectWallet };
};