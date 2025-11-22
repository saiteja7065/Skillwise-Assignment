# Skillwise Assignment Reference Document

# **Inventory Management**

## **1. Project Setup and Initialization**

### **1.1. GitHub Repository**

1. **Create Repository:** Create a new public GitHub repository (e.g., `inventory-management-app`).
2. **Initial Structure:** Create two main folders: `backend` (for Node/Express) and `frontend` (for React).

### **1.2. Backend Setup (Node.js, Express, SQLite)**

1. **Initialize:** Navigate to the `backend` folder and run:Bash
    
    `npm init -y`
    
2. **Install Dependencies:** Install core dependencies.
    
    `npm install express sqlite3 cors multer csv-parser express-validator dotenv
    # Install nodemon for development
    npm install --save-dev nodemon`
    
    - **`sqlite3`**: Database driver.
    - **`express`**: Web framework.
    - **`cors`**: Middleware for enabling Cross-Origin Resource Sharing.
    - **`multer`**: Middleware for handling `multipart/form-data` (file uploads).
    - **`csv-parser`**: For parsing CSV files.
    - **`express-validator`**: For server-side validation.
    - **`dotenv`**: For environment variables.
3. **Basic Server (`server.js`) and Database Connection:**
    - Set up a basic Express server and connect to the SQLite database.
    - Create and initialize necessary tables (`products` and `inventory_history`).
    - **Concept Snippet (DB Init):**JavaScript
        
        `const sqlite3 = require('sqlite3').verbose();
        const db = new sqlite3.Database('./inventory.db');
        
        db.serialize(() => {
          db.run(`CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL,
            unit TEXT,
            category TEXT,
            brand TEXT,
            stock INTEGER NOT NULL,
            status TEXT,
            image TEXT
          )`);
          db.run(`CREATE TABLE IF NOT EXISTS inventory_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            product_id INTEGER,
            old_quantity INTEGER,
            new_quantity INTEGER,
            change_date TEXT,
            user_info TEXT,
            FOREIGN KEY(product_id) REFERENCES products(id)
          )`);
        });
        // ... (Express setup)`
        

### **1.3. Frontend Setup (ReactJS)**

1. **Create React App:** Navigate to the `frontend` folder and run:Bash
    
    `npx create-react-app .`
    
2. **Install Dependencies:**Bash
    
    `npm install axios react-router-dom`
    
    - **`axios`**: For making HTTP requests.

---

## **2. Backend Tasks (Node.js, Express, SQLite)**

### **2.1. Products API Endpoints**

### **A. Get Products List API (GET `/api/products`)**

- **Goal:** Return all products.
- **Implementation:** Use `db.all()` to fetch all records from the `products` table.
- *(Bonus: Implement query parameters for pagination and sorting here.)*

### **B. Update Product API (PUT `/api/products/:id`)**

- **Goal:** Update product details and track inventory history.
- **Steps:**
    1. **Validation:** Use `express-validator` to ensure fields like `name` and `stock` meet requirements (e.g., `stock` is a number, `name` is unique or belongs to the current ID).
    2. **Fetch Old Data:** Before updating, fetch the current product data, specifically the `stock`.
    3. **Update:** Use `db.run()` with a `UPDATE` query.
    4. **Inventory History Tracking:** If `stock` has changed, insert a new record into the `inventory_history` table.
    - **Concept Snippet (History Logic):**JavaScript
        
        `// In the PUT handler...
        const { id } = req.params;
        const { stock } = req.body;
        
        db.get('SELECT stock FROM products WHERE id = ?', [id], (err, product) => {
          if (product && product.stock !== stock) {
            db.run(
              'INSERT INTO inventory_history (product_id, old_quantity, new_quantity, change_date) VALUES (?, ?, ?, ?)',
              [id, product.stock, stock, new Date().toISOString()]
            );
          }
          // Proceed with product update (UPDATE products SET ...)
        });`
        

### **2.2. Import/Export Functionality**

### **A. Import Products API (POST `/api/products/import`)**

- **Middleware:** Use **`multer`** to handle the file upload.JavaScript
    
    `const multer = require('multer');
    const upload = multer({ dest: 'uploads/' });
    // In router: router.post('/import', upload.single('csvFile'), (req, res) => { ... });`
    
- **Parsing:** Use **`csv-parser`** to read the uploaded CSV file.
- **Database Logic:**
    1. Read the file line by line.
    2. For each product, check for a duplicate `name` using `db.get('SELECT id FROM products WHERE name = ?', [product.name])`.
    3. If no duplicate, insert the product. Keep track of added and skipped counts.
    4. *(Optional: Store duplicate data in a list to send back for an "edit duplicate" option.)*
- **Response:** Send a JSON response with counts of added and skipped products.

### **B. Export Products API (GET `/api/products/export`)**

- **Goal:** Return all products as a CSV file.
- **Steps:**
    1. Fetch all products from the database.
    2. Format the data into a CSV string (e.g., using a library or manual string manipulation, ensuring headers are included).
    3. Set appropriate response headers:JavaScript
        
        `res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
        res.status(200).send(csvData);`
        

### **2.3. Inventory History Endpoint**

- **Create GET Endpoint:** `GET /api/products/:id/history`
- **Implementation:** Fetch records from the `inventory_history` table where `product_id` matches the route parameter.
- **Sorting:** Ensure the results are sorted by `change_date` in **descending** order.SQL
    
    `SELECT * FROM inventory_history WHERE product_id = ? ORDER BY change_date DESC`
    

