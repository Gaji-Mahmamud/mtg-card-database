# MTG Card Database

A full-stack web application for searching and discovering Magic: The Gathering cards with modern glass morphism UI.

🚀 **[Live Demo](https://mtg-card-database.vercel.app)** | 📡 **[API Docs](https://mtg-database-backend.onrender.com/docs)**

## Tech Stack

**Backend:**
- FastAPI with Python 3.12
- UV for dependency management
- Scryfall API integration
- Deployed on Render

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS v4 with glass morphism design
- TanStack Query for API state management
- Vite for build tooling
- Deployed on Vercel

## Features

- **Card Search:** Search MTG cards by name with real-time results
- **Advanced Filters:** Filter by colors, card types, and rarity
- **Card Details:** Click cards to view detailed information in modal
- **Double-faced Cards:** Full support with flip animations
- **Pricing:** Live market prices (USD/EUR, normal/foil)
- **All Artworks:** View all printings and artworks of any card
- **Modern UI:** Dark glass aesthetic with smooth animations
- **Fast:** Optimized API calls with caching

## Usage

Visit [mtg-card-database.vercel.app](https://mtg-card-database.vercel.app) to:

1. Search for any MTG card name
2. Use advanced filters (colors, types, rarity)
3. Click cards to view detailed information and pricing
4. View all artworks and printings
5. Browse market prices for different printings

## Local Development

### Prerequisites

- **Node.js** 20+ and npm
- **Python** 3.12+
- **UV** package manager

### Setup

#### Backend
```bash
cd backend
uv sync
uv run python -m uvicorn app.main:app --reload
```
Backend runs on `http://127.0.0.1:8000`

#### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`

## API Documentation

- **Live API:** [mtg-database-backend.onrender.com/docs](https://mtg-database-backend.onrender.com/docs)
- **Local API:** `http://127.0.0.1:8000/docs`

## Deployment

**Frontend:** Deployed on Vercel with automatic GitHub integration
**Backend:** Deployed on Render with 750 hours/month free tier

The application uses environment variables for API URLs and CORS configuration.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Test both frontend and backend locally
4. Submit a pull request

---

Built with modern web technologies and deployed on free hosting platforms.
