import { ethers } from 'ethers';
import { SUPPORTED_CHAINS, RPC_URLS } from './constants';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class Web3Service {
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private readProvider: ethers.JsonRpcProvider | null = null;

  async connectWallet() {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Создаем read provider для чтения данных (без ENS ошибок)
      this.readProvider = new ethers.JsonRpcProvider('https://polygon-rpc.com');
      
      // Создаем write provider для транзакций
      this.provider = new ethers.BrowserProvider(window.ethereum);
      this.signer = await this.provider.getSigner();
      
      const network = await this.provider.getNetwork();
      const chainId = Number(network.chainId);
      
      if (!SUPPORTED_CHAINS[chainId as keyof typeof SUPPORTED_CHAINS]) {
        await this.switchToPolygon();
      }
      
      return await this.getAccount();
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  async switchToPolygon() {
    if (!window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x89' }], // Polygon Mainnet
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x89',
              chainName: 'Polygon Mainnet',
              nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
              },
              rpcUrls: ['https://polygon-rpc.com'],
              blockExplorerUrls: ['https://polygonscan.com/']
            }]
          });
        } catch (addError) {
          console.error('Error adding Polygon network:', addError);
        }
      }
    }
  }

  async getAccount() {
    if (!this.signer) return '';
    return await this.signer.getAddress();
  }

  async getChainId() {
    if (!this.provider) return 0;
    const network = await this.provider.getNetwork();
    return Number(network.chainId);
  }

  // Для чтения данных используем read provider (без ENS ошибок)
  getReadProvider() {
    if (!this.readProvider) {
      this.readProvider = new ethers.JsonRpcProvider('https://polygon-rpc.com');
    }
    return this.readProvider;
  }

  // Для транзакций используем signer
  getSigner() {
    return this.signer;
  }

  // Универсальный метод для получения провайдера
  getProvider(forWrite: boolean = false) {
    return forWrite ? this.signer : this.getReadProvider();
  }

  async disconnect() {
    this.provider = null;
    this.signer = null;
    this.readProvider = null;
  }
}

export const web3Service = new Web3Service();
