import React, { useState, useEffect } from 'react';
import { ShoppingCart, Menu, X, MapPin, Search, User, Heart } from 'lucide-react';

// Mock data - in production, this would come from SQL database
const PRODUCTS = [
  { id: 1, name: 'Canadian Maple Syrup', price: 24.99, category: 'Food', image: '🍁', stock: 45, province: 'Quebec' },
  { id: 2, name: 'Hockey Jersey', price: 89.99, category: 'Apparel', image: '🏒', stock: 23, province: 'Ontario' },
  { id: 3, name: 'Artisan Coffee Beans', price: 18.99, category: 'Food', image: '☕', stock: 67, province: 'British Columbia' },
  { id: 4, name: 'Wool Toque', price: 34.99, category: 'Apparel', image: '🧢', stock: 89, province: 'Alberta' },
  { id: 5, name: 'Wild Blueberry Jam', price: 12.99, category: 'Food', image: '🫐', stock: 34, province: 'Nova Scotia' },
  { id: 6, name: 'Cedar Candle', price: 28.99, category: 'Home', image: '🕯️', stock: 56, province: 'British Columbia' },
  { id: 7, name: 'Flannel Shirt', price: 64.99, category: 'Apparel', image: '👔', stock: 41, province: 'Ontario' },
  { id: 8, name: 'Ice Wine', price: 54.99, category: 'Food', image: '🍷', stock: 18, province: 'Ontario' },
];

