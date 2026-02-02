-- ================================================
-- CANADIAN STORE DATABASE SCHEMA
-- ================================================
-- This schema supports a full e-commerce platform
-- for a Canadian online store
-- ================================================

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS provinces;

-- ================================================
-- PROVINCES TABLE
-- ================================================
CREATE TABLE provinces (
    province_id INT PRIMARY KEY AUTO_INCREMENT,
    province_code CHAR(2) NOT NULL UNIQUE,
    province_name VARCHAR(50) NOT NULL,
    tax_rate DECIMAL(5,4) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Canadian provinces and territories
INSERT INTO provinces (province_code, province_name, tax_rate) VALUES
('AB', 'Alberta', 0.05),
('BC', 'British Columbia', 0.12),
('MB', 'Manitoba', 0.12),
('NB', 'New Brunswick', 0.15),
('NL', 'Newfoundland and Labrador', 0.15),
('NS', 'Nova Scotia', 0.15),
('ON', 'Ontario', 0.13),
('PE', 'Prince Edward Island', 0.15),
('QC', 'Quebec', 0.14975),
('SK', 'Saskatchewan', 0.11),
('NT', 'Northwest Territories', 0.05),
('NU', 'Nunavut', 0.05),
('YT', 'Yukon', 0.05);

-- ================================================
-- CUSTOMERS TABLE
-- ================================================
CREATE TABLE customers (
    customer_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    
    -- Address fields
    street_address VARCHAR(255),
    city VARCHAR(100),
    province_id INT,
    postal_code VARCHAR(7),
    
    -- Account info
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    loyalty_points INT DEFAULT 0,
    
    FOREIGN KEY (province_id) REFERENCES provinces(province_id),
    INDEX idx_email (email),
    INDEX idx_province (province_id)
);

-- ================================================
-- CATEGORIES TABLE
-- ================================================
CREATE TABLE categories (
    category_id INT PRIMARY KEY AUTO_INCREMENT,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    image_url VARCHAR(255),
    display_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO categories (category_name, description, display_order) VALUES
('Food', 'Authentic Canadian food products including maple syrup, jams, and specialty items', 1),
('Apparel', 'Canadian-made clothing and accessories', 2),
('Home', 'Home decor and lifestyle products', 3),
('Gifts', 'Perfect gifts showcasing Canadian culture', 4),
('Outdoor', 'Gear for the great Canadian outdoors', 5);

-- ================================================
-- PRODUCTS TABLE
-- ================================================
CREATE TABLE products (
    product_id INT PRIMARY KEY AUTO_INCREMENT,
    category_id INT NOT NULL,
    sku VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Pricing in CAD
    price DECIMAL(10,2) NOT NULL,
    sale_price DECIMAL(10,2),
    cost DECIMAL(10,2),
    
    -- Inventory
    stock_quantity INT NOT NULL DEFAULT 0,
    low_stock_threshold INT DEFAULT 10,
    
    -- Product details
    origin_province_id INT,
    weight_grams INT,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- SEO and display
    image_url VARCHAR(255),
    image_emoji VARCHAR(10),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (category_id) REFERENCES categories(category_id),
    FOREIGN KEY (origin_province_id) REFERENCES provinces(province_id),
    INDEX idx_category (category_id),
    INDEX idx_active (is_active),
    INDEX idx_featured (is_featured),
    INDEX idx_stock (stock_quantity)
);

-- Insert sample products
INSERT INTO products (category_id, sku, product_name, description, price, stock_quantity, origin_province_id, image_emoji) VALUES
(1, 'FOOD-MAP-001', 'Canadian Maple Syrup', 'Pure grade A maple syrup from Quebec sugar shacks', 24.99, 45, 9, '🍁'),
(2, 'APP-JER-001', 'Hockey Jersey', 'Official Canadian hockey team jersey', 89.99, 23, 7, '🏒'),
(1, 'FOOD-COF-001', 'Artisan Coffee Beans', 'Small batch roasted beans from British Columbia', 18.99, 67, 2, '☕'),
(2, 'APP-TOU-001', 'Wool Toque', 'Hand-knitted winter toque', 34.99, 89, 1, '🧢'),
(1, 'FOOD-JAM-001', 'Wild Blueberry Jam', 'Wild blueberries from Nova Scotia', 12.99, 34, 6, '🫐'),
(3, 'HOME-CAN-001', 'Cedar Candle', 'BC cedar scented natural wax candle', 28.99, 56, 2, '🕯️'),
(2, 'APP-SHI-001', 'Flannel Shirt', 'Classic Canadian flannel shirt', 64.99, 41, 7, '👔'),
(1, 'FOOD-WIN-001', 'Ice Wine', 'Premium Ontario ice wine 375ml', 54.99, 18, 7, '🍷');

-- ================================================
-- REVIEWS TABLE
-- ================================================
CREATE TABLE reviews (
    review_id INT PRIMARY KEY AUTO_INCREMENT,
    product_id INT NOT NULL,
    customer_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(200),
    review_text TEXT,
    is_verified_purchase BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    INDEX idx_product (product_id),
    INDEX idx_rating (rating)
);

-- ================================================
-- CART ITEMS TABLE
-- ================================================
CREATE TABLE cart_items (
    cart_item_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    UNIQUE KEY unique_cart_item (customer_id, product_id),
    INDEX idx_customer (customer_id)
);

-- ================================================
-- ORDERS TABLE
-- ================================================
CREATE TABLE orders (
    order_id INT PRIMARY KEY AUTO_INCREMENT,
    customer_id INT NOT NULL,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    
    -- Order status
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    
    -- Pricing
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Shipping info
    shipping_first_name VARCHAR(100),
    shipping_last_name VARCHAR(100),
    shipping_street VARCHAR(255),
    shipping_city VARCHAR(100),
    shipping_province_id INT,
    shipping_postal_code VARCHAR(7),
    
    -- Tracking
    tracking_number VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id),
    FOREIGN KEY (shipping_province_id) REFERENCES provinces(province_id),
    INDEX idx_customer (customer_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);

-- ================================================
-- ORDER ITEMS TABLE
-- ================================================
CREATE TABLE order_items (
    order_item_id INT PRIMARY KEY AUTO_INCREMENT,
    order_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    FOREIGN KEY (order_id) REFERENCES orders(order_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id),
    INDEX idx_order (order_id)
);

-- ================================================
-- USEFUL VIEWS
-- ================================================

-- View for product catalog with full details
CREATE VIEW product_catalog AS
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
    COUNT(r.review_id) as review_count
FROM products p
JOIN categories c ON p.category_id = c.category_id
LEFT JOIN provinces pr ON p.origin_province_id = pr.province_id
LEFT JOIN reviews r ON p.product_id = r.product_id
GROUP BY p.product_id;

-- View for customer orders summary
CREATE VIEW customer_order_summary AS
SELECT 
    c.customer_id,
    c.email,
    c.first_name,
    c.last_name,
    COUNT(o.order_id) as total_orders,
    COALESCE(SUM(o.total_amount), 0) as total_spent,
    MAX(o.created_at) as last_order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id;

-- ================================================
-- SAMPLE QUERIES
-- ================================================

-- Get all products in a specific category with stock info
-- SELECT * FROM product_catalog WHERE category_name = 'Food' AND stock_status != 'Out of Stock';

-- Get customer cart with product details
-- SELECT ci.quantity, p.product_name, p.price, (ci.quantity * p.price) as line_total
-- FROM cart_items ci
-- JOIN products p ON ci.product_id = p.product_id
-- WHERE ci.customer_id = 1;

-- Get order details with items
-- SELECT o.order_number, o.status, o.total_amount, oi.quantity, p.product_name, oi.total_price
-- FROM orders o
-- JOIN order_items oi ON o.order_id = oi.order_id
-- JOIN products p ON oi.product_id = p.product_id
-- WHERE o.order_id = 1;

-- Top selling products
-- SELECT p.product_name, SUM(oi.quantity) as units_sold, SUM(oi.total_price) as revenue
-- FROM products p
-- JOIN order_items oi ON p.product_id = oi.product_id
-- GROUP BY p.product_id
-- ORDER BY units_sold DESC
-- LIMIT 10;

-- ================================================
-- STORED PROCEDURES
-- ================================================

DELIMITER //

-- Procedure to add item to cart
CREATE PROCEDURE add_to_cart(
    IN p_customer_id INT,
    IN p_product_id INT,
    IN p_quantity INT
)
BEGIN
    INSERT INTO cart_items (customer_id, product_id, quantity)
    VALUES (p_customer_id, p_product_id, p_quantity)
    ON DUPLICATE KEY UPDATE quantity = quantity + p_quantity;
END//

-- Procedure to create order from cart
CREATE PROCEDURE create_order_from_cart(
    IN p_customer_id INT,
    IN p_province_id INT,
    OUT p_order_id INT
)
BEGIN
    DECLARE v_subtotal DECIMAL(10,2);
    DECLARE v_tax_rate DECIMAL(5,4);
    DECLARE v_tax_amount DECIMAL(10,2);
    DECLARE v_total DECIMAL(10,2);
    DECLARE v_order_number VARCHAR(50);
    
    -- Calculate subtotal
    SELECT SUM(ci.quantity * p.price) INTO v_subtotal
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    WHERE ci.customer_id = p_customer_id;
    
    -- Get tax rate
    SELECT tax_rate INTO v_tax_rate
    FROM provinces
    WHERE province_id = p_province_id;
    
    -- Calculate tax and total
    SET v_tax_amount = v_subtotal * v_tax_rate;
    SET v_total = v_subtotal + v_tax_amount;
    
    -- Generate order number
    SET v_order_number = CONCAT('ORD-', YEAR(NOW()), '-', LPAD(FLOOR(RAND() * 100000), 5, '0'));
    
    -- Create order
    INSERT INTO orders (customer_id, order_number, subtotal, tax_amount, total_amount, shipping_province_id)
    VALUES (p_customer_id, v_order_number, v_subtotal, v_tax_amount, v_total, p_province_id);
    
    SET p_order_id = LAST_INSERT_ID();
    
    -- Insert order items from cart
    INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
    SELECT p_order_id, ci.product_id, ci.quantity, p.price, ci.quantity * p.price
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.product_id
    WHERE ci.customer_id = p_customer_id;
    
    -- Update product stock
    UPDATE products p
    JOIN cart_items ci ON p.product_id = ci.product_id
    SET p.stock_quantity = p.stock_quantity - ci.quantity
    WHERE ci.customer_id = p_customer_id;
    
    -- Clear cart
    DELETE FROM cart_items WHERE customer_id = p_customer_id;
END//

DELIMITER ;

-- ================================================
-- INDEXES FOR PERFORMANCE
-- ================================================
-- Additional indexes for common queries

CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_created ON products(created_at DESC);
CREATE INDEX idx_orders_total ON orders(total_amount);
CREATE INDEX idx_reviews_created ON reviews(created_at DESC);sc
