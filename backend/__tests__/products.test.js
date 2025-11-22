const request = require('supertest');
const { app } = require('../server');

describe('Products API', () => {
  let productId;

  // Test GET /api/products
  describe('GET /api/products', () => {
    it('should return all products', async () => {
      const response = await request(app).get('/api/products');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
      expect(Array.isArray(response.body.products)).toBe(true);
    });

    it('should support pagination', async () => {
      const response = await request(app).get('/api/products?page=1&limit=5');
      
      expect(response.status).toBe(200);
      expect(response.body.products.length).toBeLessThanOrEqual(5);
    });

    it('should support sorting', async () => {
      const response = await request(app).get('/api/products?sort=name&order=asc');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
    });
  });

  // Test POST /api/products
  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const newProduct = {
        name: `Test Product ${Date.now()}`,
        unit: 'piece',
        category: 'Test',
        brand: 'TestBrand',
        stock: 10,
        status: 'In Stock',
        image: 'test.jpg',
      };

      const response = await request(app)
        .post('/api/products')
        .send(newProduct);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('product');
      expect(response.body.product.name).toBe(newProduct.name);
      
      productId = response.body.product.id;
    });

    it('should reject product with missing name', async () => {
      const invalidProduct = {
        unit: 'piece',
        stock: 10,
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct);

      expect(response.status).toBe(400);
    });

    it('should reject product with negative stock', async () => {
      const invalidProduct = {
        name: 'Invalid Product',
        stock: -5,
      };

      const response = await request(app)
        .post('/api/products')
        .send(invalidProduct);

      expect(response.status).toBe(400);
    });
  });

  // Test GET /api/products/search
  describe('GET /api/products/search', () => {
    it('should search products by name', async () => {
      const response = await request(app).get('/api/products/search?name=Laptop');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('products');
    });

    it('should return 400 if no search query provided', async () => {
      const response = await request(app).get('/api/products/search');
      
      expect(response.status).toBe(400);
    });
  });

  // Test PUT /api/products/:id
  describe('PUT /api/products/:id', () => {
    it('should update a product', async () => {
      if (!productId) {
        // Create a product first
        const newProduct = {
          name: `Update Test ${Date.now()}`,
          unit: 'piece',
          category: 'Test',
          brand: 'TestBrand',
          stock: 10,
          status: 'In Stock',
          image: 'test.jpg',
        };
        const createResponse = await request(app)
          .post('/api/products')
          .send(newProduct);
        productId = createResponse.body.product.id;
      }

      const updatedData = {
        name: `Updated Product ${Date.now()}`,
        unit: 'box',
        category: 'Test',
        brand: 'TestBrand',
        stock: 20,
        status: 'In Stock',
        image: 'test.jpg',
      };

      const response = await request(app)
        .put(`/api/products/${productId}`)
        .send(updatedData);

      expect(response.status).toBe(200);
      expect(response.body.product.stock).toBe(20);
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app)
        .put('/api/products/99999')
        .send({
          name: 'Test',
          stock: 10,
        });

      expect(response.status).toBe(404);
    });
  });

  // Test DELETE /api/products/:id
  describe('DELETE /api/products/:id', () => {
    it('should delete a product', async () => {
      if (!productId) {
        // Create a product first
        const newProduct = {
          name: `Delete Test ${Date.now()}`,
          unit: 'piece',
          category: 'Test',
          brand: 'TestBrand',
          stock: 10,
          status: 'In Stock',
          image: 'test.jpg',
        };
        const createResponse = await request(app)
          .post('/api/products')
          .send(newProduct);
        productId = createResponse.body.product.id;
      }

      const response = await request(app).delete(`/api/products/${productId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent product', async () => {
      const response = await request(app).delete('/api/products/99999');

      expect(response.status).toBe(404);
    });
  });

  // Test GET /api/products/:id/history
  describe('GET /api/products/:id/history', () => {
    it('should return inventory history for a product', async () => {
      const response = await request(app).get('/api/products/1/history');

      if (response.status === 200) {
        expect(response.body).toHaveProperty('history');
        expect(Array.isArray(response.body.history)).toBe(true);
      } else {
        expect(response.status).toBe(404);
      }
    });
  });
});
