// components/offer/PriceMatrix.js
// Shows all lens options filtered by vision type, index, brand line, add-on price

import { useState, useMemo } from 'react';
import { Filter, Search, TrendingUp, Eye } from 'lucide-react';
import LensComparison from './LensComparison';
import styles from './PriceMatrix.module.css';

export default function PriceMatrix({ lenses = [], onSelectLens, className = '' }) {
  const [filters, setFilters] = useState({
    visionType: '',
    index: '',
    brandLine: '',
    maxAddOnPrice: '',
    search: ''
  });

  const filteredLenses = useMemo(() => {
    return lenses.filter(lens => {
      if (filters.visionType && lens.visionType !== filters.visionType) return false;
      if (filters.index && lens.index !== parseFloat(filters.index)) return false;
      if (filters.brandLine && lens.brandLine !== filters.brandLine) return false;
      if (filters.maxAddOnPrice && (lens.addOnPrice || 0) > parseFloat(filters.maxAddOnPrice)) return false;
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          (lens.name && lens.name.toLowerCase().includes(searchLower)) ||
          (lens.itCode && lens.itCode.toLowerCase().includes(searchLower)) ||
          (lens.brandLine && lens.brandLine.toLowerCase().includes(searchLower));
        if (!matchesSearch) return false;
      }
      return true;
    });
  }, [lenses, filters]);

  const uniqueValues = useMemo(() => {
    return {
      visionTypes: [...new Set(lenses.map(l => l.visionType).filter(Boolean))],
      indices: [...new Set(lenses.map(l => l.index).filter(Boolean))].sort((a, b) => a - b),
      brandLines: [...new Set(lenses.map(l => l.brandLine).filter(Boolean))].sort()
    };
  }, [lenses]);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      visionType: '',
      index: '',
      brandLine: '',
      maxAddOnPrice: '',
      search: ''
    });
  };

  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.header}>
        <h2 className={styles.title}>Lens Price Matrix</h2>
        <p className={styles.subtitle}>Compare all available lens options</p>
      </div>

      {/* Filters */}
      <div className={styles.filters}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Search</label>
            <div className={styles.searchInput}>
              <Search className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search by name, code, or brand..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className={styles.input}
              />
            </div>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Vision Type</label>
            <select
              value={filters.visionType}
              onChange={(e) => updateFilter('visionType', e.target.value)}
              className={styles.select}
            >
              <option value="">All Types</option>
              {uniqueValues.visionTypes.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Index</label>
            <select
              value={filters.index}
              onChange={(e) => updateFilter('index', e.target.value)}
              className={styles.select}
            >
              <option value="">All Indices</option>
              {uniqueValues.indices.map(index => (
                <option key={index} value={index}>{index}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Brand Line</label>
            <select
              value={filters.brandLine}
              onChange={(e) => updateFilter('brandLine', e.target.value)}
              className={styles.select}
            >
              <option value="">All Brands</option>
              {uniqueValues.brandLines.map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Max Add-on Price</label>
            <input
              type="number"
              placeholder="₹0"
              value={filters.maxAddOnPrice}
              onChange={(e) => updateFilter('maxAddOnPrice', e.target.value)}
              className={styles.input}
            />
          </div>

          <button onClick={clearFilters} className={styles.clearButton}>
            Clear Filters
          </button>
        </div>
      </div>

      {/* Results Count */}
      <div className={styles.resultsInfo}>
        <span>
          Showing {filteredLenses.length} of {lenses.length} lenses
        </span>
      </div>

      {/* Lens Grid */}
      {filteredLenses.length === 0 ? (
        <div className={styles.empty}>
          <Eye className={styles.emptyIcon} />
          <p>No lenses found matching your filters</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {filteredLenses.map((lens, index) => (
            <div key={lens.id || lens.itCode || index} className={styles.lensCard}>
              <LensComparison lens={lens} />
              {onSelectLens && (
                <button
                  onClick={() => onSelectLens(lens)}
                  className={styles.selectButton}
                >
                  Select This Lens
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

