-- Database schema for billing system with inventory management

-- Users table with role-based access
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'ventas')),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(200),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    unit VARCHAR(20) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock table (inventory per warehouse)
CREATE TABLE IF NOT EXISTS stock (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    quantity DECIMAL(12, 2) NOT NULL DEFAULT 0,
    UNIQUE(product_id, warehouse_id)
);

-- Stock ledger (kardex) with cost tracking
CREATE TABLE IF NOT EXISTS stock_ledger (
    id SERIAL PRIMARY KEY,
    product_id INTEGER NOT NULL REFERENCES products(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    transaction_type VARCHAR(50) NOT NULL,
    transaction_date TIMESTAMP NOT NULL,
    reference_type VARCHAR(50),
    reference_id INTEGER,
    quantity DECIMAL(12, 2) NOT NULL,
    unit_cost DECIMAL(12, 2),
    value_change DECIMAL(12, 2),
    balance_quantity DECIMAL(12, 2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    identification VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL REFERENCES customers(id),
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    invoice_date DATE NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    tax DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity DECIMAL(12, 2) NOT NULL,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    tax DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL REFERENCES invoices(id),
    payment_date DATE NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warehouse transfers table
CREATE TABLE IF NOT EXISTS warehouse_transfers (
    id SERIAL PRIMARY KEY,
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    from_warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    to_warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    transfer_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    notes TEXT,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Transfer items table
CREATE TABLE IF NOT EXISTS transfer_items (
    id SERIAL PRIMARY KEY,
    transfer_id INTEGER NOT NULL REFERENCES warehouse_transfers(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity DECIMAL(12, 2) NOT NULL
);

-- Inventory adjustments table with approval workflow
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id SERIAL PRIMARY KEY,
    adjustment_number VARCHAR(50) UNIQUE NOT NULL,
    warehouse_id INTEGER NOT NULL REFERENCES warehouses(id),
    adjustment_type VARCHAR(20) NOT NULL CHECK (adjustment_type IN ('increase', 'decrease')),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    effective_at DATE NOT NULL,
    reason TEXT,
    submitted_by INTEGER REFERENCES users(id),
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMP,
    review_notes TEXT
);

-- Adjustment items table
CREATE TABLE IF NOT EXISTS adjustment_items (
    id SERIAL PRIMARY KEY,
    adjustment_id INTEGER NOT NULL REFERENCES inventory_adjustments(id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(id),
    quantity DECIMAL(12, 2) NOT NULL,
    unit_cost DECIMAL(12, 2),
    notes TEXT
);

-- Inventory periods table for period closing
CREATE TABLE IF NOT EXISTS inventory_periods (
    id SERIAL PRIMARY KEY,
    period_name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed')),
    closed_by INTEGER REFERENCES users(id),
    closed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stock_product ON stock(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_warehouse ON stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_ledger_product ON stock_ledger(product_id);
CREATE INDEX IF NOT EXISTS idx_ledger_warehouse ON stock_ledger(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_ledger_date ON stock_ledger(transaction_date);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_transfers_from ON warehouse_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfers_to ON warehouse_transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_warehouse ON inventory_adjustments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_status ON inventory_adjustments(status);

-- Insert default admin user (password: admin123)
-- Hash generated with bcrypt, cost 10
INSERT INTO users (username, password_hash, full_name, role) 
VALUES ('admin', '$2a$10$N9qo8uLOickgx2ZMRZoMye6p/0SNPo7MCDvCfwMYr1mj0E0pq7byu', 'Administrator', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert default sales user (password: sales123)
INSERT INTO users (username, password_hash, full_name, role) 
VALUES ('ventas', '$2a$10$6ZfY5UqQqFrzCMrKHVFz8e4Pq8rqzXqJqKNMJOqMn0LqKZQX6JhXO', 'Sales User', 'ventas')
ON CONFLICT (username) DO NOTHING;

-- Insert default warehouse
INSERT INTO warehouses (code, name, location) 
VALUES ('WH01', 'Main Warehouse', 'Main Location')
ON CONFLICT (code) DO NOTHING;
