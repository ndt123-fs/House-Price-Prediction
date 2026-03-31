from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
<<<<<<< HEAD
import pickle
import numpy as np
import mysql.connector

app = FastAPI()

=======
import numpy as np
import mysql.connector
import joblib
import os

app = FastAPI()

# CORS
>>>>>>> 458e1190 (create new .git and update)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

<<<<<<< HEAD
with open("../model/model.pkl", "rb") as f:
    model = pickle.load(f)

# ⚠️ Sửa user/password cho đúng với MySQL của bạn
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "123456",  # ← đổi thành password MySQL của bạn
    "database": "house_prediction"
=======
# Load model (FIX PATH CHUẨN)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(BASE_DIR, "..", "model", "model.pkl")
model = joblib.load(model_path)

# DB config
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "123456",
    "database": "result_house_prediction"
>>>>>>> 458e1190 (create new .git and update)
}

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

<<<<<<< HEAD
=======
# Input schema (ĐỦ 19 FIELD)
>>>>>>> 458e1190 (create new .git and update)
class HouseInput(BaseModel):
    bedrooms: int
    bathrooms: float
    sqft_living: int
<<<<<<< HEAD
    floors: float
    waterfront: int
    view: int
=======
    sqft_lot: int
    floors: float
    waterfront: int
    view: int
    condition: int
>>>>>>> 458e1190 (create new .git and update)
    grade: int
    sqft_above: int
    sqft_basement: int
    yr_built: int
    yr_renovated: int
<<<<<<< HEAD
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
=======
    zipcode: int
    lat: float
    long: float
    sqft_living15: int
    sqft_lot15: int
    Years: int   # FIX: chữ hoa

@app.post("/predict")
def predict(data: HouseInput):

    features = np.array([[
        data.bedrooms,
        data.bathrooms,
        data.sqft_living,
        data.sqft_lot,
        data.floors,
        data.waterfront,
        data.view,
        data.condition,
        data.grade,
        data.sqft_above,
        data.sqft_basement,
        data.yr_built,
        data.yr_renovated,
        data.zipcode,
        data.lat,
        data.long,
        data.sqft_living15,
        data.sqft_lot15,
        data.Years
    ]])

    price = model.predict(features)[0]
    predicted_price = round(float(price), 2)

    # Save DB
>>>>>>> 458e1190 (create new .git and update)
    try:
        db = get_db()
        cursor = db.cursor()
        cursor.execute("""
            INSERT INTO predictions (
<<<<<<< HEAD
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
=======
                bedrooms, bathrooms, sqft_living, sqft_lot, floors, waterfront,
                view_score, condition_score, grade, sqft_above, sqft_basement,
                yr_built, yr_renovated, zipcode, lat, long,
                sqft_living15, sqft_lot15, years, predicted_price
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            data.bedrooms,
            data.bathrooms,
            data.sqft_living,
            data.sqft_lot,
            data.floors,
            data.waterfront,
            data.view,
            data.condition,
            data.grade,
            data.sqft_above,
            data.sqft_basement,
            data.yr_built,
            data.yr_renovated,
            data.zipcode,
            data.lat,
            data.long,
            data.sqft_living15,
            data.sqft_lot15,
            data.Years,
            predicted_price
>>>>>>> 458e1190 (create new .git and update)
        ))
        db.commit()
        cursor.close()
        db.close()
    except Exception as e:
<<<<<<< HEAD
        print(f"DB Error: {e}")

    return {"predicted_price": predicted_price}

=======
        print("DB error:", e)

    return {"predicted_price": predicted_price}


>>>>>>> 458e1190 (create new .git and update)
@app.get("/history")
def get_history():
    db = get_db()
    cursor = db.cursor(dictionary=True)
    cursor.execute("SELECT * FROM predictions ORDER BY created_at DESC LIMIT 10")
    rows = cursor.fetchall()
    cursor.close()
    db.close()
    return rows