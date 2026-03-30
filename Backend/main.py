from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import numpy as np
import mysql.connector

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

with open("../model/model.pkl", "rb") as f:
    model = pickle.load(f)

# ⚠️ Sửa user/password cho đúng với MySQL của bạn
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "123456",  # ← đổi thành password MySQL của bạn
    "database": "house_prediction"
}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

class HouseInput(BaseModel):
    bedrooms: int
    bathrooms: float
    sqft_living: int
    floors: float
    waterfront: int
    view: int
    grade: int
    sqft_above: int
    sqft_basement: int
    yr_built: int
    yr_renovated: int
    lat: float
    sqft_living15: int
    years: int

@app.post("/predict")
def predict(data: HouseInput):
    features = np.array([[
        data.bedrooms, data.bathrooms, data.sqft_living,
        data.floors, data.waterfront, data.view, data.grade,
        data.sqft_above, data.sqft_basement, data.yr_built,
        data.yr_renovated, data.lat, data.sqft_living15,
        data.years
    ]])
    price = model.predict(features)[0]
    predicted_price = round(float(price), 2)

    # Lưu vào MySQL
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO predictions (
                bedrooms, bathrooms, sqft_living, floors, waterfront,
                view_score, grade, sqft_above, sqft_basement, yr_built,
                yr_renovated, lat, sqft_living15, years, predicted_price
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            data.bedrooms, data.bathrooms, data.sqft_living,
            data.floors, data.waterfront, data.view, data.grade,
            data.sqft_above, data.sqft_basement, data.yr_built,
            data.yr_renovated, data.lat, data.sqft_living15,
            data.years, predicted_price
        ))
        db.commit()
        cursor.close()
        db.close()
    except Exception as e:
        print(f"DB Error: {e}")

    return {"predicted_price": predicted_price}

@app.get("/history")
def get_history():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM predictions ORDER BY created_at DESC LIMIT 10")
    rows = cursor.fetchall()
    cursor.close()
    db.close()
    return rows