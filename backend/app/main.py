from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pymongo import MongoClient
from pydantic import BaseModel
from prometheus_fastapi_instrumentator import Instrumentator
import os

app = FastAPI(
    title="RestaurantHub API",
    description="Restaurant E-commerce Management System",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# MongoDB connection
MONGO_URL = os.getenv(
    "MONGO_URL",
    "mongodb://localhost:27017"
)

client = MongoClient(MONGO_URL)
database = client["restauranthub"]

menu_collection = database["menu"]
orders_collection = database["orders"]


# Food model
class Food(BaseModel):
    name: str
    price: float
    category: str
    description: str


# Order model
class Order(BaseModel):
    customer_name: str
    food_name: str
    quantity: int


# Home API
@app.get("/")
def home():
    return {
        "message": "Welcome to RestaurantHub",
        "status": "Running"
    }


# Health API
@app.get("/health")
def health():
    try:
        client.admin.command("ping")
        return {
            "status": "healthy",
            "database": "connected"
        }
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=str(e)
        )


# Add food
@app.post("/menu")
def add_food(food: Food):

    result = menu_collection.insert_one(
        food.model_dump()
    )

    return {
        "message": "Food added successfully",
        "id": str(result.inserted_id)
    }


# Get menu
@app.get("/menu")
def get_menu():

    foods = list(menu_collection.find())

    for food in foods:
        food["_id"] = str(food["_id"])

    return foods


# Place order
@app.post("/orders")
def place_order(order: Order):

    if order.quantity <= 0:
        raise HTTPException(
            status_code=400,
            detail="Quantity must be greater than zero"
        )

    food = menu_collection.find_one(
        {"name": order.food_name}
    )

    if not food:
        raise HTTPException(
            status_code=404,
            detail="Food item not found"
        )

    total = food["price"] * order.quantity

    order_data = {
        **order.model_dump(),
        "total_price": total,
        "status": "PLACED"
    }

    result = orders_collection.insert_one(order_data)

    return {
        "message": "Order placed successfully",
        "order_id": str(result.inserted_id),
        "total_price": total,
        "status": "PLACED"
    }


# Get orders
@app.get("/orders")
def get_orders():

    orders = list(orders_collection.find())

    for order in orders:
        order["_id"] = str(order["_id"])

    return orders


# Prometheus metrics
Instrumentator().instrument(app).expose(app)