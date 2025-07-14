from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
from typing import Optional

app = FastAPI(title="MTG Card Database API", version="0.1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SCRYFALL_API_BASE = "https://api.scryfall.com"

@app.get("/")
def read_root():
    return {
        "message": "Welcome to MTG Card Database API",
        "project": "MTG Card Database",
        "version": "0.1.0"
    }

@app.get("/search/cards")
async def search_cards(
    q: str = Query(..., description="Search query for card names"),
    page: int = Query(1, ge=1, description="Page number (1-based)")
):
    """Search for MTG cards using Scryfall API"""
    try:
        async with httpx.AsyncClient() as client:
            # Build Scryfall search URL
            params = {
                "q": q,
                "page": page,
                "format": "json"
            }
            
            response = await client.get(
                f"{SCRYFALL_API_BASE}/cards/search",
                params=params,
                timeout=10.0
            )
            
            if response.status_code == 404:
                # No cards found
                return {
                    "data": [],
                    "total_cards": 0,
                    "has_more": False,
                    "page": page,
                    "message": "No cards found matching your search."
                }
            
            response.raise_for_status()
            scryfall_data = response.json()
            
            # Extract relevant card information
            cards = []
            for card in scryfall_data.get("data", []):
                card_info = {
                    "id": card.get("id"),
                    "name": card.get("name"),
                    "mana_cost": card.get("mana_cost"),
                    "type_line": card.get("type_line"),
                    "oracle_text": card.get("oracle_text"),
                    "power": card.get("power"),
                    "toughness": card.get("toughness"),
                    "colors": card.get("colors", []),
                    "rarity": card.get("rarity"),
                    "set_name": card.get("set_name"),
                    "collector_number": card.get("collector_number"),
                    "image_uris": card.get("image_uris", {}),
                    "scryfall_uri": card.get("scryfall_uri"),
                    "prices": card.get("prices", {})
                }
                cards.append(card_info)
            
            return {
                "data": cards,
                "total_cards": scryfall_data.get("total_cards", 0),
                "has_more": scryfall_data.get("has_more", False),
                "page": page
            }
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request to Scryfall API timed out")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Scryfall API error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "MTG Card Database API"}