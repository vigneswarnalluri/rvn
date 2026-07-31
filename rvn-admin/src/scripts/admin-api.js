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

    async ensureAuthenticated(force = false) {
        if (force || !this.getToken()) {
            localStorage.removeItem('rvn_admin_token');
            await this.login();
        }
    },

    async fetchWithAuth(url, options = {}) {
        await this.ensureAuthenticated();
        options.headers = {
            ...this.getHeaders(),
            ...(options.headers || {})
        };
        let res = await fetch(url, options);
        if (res.status === 401) {
            await this.ensureAuthenticated(true);
            options.headers = {
                ...this.getHeaders(),
                ...(options.headers || {})
            };
            res = await fetch(url, options);
        }
        return res;
    },

    // ----------------------------------------------------
    // DASHBOARD ANALYTICS WIDGETS
    // ----------------------------------------------------
    async loadDashboardStats() {
        try {
            const res = await this.fetchWithAuth(`${ADMIN_API_BASE_URL}/stats`);
            if (!res.ok) return;
            const data = await res.json();

            // Match stat cards dynamically by their label text
            document.querySelectorAll('strong').forEach(el => {
                const labelEl = el.closest('article')?.querySelector('p');
                if (!labelEl) return;
                const label = labelEl.textContent.trim().toLowerCase();

                if (label.includes('revenue')) el.textContent = `₹${data.total_revenue.toLocaleString()}`;
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
            const res = await this.fetchWithAuth(`${ADMIN_API_BASE_URL}/products`, {
                method: 'POST',
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
            const res = await this.fetchWithAuth(`${ADMIN_API_BASE_URL}/orders`);
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
                    <td class="py-3 px-4 font-semibold">₹${order.total_amount.toFixed(2)}</td>
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

    async loadProductsTable(tableSelector = 'tbody') {
        const tbody = document.querySelector(tableSelector);
        if (!tbody) return;

        try {
            await this.ensureAuthenticated();
            const res = await fetch(`${ADMIN_API_BASE_URL.replace('/admin', '')}/products`);
            const products = await res.json();

            if (!products || !products.length) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No products found.</td></tr>';
                return;
            }

            const resolveImg = (imgUrl) => {
                if (!imgUrl) return 'https://via.placeholder.com/150';
                if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) return imgUrl;
                const cleanPath = imgUrl.startsWith('/') ? imgUrl.slice(1) : imgUrl;
                return window.location.port === '5173' ? `http://localhost:3000/${cleanPath}` : `/${cleanPath}`;
            };

            const renderRows = (items) => {
                if (!items || !items.length) {
                    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4">No products match your search.</td></tr>';
                    return;
                }
                tbody.innerHTML = items.map(prod => `
                    <tr class="border-b border-surface-line hover:bg-surface-body/70">
                        <td class="py-4 pr-3">
                            <input type="checkbox" class="h-4 w-4 rounded border-surface-line text-brand-600 focus:ring-brand-600" />
                        </td>
                        <td class="py-4 pr-4">
                            <div class="flex items-center gap-3">
                                <img src="${resolveImg(prod.image)}" alt="${prod.title}" class="h-12 w-12 rounded-base bg-surface-body object-cover" style="width: 48px; height: 48px; object-fit: contain;" />
                                <div>
                                    <span class="font-semibold text-ink-900">${prod.title}</span>
                                    <p class="mt-1 text-[13px] text-ink-400">SKU: PROD-${prod.id}</p>
                                </div>
                            </div>
                        </td>
                        <td class="py-4 pr-4 text-ink-700">${prod.category_name || 'Retail'}</td>
                        <td class="py-4 pr-4 text-ink-700">₹${prod.price.toFixed(2)}</td>
                        <td class="py-4 pr-4 text-ink-700">${prod.stock}</td>
                        <td class="py-4 pr-4">
                            <span class="px-2.5 py-1 text-xs font-semibold rounded-full bg-success-50 text-success-600">
                                Published
                            </span>
                        </td>
                        <td class="py-4 text-right">
                            <div class="inline-flex items-center gap-1.5">
                                <a href="${resolveImg(prod.image)}" target="_blank" class="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition" title="View Product">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                                </a>
                                <a href="/edit-product.html?id=${prod.id}" class="p-2 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition" title="Edit Product">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                </a>
                                <button type="button" onclick="window.RVNAdmin.deleteProduct(${prod.id})" class="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Delete Product">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                                </button>
                            </div>
                        </td>
                    </tr>
                `).join('');
                const listInfo = document.querySelector('[data-list-info]');
                if (listInfo) {
                    listInfo.textContent = `Showing ${items.length} of ${products.length} products`;
                }
            };

            renderRows(products);

            // Bind search inputs
            document.querySelectorAll('input[placeholder*="Search"], [data-search-input]').forEach(input => {
                input.addEventListener('input', (e) => {
                    const q = e.target.value.toLowerCase().trim();
                    const filtered = products.filter(p => p.title.toLowerCase().includes(q) || (p.category_name && p.category_name.toLowerCase().includes(q)));
                    renderRows(filtered);
                });
            });

            if (window.lucide) {
                window.lucide.createIcons();
            }
        } catch (err) {
            console.error('Error loading products:', err);
        }
    },

    async updateStatus(orderId, status) {
        try {
            const res = await this.fetchWithAuth(`${ADMIN_API_BASE_URL}/orders/${orderId}`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
            if (res.ok) {
                alert('Order status updated!');
                this.loadOrdersTable();
            }
        } catch (err) {
            console.error('Update status error:', err);
        }
    },

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            const res = await this.fetchWithAuth(`${ADMIN_API_BASE_URL}/products/${productId}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                alert('Product deleted successfully!');
                this.loadProductsTable();
            } else {
                alert('Failed to delete product.');
            }
        } catch (err) {
            console.error('Delete product error:', err);
        }
    },

    async loadEditProductForm() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (!id) return;

        try {
            const res = await fetch(`${ADMIN_API_BASE_URL.replace('/admin', '')}/products/${id}`);
            if (!res.ok) return;
            const product = await res.json();

            if (product && product.title) {
                const nameInput = document.querySelector('input[name="name"], input[name="title"]');
                const priceInput = document.querySelector('input[name="price"]');
                const descInput = document.querySelector('textarea[name="description"]');
                const thumbImg = document.querySelector('#edit-product-form img, form img, article img');

                if (nameInput) nameInput.value = product.title;
                if (priceInput) priceInput.value = product.price;
                if (descInput && product.description) descInput.value = product.description;

                const resolveImg = (imgUrl) => {
                    if (!imgUrl) return 'https://via.placeholder.com/150';
                    if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) return imgUrl;
                    const cleanPath = imgUrl.startsWith('/') ? imgUrl.slice(1) : imgUrl;
                    return window.location.port === '5173' ? `http://localhost:3000/${cleanPath}` : `/${cleanPath}`;
                };

                if (thumbImg && product.image) {
                    thumbImg.src = resolveImg(product.image);
                }
            }
        } catch (err) {
            console.error('Error loading edit product form:', err);
        }
    },

    async updateProduct(id, productData) {
        try {
            const res = await this.fetchWithAuth(`${ADMIN_API_BASE_URL}/products/${id}`, {
                method: 'PUT',
                body: JSON.stringify(productData)
            });
            const result = await res.json();
            if (res.ok) {
                alert('Product updated successfully!');
                window.location.href = '/products.html';
            } else {
                alert('Error updating product: ' + (result.error || 'Unknown error'));
            }
        } catch (err) {
            console.error('Update product error:', err);
        }
    },

    async loadOrderDetail() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        if (!id) return;

        try {
            const res = await this.fetchWithAuth(`${ADMIN_API_BASE_URL}/orders/${id}`);
            if (!res.ok) return;
            const order = await res.json();

            if (order) {
                const titleEl = document.querySelector('h2');
                if (titleEl && order.order_number) {
                    titleEl.textContent = `Order Details (${order.order_number})`;
                }
                document.querySelectorAll('dd').forEach(el => {
                    const label = el.previousElementSibling?.textContent.toLowerCase() || '';
                    if (label.includes('date')) el.textContent = new Date(order.created_at).toLocaleDateString();
                    if (label.includes('payment')) el.textContent = order.payment_method || 'Credit Card';
                    if (label.includes('customer')) el.textContent = order.customer_name;
                });
            }
        } catch (err) {
            console.error('Error loading order detail:', err);
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
            
            const categoryName = formData.get('category');
            const categoryMap = {
                'Electronics': 1,
                'Grocery': 2,
                'Bakery': 3,
                'Drinks': 4,
                'Snacks': 5,
                'Dairy': 6
            };
            const categoryId = categoryMap[categoryName] || 1;

            const product = {
                title: formData.get('name') || formData.get('title') || 'New Product',
                price: parseFloat(formData.get('price')) || 0.00,
                old_price: parseFloat(formData.get('old_price')) || null,
                stock: parseInt(formData.get('stock')) || 10,
                category_id: categoryId,
                description: formData.get('description') || ''
            };

            const thumbInput = document.getElementById('thumb-input');
            if (thumbInput && thumbInput.files && thumbInput.files[0]) {
                const file = thumbInput.files[0];
                const reader = new FileReader();
                reader.onloadend = () => {
                    product.image = reader.result;
                    window.RVNAdmin.addProduct(product);
                };
                reader.readAsDataURL(file);
            } else {
                const sampleImages = [
                    'assets/images/product-img/electronics/product-img-electro-a-01.webp',
                    'assets/images/product-img/electronics/electro-c-01.webp',
                    'assets/images/product-img/electronics/product-img-watch-b-01.webp',
                    'assets/images/product-img/electronics/headphone-lg-01.webp',
                    'assets/images/product-img/electronics/electronics-bg-trans-01-a-1.webp'
                ];
                product.image = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                window.RVNAdmin.addProduct(product);
            }
        });
    }

    // Wire Edit Product Form if present
    if (window.location.pathname.includes('edit-product')) {
        window.RVNAdmin.loadEditProductForm();
        const editForm = document.querySelector('#edit-product-form');
        if (editForm) {
            editForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const urlParams = new URLSearchParams(window.location.search);
                const id = urlParams.get('id');
                if (!id) return;
                const formData = new FormData(editForm);
                const product = {
                    title: formData.get('name') || formData.get('title'),
                    price: parseFloat(formData.get('price')),
                    description: formData.get('description')
                };

                const thumbInput = document.getElementById('thumb-input');
                if (thumbInput && thumbInput.files && thumbInput.files[0]) {
                    const file = thumbInput.files[0];
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        product.image = reader.result;
                        window.RVNAdmin.updateProduct(id, product);
                    };
                    reader.readAsDataURL(file);
                } else {
                    window.RVNAdmin.updateProduct(id, product);
                }
            });
        }
    }

    // Wire Order Detail page if present
    if (window.location.pathname.includes('order-detail')) {
        window.RVNAdmin.loadOrderDetail();
    }

    // Wire Orders page if table exists
    if (window.location.pathname.includes('orders')) {
        window.RVNAdmin.loadOrdersTable();
    }

    // Wire Products page if table exists
    if (window.location.pathname.includes('products')) {
        window.RVNAdmin.loadProductsTable();
    }
});
