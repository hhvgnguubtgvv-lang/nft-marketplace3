const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying NFT Marketplace...");
  
  // Замените на адрес вашего ERC20 токена
  const paymentTokenAddress = process.env.PAYMENT_TOKEN_ADDRESS || "0xF50226FdA8c7020F45EED1c11aFf6bbbbc174b65";
  
  if (paymentTokenAddress === "0x...") {
    console.error("Please set PAYMENT_TOKEN_ADDRESS in .env file");
    process.exit(1);
  }

  const Marketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await Marketplace.deploy(paymentTokenAddress);
  
  await marketplace.waitForDeployment();
  
  console.log("NFT Marketplace deployed to:", await marketplace.getAddress());
  console.log("Payment token:", paymentTokenAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});