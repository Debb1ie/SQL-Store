-- ================================================
-- SAMPLE SQL QUERIES FOR CANADIAN STORE
-- Common queries for daily operations
-- ================================================

-- ================================================
-- PRODUCT QUERIES
-- ================================================

-- 1. Get all products with full details
SELECT * FROM product_catalog;

-- 2. Get products by category
SELECT * FROM product_catalog 
WHERE category_name = 'Food';

-- 3. Get low stock products
SELECT 
    product_name,
    stock_quantity,
    low_stock_threshold
FROM products
WHERE stock_quantity <= low_stock_threshold
ORDER BY stock_quantity ASC;

-- 4. Get best-selling products (last 30 days)
SELECT 
    p.product_name,
    SUM(oi.quantity) as units_sold,
    SUM(oi.total_price) as total_revenue
FROM products p
JOIN order_items oi ON p.product_id = oi.product_id
JOIN orders o ON oi.order_id = o.order_id
WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY p.product_id
ORDER BY units_sold DESC
LIMIT 10;

-- 5. Get products by province
SELECT 
    p.product_name,
    p.price,
    pr.province_name,
    p.stock_quantity
FROM products p
JOIN provinces pr ON p.origin_province_id = pr.province_id
WHERE pr.province_name = 'Quebec'
ORDER BY p.product_name;

-- 6. Get products with average rating above 4 stars
SELECT 
    pc.product_name,
    pc.avg_rating,
    pc.review_count,
    pc.price
FROM product_catalog pc
WHERE pc.avg_rating >= 4.0 AND pc.review_count > 0
ORDER BY pc.avg_rating DESC, pc.review_count DESC;

-- ================================================
-- CUSTOMER QUERIES
-- ================================================

-- 7. Get customer order summary
SELECT * FROM customer_order_summary
ORDER BY total_spent DESC;

-- 8. Get top 10 customers by spending
SELECT 
    c.customer_id,
    c.first_name,
    c.last_name,
    c.email,
    COUNT(o.order_id) as order_count,
    SUM(o.total_amount) as total_spent
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id
ORDER BY total_spent DESC
LIMIT 10;

-- 9. Get customers who haven't ordered in 90 days
SELECT 
    c.customer_id,
    c.email,
    c.first_name,
    c.last_name,
    MAX(o.created_at) as last_order_date
FROM customers c
LEFT JOIN orders o ON c.customer_id = o.customer_id
GROUP BY c.customer_id
HAVING last_order_date < DATE_SUB(NOW(), INTERVAL 90 DAY)
    OR last_order_date IS NULL;

-- 10. Get new customers (registered in last 30 days)
SELECT 
    customer_id,
    email,
    first_name,
    last_name,
    created_at
FROM customers
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
ORDER BY created_at DESC;

-- ================================================
-- ORDER QUERIES
-- ================================================

-- 11. Get order details with items
SELECT 
    o.order_id,
    o.order_number,
    o.status,
    c.email,
    p.product_name,
    oi.quantity,
    oi.unit_price,
    oi.total_price
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items oi ON o.order_id = oi.order_id
JOIN products p ON oi.product_id = p.product_id
WHERE o.order_id = 1;

-- 12. Get orders by status
SELECT 
    order_id,
    order_number,
    customer_id,
    total_amount,
    created_at
FROM orders
WHERE status = 'processing'
ORDER BY created_at DESC;

-- 13. Get sales by province (last 30 days)
SELECT 
    pr.province_name,
    COUNT(o.order_id) as order_count,
    SUM(o.total_amount) as total_sales,
    AVG(o.total_amount) as avg_order_value
FROM orders o
JOIN provinces pr ON o.shipping_province_id = pr.province_id
WHERE o.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY pr.province_id
ORDER BY total_sales DESC;

-- 14. Get daily sales summary
SELECT 
    DATE(created_at) as sale_date,
    COUNT(order_id) as orders,
    SUM(total_amount) as revenue,
    AVG(total_amount) as avg_order
FROM orders
WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY DATE(created_at)
ORDER BY sale_date DESC;

-- 15. Get pending orders older than 24 hours
SELECT 
    o.order_id,
    o.order_number,
    c.email,
    c.first_name,
    c.last_name,
    o.created_at,
    TIMESTAMPDIFF(HOUR, o.created_at, NOW()) as hours_pending
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
WHERE o.status = 'pending'
AND o.created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY o.created_at ASC;

-- ================================================
-- CART QUERIES
-- ================================================

-- 16. Get cart contents for a customer
SELECT 
    ci.cart_item_id,
    p.product_name,
    p.price,
    ci.quantity,
    (p.price * ci.quantity) as line_total
FROM cart_items ci
JOIN products p ON ci.product_id = p.product_id
WHERE ci.customer_id = 1;

