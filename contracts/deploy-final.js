const { ethers } = require('ethers');
require('dotenv').config(); // Добавляем эту строку!

async function main() {
  // Настройки - теперь читаем из process.env
  const RPC_URL = process.env.MUMBAI_RPC_URL || 'https://polygon-mumbai-bor.publicnode.com';
  const PRIVATE_KEY = process.env.PRIVATE_KEY;
  const PAYMENT_TOKEN = process.env.PAYMENT_TOKEN_ADDRESS;

  console.log('PRIVATE_KEY from env:', PRIVATE_KEY ? '***' + PRIVATE_KEY.slice(-6) : 'Not set');
  console.log('PAYMENT_TOKEN from env:', PAYMENT_TOKEN || 'Not set');

  if (!PRIVATE_KEY) {
    console.error('❌ Установите PRIVATE_KEY в .env файле');
    console.log('Текущий .env файл:');
    const fs = require('fs');
    if (fs.existsSync('.env')) {
      console.log(fs.readFileSync('.env', 'utf8'));
    }
    process.exit(1);
  }

  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  
  console.log('👛 Деплой от:', wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log('💰 Баланс:', ethers.formatEther(balance), 'MATIC');
  
  if (balance === 0n) {
    console.log('❌ Недостаточно MATIC для газа. Получите test MATIC:');
    console.log('https://faucet.polygon.technology/');
    process.exit(1);
  }

  // Остальной код деплоя...
  console.log('🚀 Запускаем деплой...');
}

main().catch(console.error);
