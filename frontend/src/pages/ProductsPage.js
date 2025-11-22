import React, { useState, useEffect, useCallback } from 'react';
import { getProducts } from '../services/api';
import ProductTable from '../components/ProductTable';
import SearchBar from '../components/SearchBar';
import CategoryFilter from '../components/CategoryFilter';
import ImportExport from '../components/ImportExport';
import '../styles/ProductsPage.css';

const ProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Fetch all products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Extract unique categories when products change
  useEffect(() => {
    if (products.length > 0) {
      const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
      setCategories(uniqueCategories);
    }
  }, [products]);

  const filterProducts = useCallback(() => {
    let filtered = [...products];

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === selectedCategory);
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, selectedCategory]);

  // Filter products when search query or category changes
  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await getProducts();
      setProducts(response.data.products || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch products');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
  };

  const handleAddProduct = () => {
    // TODO: Open modal/form for adding new product
    alert('Add Product feature - Coming soon!');
  };

  return (
    <div className="products-page">
      <div className="toolbar">
        <div className="toolbar-left">
          <SearchBar onSearch={handleSearch} />
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
          />
          <button className="btn btn-primary" onClick={handleAddProduct}>
            + Add New Product
          </button>
        </div>

        <div className="toolbar-right">
          <ImportExport onImportSuccess={fetchProducts} />
        </div>
      </div>

      {loading && <div className="loading">Loading products...</div>}
      {error && <div className="error">{error}</div>}

      {!loading && !error && (
        <ProductTable
          products={filteredProducts}
          onProductUpdate={fetchProducts}
          onProductDelete={fetchProducts}
        />
      )}
    </div>
  );
};

export default ProductsPage;
