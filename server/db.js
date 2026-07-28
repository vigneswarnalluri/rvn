const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const path = require('path');
const bcrypt = require('bcryptjs');

const keyPath = process.env.FIREBASE_KEY_PATH || 'firebase-key.json.json';
const serviceAccount = require(path.resolve(__dirname, keyPath));

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

// Seeding logic for Firestore
async function seedDatabase() {
    try {
        // 1. Seed Categories
        const categoriesCol = db.collection('categories');
        const catSnap = await categoriesCol.limit(1).get();
        if (catSnap.empty) {
            console.log('Seeding initial categories to Firestore...');
            const categories = [
                { id: 1, name: 'Headphones & Audio', slug: 'headphones', image: 'rbt-cat-1.png' },
                { id: 2, name: 'Charging Cables', slug: 'cables', image: 'rbt-cat-2.png' },
                { id: 3, name: 'Power Adapters', slug: 'adapters', image: 'rbt-cat-3.png' },
                { id: 4, name: 'Power Banks', slug: 'powerbanks', image: 'rbt-cat-4.png' },
                { id: 5, name: 'Bluetooth Speakers', slug: 'speakers', image: 'rbt-cat-5.png' },
                { id: 6, name: 'Smart Watches', slug: 'watches', image: 'rbt-cat-6.png' },
                { id: 7, name: 'Smart TVs & Electronics', slug: 'tvs', image: 'rbt-cat-7.png' }
            ];
            for (const cat of categories) {
                await categoriesCol.doc(String(cat.id)).set(cat);
            }
        }

        // 2. Seed Brands
        const brandsCol = db.collection('brands');
        const brandSnap = await brandsCol.limit(1).get();
        if (brandSnap.empty) {
            console.log('Seeding initial brands to Firestore...');
            const brands = [
                { id: 1, name: 'Apple', logo: 'brand-1.png' },
                { id: 2, name: 'Samsung', logo: 'brand-2.png' },
                { id: 3, name: 'Sony', logo: 'brand-3.png' },
                { id: 4, name: 'JBL', logo: 'brand-4.png' },
                { id: 5, name: 'Bose', logo: 'brand-5.png' }
            ];
            for (const b of brands) {
                await brandsCol.doc(String(b.id)).set(b);
            }
        }

        // 3. Seed Users (Admin)
        const usersCol = db.collection('users');
        const userSnap = await usersCol.limit(1).get();
        if (userSnap.empty) {
            console.log('Seeding default admin user to Firestore...');
            const hashedPassword = bcrypt.hashSync('admin123', 10);
            const defaultAdmin = {
                name: 'Admin User',
                email: 'admin@rvn.local',
                password: hashedPassword,
                role: 'admin',
                created_at: new Date().toISOString()
            };
            await usersCol.doc(defaultAdmin.email).set(defaultAdmin);
        }

        // 4. Seed Products
        const productsCol = db.collection('products');
        const prodSnap = await productsCol.limit(1).get();
        if (prodSnap.empty) {
            console.log('Seeding initial products to Firestore...');
            const products = [
                { id: 1, title: 'Wireless ANC Noise Cancelling Headphones', slug: 'wireless-anc-headphones', price: 199.99, old_price: 249.99, stock: 45, category_id: 1, brand_id: 3, rating: 4.8, reviews_count: 48, image: 'assets/images/product-img/electronics/electronics-bg-trans-01-a-1.webp', description: 'Premium active noise cancelling over-ear headphones with 30-hour battery life.', is_featured: 1, is_new: 1 },
                { id: 2, title: 'Fast Charging USB-C Braided Cable 6ft', slug: 'usbc-braided-cable', price: 19.99, old_price: 29.99, stock: 120, category_id: 2, brand_id: 1, rating: 4.6, reviews_count: 95, image: 'assets/images/product-img/electronics/electronics-bg-trans-02-a-1.webp', description: 'Durable nylon braided USB-C fast charging cable compatible with all modern smartphones.', is_featured: 1, is_new: 0 },
                { id: 3, title: '65W Dual Port GaN Fast Wall Charger', slug: '65w-gan-charger', price: 39.99, old_price: 49.99, stock: 80, category_id: 3, brand_id: 1, rating: 4.9, reviews_count: 64, image: 'assets/images/product-img/electronics/electronics-bg-trans-03-a-1.webp', description: 'Ultra compact GaN technology fast charger for laptops, tablets and phones.', is_featured: 1, is_new: 1 },
                { id: 4, title: '20,000mAh Ultra Slim Power Bank', slug: '20000mah-power-bank', price: 49.99, old_price: 59.99, stock: 65, category_id: 4, brand_id: 2, rating: 4.7, reviews_count: 31, image: 'assets/images/product-img/electronics/electronics-bg-trans-04-a-1.webp', description: 'High-capacity slim portable power bank with digital LED battery percentage display.', is_featured: 0, is_new: 1 },
                { id: 5, title: 'Waterproof Portable Bluetooth Speaker', slug: 'portable-bluetooth-speaker', price: 79.99, old_price: 99.99, stock: 50, category_id: 5, brand_id: 4, rating: 4.8, reviews_count: 112, image: 'assets/images/product-img/electronics/electronics-bg-trans-05-a-1.webp', description: 'IPX7 waterproof wireless speaker with deep bass and 15-hour playback.', is_featured: 1, is_new: 0 },
                { id: 6, title: 'Fitness Smartwatch with Heart Rate & GPS', slug: 'fitness-smartwatch-gps', price: 149.99, old_price: 189.99, stock: 35, category_id: 6, brand_id: 2, rating: 4.5, reviews_count: 27, image: 'assets/images/product-img/electronics/electronics-bg-trans-06-a-1.webp', description: 'Smart fitness tracking watch with AMOLED screen, blood oxygen monitor, and custom dials.', is_featured: 1, is_new: 1 },
                { id: 7, title: '55" 4K Ultra HD Smart HDR OLED TV', slug: '55-4k-oled-tv', price: 799.99, old_price: 999.99, stock: 15, category_id: 7, brand_id: 3, rating: 4.9, reviews_count: 83, image: 'assets/images/product-img/electronics/electronics-bg-trans-07-a-1.webp', description: 'Stunning 4K OLED display with Dolby Vision, voice assistant support, and gaming mode.', is_featured: 1, is_new: 0 },
                { id: 8, title: 'Wireless Studio Earbuds with Charging Case', slug: 'studio-wireless-earbuds', price: 89.99, old_price: 119.99, stock: 90, category_id: 1, brand_id: 3, rating: 4.6, reviews_count: 52, image: 'assets/images/product-img/electronics/electronics-bg-trans-08-a-1.webp', description: 'Crystal clear audio calling, touch controls, and compact wireless charging case.', is_featured: 0, is_new: 1 },
                { id: 9, title: 'Over-Ear Hi-Fi Studio Monitor Headphones', slug: 'hifi-studio-headphones', price: 129.99, old_price: 159.99, stock: 40, category_id: 1, brand_id: 5, rating: 4.7, reviews_count: 36, image: 'assets/images/product-img/electronics/electronics-bg-trans-01-a-1.webp', description: 'Professional studio monitoring headphones with neutral sound curve and soft ear cushions.', is_featured: 0, is_new: 0 },
                { id: 10, title: 'MagSafe Wireless Charging Pad 15W', slug: 'magsafe-charging-pad', price: 29.99, old_price: 39.99, stock: 110, category_id: 3, brand_id: 1, rating: 4.8, reviews_count: 75, image: 'assets/images/product-img/electronics/electronics-bg-trans-03-a-1.webp', description: 'Fast magnetic wireless charger compatible with iPhone and Qi-enabled devices.', is_featured: 1, is_new: 1 },
                { id: 11, title: '30,000mAh Heavy Duty Power Bank w/ Flashlight', slug: '30000mah-heavy-powerbank', price: 69.99, old_price: 89.99, stock: 42, category_id: 4, brand_id: 2, rating: 4.6, reviews_count: 44, image: 'assets/images/product-img/electronics/electronics-bg-trans-04-a-1.webp', description: 'Rugged outdoor power station with triple USB output and built-in emergency LED flashlight.', is_featured: 0, is_new: 0 },
                { id: 12, title: 'Boombox Wireless Party Speaker 60W', slug: 'boombox-party-speaker', price: 179.99, old_price: 219.99, stock: 25, category_id: 5, brand_id: 4, rating: 4.9, reviews_count: 68, image: 'assets/images/product-img/electronics/electronics-bg-trans-05-a-1.webp', description: 'High power party speaker with dynamic RGB party light show and deep subwoofer bass.', is_featured: 1, is_new: 1 },
                { id: 13, title: 'AMOLED Ultra Smart Watch w/ Titanium Case', slug: 'amoled-titanium-smartwatch', price: 249.99, old_price: 299.99, stock: 20, category_id: 6, brand_id: 2, rating: 4.9, reviews_count: 19, image: 'assets/images/product-img/electronics/electronics-bg-trans-06-a-1.webp', description: 'Rugged titanium alloy smartwatch with always-on display, ECG monitoring, and GPS navigation.', is_featured: 1, is_new: 1 },
                { id: 14, title: '65" 8K QLED Quantum Dot Smart TV', slug: '65-8k-qled-tv', price: 1499.99, old_price: 1899.99, stock: 10, category_id: 7, brand_id: 2, rating: 5.0, reviews_count: 42, image: 'assets/images/product-img/electronics/electronics-bg-trans-07-a-1.webp', description: 'Ultimate 8K clarity with Quantum Dot color accuracy and 120Hz smooth gaming refresh rate.', is_featured: 1, is_new: 1 },
                { id: 15, title: 'Noise Isolating In-Ear Neckband Earphones', slug: 'neckband-wireless-earphones', price: 34.99, old_price: 44.99, stock: 85, category_id: 1, brand_id: 4, rating: 4.4, reviews_count: 29, image: 'assets/images/product-img/electronics/electronics-bg-trans-08-a-1.webp', description: 'Flexible magnetic neckband bluetooth earphones with magnetic earbuds and HD mic.', is_featured: 0, is_new: 0 },
                { id: 16, title: 'Lightning to USB-C Fast Sync Cable 3ft', slug: 'lightning-usbc-cable-3ft', price: 14.99, old_price: 19.99, stock: 150, category_id: 2, brand_id: 1, rating: 4.7, reviews_count: 108, image: 'assets/images/product-img/electronics/electronics-bg-trans-02-a-1.webp', description: 'MFi certified Lightning cable for high speed data sync and fast charging.', is_featured: 0, is_new: 0 }
            ];
            for (const p of products) {
                await productsCol.doc(String(p.id)).set(p);
            }
        }

        // 5. Seed Orders
        const ordersCol = db.collection('orders');
        const orderSnap = await ordersCol.limit(1).get();
        if (orderSnap.empty) {
            console.log('Seeding initial orders to Firestore...');
            const orders = [
                {
                    id: 9856,
                    order_number: 'ORD-9856',
                    customer_name: 'Emay Walter',
                    customer_email: 'emay@RVN.local',
                    customer_phone: '+1 (555) 234-5678',
                    shipping_address: '123 Market Street, Suite 400',
                    city: 'San Francisco',
                    zip_code: '94105',
                    total_amount: 6659.00,
                    payment_method: 'Credit Card',
                    status: 'Processing',
                    created_at: new Date('2026-06-11').toISOString(),
                    items: [
                        { product_id: 1, product_title: 'Wireless ANC Noise Cancelling Headphones', price: 199.99, quantity: 1 }
                    ]
                },
                {
                    id: 9855,
                    order_number: 'ORD-9855',
                    customer_name: 'Sarah Jenkins',
                    customer_email: 'sarah.j@example.com',
                    customer_phone: '+1 (555) 987-6543',
                    shipping_address: '742 Evergreen Terrace',
                    city: 'Springfield',
                    zip_code: '97477',
                    total_amount: 249.99,
                    payment_method: 'PayPal',
                    status: 'Completed',
                    created_at: new Date('2026-06-12').toISOString(),
                    items: [
                        { product_id: 6, product_title: 'Fitness Smartwatch with Heart Rate & GPS', price: 149.99, quantity: 1 }
                    ]
                },
                {
                    id: 9854,
                    order_number: 'ORD-9854',
                    customer_name: 'David Miller',
                    customer_email: 'david.m@example.com',
                    customer_phone: '+1 (555) 456-7890',
                    shipping_address: '100 North Main Ave',
                    city: 'Austin',
                    zip_code: '73301',
                    total_amount: 129.50,
                    payment_method: 'Credit Card',
                    status: 'Shipped',
                    created_at: new Date('2026-06-11').toISOString(),
                    items: [
                        { product_id: 8, product_title: 'Wireless Studio Earbuds with Charging Case', price: 89.99, quantity: 1 }
                    ]
                }
            ];
            for (const o of orders) {
                await ordersCol.doc(String(o.id)).set(o);
            }
        }

        console.log('Firestore seeding completed successfully.');
    } catch (e) {
        console.error('Error seeding Firestore:', e);
    }
}

// Trigger Seeding
seedDatabase();

module.exports = db;
