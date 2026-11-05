from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_home():
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["status"] == "Running"


def test_health_endpoint():
    response = client.get("/health")

    # This checks the health endpoint response.
    assert response.status_code in [200, 503]


def test_order_with_zero_quantity():
    response = client.post(
        "/orders",
        json={
            "customer_name": "Test User",
            "food_name": "Chicken Burger",
            "quantity": 0
        }
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Quantity must be greater than zero"