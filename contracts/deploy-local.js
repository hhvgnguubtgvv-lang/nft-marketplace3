const { ethers } = require('ethers');
require('dotenv').config();

async function main() {
  // Используем локальную сеть Hardhat
  const RPC_URL = 'http://localhost:8545';
  const PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'; // Hardhat test key
  const PAYMENT_TOKEN = process.env.PAYMENT_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('👛 Деплой от:', wallet.address);
  console.log('💰 Баланс:', ethers.formatEther(await provider.getBalance(wallet.address)), 'ETH');
  
  console.log('✅ Локальная сеть работает!');
  console.log('📝 Для продакшена нужно:');
  console.log('1. Починить интернет соединение');
  console.log('2. Использовать рабочий RPC URL');
  console.log('3. Деплоить в Mumbai testnet');
}

main().catch(console.error);
