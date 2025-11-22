import React from 'react';
import '../styles/CategoryFilter.css';

const CategoryFilter = ({ categories, selectedCategory, onCategoryChange }) => {
  const handleChange = (e) => {
    onCategoryChange(e.target.value);
  };

  return (
    <div className="category-filter">
      <select
        value={selectedCategory}
        onChange={handleChange}
        className="category-select"
      >
        <option value="">All Categories</option>
        {categories.map((category) => (
          <option key={category} value={category}>
            {category}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CategoryFilter;
