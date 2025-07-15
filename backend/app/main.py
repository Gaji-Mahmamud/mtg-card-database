from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import httpx
from typing import Optional, List
import asyncio
from datetime import datetime, timedelta
import json
import os

app = FastAPI(title="MTG Card Database API", version="0.1.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173", 
        "https://mtg-card-database.vercel.app",
        os.getenv("FRONTEND_URL", "")
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory cache
cache = {}
CACHE_DURATION = timedelta(minutes=10)

def get_cache_key(query: str, page: int, colors: str = "", types: str = "", rarity: str = ""):
    """Generate cache key from search parameters"""
    return f"search:{query}:{page}:{colors}:{types}:{rarity}"

def is_cache_valid(timestamp: datetime) -> bool:
    """Check if cache entry is still valid"""
    return datetime.now() - timestamp < CACHE_DURATION

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
    q: Optional[str] = Query(None, description="Search query for card names"),
    page: int = Query(1, ge=1, description="Page number (1-based)"),
    colors: Optional[str] = Query(None, description="Filter by colors (e.g., 'R,U' for red/blue)"),
    types: Optional[str] = Query(None, description="Filter by card types (e.g., 'creature,instant')"),
    rarity: Optional[str] = Query(None, description="Filter by rarity (common,uncommon,rare,mythic)")
):
    """Search for MTG cards using Scryfall API with advanced filters"""
    
    # Check if we have any search criteria
    if not q and not colors and not types and not rarity:
        return {
            "data": [],
            "total_cards": 0,
            "has_more": False,
            "page": page,
            "message": "Please provide a search query or apply filters."
        }
    
    # Check cache first
    cache_key = get_cache_key(q or "", page, colors or "", types or "", rarity or "")
    if cache_key in cache:
        cached_data, timestamp = cache[cache_key]
        if is_cache_valid(timestamp):
            return cached_data
        else:
            # Remove expired entry
            del cache[cache_key]
    
    try:
        async with httpx.AsyncClient() as client:
            # Build advanced search query
            search_parts = []
            
            # Add text query if provided
            if q and q.strip():
                search_parts.append(q.strip())
            
            # Add color filter
            if colors:
                color_list = [c.strip().upper() for c in colors.split(',')]
                color_filter = 'c:' + ''.join(color_list)
                search_parts.append(color_filter)
            
            # Add type filter
            if types:
                type_list = [t.strip().lower() for t in types.split(',')]
                for card_type in type_list:
                    search_parts.append(f"t:{card_type}")
            
            # Add rarity filter
            if rarity:
                search_parts.append(f"r:{rarity.lower()}")
            
            # If no search criteria, use a broad search
            if not search_parts:
                search_parts.append("*")  # Wildcard search
            
            search_query = " ".join(search_parts)
            
            params = {
                "q": search_query,
                "page": page,
                "format": "json"
            }
            
            response = await client.get(
                f"{SCRYFALL_API_BASE}/cards/search",
                params=params,
                timeout=10.0
            )
            
            if response.status_code == 404:
                result = {
                    "data": [],
                    "total_cards": 0,
                    "has_more": False,
                    "page": page,
                    "message": "No cards found matching your search."
                }
                # Cache empty results too
                cache[cache_key] = (result, datetime.now())
                return result
            
            response.raise_for_status()
            scryfall_data = response.json()
            
            # Extract relevant card information
            cards = []
            for card in scryfall_data.get("data", []):
                # Handle double-faced cards
                if card.get("card_faces"):
                    # Multi-faced card - extract both faces
                    faces = card.get("card_faces", [])
                    front_face = faces[0] if faces else {}
                    back_face = faces[1] if len(faces) > 1 else None
                    
                    card_info = {
                        "id": card.get("id"),
                        "name": card.get("name"),
                        "mana_cost": front_face.get("mana_cost") or card.get("mana_cost"),
                        "type_line": front_face.get("type_line") or card.get("type_line"),
                        "oracle_text": front_face.get("oracle_text") or card.get("oracle_text"),
                        "power": front_face.get("power"),
                        "toughness": front_face.get("toughness"),
                        "colors": card.get("colors", []),
                        "rarity": card.get("rarity"),
                        "set_name": card.get("set_name"),
                        "collector_number": card.get("collector_number"),
                        "image_uris": front_face.get("image_uris") or card.get("image_uris", {}),
                        "scryfall_uri": card.get("scryfall_uri"),
                        "prices": card.get("prices", {}),
                        # Double-faced card specific data
                        "has_multiple_faces": True,
                        "card_faces": {
                            "front": {
                                "name": front_face.get("name"),
                                "mana_cost": front_face.get("mana_cost"),
                                "type_line": front_face.get("type_line"),
                                "oracle_text": front_face.get("oracle_text"),
                                "power": front_face.get("power"),
                                "toughness": front_face.get("toughness"),
                                "image_uris": front_face.get("image_uris", {})
                            },
                            "back": {
                                "name": back_face.get("name") if back_face else None,
                                "mana_cost": back_face.get("mana_cost") if back_face else None,
                                "type_line": back_face.get("type_line") if back_face else None,
                                "oracle_text": back_face.get("oracle_text") if back_face else None,
                                "power": back_face.get("power") if back_face else None,
                                "toughness": back_face.get("toughness") if back_face else None,
                                "image_uris": back_face.get("image_uris", {}) if back_face else {}
                            } if back_face else None
                        }
                    }
                else:
                    # Single-faced card
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
                        "prices": card.get("prices", {}),
                        "has_multiple_faces": False,
                        "card_faces": None
                    }
                cards.append(card_info)
            
            result = {
                "data": cards,
                "total_cards": scryfall_data.get("total_cards", 0),
                "has_more": scryfall_data.get("has_more", False),
                "page": page,
                "next_page": page + 1 if scryfall_data.get("has_more", False) else None
            }
            
            # Cache the result
            cache[cache_key] = (result, datetime.now())
            
            return result
            
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Request to Scryfall API timed out")
    except httpx.HTTPStatusError as e:
        raise HTTPException(status_code=e.response.status_code, detail=f"Scryfall API error: {e.response.text}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/search/filters")
