// RVN Admin Dashboard API Client
const ADMIN_API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api/admin'
    : '/api/admin';

window.RVNAdmin = {
    getToken() {
        return localStorage.getItem('rvn_admin_token');
    },

    getHeaders() {
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    },

    async login(email = 'admin@rvn.local', password = 'admin123') {
        try {
            const res = await fetch(`${ADMIN_API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (res.ok && data.token) {
                localStorage.setItem('rvn_admin_token', data.token);
                return data;
            } else {
                console.warn('Auto-login notice:', data.error);
                return null;
            }
        } catch (err) {
            console.error('Login failed:', err);
            return null;
        }
    },

    async ensureAuthenticated() {
        if (!this.getToken()) {
            await this.login();
        }
    },

    // ----------------------------------------------------
    // DASHBOARD ANALYTICS WIDGETS
    // ----------------------------------------------------
    async loadDashboardStats() {
        try {
            await this.ensureAuthenticated();
            const res = await fetch(`${ADMIN_API_BASE_URL}/stats`, {
                headers: this.getHeaders()
            });
            if (!res.ok) return;
            const data = await res.json();

            // Match stat cards dynamically by their label text
            document.querySelectorAll('strong').forEach(el => {
                const labelEl = el.closest('div')?.querySelector('p');
                if (!labelEl) return;
                const label = labelEl.textContent.trim().toLowerCase();

                if (label.includes('revenue')) el.textContent = `$${data.total_revenue.toLocaleString()}`;
                if (label.includes('orders')) el.textContent = data.total_orders.toLocaleString();
                if (label.includes('products')) el.textContent = data.total_products.toLocaleString();
                if (label.includes('customers')) el.textContent = `${(data.total_customers / 1000).toFixed(1)}k`;
            });
        } catch (err) {
            console.error('Failed to load admin stats:', err);
        }
    },

    // ----------------------------------------------------
    // ADD PRODUCT FUNCTIONALITY
    // ----------------------------------------------------
    async addProduct(productData) {
        try {
            await this.ensureAuthenticated();
            const res = await fetch(`${ADMIN_API_BASE_URL}/products`, {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify(productData)
            });
            const result = await res.json();
            if (res.ok) {
                alert('Product created successfully! It is now live on your storefront.');
                window.location.href = '/products.html';
            } else {
                alert('Error: ' + (result.error || 'Failed to add product'));
            }
        } catch (err) {
            console.error('Failed to add product:', err);
            alert('Failed to connect to backend server.');
        }
    },

    // ----------------------------------------------------
    // ORDER MANAGEMENT
    // ----------------------------------------------------
    async loadOrdersTable(tableSelector = 'tbody') {
        const tbody = document.querySelector(tableSelector);
        if (!tbody) return;

        try {
            await this.ensureAuthenticated();
            const res = await fetch(`${ADMIN_API_BASE_URL}/orders`, {
                headers: this.getHeaders()
            });
            const orders = await res.json();

            if (!orders || !orders.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No orders found.</td></tr>';
                return;
            }

            tbody.innerHTML = orders.map(order => `
                <tr class="border-b border-gray-100 hover:bg-gray-50/50 transition">
                    <td class="py-3 px-4 font-semibold text-blue-600">${order.order_number}</td>
                    <td class="py-3 px-4">${order.customer_name}</td>
                    <td class="py-3 px-4">${new Date(order.created_at).toLocaleDateString()}</td>
                    <td class="py-3 px-4 font-semibold">$${order.total_amount.toFixed(2)}</td>
                    <td class="py-3 px-4">${order.payment_method}</td>
                    <td class="py-3 px-4">
                        <span class="px-2.5 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'
                        }">
                            ${order.status}
                        </span>
                    </td>
                    <td class="py-3 px-4 text-right">
                        <button onclick="window.RVNAdmin.updateStatus(${order.id}, 'Completed')" class="text-xs bg-emerald-500 text-white px-2 py-1 rounded hover:bg-emerald-600">Mark Completed</button>
                    </td>
                </tr>
            `).join('');
        } catch (err) {
            console.error('Error loading orders:', err);
        }
    },

    async updateStatus(orderId, status) {
        try {
            await this.ensureAuthenticated();
            const res = await fetch(`${ADMIN_API_BASE_URL}/orders/${orderId}`, {
                method: 'PUT',
                headers: this.getHeaders(),
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                alert('Order status updated!');
                this.loadOrdersTable();
            }
        } catch (err) {
            console.error('Update status error:', err);
        }
    }
};

// Initialize Dashboard Stats on load
document.addEventListener('DOMContentLoaded', () => {
    window.RVNAdmin.loadDashboardStats();
    
    // Wire Add Product Form if present
    const addProductForm = document.querySelector('form[action*="add-product"], #add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const formData = new FormData(addProductForm);
            const product = {
                title: formData.get('title') || formData.get('product_name') || 'New Sample Item',
                price: parseFloat(formData.get('price')) || 49.99,
                old_price: parseFloat(formData.get('old_price')) || 69.99,
                stock: parseInt(formData.get('stock')) || 50,
                description: formData.get('description') || 'Product description added from Admin Portal.'
            };
            window.RVNAdmin.addProduct(product);
        });
    }

    // Wire Orders page if table exists
    if (window.location.pathname.includes('orders')) {
        window.RVNAdmin.loadOrdersTable();
    }
});
