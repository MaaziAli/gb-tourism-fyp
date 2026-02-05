from fastapi import FastAPI
from app.routers import listings

app = FastAPI(title="GB Tourism Backend")

app.include_router(listings.router)

@app.get("/")
def root():
    return {"message": "GB Tourism Backend 4th version is running successfully"}
