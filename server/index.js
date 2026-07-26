require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'rvn_super_secret_jwt_key_2026';

// Security Headers
app.use(helmet({
    contentSecurityPolicy: false
}));

// Rate Limiting: 100 requests per 15 minutes per IP
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests from this IP, please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false
});

app.use('/api/', apiLimiter);

// CORS Configuration
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(cors({
    origin: allowedOrigin ? [allowedOrigin, 'http://localhost:3000', 'http://localhost:5173'] : '*'
}));

app.use(express.json());

// Root Health Check Route
app.get('/', (req, res) => {
    res.json({
        message: 'RVN Backend API Server is running!',
        status: 'online',
        endpoints: [
            '/api/products',
            '/api/categories',
            '/api/brands',
            '/api/admin/login',
            '/api/admin/stats',
            '/api/admin/orders'
        ]
    });
});

// ----------------------------------------------------
// AUTHENTICATION MIDDLEWARE & ENDPOINTS
// ----------------------------------------------------

const authenticateAdmin = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired authentication token.' });
    }
};

// Admin Login
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(401).json({ error: 'Invalid email or password' });

        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign(
            { id: user.id, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role }
        });
    });
});

// Get Current Logged-in Admin Profile
app.get('/api/admin/me', authenticateAdmin, (req, res) => {
    res.json({ user: req.user });
});

// ----------------------------------------------------
// STOREFRONT PUBLIC API ENDPOINTS
// ----------------------------------------------------

// 1. Get Categories
app.get('/api/categories', (req, res) => {
    db.all('SELECT * FROM categories', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 2. Get Brands
app.get('/api/brands', (req, res) => {
    db.all('SELECT * FROM brands', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 3. Get Products (Supports search query, category_id filter, limit, featured)
app.get('/api/products', (req, res) => {
    const { category_id, search, is_featured, limit } = req.query;
    let query = `
        SELECT p.*, c.name as category_name, b.name as brand_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE 1=1
    `;
    const params = [];

    if (category_id) {
        query += ' AND p.category_id = ?';
        params.push(category_id);
    }
    if (is_featured) {
        query += ' AND p.is_featured = 1';
    }
    if (search) {
        query += ' AND (p.title LIKE ? OR p.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY p.id DESC';

    if (limit) {
        query += ' LIMIT ?';
        params.push(parseInt(limit));
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 4. Get Single Product Detail
app.get('/api/products/:id', (req, res) => {
    const { id } = req.params;
    db.get(`
        SELECT p.*, c.name as category_name, b.name as brand_name 
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        LEFT JOIN brands b ON p.brand_id = b.id
        WHERE p.id = ? OR p.slug = ?
    `, [id, id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: 'Product not found' });
        res.json(row);
    });
});

// 5. Create New Order (Storefront Checkout)
app.post('/api/orders', (req, res) => {
    const { customer_name, customer_email, customer_phone, shipping_address, city, zip_code, total_amount, payment_method, items } = req.body;
    
    if (!customer_name || !customer_email || !total_amount || !items || !items.length) {
        return res.status(400).json({ error: 'Missing required order fields' });
    }

    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);

    db.run(`
        INSERT INTO orders (order_number, customer_name, customer_email, customer_phone, shipping_address, city, zip_code, total_amount, payment_method, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Processing')
    `, [orderNumber, customer_name, customer_email, customer_phone || '', shipping_address || '', city || '', zip_code || '', total_amount, payment_method || 'Credit Card'], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        
        const orderId = this.lastID;
        const stmt = db.prepare('INSERT INTO order_items (order_id, product_id, product_title, price, quantity) VALUES (?, ?, ?, ?, ?)');
        
        items.forEach(item => {
            stmt.run(orderId, item.product_id, item.product_title || 'Product', item.price, item.quantity);
        });
        stmt.finalize();

        res.status(201).json({
            message: 'Order created successfully!',
            order_number: orderNumber,
            order_id: orderId
        });
    });
});

// ----------------------------------------------------
// PROTECTED ADMIN DASHBOARD API ENDPOINTS
// ----------------------------------------------------

// 6. Admin Analytics Stats
app.get('/api/admin/stats', authenticateAdmin, (req, res) => {
    db.get('SELECT COUNT(*) as total_products FROM products', (err, prodRow) => {
        db.get('SELECT COUNT(*) as total_orders, COALESCE(SUM(total_amount), 0) as total_revenue FROM orders', (err, orderRow) => {
            db.get('SELECT COUNT(*) as total_customers FROM (SELECT DISTINCT customer_email FROM orders)', (err, custRow) => {
                res.json({
                    total_revenue: orderRow ? orderRow.total_revenue : 6659,
                    total_orders: orderRow ? orderRow.total_orders : 9856,
                    total_products: prodRow ? prodRow.total_products : 893,
                    total_customers: custRow ? custRow.total_customers : 4600
                });
            });
        });
    });
});

// 7. Admin Add Product
app.post('/api/admin/products', authenticateAdmin, (req, res) => {
    const { title, price, old_price, stock, category_id, brand_id, image, description } = req.body;
    
    if (!title || !price) {
        return res.status(400).json({ error: 'Title and Price are required' });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    const imgUrl = image || '/assets/images/product/product-1.jpg';

    db.run(`
        INSERT INTO products (title, slug, price, old_price, stock, category_id, brand_id, rating, reviews_count, image, description, is_featured, is_new)
        VALUES (?, ?, ?, ?, ?, ?, ?, 5.0, 1, ?, ?, 1, 1)
    `, [title, slug, price, old_price || price * 1.2, stock || 50, category_id || 1, brand_id || 1, imgUrl, description || ''], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'Product created successfully', id: this.lastID });
    });
});

// 8. Admin List Orders
app.get('/api/admin/orders', authenticateAdmin, (req, res) => {
    db.all('SELECT * FROM orders ORDER BY id DESC', [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 9. Admin Update Order Status
app.put('/api/admin/orders/:id', authenticateAdmin, (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    db.run('UPDATE orders SET status = ? WHERE id = ?', [status, id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Order status updated successfully' });
    });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`RVN Backend API Server running at http://localhost:${PORT}`);
    });
}

module.exports = app;
