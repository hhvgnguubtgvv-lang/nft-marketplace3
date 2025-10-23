// Конфигурация маркетплейса
export const CONTRACT_ADDRESSES: { [key: number]: string } = {
  137: '0x4f26e1fb61e9d3912aac508134e48a4cb3eed284', // Ваш маркетплейс Polygon Mainnet
  80001: '', // Mumbai Testnet
  31337: '0x5FbDB2315678afecb367f032d93F642f64180aa3' // Localhost
};

export const NFT_CONTRACT_ADDRESSES: { [key: number]: string } = {
  137: '0x97401Af899150864C11baEe542397c087E405889', // Ваш NFT контракт
  80001: '',
  31337: ''
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

export const API_URL = 'https://your-api-domain.com/api';

export const RPC_URLS = {
  137: 'https://polygon-rpc.com',
  80001: 'https://rpc-mumbai.maticvigil.com'
};

// Для обратной совместимости
export const NFT_CONTRACT = NFT_CONTRACT_ADDRESSES[137];