def get_search_filters():
    """Get available filter options"""
    return {
        "colors": [
            {"value": "W", "label": "White", "symbol": "⚪"},
            {"value": "U", "label": "Blue", "symbol": "🔵"},
            {"value": "B", "label": "Black", "symbol": "⚫"},
            {"value": "R", "label": "Red", "symbol": "🔴"},
            {"value": "G", "label": "Green", "symbol": "🟢"},
            {"value": "C", "label": "Colorless", "symbol": "◇"}
        ],
        "types": [
            "creature", "instant", "sorcery", "artifact", "enchantment", 
            "planeswalker", "land", "tribal", "legendary"
        ],
        "rarities": [
            {"value": "common", "label": "Common"},
            {"value": "uncommon", "label": "Uncommon"}, 
            {"value": "rare", "label": "Rare"},
            {"value": "mythic", "label": "Mythic Rare"}
        ]
    }

@app.get("/cache/stats")
def get_cache_stats():
    """Get cache statistics (for debugging)"""
    valid_entries = 0
    expired_entries = 0
    
    for key, (data, timestamp) in cache.items():
        if is_cache_valid(timestamp):
            valid_entries += 1
        else:
            expired_entries += 1
    
    return {
        "total_entries": len(cache),
        "valid_entries": valid_entries,
        "expired_entries": expired_entries,
        "cache_duration_minutes": CACHE_DURATION.total_seconds() / 60
    }

@app.delete("/cache")
def clear_cache():
    """Clear all cache entries"""
    cache.clear()
    return {"message": "Cache cleared successfully"}

@app.get("/cards/{card_name}/printings")
async def get_card_printings(card_name: str):
    """Get all printings/artworks of a specific card"""
    cache_key = f"printings:{card_name.lower()}"
    
    # Check cache first
    if cache_key in cache:
        cached_data, timestamp = cache[cache_key]
        if is_cache_valid(timestamp):
            return cached_data
        else:
            del cache[cache_key]
    
    try:
        async with httpx.AsyncClient() as client:
            # Search for exact card name to get all printings
            params = {
                "q": f'!"{card_name}"',
                "format": "json",
                "unique": "prints"
            }
            
            response = await client.get(
                f"{SCRYFALL_API_BASE}/cards/search",
                params=params,
                timeout=15.0
            )
            
            if response.status_code == 404:
                result = {
                    "data": [],
                    "total_printings": 0,
                    "message": "No printings found for this card."
                }
                cache[cache_key] = (result, datetime.now())
                return result
            
            response.raise_for_status()
            scryfall_data = response.json()
            
            # Extract printing information
            printings = []
            for card in scryfall_data.get("data", []):
                # Handle double-faced cards for printings
                image_uris = card.get("image_uris", {})
                back_image_uris = {}
                
                if not image_uris and card.get("card_faces"):
                    # For double-faced cards, get both faces
                    faces = card.get("card_faces", [])
                    front_face = faces[0] if faces else {}
                    back_face = faces[1] if len(faces) > 1 else None
                    
                    image_uris = front_face.get("image_uris", {})
                    back_image_uris = back_face.get("image_uris", {}) if back_face else {}
                
                printing_info = {
                    "id": card.get("id"),
                    "name": card.get("name"),
                    "set_name": card.get("set_name"),
                    "set_code": card.get("set"),
                    "collector_number": card.get("collector_number"),
                    "released_at": card.get("released_at"),
                    "rarity": card.get("rarity"),
                    "artist": card.get("artist"),
                    "flavor_text": card.get("flavor_text"),
                    "image_uris": image_uris,
                    "back_image_uris": back_image_uris if back_image_uris else None,
                    "prices": card.get("prices", {}),
                    "scryfall_uri": card.get("scryfall_uri")
                }
                printings.append(printing_info)
            
            # Sort by release date (newest first)
            printings.sort(key=lambda x: x.get("released_at", ""), reverse=True)
            
            result = {
                "data": printings,
                "total_printings": len(printings),
                "card_name": card_name
            }
            
            # Cache the result
            cache[cache_key] = (result, datetime.now())
            
            return result
            
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
