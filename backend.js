// ================================================
// CANADIAN STORE BACKEND API
// Node.js + Express + MySQL
// ================================================

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ================================================
// DATABASE CONNECTION
// ================================================
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'canadian_store',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Test database connection
pool.getConnection()
    .then(connection => {
        console.log('✅ Database connected successfully');
        connection.release();
    })
    .catch(err => {
        console.error('❌ Database connection failed:', err);
    });

// ================================================
// AUTHENTICATION MIDDLEWARE
// ================================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

// ================================================
// PRODUCTS ENDPOINTS
// ================================================

// Get all products with filters
app.get('/api/products', async (req, res) => {
    try {
        const { category, search, minPrice, maxPrice, province } = req.query;
        
        let query = `
            SELECT 
                p.product_id,
                p.sku,
                p.product_name,
                p.description,
                p.price,
                p.sale_price,
                p.stock_quantity,
                p.image_emoji,
                c.category_name,
                pr.province_name as origin_province,
                CASE 
                    WHEN p.stock_quantity = 0 THEN 'Out of Stock'
                    WHEN p.stock_quantity <= p.low_stock_threshold THEN 'Low Stock'
                    ELSE 'In Stock'
                END as stock_status,
                COALESCE(AVG(r.rating), 0) as avg_rating,
                COUNT(DISTINCT r.review_id) as review_count
            FROM products p
            JOIN categories c ON p.category_id = c.category_id
            LEFT JOIN provinces pr ON p.origin_province_id = pr.province_id
            LEFT JOIN reviews r ON p.product_id = r.product_id
            WHERE p.is_active = TRUE
        `;
        
        const params = [];
        
        if (category) {
            query += ' AND c.category_name = ?';
            params.push(category);
        }
        
        if (search) {
            query += ' AND (p.product_name LIKE ? OR p.description LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }
        
        if (minPrice) {
            query += ' AND p.price >= ?';
            params.push(parseFloat(minPrice));
        }
        
        if (maxPrice) {
            query += ' AND p.price <= ?';
            params.push(parseFloat(maxPrice));
        }
        
        if (province) {
            query += ' AND pr.province_name = ?';
            params.push(province);
        }
        
        query += ' GROUP BY p.product_id ORDER BY p.product_name';
        
        const [products] = await pool.execute(query, params);
        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Get single product details
app.get('/api/products/:id', async (req, res) => {
    try {
        const [products] = await pool.execute(`
            SELECT * FROM product_catalog WHERE product_id = ?
        `, [req.params.id]);
        
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({ success: true, data: products[0] });
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Get product reviews
app.get('/api/products/:id/reviews', async (req, res) => {
    try {
        const [reviews] = await pool.execute(`
            SELECT 
                r.review_id,
                r.rating,
                r.title,
                r.review_text,
                r.is_verified_purchase,
                r.helpful_count,
                r.created_at,
                c.first_name,
                c.last_name
            FROM reviews r
            JOIN customers c ON r.customer_id = c.customer_id
            WHERE r.product_id = ?
            ORDER BY r.created_at DESC
        `, [req.params.id]);
        
        res.json({ success: true, data: reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
});

// ================================================
// CATEGORIES ENDPOINTS
// ================================================

app.get('/api/categories', async (req, res) => {
    try {
        const [categories] = await pool.execute(`
            SELECT 
                c.category_id,
                c.category_name,
                c.description,
                COUNT(p.product_id) as product_count
            FROM categories c
            LEFT JOIN products p ON c.category_id = p.category_id AND p.is_active = TRUE
            WHERE c.is_active = TRUE
            GROUP BY c.category_id
            ORDER BY c.display_order
        `);
        
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// ================================================
// CART ENDPOINTS
// ================================================

// Get cart items
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const [items] = await pool.execute(`
            SELECT 
                ci.cart_item_id,
                ci.quantity,
                p.product_id,
                p.product_name,
                p.price,
                p.image_emoji,
                p.stock_quantity,
                (ci.quantity * p.price) as line_total
            FROM cart_items ci
            JOIN products p ON ci.product_id = p.product_id
            WHERE ci.customer_id = ?
        `, [req.user.customerId]);
        
        const total = items.reduce((sum, item) => sum + parseFloat(item.line_total), 0);
        
        res.json({ 
            success: true, 
            data: {
                items,
                subtotal: total.toFixed(2),
                itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
            }
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

// Add to cart
app.post('/api/cart', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        
        // Check product availability
        const [products] = await pool.execute(
            'SELECT stock_quantity FROM products WHERE product_id = ?',
            [productId]
        );
        
        if (products.length === 0) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        if (products[0].stock_quantity < quantity) {
            return res.status(400).json({ error: 'Insufficient stock' });
        }
        
        // Add to cart using stored procedure
        await pool.execute(
            'CALL add_to_cart(?, ?, ?)',
            [req.user.customerId, productId, quantity]
        );
        
        res.json({ success: true, message: 'Item added to cart' });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ error: 'Failed to add to cart' });
    }
});

// Update cart item quantity
app.put('/api/cart/:itemId', authenticateToken, async (req, res) => {
    try {
        const { quantity } = req.body;
        
        if (quantity <= 0) {
            // Remove item if quantity is 0 or negative
            await pool.execute(
                'DELETE FROM cart_items WHERE cart_item_id = ? AND customer_id = ?',
                [req.params.itemId, req.user.customerId]
            );
        } else {
            await pool.execute(
                'UPDATE cart_items SET quantity = ? WHERE cart_item_id = ? AND customer_id = ?',
                [quantity, req.params.itemId, req.user.customerId]
            );
        }
        
        res.json({ success: true, message: 'Cart updated' });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

// Remove from cart
app.delete('/api/cart/:itemId', authenticateToken, async (req, res) => {
    try {
        await pool.execute(
            'DELETE FROM cart_items WHERE cart_item_id = ? AND customer_id = ?',
            [req.params.itemId, req.user.customerId]
        );
        
        res.json({ success: true, message: 'Item removed from cart' });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ error: 'Failed to remove item' });
    }
});

// ================================================
// ORDERS ENDPOINTS
// ================================================

// Create order from cart
app.post('/api/orders', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    
    try {
        await connection.beginTransaction();
        
        const { shippingAddress } = req.body;
        
        // Call stored procedure to create order
        const [result] = await connection.execute(
            'CALL create_order_from_cart(?, ?, @order_id)',
            [req.user.customerId, shippingAddress.provinceId]
        );
        
        // Get the order ID
        const [orderIdResult] = await connection.execute('SELECT @order_id as order_id');
        const orderId = orderIdResult[0].order_id;
        
        // Update shipping address
        await connection.execute(`
            UPDATE orders SET
                shipping_first_name = ?,
                shipping_last_name = ?,
                shipping_street = ?,
                shipping_city = ?,
                shipping_postal_code = ?
            WHERE order_id = ?
        `, [
            shippingAddress.firstName,
            shippingAddress.lastName,
            shippingAddress.street,
            shippingAddress.city,
            shippingAddress.postalCode,
            orderId
        ]);
        
        await connection.commit();
        
        res.json({ 
            success: true, 
            message: 'Order created successfully',
            orderId: orderId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    } finally {
        connection.release();
    }
});

// Get customer orders
app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.execute(`
            SELECT 
                o.order_id,
                o.order_number,
                o.status,
                o.total_amount,
                o.created_at,
                COUNT(oi.order_item_id) as item_count
            FROM orders o
            LEFT JOIN order_items oi ON o.order_id = oi.order_id
            WHERE o.customer_id = ?
            GROUP BY o.order_id
            ORDER BY o.created_at DESC
        `, [req.user.customerId]);
        
        res.json({ success: true, data: orders });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Get order details
app.get('/api/orders/:id', authenticateToken, async (req, res) => {
    try {
        const [orders] = await pool.execute(`
            SELECT 
                o.*,
                p.province_name as shipping_province
            FROM orders o
            LEFT JOIN provinces p ON o.shipping_province_id = p.province_id
            WHERE o.order_id = ? AND o.customer_id = ?
        `, [req.params.id, req.user.customerId]);
        
        if (orders.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const [items] = await pool.execute(`
            SELECT 
                oi.*,
                p.product_name,
                p.image_emoji
            FROM order_items oi
            JOIN products p ON oi.product_id = p.product_id
            WHERE oi.order_id = ?
        `, [req.params.id]);
        
        res.json({ 
            success: true, 
            data: {
                ...orders[0],
                items
            }
        });
    } catch (error) {
        console.error('Error fetching order:', error);
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// ================================================
// AUTHENTICATION ENDPOINTS
// ================================================

// Register new customer
app.post('/api/auth/register', async (req, res) => {
    try {
        const { email, password, firstName, lastName, phone } = req.body;
        
        // Check if email already exists
        const [existing] = await pool.execute(
            'SELECT customer_id FROM customers WHERE email = ?',
            [email]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Email already registered' });
        }
        
        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);
        
        // Insert new customer
        const [result] = await pool.execute(`
            INSERT INTO customers (email, password_hash, first_name, last_name, phone)
            VALUES (?, ?, ?, ?, ?)
        `, [email, passwordHash, firstName, lastName, phone]);
        
        // Generate JWT token
        const token = jwt.sign(
            { customerId: result.insertId, email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        res.json({ 
            success: true, 
            message: 'Registration successful',
            token,
            customer: { id: result.insertId, email, firstName, lastName }
        });
    } catch (error) {
        console.error('Error registering customer:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Get customer
        const [customers] = await pool.execute(
            'SELECT * FROM customers WHERE email = ? AND is_active = TRUE',
            [email]
        );
        
        if (customers.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        const customer = customers[0];
        
        // Verify password
        const validPassword = await bcrypt.compare(password, customer.password_hash);
        
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        
        // Update last login
        await pool.execute(
            'UPDATE customers SET last_login = CURRENT_TIMESTAMP WHERE customer_id = ?',
            [customer.customer_id]
        );
        
        // Generate JWT token
        const token = jwt.sign(
            { customerId: customer.customer_id, email: customer.email },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '7d' }
        );
        
        res.json({ 
            success: true,
            token,
            customer: {
                id: customer.customer_id,
                email: customer.email,
                firstName: customer.first_name,
                lastName: customer.last_name
            }
        });
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// ================================================
// PROVINCES ENDPOINT
// ================================================

app.get('/api/provinces', async (req, res) => {
    try {
        const [provinces] = await pool.execute(
            'SELECT * FROM provinces ORDER BY province_name'
        );
        res.json({ success: true, data: provinces });
    } catch (error) {
        console.error('Error fetching provinces:', error);
        res.status(500).json({ error: 'Failed to fetch provinces' });
    }
});

// ================================================
// START SERVER
// ================================================

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🍁 Canadian Store API ready`);
});

module.exports = app;
