const { ethers } = require('ethers');

async function testRPC(url, name) {
  try {
    console.log(`\n🔍 Тестируем ${name}...`);
    const provider = new ethers.JsonRpcProvider(url);
    const network = await provider.getNetwork();
    console.log(`✅ ${name} работает! Chain ID: ${network.chainId}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} не работает: ${error.message}`);
    return false;
  }
}

async function main() {
  const rpcList = [
    { url: 'https://polygon-mumbai-bor.publicnode.com', name: 'PublicNode' },
    { url: 'https://rpc.ankr.com/polygon_mumbai', name: 'Ankr' },
    { url: 'https://matic-mumbai.chainstacklabs.com', name: 'Chainstack' },
    { url: 'https://rpc-mumbai.maticvigil.com', name: 'MaticVigil' }
  ];

  for (const rpc of rpcList) {
    await testRPC(rpc.url, rpc.name);
  }
}

main();
