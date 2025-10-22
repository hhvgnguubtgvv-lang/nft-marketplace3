// Конфигурация маркетплейса
export const CONTRACT_ADDRESSES: { [key: number]: string } = {
  137: '0x0C8458221a2E4dDc5470aBc3dCa5378d4E971825', // Polygon Mainnet
  80001: '', // Mumbai Testnet
  31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3' // Localhost
};

export const PAYMENT_TOKEN = {
  address: '0xF50226FdA8c7020F45EED1c11aFf6bbbbc174b65',
  symbol: 'LEX',
  decimals: 18,
  name: 'LearningEXchange'
};

export const SUPPORTED_CHAINS = {
  137: 'Polygon Mainnet',
  80001: 'Polygon Mumbai Testnet',
  31337: 'Hardhat Local'
};

export const API_URL = 'http://localhost:3005/api';

export const RPC_URLS = {
  137: 'https://polygon-rpc.com',
  80001: 'https://rpc-mumbai.maticvigil.com'
};
