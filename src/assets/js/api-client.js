// RVN Storefront API & Cart Manager Client
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api';

window.RVNStore = {
    // ----------------------------------------------------
    // CART STATE MANAGEMENT
    // ----------------------------------------------------
    getCart() {
        return JSON.parse(localStorage.getItem('rvn_cart') || '[]');
    },

    saveCart(cart) {
        localStorage.setItem('rvn_cart', JSON.stringify(cart));
        this.updateCartBadge();
    },

    addToCart(product, quantity = 1) {
        let cart = this.getCart();
        const existingIndex = cart.findIndex(item => item.product_id === product.id);

        if (existingIndex > -1) {
            cart[existingIndex].quantity += quantity;
        } else {
            cart.push({
                product_id: product.id,
                product_title: product.title,
                price: product.price,
                image: product.image,
                quantity: quantity
            });
        }

        this.saveCart(cart);
        this.showToast(`Added "${product.title}" to cart!`);
    },

    removeFromCart(productId) {
        let cart = this.getCart().filter(item => item.product_id !== productId);
        this.saveCart(cart);
    },

    getCartTotal() {
        return this.getCart().reduce((sum, item) => sum + (item.price * item.quantity), 0);
    },

    getCartCount() {
        return this.getCart().reduce((sum, item) => sum + item.quantity, 0);
    },

    updateCartBadge() {
        const count = this.getCartCount();
        const total = this.getCartTotal().toFixed(2);

        document.querySelectorAll('.access-box-count, .rbt-cart-count, .cart-count-badge').forEach(el => {
            el.textContent = count;
        });

        document.querySelectorAll('.rbt-mini-cart .content span').forEach(el => {
            el.textContent = `Total ₹${total}`;
        });
    },

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'RVN-toast-notification';
        toast.style.cssText = `
            position: fixed;
            bottom: 24px;
            right: 24px;
            background: #215ada;
            color: #ffffff;
            padding: 14px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            font-size: 14px;
            font-weight: 600;
            z-index: 999999;
            transition: all 0.3s ease;
        `;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // ----------------------------------------------------
    // API FETCHING & DYNAMIC PRODUCT RENDER
    // ----------------------------------------------------
    async fetchProducts(params = {}) {
        try {
            const query = new URLSearchParams(params).toString();
            const res = await fetch(`${API_BASE_URL}/products?${query}`);
            if (!res.ok) throw new Error('Failed to fetch products');
            return await res.json();
        } catch (err) {
            console.error('API Error:', err);
            return [];
        }
    },

    async fetchCategories() {
        try {
            const res = await fetch(`${API_BASE_URL}/categories`);
            return await res.json();
        } catch (err) {
            console.error('Categories Error:', err);
            return [];
        }
    },

    async renderLiveProductGrids() {
        const products = await this.fetchProducts();
        if (!products || !products.length) return;

        // Populate dynamic product containers if present
        const productGridContainer = document.querySelector('#live-products-grid, .rbt-live-product-container');
        if (productGridContainer) {
            productGridContainer.innerHTML = products.map(prod => `
                <div class="col-lg-3 col-md-4 col-sm-6 col-12 mb--30">
                    <div class="rbt-card rbt-product-card style-one border">
                        <div class="rbt-card-img position-relative overflow-hidden text-center p-3">
                            <a href="product-single-default.html?id=${prod.id}">
                                <img src="${prod.image}" alt="${prod.title}" style="height: 200px; object-fit: contain;">
                            </a>
                            <span class="rbt-badge bg-primary position-absolute top-0 start-0 m-2 px-2 py-1 text-white text-xs rounded">
                                ${prod.category_name || 'Retail'}
                            </span>
                        </div>
                        <div class="rbt-card-body p-3">
                            <h5 class="rbt-card-title text-truncate font-weight-bold mb-2">
                                <a href="product-single-default.html?id=${prod.id}">${prod.title}</a>
                            </h5>
                            <div class="d-flex align-items-center justify-content-between mb-3">
                                <span class="h5 text-primary font-weight-bold mb-0">₹${prod.price.toFixed(2)}</span>
                                ${prod.old_price ? `<span class="text-muted text-decoration-line-through text-sm">₹${prod.old_price.toFixed(2)}</span>` : ''}
                            </div>
                            <button onclick="window.RVNStore.addToCart({id: ${prod.id}, title: '${prod.title.replace(/'/g, "\\'")}', price: ${prod.price}, image: '${prod.image}'})" 
                                class="btn btn-primary w-100 rounded-pill font-weight-semibold">
                                <i class="fa-solid fa-cart-shopping me-2"></i> Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Attach global Add To Cart handlers to any template static Add-To-Cart buttons
        document.querySelectorAll('.rbt-add-to-cart-btn, .addto-cart-btn, [data-add-cart]').forEach((btn, idx) => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const prod = products[idx % products.length] || products[0];
                this.addToCart({
                    id: prod.id,
                    title: prod.title,
                    price: prod.price,
                    image: prod.image
                });
            });
        });
    },

    async submitOrder(orderData) {
        try {
            const res = await fetch(`${API_BASE_URL}/orders`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            return await res.json();
        } catch (err) {
            console.error('Order Submission Error:', err);
            return { error: 'Failed to place order' };
        }
    }
};

// Initialize Storefront safely checking document.readyState
const initStore = () => {
    window.RVNStore.updateCartBadge();
    window.RVNStore.renderLiveProductGrids();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStore);
} else {
    initStore();
}
