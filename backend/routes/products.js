const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const router = express.Router();

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Import database from server.js
let db;
const setDb = (database) => {
  db = database;
};

// Search Products (GET /api/products/search?name=query)
router.get('/search', (req, res) => {
  const { name } = req.query;

  if (!name) {
    return res.status(400).json({ error: 'Search query is required' });
  }

  db.all(
    'SELECT * FROM products WHERE name LIKE ? COLLATE NOCASE',
    [`%${name}%`],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ products: rows, count: rows.length });
    }
  );
});

// Get Inventory History for a Product (GET /api/products/:id/history)
router.get('/:id/history', (req, res) => {
  const { id } = req.params;

  // First check if product exists
  db.get('SELECT id, name FROM products WHERE id = ?', [id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Fetch inventory history sorted by date descending
    db.all(
      `SELECT * FROM inventory_history 
       WHERE product_id = ? 
       ORDER BY change_date DESC`,
      [id],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          product: product,
          history: rows,
          count: rows.length,
        });
      }
    );
  });
});

// B. Export Products API (GET /api/products/export)
router.get('/export', (req, res) => {
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Create CSV header
    const headers = ['id', 'name', 'unit', 'category', 'brand', 'stock', 'status', 'image'];
    let csvData = headers.join(',') + '\n';

    // Add product rows
    rows.forEach((product) => {
      const row = headers.map((header) => {
        const value = product[header] || '';
        // Escape commas and quotes in values
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvData += row.join(',') + '\n';
    });

    // Set response headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.status(200).send(csvData);
  });
});

