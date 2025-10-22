import { ethers } from 'ethers';
import { web3Service } from './web3';
import { CONTRACT_ADDRESSES, PAYMENT_TOKEN } from './constants';
import { MARKETPLACE_ABI, ERC20_ABI, ERC721_ABI } from './contracts';

export const getMarketplaceContract = async (forWrite: boolean = false) => {
  const provider = web3Service.getProvider(forWrite);
  if (!provider) throw new Error('Provider not available');
  
  return new ethers.Contract(CONTRACT_ADDRESSES.polygon, MARKETPLACE_ABI, provider);
};

export const getPaymentTokenContract = async (forWrite: boolean = false) => {
  const provider = web3Service.getProvider(forWrite);
  if (!provider) throw new Error('Provider not available');
  
  return new ethers.Contract(PAYMENT_TOKEN.address, ERC20_ABI, provider);
};

export const getNFTContract = async (address: string, forWrite: boolean = false) => {
  const provider = web3Service.getProvider(forWrite);
  if (!provider) throw new Error('Provider not available');
  
  return new ethers.Contract(address, ERC721_ABI, provider);
};
