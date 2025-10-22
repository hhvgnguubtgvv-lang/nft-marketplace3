import express from 'express';
import cors from 'cors';
import { ethers } from 'ethers';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Polygon RPC configuration
const POLYGON_RPC = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
const provider = new ethers.JsonRpcProvider(POLYGON_RPC);

// Cache for metadata
const metadataCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Utility function to fetch with cache
async function fetchWithCache(key, fetchFunction) {
  const cached = metadataCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const data = await fetchFunction();
  metadataCache.set(key, {
    data,
    timestamp: Date.now()
  });

  return data;
}

// ERC721 ABI for metadata
const ERC721_ABI = [
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)"
];

// API Routes

// Get NFT metadata
app.get('/api/nft/metadata/:contractAddress/:tokenId', async (req, res) => {
  const { contractAddress, tokenId } = req.params;

  try {
    const cacheKey = `metadata-${contractAddress}-${tokenId}`;
    
    const metadata = await fetchWithCache(cacheKey, async () => {
      const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
      
      let tokenURI;
      try {
        tokenURI = await contract.tokenURI(tokenId);
      } catch (error) {
        console.error('Error fetching tokenURI:', error);
        return {
          name: `NFT #${tokenId}`,
          description: 'No description available',
          image: 'https://via.placeholder.com/400x400?text=NFT+Image+Not+Found'
        };
      }

      // Handle IPFS and HTTP URLs
      let metadataUrl = tokenURI;
      if (tokenURI.startsWith('ipfs://')) {
        const ipfsHash = tokenURI.replace('ipfs://', '');
        metadataUrl = `https://ipfs.io/ipfs/${ipfsHash}`;
      }

      try {
        const response = await fetch(metadataUrl);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const metadata = await response.json();
        
        // Ensure image URL is properly formatted
        if (metadata.image) {
          if (metadata.image.startsWith('ipfs://')) {
            const ipfsHash = metadata.image.replace('ipfs://', '');
            metadata.image = `https://ipfs.io/ipfs/${ipfsHash}`;
          }
        }

        return metadata;
      } catch (fetchError) {
        console.error('Error fetching metadata from URI:', fetchError);
        return {
          name: `NFT #${tokenId}`,
          description: 'Metadata not available',
          image: 'https://via.placeholder.com/400x400?text=Metadata+Unavailable'
        };
      }
    });

    res.json(metadata);
  } catch (error) {
    console.error('Error in metadata endpoint:', error);
    res.status(500).json({ 
      error: 'Failed to fetch NFT metadata',
      details: error.message 
    });
  }
});

// Search NFTs endpoint
app.get('/api/nft/search', async (req, res) => {
  const {
    priceMin,
    priceMax,
    collection,
    seller,
    tokenId,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = req.query;

  try {
    // In a real implementation, you would query your database or indexer
    // For now, return mock data with real metadata
    const mockListings = [
      {
        listingId: 1,
        seller: '0x742E4C2F4C7c2B8Ee6F2d8e8e8e8e8e8e8e8e8e8',
        nftContract: '0x8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8',
        tokenId: 1,
        price: '100',
        active: true,
        createdAt: Date.now() - 1000000
      }
    ];

    // Filter logic would go here
    let filtered = mockListings;

    // Sort logic
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'price':
          aValue = parseFloat(a.price);
          bValue = parseFloat(b.price);
          break;
        case 'createdAt':
        default:
          aValue = a.createdAt;
          bValue = b.createdAt;
      }

      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
    });

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = filtered.slice(startIndex, endIndex);

    // Fetch metadata for each NFT
    const listingsWithMetadata = await Promise.all(
      paginatedResults.map(async (listing) => {
        try {
          const metadataResponse = await fetch(`http://localhost:${PORT}/api/nft/metadata/${listing.nftContract}/${listing.tokenId}`);
          const metadata = await metadataResponse.json();
          
          return {
            ...listing,
            metadata
          };
        } catch (error) {
          console.error('Error fetching metadata for listing:', listing.listingId, error);
          return listing;
        }
      })
    );

    res.json({
      listings: listingsWithMetadata,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / limit)
      }
    });
  } catch (error) {
    console.error('Error in search endpoint:', error);
    res.status(500).json({ 
      error: 'Search failed',
      details: error.message 
    });
  }
});

// Get collection info
app.get('/api/collection/:contractAddress', async (req, res) => {
  const { contractAddress } = req.params;

  try {
    const contract = new ethers.Contract(contractAddress, ERC721_ABI, provider);
    
    const [name, symbol] = await Promise.all([
      contract.name(),
      contract.symbol()
    ]);

    res.json({
      address: contractAddress,
      name,
      symbol
    });
  } catch (error) {
    console.error('Error fetching collection info:', error);
    res.status(500).json({ 
      error: 'Failed to fetch collection information',
      details: error.message 
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    network: 'Polygon'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: error.message 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
  console.log(`Polygon RPC: ${POLYGON_RPC}`);
});