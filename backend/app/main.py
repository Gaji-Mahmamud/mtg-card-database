from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {
        "message": "Welcome to MTG Card Database API",
        "project": "MTG Card Database",
        "version": "0.1.0"
    }