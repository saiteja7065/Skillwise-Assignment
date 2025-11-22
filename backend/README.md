# Backend - Inventory Management API

Node.js + Express + SQLite backend for the Inventory Management System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Start the production server:
```bash
npm start
```

## API Endpoints

- `GET /` - API status
- `GET /api/health` - Health check

## Database

SQLite database with two tables:
- `products` - Store product information
- `inventory_history` - Track inventory changes

## Environment Variables

Create a `.env` file with:
```
PORT=5000
NODE_ENV=development
```
