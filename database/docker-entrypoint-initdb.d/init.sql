CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user'
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER,
    license_plate VARCHAR(20) UNIQUE NOT NULL,
    vin VARCHAR(17) UNIQUE
);

CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    invoice_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    total_amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending'
);

CREATE TABLE IF NOT EXISTS invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER REFERENCES invoices(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS feedback (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
    vehicle_id INTEGER REFERENCES vehicles(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    feedback_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dummy Data (converted from database/init_db.js)


-- Customers
INSERT INTO customers (first_name, last_name, email, phone) VALUES
('Alice', 'Smith', 'alice.smith@example.com', '111-222-3333') ON CONFLICT (email) DO NOTHING;
INSERT INTO customers (first_name, last_name, email, phone) VALUES
('Bob', 'Johnson', 'bob.johnson@example.com', '444-555-6666') ON CONFLICT (email) DO NOTHING;
INSERT INTO customers (first_name, last_name, email, phone) VALUES
('Charlie', 'Brown', 'charlie.brown@example.com', '777-888-9999') ON CONFLICT (email) DO NOTHING;

-- Vehicles (requires customer_id, so select it)
INSERT INTO vehicles (customer_id, make, model, year, license_plate, vin)
SELECT id, 'Toyota', 'Camry', 2020, 'ABC123', 'VINTOYOTA12345' FROM customers WHERE email = 'alice.smith@example.com' ON CONFLICT (license_plate) DO NOTHING;
INSERT INTO vehicles (customer_id, make, model, year, license_plate, vin)
SELECT id, 'Honda', 'Civic', 2018, 'DEF456', 'VINHONDA67890' FROM customers WHERE email = 'bob.johnson@example.com' ON CONFLICT (license_plate) DO NOTHING;

-- Services
INSERT INTO services (name, description, price) VALUES
('Oil Change', 'Standard oil and filter replacement', 59.99) ON CONFLICT (name) DO NOTHING;
INSERT INTO services (name, description, price) VALUES
('Tire Rotation', 'Rotate tires and check pressure', 29.99) ON CONFLICT (name) DO NOTHING;
INSERT INTO services (name, description, price) VALUES
('Brake Inspection', 'Inspect brake pads, rotors, and fluid', 79.99) ON CONFLICT (name) DO NOTHING;

-- Invoices (requires customer_id and vehicle_id)
INSERT INTO invoices (customer_id, vehicle_id, total_amount, status)
SELECT c.id, v.id, 89.98, 'paid'
FROM customers c, vehicles v
WHERE c.email = 'alice.smith@example.com' AND v.license_plate = 'ABC123';

INSERT INTO invoices (customer_id, vehicle_id, total_amount, status)
SELECT c.id, v.id, 79.99, 'pending'
FROM customers c, vehicles v
WHERE c.email = 'bob.johnson@example.com' AND v.license_plate = 'DEF456';

-- Invoice Items (requires invoice_id and service_id)
INSERT INTO invoice_items (invoice_id, service_id, quantity, unit_price)
SELECT i.id, s.id, 1, 59.99
FROM invoices i, services s
WHERE i.total_amount = 89.98 AND s.name = 'Oil Change';

INSERT INTO invoice_items (invoice_id, service_id, quantity, unit_price)
SELECT i.id, s.id, 1, 29.99
FROM invoices i, services s
WHERE i.total_amount = 89.98 AND s.name = 'Tire Rotation';

INSERT INTO invoice_items (invoice_id, service_id, quantity, unit_price)
SELECT i.id, s.id, 1, 79.99
FROM invoices i, services s
WHERE i.total_amount = 79.99 AND s.name = 'Brake Inspection';

-- Feedback (requires customer_id and vehicle_id)
INSERT INTO feedback (customer_id, vehicle_id, rating, comments)
SELECT c.id, v.id, 5, 'Great service, quick and efficient!'
FROM customers c, vehicles v
WHERE c.email = 'alice.smith@example.com' AND v.license_plate = 'ABC123';

INSERT INTO feedback (customer_id, vehicle_id, rating, comments)
SELECT c.id, v.id, 4, 'Good job, but took a bit longer than expected.'
FROM customers c, vehicles v
WHERE c.email = 'bob.johnson@example.com' AND v.license_plate = 'DEF456';
