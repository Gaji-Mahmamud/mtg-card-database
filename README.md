# MTG Card Database

A full-stack web application for searching and discovering Magic: The Gathering cards with modern glass morphism UI.

## Tech Stack

**Backend:**
- FastAPI with Python 3.12
- UV for dependency management
- Scryfall API integration
- Real-time card pricing data

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS v4 with glass morphism design
- TanStack Query for API state management
- Vite for build tooling

## Features

- **Card Search:** Search MTG cards by name with real-time results
- **Card Details:** Click cards to view detailed information in modal
- **Pricing:** Live market prices (USD/EUR, normal/foil)
- **Modern UI:** Dark glass aesthetic with smooth animations
- **Fast:** Optimized API calls with caching

## Prerequisites

- **Node.js** 20+ and npm
- **Python** 3.12+
- **UV** package manager

## Installation

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd mtg-card-database
```

### 2. Backend Setup
```bash
cd backend
uv sync
uv run python -m uvicorn app.main:app --reload
```
Backend runs on `http://127.0.0.1:8000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

## Development

**Start Backend:**
```bash
cd backend
uv run python -m uvicorn app.main:app --reload
```

**Start Frontend:**
```bash
cd frontend
npm run dev
```

## API Documentation

Interactive API docs: `http://127.0.0.1:8000/docs`

## Usage

1. Open the application in your browser
2. Search for any MTG card name
3. Click cards to view detailed information and pricing
4. View market prices for different printings

## Contributing

1. Fork the repository
2. Create a feature branch
3. Test both frontend and backend
4. Submit a pull request