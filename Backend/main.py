from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from pathlib import Path
import joblib
import numpy as np
import mysql.connector
import os
import pandas as pd
import json

load_dotenv()

app = FastAPI(title="House Price Prediction API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =========================
# Load model
# =========================
BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR.parent / "model" / "pipeline_gb_tuned.pkl"

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Không tìm thấy model tại: {MODEL_PATH}")

model = joblib.load(MODEL_PATH)

FEATURE_PATH = BASE_DIR.parent / "model" / "feature_list.json"
with open(FEATURE_PATH, "r") as f:
    FEATURES = json.load(f)
# =========================
# DB Config
# =========================
DB_CONFIG = {
    "host": os.getenv("DB_HOST"),
    "user": os.getenv("DB_USER"),
    "password": os.getenv("DB_PASSWORD"),
    "database": os.getenv("DB_NAME"),
}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

# =========================
# Request Schema
# =========================
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
    lat: float = Field(..., ge=47.1, le=47.8, description="Vĩ độ (King County area)")
    sqft_living15: int
    years: int
    

# =========================
# Test API
# =========================
@app.get("/")
def root():
    return {"message": "House Price Prediction API is running"}

@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_path": str(MODEL_PATH)
    }

# =========================
# Predict API
# =========================
@app.post("/predict")
def predict(data: HouseInput):
    try:
         # Thay thế đoạn np.array cũ bằng đoạn này
        input_df = pd.DataFrame([{
            "bedrooms": data.bedrooms,
            "bathrooms": data.bathrooms,
            "sqft_living": data.sqft_living,
            "floors": data.floors,
            "waterfront": data.waterfront,
            "view": data.view,
            "grade": data.grade,
            "sqft_above": data.sqft_above,
            "sqft_basement": data.sqft_basement,
            "yr_built": data.yr_built,
            "yr_renovated": data.yr_renovated,
            "lat": data.lat,
            "sqft_living15": data.sqft_living15,
            "Years": data.years,
            # Các features mới được tính tự động
            "house_age": data.years - data.yr_built,
            "years_since_renovation": (data.years - data.yr_renovated) if data.yr_renovated > 0 else (data.years - data.yr_built),
            "basement_ratio": data.sqft_basement / (data.sqft_living + 1),
            "total_rooms": data.bedrooms + data.bathrooms,
        }])[FEATURES]  # đảm bảo đúng thứ tự cột

        predicted_price = round(float(model.predict(input_df)[0]), 2)
        # lưu vào bảng prediction_history
        try:
            db = get_db()
            cursor = db.cursor()

            cursor.execute("""
                INSERT INTO prediction_history (
                    bedrooms,
                    bathrooms,
                    sqft_living,
                    floors,
                    waterfront,
                    view_score,
                    grade,
                    sqft_above,
                    sqft_basement,
                    yr_built,
                    yr_renovated,
                    lat,
                    sqft_living15,
                    years,
                    predicted_price
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                data.bedrooms,
                data.bathrooms,
                data.sqft_living,
                data.floors,
                data.waterfront,
                data.view,
                data.grade,
                data.sqft_above,
                data.sqft_basement,
                data.yr_built,
                data.yr_renovated,
                data.lat,
                data.sqft_living15,
                data.years,
                predicted_price
            ))

            db.commit()
            cursor.close()
            db.close()

        except Exception as db_error:
            print(f"[DB Warning] Không lưu được prediction_history: {db_error}")

        return {
            "success": True,
            "predicted_price": predicted_price
        }

    except Exception as e:
        return {
            "success": False,
            "error": f"Lỗi dự đoán: {str(e)}"
        }

# =========================
# History API
# =========================
@app.get("/history")
def get_history():
    try:
        db = get_db()
        cursor = db.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                id,
                bedrooms,
                bathrooms,
                sqft_living,
                floors,
                waterfront,
                view_score,
                grade,
                sqft_above,
                sqft_basement,
                yr_built,
                yr_renovated,
                lat,
                sqft_living15,
                years,
                predicted_price,
                created_at
            FROM prediction_history
            ORDER BY created_at DESC
            LIMIT 10
        """)

        rows = cursor.fetchall()
        cursor.close()
        db.close()

        return rows

    except Exception as e:
        return {
            "success": False,
            "error": f"DB Error: {str(e)}"
        }