-- 17. Get abandoned carts (items added > 7 days ago, no orders)
SELECT 
    c.customer_id,
    c.email,
    COUNT(ci.cart_item_id) as items_in_cart,
    SUM(p.price * ci.quantity) as cart_value,
    MAX(ci.added_at) as last_updated
FROM customers c
JOIN cart_items ci ON c.customer_id = ci.customer_id
JOIN products p ON ci.product_id = p.product_id
WHERE ci.added_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY c.customer_id
ORDER BY cart_value DESC;

-- ================================================
-- REVIEW QUERIES
-- ================================================

-- 18. Get recent reviews
SELECT 
    r.review_id,
    p.product_name,
    c.first_name,
    c.last_name,
    r.rating,
    r.title,
    r.review_text,
    r.created_at
FROM reviews r
JOIN products p ON r.product_id = p.product_id
JOIN customers c ON r.customer_id = c.customer_id
ORDER BY r.created_at DESC
LIMIT 20;

-- 19. Get products needing reviews (low review count)
SELECT 
    p.product_name,
    COUNT(r.review_id) as review_count,
    COALESCE(AVG(r.rating), 0) as avg_rating
FROM products p
LEFT JOIN reviews r ON p.product_id = r.product_id
WHERE p.is_active = TRUE
GROUP BY p.product_id
HAVING review_count < 3
ORDER BY review_count ASC, p.product_name;

-- ================================================
-- INVENTORY QUERIES
-- ================================================

-- 20. Stock value by category
SELECT 
    c.category_name,
    COUNT(p.product_id) as product_count,
    SUM(p.stock_quantity) as total_units,
    SUM(p.stock_quantity * p.cost) as inventory_value
FROM products p
JOIN categories c ON p.category_id = c.category_id
WHERE p.is_active = TRUE
GROUP BY c.category_id
ORDER BY inventory_value DESC;

-- 21. Products that need restocking
SELECT 
    product_name,
    stock_quantity,
    low_stock_threshold,
    (low_stock_threshold - stock_quantity) as units_needed
FROM products
WHERE stock_quantity < low_stock_threshold
ORDER BY units_needed DESC;

-- ================================================
-- ANALYTICS QUERIES
-- ================================================

-- 22. Monthly revenue report
SELECT 
    YEAR(created_at) as year,
    MONTH(created_at) as month,
    COUNT(order_id) as orders,
    SUM(total_amount) as revenue,
    AVG(total_amount) as avg_order_value
FROM orders
WHERE status != 'cancelled'
GROUP BY YEAR(created_at), MONTH(created_at)
ORDER BY year DESC, month DESC;

-- 23. Category performance
SELECT 
    c.category_name,
    COUNT(DISTINCT oi.order_id) as orders,
    SUM(oi.quantity) as units_sold,
    SUM(oi.total_price) as revenue
FROM categories c
JOIN products p ON c.category_id = p.category_id
JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY c.category_id
ORDER BY revenue DESC;

-- 24. Customer lifetime value distribution
SELECT 
    CASE 
        WHEN total_spent < 100 THEN '< $100'
        WHEN total_spent < 500 THEN '$100-$500'
        WHEN total_spent < 1000 THEN '$500-$1000'
        ELSE '$1000+'
    END as spending_range,
    COUNT(*) as customer_count
FROM customer_order_summary
GROUP BY spending_range
ORDER BY MIN(total_spent);

-- 25. Product conversion rate (viewed vs purchased)
-- Note: This requires a views tracking table to be fully functional
-- Showing purchased products analysis instead
SELECT 
    p.product_name,
    COUNT(DISTINCT oi.order_id) as times_purchased,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.total_price) as total_revenue
FROM products p
LEFT JOIN order_items oi ON p.product_id = oi.product_id
GROUP BY p.product_id
ORDER BY times_purchased DESC;

-- ================================================
-- MAINTENANCE QUERIES
-- ================================================

-- 26. Clean up old cart items (> 30 days)
DELETE FROM cart_items 
WHERE added_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

-- 27. Update product stock levels after manual count
-- UPDATE products SET stock_quantity = ? WHERE product_id = ?;

-- 28. Deactivate discontinued products
UPDATE products 
SET is_active = FALSE 
WHERE stock_quantity = 0 
AND updated_at < DATE_SUB(NOW(), INTERVAL 90 DAY);

-- 29. Database size check
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) as size_mb
FROM information_schema.TABLES
WHERE table_schema = 'canadian_store'
ORDER BY (data_length + index_length) DESC;

-- 30. Row counts for all tables
SELECT 
    table_name,
    table_rows
FROM information_schema.TABLES
WHERE table_schema = 'canadian_store'
ORDER BY table_rows DESC;
