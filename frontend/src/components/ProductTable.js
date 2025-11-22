import React, { useState } from 'react';
import { updateProduct, deleteProduct } from '../services/api';
import InventoryHistorySidebar from './InventoryHistorySidebar';
import '../styles/ProductTable.css';

const ProductTable = ({ products, onProductUpdate, onProductDelete }) => {
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  if (products.length === 0) {
    return <div className="no-products">No products found</div>;
  }

  const getStockStatus = (stock) => {
    return stock > 0 ? 'In Stock' : 'Out of Stock';
  };

  const getStockStatusClass = (stock) => {
    return stock > 0 ? 'status-in-stock' : 'status-out-of-stock';
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setEditForm({ ...product });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleChange = (field, value) => {
    setEditForm({
      ...editForm,
      [field]: value,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Validate stock is a number
      const stock = parseInt(editForm.stock);
      if (isNaN(stock) || stock < 0) {
        alert('Stock must be a valid number >= 0');
        return;
      }

      // Validate required fields
      if (!editForm.name || !editForm.name.trim()) {
        alert('Product name is required');
        return;
      }

      const updatedData = {
        ...editForm,
        stock: stock,
      };

      await updateProduct(editingId, updatedData);
      
      setEditingId(null);
      setEditForm({});
      
      // Refresh product list
      if (onProductUpdate) {
        onProductUpdate();
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Failed to update product: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (product) => {
    if (!window.confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    try {
      await deleteProduct(product.id);
      
      // Refresh product list
      if (onProductDelete) {
        onProductDelete();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleViewHistory = (product) => {
    setSelectedProduct(product);
  };

  const handleCloseSidebar = () => {
    setSelectedProduct(null);
  };

  const renderRow = (product) => {
    const isEditing = editingId === product.id;

    if (isEditing) {
      return (
        <tr key={product.id} className="editing-row">
          <td>
            <input
              type="text"
              value={editForm.image || ''}
              onChange={(e) => handleChange('image', e.target.value)}
              className="edit-input"
              placeholder="Image URL"
            />
          </td>
          <td>
            <input
              type="text"
              value={editForm.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="edit-input"
              placeholder="Name"
              required
            />
          </td>
          <td>
            <input
              type="text"
              value={editForm.unit || ''}
              onChange={(e) => handleChange('unit', e.target.value)}
              className="edit-input"
              placeholder="Unit"
            />
          </td>
          <td>
            <input
              type="text"
              value={editForm.category || ''}
              onChange={(e) => handleChange('category', e.target.value)}
              className="edit-input"
              placeholder="Category"
            />
          </td>
          <td>
            <input
              type="text"
              value={editForm.brand || ''}
              onChange={(e) => handleChange('brand', e.target.value)}
              className="edit-input"
              placeholder="Brand"
            />
          </td>
          <td>
            <input
              type="number"
              value={editForm.stock || 0}
              onChange={(e) => handleChange('stock', e.target.value)}
              className="edit-input"
              min="0"
              required
            />
          </td>
          <td>
            <input
              type="text"
              value={editForm.status || ''}
              onChange={(e) => handleChange('status', e.target.value)}
              className="edit-input"
              placeholder="Status"
            />
          </td>
          <td className="action-buttons">
            <button
              className="btn-action btn-save"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              className="btn-action btn-cancel"
              onClick={handleCancel}
              disabled={saving}
            >
              Cancel
            </button>
          </td>
        </tr>
      );
    }

    return (
      <tr key={product.id}>
        <td>
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="product-image"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/50?text=No+Image';
              }}
            />
          ) : (
            <div className="no-image">No Image</div>
          )}
        </td>
        <td>{product.name}</td>
        <td>{product.unit}</td>
        <td>{product.category}</td>
        <td>{product.brand}</td>
        <td>{product.stock}</td>
        <td>
          <span className={`status-badge ${getStockStatusClass(product.stock)}`}>
            {getStockStatus(product.stock)}
          </span>
        </td>
        <td className="action-buttons">
          <button
            className="btn-action btn-edit"
            onClick={() => handleEdit(product)}
          >
            Edit
          </button>
          <button
            className="btn-action btn-delete"
            onClick={() => handleDelete(product)}
          >
            Delete
          </button>
          <button
            className="btn-action btn-history"
            onClick={() => handleViewHistory(product)}
            title="View Inventory History"
          >
            📊 History
          </button>
        </td>
      </tr>
    );
  };

  return (
    <>
      <div className="product-table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Unit</th>
              <th>Category</th>
              <th>Brand</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => renderRow(product))}
          </tbody>
        </table>
      </div>

      {selectedProduct && (
        <InventoryHistorySidebar
          productId={selectedProduct.id}
          productName={selectedProduct.name}
          onClose={handleCloseSidebar}
        />
      )}
    </>
  );
};

export default ProductTable;