// A. Import Products API (POST /api/products/import)
router.post('/import', upload.single('csvFile'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const results = [];
  const filePath = req.file.path;

  // Read and parse CSV file
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', () => {
      let added = 0;
      let skipped = 0;
      const duplicates = [];
      let processed = 0;

      if (results.length === 0) {
        fs.unlinkSync(filePath); // Clean up uploaded file
        return res.status(400).json({ error: 'CSV file is empty' });
      }

      // Process each product
      results.forEach((product, index) => {
        const { name, unit, category, brand, stock, status, image } = product;

        // Validate required fields
        if (!name || stock === undefined) {
          processed++;
          skipped++;
          if (processed === results.length) {
            fs.unlinkSync(filePath); // Clean up uploaded file
            res.json({ added, skipped, duplicates });
          }
          return;
        }

        // Check for duplicate name (case-insensitive)
        db.get(
          'SELECT id, name FROM products WHERE LOWER(name) = LOWER(?)',
          [name],
          (err, existingProduct) => {
            if (err) {
              console.error('Error checking duplicate:', err.message);
              processed++;
              skipped++;
            } else if (existingProduct) {
              // Duplicate found
              duplicates.push({
                name: name,
                existingId: existingProduct.id,
              });
              processed++;
              skipped++;
            } else {
              // Insert new product
              db.run(
                `INSERT INTO products (name, unit, category, brand, stock, status, image) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [name, unit || '', category || '', brand || '', parseInt(stock) || 0, status || '', image || ''],
                function (err) {
                  if (err) {
                    console.error('Error inserting product:', err.message);
                    skipped++;
                  } else {
                    added++;
                  }
                  processed++;

                  // Send response when all products are processed
                  if (processed === results.length) {
                    fs.unlinkSync(filePath); // Clean up uploaded file
                    res.json({ added, skipped, duplicates });
                  }
                }
              );
              return;
            }

            // Send response when all products are processed
            if (processed === results.length) {
              fs.unlinkSync(filePath); // Clean up uploaded file
              res.json({ added, skipped, duplicates });
            }
          }
        );
      });
    })
    .on('error', (error) => {
      fs.unlinkSync(filePath); // Clean up uploaded file
      res.status(500).json({ error: 'Error parsing CSV file: ' + error.message });
    });
});

// A. Get Products List API (GET /api/products)
router.get('/', (req, res) => {
  const { page, limit, sort, order, category } = req.query;

  let query = 'SELECT * FROM products';
  const params = [];

  // Filter by category if provided
  if (category) {
    query += ' WHERE category = ?';
    params.push(category);
  }

  // Sorting
  if (sort) {
    const validSortFields = ['id', 'name', 'category', 'brand', 'stock', 'status'];
    const sortField = validSortFields.includes(sort) ? sort : 'id';
    const sortOrder = order === 'desc' ? 'DESC' : 'ASC';
    query += ` ORDER BY ${sortField} ${sortOrder}`;
  }

  // Pagination
  if (page && limit) {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const offset = (pageNum - 1) * limitNum;
    query += ' LIMIT ? OFFSET ?';
    params.push(limitNum, offset);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ products: rows, count: rows.length });
  });
});

// Get Inventory History for a Product (GET /api/products/:id/history)
router.get('/:id/history', (req, res) => {
  const { id } = req.params;

  // First check if product exists
  db.get('SELECT id, name FROM products WHERE id = ?', [id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Fetch inventory history sorted by date descending
    db.all(
      'SELECT * FROM inventory_history WHERE product_id = ? ORDER BY change_date DESC',
      [id],
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          productId: id,
          productName: product.name,
          history: rows,
          count: rows.length,
        });
      }
    );
  });
});

// Get Product by ID (GET /api/products/:id)
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM products WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ product: row });
  });
});

// Create Product API (POST /api/products)
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a number >= 0'),
    body('unit').optional(),
    body('category').optional(),
    body('brand').optional(),
    body('status').optional(),
    body('image').optional(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, unit, category, brand, stock, status, image } = req.body;

    // Check if product name already exists
    db.get('SELECT id FROM products WHERE name = ?', [name], (err, existingProduct) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (existingProduct) {
        return res.status(400).json({ error: 'Product name already exists' });
      }

      // Insert new product
      db.run(
        `INSERT INTO products (name, unit, category, brand, stock, status, image) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, unit, category, brand, stock, status, image],
        function (err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Return created product
          db.get('SELECT * FROM products WHERE id = ?', [this.lastID], (err, product) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            res.status(201).json({ 
              message: 'Product created successfully', 
              product 
            });
          });
        }
      );
    });
  }
);

// B. Update Product API (PUT /api/products/:id)
router.put(
  '/:id',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a number >= 0'),
    body('unit').optional(),
    body('category').optional(),
    body('brand').optional(),
    body('status').optional(),
    body('image').optional(),
  ],
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { name, unit, category, brand, stock, status, image } = req.body;

    // First, check if name is unique (except for current product)
    db.get(
      'SELECT id FROM products WHERE name = ? AND id != ?',
      [name, id],
      (err, existingProduct) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        if (existingProduct) {
          return res.status(400).json({ error: 'Product name already exists' });
        }

        // Fetch old product data to track inventory changes
        db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          if (!product) {
            return res.status(404).json({ error: 'Product not found' });
          }

          // Update product
          db.run(
            `UPDATE products 
             SET name = ?, unit = ?, category = ?, brand = ?, stock = ?, status = ?, image = ?
             WHERE id = ?`,
            [name, unit, category, brand, stock, status, image, id],
            function (err) {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              // Track inventory history if stock changed
              if (product.stock !== stock) {
                db.run(
                  `INSERT INTO inventory_history 
                   (product_id, old_quantity, new_quantity, change_date, user_info) 
                   VALUES (?, ?, ?, ?, ?)`,
                  [id, product.stock, stock, new Date().toISOString(), 'admin'],
                  (err) => {
                    if (err) {
                      console.error('Error logging inventory history:', err.message);
                    }
                  }
                );
              }

              // Return updated product
              db.get('SELECT * FROM products WHERE id = ?', [id], (err, updatedProduct) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                res.json({ 
                  message: 'Product updated successfully', 
                  product: updatedProduct 
                });
              });
            }
          );
        });
      }
    );
  }
);

// Delete Product API (DELETE /api/products/:id)
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Check if product exists
  db.get('SELECT * FROM products WHERE id = ?', [id], (err, product) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Delete product
    db.run('DELETE FROM products WHERE id = ?', [id], function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Also delete related inventory history
      db.run('DELETE FROM inventory_history WHERE product_id = ?', [id], (err) => {
        if (err) {
          console.error('Error deleting inventory history:', err.message);
        }
      });

      res.json({ 
        message: 'Product deleted successfully', 
        deletedProduct: product 
      });
    });
  });
});

module.exports = { router, setDb };
