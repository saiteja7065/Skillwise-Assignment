import React, { useState, useEffect } from 'react';
import { getProductHistory } from '../services/api';
import '../styles/InventoryHistorySidebar.css';

const InventoryHistorySidebar = ({ productId, productName, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getProductHistory(productId);
      setHistory(response.data.history || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError('Failed to load inventory history');
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchHistory();
    }
  }, [productId, fetchHistory]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChangeIndicator = (oldQty, newQty) => {
    const diff = newQty - oldQty;
    if (diff > 0) {
      return { symbol: '↑', class: 'increase', text: `+${diff}` };
    } else if (diff < 0) {
      return { symbol: '↓', class: 'decrease', text: `${diff}` };
    }
    return { symbol: '=', class: 'no-change', text: '0' };
  };

  return (
    <div className="sidebar-overlay" onClick={onClose}>
      <div className="sidebar" onClick={(e) => e.stopPropagation()}>
        <div className="sidebar-header">
          <div>
            <h2>Inventory History</h2>
            <p className="product-name">{productName}</p>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="sidebar-content">
          {loading && (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading history...</p>
            </div>
          )}

          {error && (
            <div className="error-state">
              <p>{error}</p>
              <button className="retry-btn" onClick={fetchHistory}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="empty-state">
              <p>No inventory changes recorded yet.</p>
            </div>
          )}

          {!loading && !error && history.length > 0 && (
            <div className="history-list">
              {history.map((entry) => {
                const change = getChangeIndicator(entry.old_quantity, entry.new_quantity);
                return (
                  <div key={entry.id} className="history-item">
                    <div className="history-item-header">
                      <span className="history-date">{formatDate(entry.change_date)}</span>
                      <span className={`change-badge ${change.class}`}>
                        {change.symbol} {change.text}
                      </span>
                    </div>
                    <div className="history-item-body">
                      <div className="quantity-change">
                        <div className="quantity-box old">
                          <span className="label">Old Stock</span>
                          <span className="value">{entry.old_quantity}</span>
                        </div>
                        <div className="arrow">→</div>
                        <div className="quantity-box new">
                          <span className="label">New Stock</span>
                          <span className="value">{entry.new_quantity}</span>
                        </div>
                      </div>
                      {entry.user_info && (
                        <div className="user-info">
                          <span className="label">Changed by:</span>
                          <span className="value">{entry.user_info}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryHistorySidebar;
