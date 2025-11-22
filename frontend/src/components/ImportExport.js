import React, { useRef, useState } from 'react';
import { importProducts, exportProducts } from '../services/api';
import '../styles/ImportExport.css';

const ImportExport = ({ onImportSuccess }) => {
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      alert('Please select a CSV file');
      return;
    }

    const formData = new FormData();
    formData.append('csvFile', file);

    try {
      setImporting(true);
      const response = await importProducts(formData);
      const { added, skipped, duplicates } = response.data;

      let message = `Import completed!\n\nAdded: ${added}\nSkipped: ${skipped}`;
      if (duplicates && duplicates.length > 0) {
        message += `\n\nDuplicates found:\n${duplicates.map(d => `- ${d.name}`).join('\n')}`;
      }

      alert(message);
      
      // Refresh product list
      if (onImportSuccess) {
        onImportSuccess();
      }
    } catch (error) {
      console.error('Import error:', error);
      alert('Failed to import products: ' + (error.response?.data?.error || error.message));
    } finally {
      setImporting(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const response = await exportProducts();
      
      // Create blob from response
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      
      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'products.csv';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export products: ' + (error.response?.data?.error || error.message));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="import-export">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        style={{ display: 'none' }}
      />
      
      <button
        className="btn btn-secondary"
        onClick={handleImportClick}
        disabled={importing}
      >
        {importing ? 'Importing...' : '📥 Import'}
      </button>
      
      <button
        className="btn btn-secondary"
        onClick={handleExport}
        disabled={exporting}
      >
        {exporting ? 'Exporting...' : '📤 Export'}
      </button>
    </div>
  );
};

export default ImportExport;
