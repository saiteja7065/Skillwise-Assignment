import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SearchBar from '../SearchBar';

describe('SearchBar Component', () => {
  it('renders search input', () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/search products/i);
    expect(input).toBeInTheDocument();
  });

  it('calls onSearch when typing', () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/search products/i);
    fireEvent.change(input, { target: { value: 'laptop' } });
    
    expect(mockOnSearch).toHaveBeenCalledWith('laptop');
  });

  it('shows clear button when there is text', () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/search products/i);
    fireEvent.change(input, { target: { value: 'test' } });
    
    const clearButton = screen.getByRole('button');
    expect(clearButton).toBeInTheDocument();
  });

  it('clears input when clear button is clicked', () => {
    const mockOnSearch = jest.fn();
    render(<SearchBar onSearch={mockOnSearch} />);
    
    const input = screen.getByPlaceholderText(/search products/i);
    fireEvent.change(input, { target: { value: 'test' } });
    
    const clearButton = screen.getByRole('button');
    fireEvent.click(clearButton);
    
    expect(input.value).toBe('');
    expect(mockOnSearch).toHaveBeenCalledWith('');
  });
});
