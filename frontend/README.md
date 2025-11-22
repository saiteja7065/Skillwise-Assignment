# Frontend - Inventory Management System

React frontend for the Inventory Management System.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with:
```
REACT_APP_API_URL=http://localhost:5000
```

3. Start the development server:
```bash
npm start
```

4. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/       # Reusable React components
├── pages/           # Page components
├── services/        # API service layer
│   └── api.js      # Axios API calls
├── App.js          # Main app component with routing
└── index.js        # Entry point
```

## Features

- Product search and filtering
- Inline editing
- CSV import/export
- Inventory history tracking
- Responsive design

## Available Scripts

- `npm start` - Run development server
- `npm run build` - Build for production
- `npm test` - Run tests
