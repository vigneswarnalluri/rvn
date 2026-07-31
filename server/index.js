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
        message: 'RVN Backend API Server is running on Firebase Firestore!',
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
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    try {
        const userDoc = await db.collection('users').doc(email).get();
        if (!userDoc.exists) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const user = userDoc.data();
        const isMatch = bcrypt.compareSync(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { id: user.id || user.email, name: user.name, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id || user.email, name: user.name, email: user.email, role: user.role }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Current Logged-in Admin Profile
app.get('/api/admin/me', authenticateAdmin, (req, res) => {
    res.json({ user: req.user });
});

// ----------------------------------------------------
// STOREFRONT PUBLIC API ENDPOINTS
// ----------------------------------------------------

// 1. Get Categories
app.get('/api/categories', async (req, res) => {
    try {
        const snap = await db.collection('categories').get();
        const rows = [];
        snap.forEach(doc => rows.push(doc.data()));
        // Sort by ID ascending
        rows.sort((a, b) => a.id - b.id);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get Brands
app.get('/api/brands', async (req, res) => {
    try {
        const snap = await db.collection('brands').get();
        const rows = [];
        snap.forEach(doc => rows.push(doc.data()));
        rows.sort((a, b) => a.id - b.id);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get Products (Supports search query, category_id filter, limit, featured)
app.get('/api/products', async (req, res) => {
    const { category_id, search, is_featured, limit } = req.query;
    try {
        let query = db.collection('products');

        if (category_id) {
            query = query.where('category_id', '==', parseInt(category_id));
        }
        if (is_featured) {
            query = query.where('is_featured', '==', 1);
        }

        const snap = await query.get();
        let rows = [];

        // Fetch categories and brands mapping to resolve titles in-memory
        const categoriesSnap = await db.collection('categories').get();
        const brandsSnap = await db.collection('brands').get();
        
        const categoryMap = {};
        categoriesSnap.forEach(doc => {
            const data = doc.data();
            categoryMap[data.id] = data.name;
        });

        const brandMap = {};
        brandsSnap.forEach(doc => {
            const data = doc.data();
            brandMap[data.id] = data.name;
        });

        snap.forEach(doc => {
            const p = doc.data();
            p.category_name = categoryMap[p.category_id] || 'Retail';
            p.brand_name = brandMap[p.brand_id] || '';
            rows.push(p);
        });

        if (search) {
            const searchLower = search.toLowerCase();
            rows = rows.filter(p => 
                (p.title && p.title.toLowerCase().includes(searchLower)) || 
                (p.description && p.description.toLowerCase().includes(searchLower))
            );
        }

        // Sort products by ID descending (newest first)
        rows.sort((a, b) => b.id - a.id);

        if (limit) {
            rows = rows.slice(0, parseInt(limit));
        }

        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Get Single Product Detail
app.get('/api/products/:id', async (req, res) => {
    const { id } = req.params;
    try {
        let snap;
        if (!isNaN(id)) {
            snap = await db.collection('products').where('id', '==', parseInt(id)).get();
        } else {
            snap = await db.collection('products').where('slug', '==', id).get();
        }

        if (snap.empty) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const prod = snap.docs[0].data();

        // Populate Category and Brand Names
        const catDoc = await db.collection('categories').doc(String(prod.category_id)).get();
        if (catDoc.exists) prod.category_name = catDoc.data().name;
        
        const brandDoc = await db.collection('brands').doc(String(prod.brand_id)).get();
        if (brandDoc.exists) prod.brand_name = brandDoc.data().name;

        res.json(prod);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 5. Create New Order (Storefront Checkout)
app.post('/api/orders', async (req, res) => {
    const { customer_name, customer_email, customer_phone, shipping_address, city, zip_code, total_amount, payment_method, items } = req.body;
    
    if (!customer_name || !customer_email || !total_amount || !items || !items.length) {
        return res.status(400).json({ error: 'Missing required order fields' });
    }

    const orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
    const orderId = Math.floor(10000 + Math.random() * 90000);

    try {
        const newOrder = {
            id: orderId,
            order_number: orderNumber,
            customer_name,
            customer_email,
            customer_phone: customer_phone || '',
            shipping_address: shipping_address || '',
            city: city || '',
            zip_code: zip_code || '',
            total_amount: parseFloat(total_amount),
            payment_method: payment_method || 'Credit Card',
            status: 'Processing',
            created_at: new Date().toISOString(),
            items: items.map(item => ({
                product_id: parseInt(item.product_id),
                product_title: item.product_title || 'Product',
                price: parseFloat(item.price),
                quantity: parseInt(item.quantity)
            }))
        };

        await db.collection('orders').doc(String(orderId)).set(newOrder);

        res.status(201).json({
            message: 'Order created successfully!',
            order_number: orderNumber,
            order_id: orderId
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ----------------------------------------------------
// PROTECTED ADMIN DASHBOARD API ENDPOINTS
// ----------------------------------------------------

// 6. Admin Analytics Stats
app.get('/api/admin/stats', authenticateAdmin, async (req, res) => {
    try {
        const prodSnap = await db.collection('products').get();
        const orderSnap = await db.collection('orders').get();

        const total_products = prodSnap.size;
        const total_orders = orderSnap.size;
        let total_revenue = 0;
        const customerEmails = new Set();

        orderSnap.forEach(doc => {
            const o = doc.data();
            total_revenue += parseFloat(o.total_amount || 0);
            if (o.customer_email) {
                customerEmails.add(o.customer_email.trim().toLowerCase());
            }
        });

        res.json({
            total_revenue,
            total_orders,
            total_products,
            total_customers: customerEmails.size
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 7. Admin Add Product
app.post('/api/admin/products', authenticateAdmin, async (req, res) => {
    const { title, price, old_price, stock, category_id, brand_id, image, description } = req.body;
    
    if (!title || !price) {
        return res.status(400).json({ error: 'Title and Price are required' });
    }

    try {
        // Calculate next product ID
        const prodSnap = await db.collection('products').get();
        let maxId = 0;
        prodSnap.forEach(doc => {
            const p = doc.data();
            if (p.id && p.id > maxId) maxId = p.id;
        });
        const newId = maxId + 1;

        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        const imgUrl = image || '/assets/images/product/product-1.jpg';

        const newProduct = {
            id: newId,
            title,
            slug,
            price: parseFloat(price),
            old_price: parseFloat(old_price || price * 1.2),
            stock: parseInt(stock || 50),
            category_id: parseInt(category_id || 1),
            brand_id: parseInt(brand_id || 1),
            rating: 5.0,
            reviews_count: 1,
            image: imgUrl,
            description: description || '',
            is_featured: 1,
            is_new: 1
        };

        await db.collection('products').doc(String(newId)).set(newProduct);
        res.status(201).json({ message: 'Product created successfully', id: newId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Delete Product
app.delete('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        await db.collection('products').doc(String(id)).delete();
        res.json({ message: 'Product deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Update Product
app.put('/api/admin/products/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { title, price, description, image } = req.body;
    try {
        const prodRef = db.collection('products').doc(String(id));
        const updates = {};
        if (title) updates.title = title;
        if (price) updates.price = parseFloat(price);
        if (description !== undefined) updates.description = description;
        if (image) updates.image = image;

        await prodRef.update(updates);
        res.json({ message: 'Product updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



// 8. Admin List Orders
app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
    try {
        const snap = await db.collection('orders').get();
        const rows = [];
        snap.forEach(doc => rows.push(doc.data()));
        // Sort newest first
        rows.sort((a, b) => b.id - a.id);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Admin Get Single Order Detail
app.get('/api/admin/orders/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    try {
        let doc = await db.collection('orders').doc(String(id)).get();
        if (doc.exists) {
            return res.json(doc.data());
        }
        const snap = await db.collection('orders').where('id', '==', parseInt(id)).get();
        if (!snap.empty) {
            return res.json(snap.docs[0].data());
        }
        res.status(404).json({ error: 'Order not found' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// 9. Admin Update Order Status
app.put('/api/admin/orders/:id', authenticateAdmin, async (req, res) => {
    const { status } = req.body;
    const { id } = req.params;

    try {
        const orderRef = db.collection('orders').doc(String(id));
        const doc = await orderRef.get();
        
        if (doc.exists) {
            await orderRef.update({ status });
            return res.json({ message: 'Order status updated successfully' });
        }

        // Check if query matches field 'id' instead of document name
        const snap = await db.collection('orders').where('id', '==', parseInt(id)).get();
        if (snap.empty) {
            return res.status(404).json({ error: 'Order not found' });
        }

        await snap.docs[0].ref.update({ status });
        res.json({ message: 'Order status updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`RVN Backend API Server running at http://localhost:${PORT} with Firebase Firestore`);
    });
}

module.exports = app;
