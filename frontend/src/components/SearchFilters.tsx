import React from 'react';
import { SearchFilters as SearchFiltersType } from '../types';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
}

const SearchFiltersComponent: React.FC<SearchFiltersProps> = ({ filters, onFiltersChange }) => {
  const handleChange = (key: keyof SearchFiltersType, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      priceMin: '',
      priceMax: '',
      collection: '',
      seller: '',
      tokenId: '',
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  return (
    <div className="search-filters">
      <h3>🔍 Search Filters</h3>
      
      <div className="filters-grid">
        <div className="filter-group">
          <label>Price Range</label>
          <div className="price-range">
            <input
              type="number"
              placeholder="Min Price"
              value={filters.priceMin}
              onChange={(e) => handleChange('priceMin', e.target.value)}
            />
            <span>to</span>
            <input
              type="number"
              placeholder="Max Price"
              value={filters.priceMax}
              onChange={(e) => handleChange('priceMax', e.target.value)}
            />
          </div>
        </div>

        <div className="filter-group">
          <label>Collection Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={filters.collection}
            onChange={(e) => handleChange('collection', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Seller Address</label>
          <input
            type="text"
            placeholder="0x..."
            value={filters.seller}
            onChange={(e) => handleChange('seller', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Token ID</label>
          <input
            type="text"
            placeholder="123"
            value={filters.tokenId}
            onChange={(e) => handleChange('tokenId', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label>Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleChange('sortBy', e.target.value)}
          >
            <option value="date">Date Listed</option>
            <option value="price">Price</option>
            <option value="name">Name</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Order</label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleChange('sortOrder', e.target.value)}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>
      </div>

      <button onClick={clearFilters} className="clear-filters-btn">
        Clear All Filters
      </button>
    </div>
  );
};

export default SearchFiltersComponent;
