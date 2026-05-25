import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { STREETS, COMMUNITIES } from '../../config';

interface FiltersProps {
  onFilterChange?: (filters: any) => void;
}

export const Filters: React.FC<FiltersProps> = ({ onFilterChange }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [selectedStreet, setSelectedStreet] = useState(user?.region || '');
  const [selectedCommunity, setSelectedCommunity] = useState('');
  const [availableCommunities, setAvailableCommunities] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [trapDateRange, setTrapDateRange] = useState({ start: '', end: '' });
  const [generalDateRange, setGeneralDateRange] = useState({ start: '', end: '' });
  const [enabledTypes, setEnabledTypes] = useState({
    case: true,
    water: true,
    blackspot: true,
    adult: true,
    trap: true,
  });
  const [enableRings, setEnableRings] = useState({
    core: true,
    warning: true,
    monitoring: true,
  });

  useEffect(() => {
    if (selectedStreet) {
      setAvailableCommunities(COMMUNITIES[selectedStreet] || []);
    } else {
      setAvailableCommunities([]);
    }
  }, [selectedStreet]);

  const handleTypeToggle = (type: keyof typeof enabledTypes) => {
    setEnabledTypes(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleRingToggle = (ring: keyof typeof enableRings) => {
    setEnableRings(prev => ({ ...prev, [ring]: !prev[ring] }));
  };

  const applyFilters = () => {
    const filters = {
      street: selectedStreet,
      community: selectedCommunity,
      dateRange: dateRange.start ? dateRange : undefined,
      trapDateRange: trapDateRange.start ? trapDateRange : undefined,
      generalDateRange: generalDateRange.start ? generalDateRange : undefined,
      enabledTypes,
      enableRings,
    };
    onFilterChange?.(filters);
  };

  return (
    <div className="filters-container">
      <div className="filter-group">
        <label>街道</label>
        <select
          value={selectedStreet}
          onChange={(e) => setSelectedStreet(e.target.value)}
          disabled={!isAdmin}
        >
          <option value="">全部街道</option>
          {STREETS.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label>居委会</label>
        <select
          value={selectedCommunity}
          onChange={(e) => setSelectedCommunity(e.target.value)}
          disabled={!selectedStreet}
        >
          <option value="">全部居委会</option>
          {availableCommunities.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>

      <div className="filter-group">
        <label>发病日期范围</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="date" value={dateRange.start} onChange={e => setDateRange({ ...dateRange, start: e.target.value })} />
          <span>~</span>
          <input type="date" value={dateRange.end} onChange={e => setDateRange({ ...dateRange, end: e.target.value })} />
        </div>
      </div>

      <div className="filter-group">
        <label>诱蚊诱卵器日期范围</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="date" value={trapDateRange.start} onChange={e => setTrapDateRange({ ...trapDateRange, start: e.target.value })} />
          <span>~</span>
          <input type="date" value={trapDateRange.end} onChange={e => setTrapDateRange({ ...trapDateRange, end: e.target.value })} />
        </div>
      </div>

      <div className="filter-group">
        <label>积水/黑点/成蚊日期范围</label>
        <div style={{ display: 'flex', gap: 8 }}>
          <input type="date" value={generalDateRange.start} onChange={e => setGeneralDateRange({ ...generalDateRange, start: e.target.value })} />
          <span>~</span>
          <input type="date" value={generalDateRange.end} onChange={e => setGeneralDateRange({ ...generalDateRange, end: e.target.value })} />
        </div>
      </div>

      <div className="filter-group">
        <label>标记类型显隐</label>
        <div className="type-toggles">
          {Object.entries(enabledTypes).map(([key, val]) => (
            <button key={key} className={`type-btn ${val ? 'active' : ''}`} onClick={() => handleTypeToggle(key as any)}>
              {key === 'case' ? '病例' : key === 'water' ? '积水' : key === 'blackspot' ? '黑点' : key === 'adult' ? '成蚊' : '诱卵器'}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <label>防控圈显隐</label>
        <div className="ring-toggles">
          <button className={`ring-btn ${enableRings.core ? 'active' : ''}`} onClick={() => handleRingToggle('core')}>核心区</button>
          <button className={`ring-btn ${enableRings.warning ? 'active' : ''}`} onClick={() => handleRingToggle('warning')}>警戒区</button>
          <button className={`ring-btn ${enableRings.monitoring ? 'active' : ''}`} onClick={() => handleRingToggle('monitoring')}>监控区</button>
        </div>
      </div>

      <button className="apply-btn" onClick={applyFilters}>应用筛选</button>
    </div>
  );
};