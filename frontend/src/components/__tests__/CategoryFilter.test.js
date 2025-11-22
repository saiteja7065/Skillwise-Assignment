import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import CategoryFilter from '../CategoryFilter';

describe('CategoryFilter Component', () => {
  const mockCategories = ['Electronics', 'Furniture', 'Stationery'];
  const mockOnCategoryChange = jest.fn();

  it('renders category dropdown', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory=""
        onCategoryChange={mockOnCategoryChange}
      />
    );
    
    const select = screen.getByRole('combobox');
    expect(select).toBeInTheDocument();
  });

  it('displays all categories', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory=""
        onCategoryChange={mockOnCategoryChange}
      />
    );
    
    expect(screen.getByText('All Categories')).toBeInTheDocument();
    expect(screen.getByText('Electronics')).toBeInTheDocument();
    expect(screen.getByText('Furniture')).toBeInTheDocument();
    expect(screen.getByText('Stationery')).toBeInTheDocument();
  });

  it('calls onCategoryChange when selection changes', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory=""
        onCategoryChange={mockOnCategoryChange}
      />
    );
    
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Electronics' } });
    
    expect(mockOnCategoryChange).toHaveBeenCalledWith('Electronics');
  });

  it('shows selected category', () => {
    render(
      <CategoryFilter
        categories={mockCategories}
        selectedCategory="Electronics"
        onCategoryChange={mockOnCategoryChange}
      />
    );
    
    const select = screen.getByRole('combobox');
    expect(select.value).toBe('Electronics');
  });
});