const CanadianStore = () => {
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showCart, setShowCart] = useState(false);

  const categories = ['All', 'Food', 'Apparel', 'Home'];

  const filteredProducts = PRODUCTS.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item => 
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, change) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + change;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50 to-slate-100">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Work+Sans:wght@300;400;600&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Work Sans', sans-serif;
          overflow-x: hidden;
        }

        .header-bg {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          position: relative;
          overflow: hidden;
        }

        .header-bg::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: repeating-linear-gradient(
            45deg,
            transparent,
            transparent 10px,
            rgba(255,255,255,0.03) 10px,
            rgba(255,255,255,0.03) 20px
          );
          animation: slide 20s linear infinite;
        }

        @keyframes slide {
          0% { transform: translate(0, 0); }
          100% { transform: translate(50px, 50px); }
        }

        .logo-text {
          font-family: 'Archivo Black', sans-serif;
          font-size: 2rem;
          letter-spacing: -1px;
          text-transform: uppercase;
          color: white;
          text-shadow: 3px 3px 0 rgba(0,0,0,0.2);
        }

        .maple-leaf {
          position: absolute;
          font-size: 120px;
          opacity: 0.05;
          animation: float 20s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-30px) rotate(10deg); }
        }

        .product-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          border: 2px solid transparent;
          box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }

        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(220, 38, 38, 0.15);
          border-color: #dc2626;
        }

        .product-emoji {
          font-size: 80px;
          transition: transform 0.4s ease;
        }

        .product-card:hover .product-emoji {
          transform: scale(1.1) rotate(5deg);
        }

        .category-btn {
          padding: 12px 24px;
          border-radius: 100px;
          border: 2px solid #dc2626;
          background: white;
          color: #dc2626;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Work Sans', sans-serif;
        }

        .category-btn:hover {
          background: #dc2626;
          color: white;
          transform: translateY(-2px);
          box-shadow: 0 8px 16px rgba(220, 38, 38, 0.2);
        }

        .category-btn.active {
          background: #dc2626;
          color: white;
        }

        .add-to-cart-btn {
          background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%);
          color: white;
          padding: 14px 28px;
          border-radius: 100px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: 'Work Sans', sans-serif;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-size: 14px;
        }

        .add-to-cart-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 8px 24px rgba(220, 38, 38, 0.4);
        }

        .cart-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #dc2626;
          color: white;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          font-weight: 700;
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .search-input {
          padding: 14px 20px;
          padding-left: 48px;
          border: 2px solid #e5e7eb;
          border-radius: 100px;
          width: 100%;
          font-family: 'Work Sans', sans-serif;
          transition: all 0.3s ease;
        }

        .search-input:focus {
          outline: none;
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }

        .province-tag {
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .cart-sidebar {
          position: fixed;
          top: 0;
          right: 0;
          width: 100%;
          max-width: 450px;
          height: 100vh;
          background: white;
          box-shadow: -8px 0 40px rgba(0,0,0,0.15);
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1000;
          display: flex;
          flex-direction: column;
        }

        .cart-sidebar.open {
          transform: translateX(0);
        }

        .cart-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100vh;
          background: rgba(0,0,0,0.5);
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s ease;
          z-index: 999;
        }

        .cart-overlay.open {
          opacity: 1;
          pointer-events: all;
        }

        .stock-indicator {
          font-size: 12px;
          font-weight: 600;
        }

        .stock-low {
          color: #dc2626;
        }

        .stock-good {
          color: #059669;
        }
      `}</style>

      {/* Cart Overlay */}
      <div 
        className={`cart-overlay ${showCart ? 'open' : ''}`}
        onClick={() => setShowCart(false)}
      />

      {/* Cart Sidebar */}
      <div className={`cart-sidebar ${showCart ? 'open' : ''}`}>
        <div className="p-6 border-b flex items-center justify-between header-bg">
          <h2 className="text-2xl font-bold text-white">Your Cart</h2>
          <button onClick={() => setShowCart(false)} className="text-white hover:opacity-70">
            <X size={28} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart size={64} className="mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">Your cart is empty</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                  <div className="text-4xl">{item.image}</div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.name}</h3>
                    <p className="text-gray-600">${item.price.toFixed(2)} CAD</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => updateQuantity(item.id, -1)}
                      className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 hover:border-red-600 flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="font-semibold w-8 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      className="w-8 h-8 rounded-full bg-white border-2 border-gray-300 hover:border-red-600 flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="p-6 border-t bg-slate-50">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-semibold">Total:</span>
              <span className="text-2xl font-bold text-red-600">${cartTotal.toFixed(2)} CAD</span>
            </div>
            <button className="add-to-cart-btn w-full">
              Checkout Now
            </button>
          </div>
        )}
      </div>

      {/* Maple Leaf Decorations */}
      <div className="maple-leaf" style={{ top: '10%', left: '5%' }}>🍁</div>
      <div className="maple-leaf" style={{ top: '60%', right: '8%', animationDelay: '5s' }}>🍁</div>
      <div className="maple-leaf" style={{ top: '85%', left: '15%', animationDelay: '10s' }}>🍁</div>

      {/* Header */}
      <header className="header-bg text-white shadow-xl relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-5xl">🍁</div>
              <h1 className="logo-text">True North Market</h1>
            </div>
            
            <nav className="hidden md:flex items-center gap-8">
              <a href="#" className="hover:opacity-80 transition font-semibold">Shop</a>
              <a href="#" className="hover:opacity-80 transition font-semibold">About</a>
              <a href="#" className="hover:opacity-80 transition font-semibold">Contact</a>
            </nav>

            <div className="flex items-center gap-4">
              <button className="hover:opacity-80 transition">
                <User size={24} />
              </button>
              <button className="hover:opacity-80 transition">
                <Heart size={24} />
              </button>
              <button 
                className="relative hover:opacity-80 transition"
                onClick={() => setShowCart(true)}
              >
                <ShoppingCart size={24} />
                {cartCount > 0 && (
                  <span className="cart-badge">{cartCount}</span>
                )}
              </button>
              <button 
                className="md:hidden hover:opacity-80 transition"
                onClick={() => setMenuOpen(!menuOpen)}
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-6 py-16 text-center relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-4" style={{ fontFamily: 'Archivo Black, sans-serif' }}>
            Authentically Canadian
          </h2>
          <p className="text-xl text-red-100 mb-8 max-w-2xl mx-auto font-light">
            Discover premium products from coast to coast. Made in Canada, for Canadians.
          </p>
          <div className="flex items-center justify-center gap-2 text-red-100">
            <MapPin size={20} />
            <span className="font-semibold">Shipping across all provinces & territories</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        {/* Search and Filters */}
        <div className="mb-12">
          <div className="relative mb-8 max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search Canadian products..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            {categories.map(category => (
              <button
                key={category}
                className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card">
              <div className="p-6 text-center">
                <div className="product-emoji mb-4">{product.image}</div>
                <div className="mb-2">
                  <span className="province-tag">
                    <MapPin size={12} />
                    {product.province}
                  </span>
                </div>
                <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                <p className="text-gray-600 mb-1">{product.category}</p>
                <p className={`stock-indicator mb-4 ${product.stock < 30 ? 'stock-low' : 'stock-good'}`}>
                  {product.stock < 30 ? `Only ${product.stock} left!` : `${product.stock} in stock`}
                </p>
                <div className="text-2xl font-bold text-red-600 mb-4">
                  ${product.price.toFixed(2)} <span className="text-sm text-gray-500">CAD</span>
                </div>
                <button 
                  className="add-to-cart-btn"
                  onClick={() => addToCart(product)}
                >
                  Add to Cart
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-2xl text-gray-400">No products found</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white mt-20">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">About Us</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Your trusted source for authentic Canadian products, from the Rockies to the Atlantic.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Shop</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">All Products</a></li>
                <li><a href="#" className="hover:text-white transition">New Arrivals</a></li>
                <li><a href="#" className="hover:text-white transition">Best Sellers</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition">Shipping Info</a></li>
                <li><a href="#" className="hover:text-white transition">Returns</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-lg mb-4">Connect</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Instagram</a></li>
                <li><a href="#" className="hover:text-white transition">Facebook</a></li>
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>© 2026 True North Market. Proudly Canadian 🍁</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CanadianStore;
