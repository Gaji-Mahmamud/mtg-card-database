# MTG Card Database

A full-stack web application for searching and discovering Magic: The Gathering cards.

## Tech Stack

**Backend:**
- FastAPI with Python 3.12
- UV for dependency management
- Integration with Scryfall API

**Frontend:**
- React 19 with TypeScript
- Tailwind CSS v4
- TanStack Query for API state management
- Vite for build tooling

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
Backend will run on `http://127.0.0.1:8000`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Frontend will run on `http://localhost:5173`

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

Visit `http://127.0.0.1:8000/docs` for interactive API documentation.

## Project Structure

```
mtg-card-database/
├── backend/
│   ├── app/
│   │   └── main.py
│   ├── pyproject.toml
│   └── uv.lock
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Features (Coming Soon)

- [ ] Search MTG cards by name, type, color
- [ ] Advanced filtering options
- [ ] Card details with images and game text
- [ ] Search history and favorites
- [ ] Export search results

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test both frontend and backend
5. Submit a pull request