---

## **3. Frontend Tasks (ReactJS)**

### **3.1. Main Product Page Structure**

- **Layout:** Use a grid or Flexbox for layout.
- **Header Elements:**
    - **Left Side:** Search Bar, Category Filter, "Add New Product" button.
    - **Right Side:** "Import" button, "Export" button.

### **3.2. Product Search & Filtering**

1. **Search Bar:**
    - Component state manages the query string.
    - On change, trigger an API call to `GET /api/products/search?name={query}` (requires implementing this search endpoint in the backend).
2. **Category Filter:**
    - Populate the dropdown by fetching unique categories from the product list (or a dedicated backend endpoint).
    - Filtering can be done client-side if the product list is small, or by making an API call: `GET /api/products?category={category}`.

### **3.3. Products Table (Component: `ProductTable.js`)**

- **Responsiveness:** Use CSS media queries or a responsive UI framework (like Bootstrap or Tailwind CSS) to ensure the table adjusts well on smaller screens.
- **Stock Status Display:** Implement logic to map the `stock` value to a visual status:
    - `stock == 0`: **Out of Stock** (Red Label)
    - `stock > 0`: **In Stock** (Green Label)
    - **Concept Snippet (Status Logic):**JavaScript
        
        `const status = product.stock === 0 ? 'Out of Stock' : 'In Stock';
        const colorClass = product.stock === 0 ? 'text-red-600' : 'text-green-600';
        // Display <span className={colorClass}>{status}</span>`
        
- **Actions Column:** Include "Edit" and "Delete" buttons.

### **3.4. Inline Editing**

1. **State Management:** In the `ProductTable` component (or a `ProductRow` component), add a state like `isEditing` for each row.
2. **"Edit" Click:** Set `isEditing` to `true`. Replace static text fields in the row with `<input>` or `<select>` elements, pre-filled with the current data.
3. **"Save" Button:**
    - A "Save" button replaces "Edit" when `isEditing` is true.
    - On click, gather the updated data and send a **PUT request** to `/api/products/:id`.
    - On success, update the local product list state with the new data and set `isEditing` back to `false`.

### **3.5. Import/Export Functionality**

1. **Export Button:**
    - On click, use `window.open` or `axios` with `responseType: 'blob'` to download the file from `GET /api/products/export`.
2. **Import Button:**
    - Use a hidden `<input type="file" accept=".csv" />` triggered by the button click.
    - On file selection, create a `FormData` object and append the file.
    - Send a **POST request** to `/api/products/import` with the `FormData`.
    - On successful response (status 200/201), refresh the product table data by calling `GET /api/products`.

### **3.6. Inventory History Sidebar**

1. **Trigger:** Clicking a row or a specific button (e.g., "View History") should select a product.
2. **Sidebar Component:**
    - When a product is selected, the sidebar appears.
    - It fetches data from the backend: `GET /api/products/{product_id}/history`.
    - Display the history logs (Old Quantity, New Quantity, Date, etc.) in a clear, formatted list.

---

## **4. Bonus Tasks and Deployment**

### **4.1. Bonus Tasks Guidance**

| Feature | Frontend (ReactJS) Implementation | Backend (Node/Express) Implementation |
| --- | --- | --- |
| **Pagination & Sorting** | Add table header click handlers to change sort parameters. Use state for `currentPage`, `pageSize`, `sortField`, `sortOrder`. | Modify `GET /api/products` to accept query parameters: `?page=1&limit=10&sort=name&order=asc`. Use `LIMIT` and `OFFSET` in SQLite queries. |
| **Authentication** | Implement **JWT (JSON Web Tokens)**. Add login/register components. Store JWT in browser storage (e.g., Local Storage). Include the token in the `Authorization` header of all protected API calls. | Add new endpoints for **Login/Register**. Use `bcrypt` to hash passwords. Use a middleware function to verify the incoming JWT and protect routes. |
| **Responsive Design** | Use **CSS Flexbox/Grid** for the overall layout. Implement media queries for different breakpoints (mobile, tablet, desktop). Ensure the product table is manageable on small screens (e.g., by hiding less critical columns). | N/A |
| **Testing** | Use **Jest/React Testing Library** for component unit tests (e.g., testing that the search bar correctly handles input). | Use **Mocha/Chai/Jest/Supertest** for unit and integration testing of API routes (e.g., testing that the `/import` endpoint correctly handles a valid CSV file). |

### **4.2. Deployment Steps**

1. **Backend Deployment (Render/Other Service):**
    - Configure the service to run `npm start` (ensure your `package.json` has a start script).
    - Set environment variables (if any, like database path or JWT secret).
    - Ensure the SQLite database file is either included and writeable or use a service like **Render's Native PostgreSQL** for a persistent production database (SQLite is often tricky for services that don't guarantee file system persistence).
2. **Frontend Deployment (Netlify/Vercel):**
    - Configure the service to build the React application (`npm run build`).
    - The build output should be served.
    - **Crucial:** Update all API calls in the frontend to use the **live, public URL** of the deployed backend.

---

## **5. Submission Requirements**

1. **GitHub Repository Link:** Share the link to the public repository.
2. **Live Backend Link:** Share the URL for the deployed Node/Express API.
3. **Live Frontend Link:** Share the URL for the deployed React application.