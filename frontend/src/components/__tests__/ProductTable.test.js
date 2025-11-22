import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ProductTable from '../ProductTable';

describe('ProductTable Component', () => {
  const mockProducts = [
    {
      id: 1,
      name: 'Laptop',
      unit: 'piece',
      category: 'Electronics',
      brand: 'Dell',
      stock: 10,
      status: 'In Stock',
      image: 'laptop.jpg',
    },
    {
      id: 2,
      name: 'Keyboard',
      unit: 'piece',
      category: 'Electronics',
      brand: 'Logitech',
      stock: 0,
      status: 'Out of Stock',
      image: 'keyboard.jpg',
    },
  ];

  it('renders product table with products', () => {
    render(
      <ProductTable
        products={mockProducts}
        onProductUpdate={jest.fn()}
        onProductDelete={jest.fn()}
      />
    );
    
    expect(screen.getByText('Laptop')).toBeInTheDocument();
    expect(screen.getByText('Keyboard')).toBeInTheDocument();
  });

  it('displays stock status correctly', () => {
    render(
      <ProductTable
        products={mockProducts}
        onProductUpdate={jest.fn()}
        onProductDelete={jest.fn()}
      />
    );
    
    const inStockBadges = screen.getAllByText('In Stock');
    const outOfStockBadges = screen.getAllByText('Out of Stock');
    
    expect(inStockBadges.length).toBeGreaterThan(0);
    expect(outOfStockBadges.length).toBeGreaterThan(0);
  });

  it('shows action buttons for each product', () => {
    render(
      <ProductTable
        products={mockProducts}
        onProductUpdate={jest.fn()}
        onProductDelete={jest.fn()}
      />
    );
    
    const editButtons = screen.getAllByText('Edit');
    const deleteButtons = screen.getAllByText('Delete');
    
    expect(editButtons.length).toBe(mockProducts.length);
    expect(deleteButtons.length).toBe(mockProducts.length);
  });

  it('shows "no products" message when products array is empty', () => {
    render(
      <ProductTable
        products={[]}
        onProductUpdate={jest.fn()}
        onProductDelete={jest.fn()}
      />
    );
    
    expect(screen.getByText(/no products found/i)).toBeInTheDocument();
  });

  it('displays all table columns', () => {
    render(
      <ProductTable
        products={mockProducts}
        onProductUpdate={jest.fn()}
        onProductDelete={jest.fn()}
      />
    );
    
    expect(screen.getByText('Image')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Unit')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Brand')).toBeInTheDocument();
    expect(screen.getByText('Stock')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });
});
