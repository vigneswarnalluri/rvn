const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.resolve(__dirname, 'RVN.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    // 1. Categories Table
    db.run(`
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            icon TEXT,
            image TEXT
        )
    `);

    // 2. Brands Table
    db.run(`
        CREATE TABLE IF NOT EXISTS brands (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            logo TEXT
        )
    `);

    // 3. Products Table
    db.run(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT NOT NULL,
            price REAL NOT NULL,
            old_price REAL,
            stock INTEGER DEFAULT 50,
            category_id INTEGER,
            brand_id INTEGER,
            rating REAL DEFAULT 4.5,
            reviews_count INTEGER DEFAULT 12,
            image TEXT NOT NULL,
            description TEXT,
            is_featured INTEGER DEFAULT 0,
            is_new INTEGER DEFAULT 1,
            FOREIGN KEY (category_id) REFERENCES categories(id)
        )
    `);

    // 4. Orders Table
    db.run(`
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_number TEXT UNIQUE NOT NULL,
            customer_name TEXT NOT NULL,
            customer_email TEXT NOT NULL,
            customer_phone TEXT,
            shipping_address TEXT NOT NULL,
            city TEXT NOT NULL,
            zip_code TEXT NOT NULL,
            total_amount REAL NOT NULL,
            payment_method TEXT DEFAULT 'Credit Card',
            status TEXT DEFAULT 'Processing',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // 5. Order Items Table
    db.run(`
        CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER NOT NULL,
            product_id INTEGER NOT NULL,
            product_title TEXT NOT NULL,
            price REAL NOT NULL,
            quantity INTEGER NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders(id)
        )
    `);

    // 6. Users / Admin Table
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Seed default admin user
    db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (!row || row.count === 0) {
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            db.run('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
                ['Admin User', 'admin@rvn.local', hashedPassword, 'admin']);
        }
    });

    // Seed Categories, Brands, Products, Orders if empty
    db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
        if (!row || row.count === 0) {
            console.log('Seeding initial categories, brands, and expanded products...');
            
            const categories = [
                ['Headphones & Audio', 'headphones', 'rbt-cat-1.png'],
                ['Charging Cables', 'cables', 'rbt-cat-2.png'],
                ['Power Adapters', 'adapters', 'rbt-cat-3.png'],
                ['Power Banks', 'powerbanks', 'rbt-cat-4.png'],
                ['Bluetooth Speakers', 'speakers', 'rbt-cat-5.png'],
                ['Smart Watches', 'watches', 'rbt-cat-6.png'],
                ['Smart TVs & Electronics', 'tvs', 'rbt-cat-7.png']
            ];
            
            const stmtCat = db.prepare('INSERT INTO categories (name, slug, image) VALUES (?, ?, ?)');
            categories.forEach(cat => stmtCat.run(cat[0], cat[1], cat[2]));
            stmtCat.finalize();

            const brands = [
                ['Apple', 'brand-1.png'],
                ['Samsung', 'brand-2.png'],
                ['Sony', 'brand-3.png'],
                ['JBL', 'brand-4.png'],
                ['Bose', 'brand-5.png']
            ];
            const stmtBrand = db.prepare('INSERT INTO brands (name, logo) VALUES (?, ?)');
            brands.forEach(b => stmtBrand.run(b[0], b[1]));
            stmtBrand.finalize();

            const products = [
                ['Wireless ANC Noise Cancelling Headphones', 'wireless-anc-headphones', 199.99, 249.99, 45, 1, 3, 4.8, 48, 'assets/images/product-img/electronics/electronics-bg-trans-01-a-1.webp', 'Premium active noise cancelling over-ear headphones with 30-hour battery life.', 1, 1],
                ['Fast Charging USB-C Braided Cable 6ft', 'usbc-braided-cable', 19.99, 29.99, 120, 2, 1, 4.6, 95, 'assets/images/product-img/electronics/electronics-bg-trans-02-a-1.webp', 'Durable nylon braided USB-C fast charging cable compatible with all modern smartphones.', 1, 0],
                ['65W Dual Port GaN Fast Wall Charger', '65w-gan-charger', 39.99, 49.99, 80, 3, 1, 4.9, 64, 'assets/images/product-img/electronics/electronics-bg-trans-03-a-1.webp', 'Ultra compact GaN technology fast charger for laptops, tablets and phones.', 1, 1],
                ['20,000mAh Ultra Slim Power Bank', '20000mah-power-bank', 49.99, 59.99, 65, 4, 2, 4.7, 31, 'assets/images/product-img/electronics/electronics-bg-trans-04-a-1.webp', 'High-capacity slim portable power bank with digital LED battery percentage display.', 0, 1],
                ['Waterproof Portable Bluetooth Speaker', 'portable-bluetooth-speaker', 79.99, 99.99, 50, 5, 4, 4.8, 112, 'assets/images/product-img/electronics/electronics-bg-trans-05-a-1.webp', 'IPX7 waterproof wireless speaker with deep bass and 15-hour playback.', 1, 0],
                ['Fitness Smartwatch with Heart Rate & GPS', 'fitness-smartwatch-gps', 149.99, 189.99, 35, 6, 2, 4.5, 27, 'assets/images/product-img/electronics/electronics-bg-trans-06-a-1.webp', 'Smart fitness tracking watch with AMOLED screen, blood oxygen monitor, and custom dials.', 1, 1],
                ['55" 4K Ultra HD Smart HDR OLED TV', '55-4k-oled-tv', 799.99, 999.99, 15, 7, 3, 4.9, 83, 'assets/images/product-img/electronics/electronics-bg-trans-07-a-1.webp', 'Stunning 4K OLED display with Dolby Vision, voice assistant support, and gaming mode.', 1, 0],
                ['Wireless Studio Earbuds with Charging Case', 'studio-wireless-earbuds', 89.99, 119.99, 90, 1, 3, 4.6, 52, 'assets/images/product-img/electronics/electronics-bg-trans-08-a-1.webp', 'Crystal clear audio calling, touch controls, and compact wireless charging case.', 0, 1],
                ['Over-Ear Hi-Fi Studio Monitor Headphones', 'hifi-studio-headphones', 129.99, 159.99, 40, 1, 5, 4.7, 36, 'assets/images/product-img/electronics/electronics-bg-trans-01-a-1.webp', 'Professional studio monitoring headphones with neutral sound curve and soft ear cushions.', 0, 0],
                ['MagSafe Wireless Charging Pad 15W', 'magsafe-charging-pad', 29.99, 39.99, 110, 3, 1, 4.8, 75, 'assets/images/product-img/electronics/electronics-bg-trans-03-a-1.webp', 'Fast magnetic wireless charger compatible with iPhone and Qi-enabled devices.', 1, 1],
                ['30,000mAh Heavy Duty Power Bank w/ Flashlight', '30000mah-heavy-powerbank', 69.99, 89.99, 42, 4, 2, 4.6, 44, 'assets/images/product-img/electronics/electronics-bg-trans-04-a-1.webp', 'Rugged outdoor power station with triple USB output and built-in emergency LED flashlight.', 0, 0],
                ['Boombox Wireless Party Speaker 60W', 'boombox-party-speaker', 179.99, 219.99, 25, 5, 4, 4.9, 68, 'assets/images/product-img/electronics/electronics-bg-trans-05-a-1.webp', 'High power party speaker with dynamic RGB party light show and deep subwoofer bass.', 1, 1],
                ['AMOLED Ultra Smart Watch w/ Titanium Case', 'amoled-titanium-smartwatch', 249.99, 299.99, 20, 6, 2, 4.9, 19, 'assets/images/product-img/electronics/electronics-bg-trans-06-a-1.webp', 'Rugged titanium alloy smartwatch with always-on display, ECG monitoring, and GPS navigation.', 1, 1],
                ['65" 8K QLED Quantum Dot Smart TV', '65-8k-qled-tv', 1499.99, 1899.99, 10, 7, 2, 5.0, 42, 'assets/images/product-img/electronics/electronics-bg-trans-07-a-1.webp', 'Ultimate 8K clarity with Quantum Dot color accuracy and 120Hz smooth gaming refresh rate.', 1, 1],
                ['Noise Isolating In-Ear Neckband Earphones', 'neckband-wireless-earphones', 34.99, 44.99, 85, 1, 4, 4.4, 29, 'assets/images/product-img/electronics/electronics-bg-trans-08-a-1.webp', 'Flexible magnetic neckband bluetooth earphones with magnetic earbuds and HD mic.', 0, 0],
                ['Lightning to USB-C Fast Sync Cable 3ft', 'lightning-usbc-cable-3ft', 14.99, 19.99, 150, 2, 1, 4.7, 108, 'assets/images/product-img/electronics/electronics-bg-trans-02-a-1.webp', 'MFi certified Lightning cable for high speed data sync and fast charging.', 0, 0]
            ];

            const stmtProd = db.prepare(`
                INSERT INTO products 
                (title, slug, price, old_price, stock, category_id, brand_id, rating, reviews_count, image, description, is_featured, is_new) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            products.forEach(p => stmtProd.run(p));
            stmtProd.finalize();

            // Seed initial orders
            const orders = [
                ['ORD-9856', 'Emay Walter', 'emay@RVN.local', '+1 (555) 234-5678', '123 Market Street, Suite 400', 'San Francisco', '94105', 6659.00, 'Credit Card', 'Processing'],
                ['ORD-9855', 'Sarah Jenkins', 'sarah.j@example.com', '+1 (555) 987-6543', '742 Evergreen Terrace', 'Springfield', '97477', 249.99, 'PayPal', 'Completed'],
                ['ORD-9854', 'David Miller', 'david.m@example.com', '+1 (555) 456-7890', '100 North Main Ave', 'Austin', '73301', 129.50, 'Credit Card', 'Shipped']
            ];

            const stmtOrder = db.prepare(`
                INSERT INTO orders 
                (order_number, customer_name, customer_email, customer_phone, shipping_address, city, zip_code, total_amount, payment_method, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);
            orders.forEach(o => stmtOrder.run(o));
            stmtOrder.finalize();

            console.log('Database seeded successfully with expanded products & default admin user!');
        }
    });
});

module.exports = db;
