# 🍁 Canadian Store - E-commerce Platform

A modern, full-stack e-commerce website for a Canadian store featuring React frontend, Node.js/Express backend, and MySQL database.

## Features

### Frontend (React)
- 🎨 **Beautiful Canadian-themed design** with maple leaf motifs and red/white color scheme
- 🛒 **Shopping cart** with real-time updates
- 🔍 **Product search and filtering** by category
- 📱 **Responsive design** for mobile and desktop
- 🎭 **Smooth animations** and interactive UI elements
- 🏷️ **Province-specific product information**

### Backend (Node.js + Express)
- 🔐 **JWT-based authentication**
- 🛡️ **Secure password hashing** with bcrypt
- 📦 **RESTful API** for all operations
- 💾 **MySQL database** with comprehensive schema
- ⚡ **Stored procedures** for complex operations
- 🔄 **Transaction management** for orders

### Database (MySQL)
- 📊 **Normalized schema** with 8+ tables
- 🇨🇦 **Canadian provinces** with tax rates
- 📦 **Product inventory** management
- 🛍️ **Order processing** system
- ⭐ **Customer reviews** and ratings
- 🎯 **Optimized queries** with indexes and views

## Tech Stack

**Frontend:**
- React 18
- Tailwind CSS
- Lucide React (icons)

**Backend:**
- Node.js
- Express.js
- MySQL2 (with promises)
- JWT for authentication
- Bcrypt for password hashing

**Database:**
- MySQL 8.0+

## Installation

### Prerequisites
- Node.js 16+ 
- MySQL 8.0+
- npm or yarn

### 1. Database Setup

```bash
# Login to MySQL
mysql -u root -p

# Create database
CREATE DATABASE canadian_store;

# Use the database
USE canadian_store;

# Import schema
source database-schema.sql
```

### 2. Backend Setup

```bash
# Install dependencies
npm install express mysql2 cors bcrypt jsonwebtoken dotenv

# Create .env file
touch .env
```

Edit `.env`:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=canadian_store
JWT_SECRET=your_super_secret_key_change_this
PORT=3001
```

```bash
# Start backend server
node backend-api.js
```

### 3. Frontend Setup

```bash
# Install React and dependencies
npx create-react-app canadian-store-frontend
cd canadian-store-frontend

# Install additional dependencies
npm install lucide-react

# Copy the React component
# Replace src/App.jsx with canadian-store.jsx content

# Start development server
npm start
```

## API Endpoints

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `GET /api/products/:id/reviews` - Get product reviews

### Categories
- `GET /api/categories` - Get all categories

### Cart (requires authentication)
- `GET /api/cart` - Get cart items
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/:itemId` - Update cart item quantity
- `DELETE /api/cart/:itemId` - Remove item from cart

### Orders (requires authentication)
- `GET /api/orders` - Get customer orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders` - Create order from cart

### Authentication
- `POST /api/auth/register` - Register new customer
- `POST /api/auth/login` - Login customer

### Provinces
- `GET /api/provinces` - Get all Canadian provinces with tax rates

## Database Schema Overview

### Main Tables
1. **customers** - Customer accounts and profiles
2. **products** - Product catalog
3. **categories** - Product categories
4. **provinces** - Canadian provinces with tax rates
5. **cart_items** - Shopping cart items
6. **orders** - Customer orders
7. **order_items** - Line items for orders
8. **reviews** - Product reviews and ratings

### Views
- `product_catalog` - Complete product information with ratings
- `customer_order_summary` - Customer spending summary

### Stored Procedures
- `add_to_cart()` - Add/update cart items
- `create_order_from_cart()` - Process checkout

## Sample Data

The database comes pre-populated with:
- ✅ All 13 Canadian provinces and territories
- ✅ 5 product categories
- ✅ 8 sample products (maple syrup, hockey jerseys, etc.)

## Usage Examples

### Adding a Product to Cart (with authentication)

```javascript
// Login first
const loginResponse = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        email: 'customer@example.com',
        password: 'password123'
    })
});
const { token } = await loginResponse.json();

// Add to cart
await fetch('http://localhost:3001/api/cart', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        productId: 1,
        quantity: 2
    })
});
```

### Searching Products

```javascript
// Search for maple products
const response = await fetch('http://localhost:3001/api/products?search=maple');
const { data } = await response.json();
console.log(data);
```

### Creating an Order

```javascript
await fetch('http://localhost:3001/api/orders', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
        shippingAddress: {
            firstName: 'John',
            lastName: 'Doe',
            street: '123 Maple Street',
            city: 'Toronto',
            provinceId: 7, // Ontario
            postalCode: 'M5H 2N2'
        }
    })
});
```

## Canadian Tax Rates (Built-in)

The system automatically calculates taxes based on province:
- Alberta (AB): 5%
- British Columbia (BC): 12%
- Manitoba (MB): 12%
- New Brunswick (NB): 15%
- Newfoundland and Labrador (NL): 15%
- Nova Scotia (NS): 15%
- Ontario (ON): 13%
- Prince Edward Island (PE): 15%
- Quebec (QC): 14.975%
- Saskatchewan (SK): 11%
- Northwest Territories (NT): 5%
- Nunavut (NU): 5%
- Yukon (YT): 5%

## Security Features

- 🔒 Password hashing with bcrypt (10 rounds)
- 🎫 JWT tokens with 7-day expiration
- 🛡️ SQL injection prevention with prepared statements
- 🔐 Authentication required for cart and orders
- ✅ Input validation on all endpoints

## Future Enhancements

- [ ] Email notifications for orders
- [ ] Payment gateway integration (Stripe)
- [ ] Product image upload
- [ ] Admin dashboard
- [ ] Wishlist functionality
- [ ] Product recommendations
- [ ] Inventory alerts
- [ ] Customer loyalty program
- [ ] Multi-language support (English/French)

## License

MIT License - feel free to use for your projects!

## Support

For issues or questions, please create an issue in the repository.

---

**Made with 🍁 in Canada**
