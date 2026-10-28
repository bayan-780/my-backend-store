
-- =========================================
-- 1. USERS TABLE
-- =========================================
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_users_role CHECK (
        role IN ('admin', 'store_owner', 'customer')
    )
);

-- =========================================
-- 2. STORES TABLE
-- =========================================
CREATE TABLE stores (
    id UUID PRIMARY KEY,
    owner_id UUID,
    name VARCHAR(100),
    description TEXT,
    logo VARCHAR(500),
    status VARCHAR(20),
    rating NUMERIC(3, 1),
    CONSTRAINT fk_stores_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_stores_status CHECK (
        status IN ('pending', 'active', 'suspended')

    )
);

-- =========================================
-- 3. PRODUCTS TABLE
-- =========================================
CREATE TABLE products (
    id UUID PRIMARY KEY,
    store_id UUID,
    name VARCHAR(150),
    description TEXT,
    price NUMERIC(10, 2),
    currency VARCHAR(10) DEFAULT 'SAR',
    image VARCHAR(500),
    stock NUMERIC(10),
    category VARCHAR(50),
    CONSTRAINT fk_products_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE
);

-- =========================================
-- 4. ORDERS TABLE
-- =========================================
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE,
    store_id UUID,
    customer_id UUID,
    customer_name VARCHAR(100),
    customer_phone VARCHAR(20),

    customer_address TEXT,
    total NUMERIC(10, 2),
    status VARCHAR(20) DEFAULT 'pending',
    payment_method VARCHAR(20) DEFAULT 'COD',
    delivery_method VARCHAR(20),
    CONSTRAINT fk_orders_store FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =========================================
-- 5. ORDER_ITEMS TABLE
-- =========================================
CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID,
    product_id UUID,
    product_name_at_purchase VARCHAR(150),
    price_at_purchase NUMERIC(10, 2),
    quantity NUMERIC(10),
    CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
