import { useEffect, useState } from "react";
import "./App.css";

const API = "http://localhost:8000";

function App() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState("");
  const [message, setMessage] = useState("");

  async function fetchMenu() {
    try {
      const response = await fetch(`${API}/menu`);
      if (!response.ok) throw new Error("Could not load menu");

      setMenu(await response.json());
      setMessage("");
    } catch {
      setMessage("Unable to connect to the restaurant server.");
    }
  }

  useEffect(() => {
    fetchMenu();
  }, []);

  function addToCart(food) {
    setCart((previous) => {
      const existing = previous.find((item) => item.name === food.name);

      if (existing) {
        return previous.map((item) =>
          item.name === food.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...previous, { ...food, quantity: 1 }];
    });
  }

  function removeFromCart(foodName) {
    setCart((previous) =>
      previous.filter((item) => item.name !== foodName)
    );
  }

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  async function placeOrder() {
    if (!customer.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    if (cart.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    try {
      for (const item of cart) {
        const response = await fetch(`${API}/orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customer_name: customer,
            food_name: item.name,
            quantity: item.quantity,
          }),
        });

        if (!response.ok) throw new Error("Order failed");
      }

      setMessage(`Order placed successfully! Total: ₹${total}`);
      setCart([]);
      setCustomer("");
    } catch {
      setMessage("Unable to place order. Please try again.");
    }
  }

  return (
    <div className="app">
      <header className="navbar">
        <h1>🍽️ RestaurantHub</h1>
        <span>Fresh Food. Fast Delivery.</span>
      </header>

      <section className="hero">
        <h2>Discover Delicious Food</h2>
        <p>Order your favourite meals with RestaurantHub.</p>
        <a href="#menu">Explore Menu</a>
      </section>

      <main className="container">
        <section id="menu" className="menu-section">
          <h2>Our Menu</h2>

          <div className="food-grid">
            {menu.map((food) => (
              <div className="food-card" key={food._id}>
                <div className="food-image">
                  {food.category === "Pizza" ? "🍕" : "🍔"}
                </div>

                <h3>{food.name}</h3>
                <p>{food.description}</p>
                <h3>₹{food.price}</h3>

                <button onClick={() => addToCart(food)}>
                  Add to Cart
                </button>
              </div>
            ))}
          </div>

          {menu.length === 0 && <p>No menu items available.</p>}
        </section>

        <section className="cart-section">
          <h2>🛒 Your Cart</h2>

          {cart.length === 0 && <p>Your cart is empty.</p>}

          {cart.map((item) => (
            <div className="cart-item" key={item._id}>
              <span>{item.name} × {item.quantity}</span>
              <span>₹{item.price * item.quantity}</span>
              <button onClick={() => removeFromCart(item.name)}>
                Remove
              </button>
            </div>
          ))}

          <h3>Total: ₹{total}</h3>

          <input
            type="text"
            placeholder="Enter your name"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />

          <button className="order-button" onClick={placeOrder}>
            Place Order
          </button>

          {message && <p className="message">{message}</p>}
        </section>
      </main>

      <footer>
        <p>© 2026 RestaurantHub | Powered by FastAPI & React</p>
      </footer>
    </div>
  );
}

export default App;