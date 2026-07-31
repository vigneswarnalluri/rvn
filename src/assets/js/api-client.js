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

    bindExistingUI() {
        // Attach click listeners to all existing template "Add To Cart" buttons
        const cartButtons = document.querySelectorAll('.rbt-cart-sidenav-activation, .rbt-add-to-cart-btn, .addto-cart-btn, [data-add-cart], .add-itembtn');
        cartButtons.forEach((btn) => {
            btn.addEventListener('click', (e) => {
                const card = btn.closest('.rbt-card, .rbt-product-card, .minicart-item, .inner, .swiper-slide');
                if (!card) return;

                const titleEl = card.querySelector('.rbt-card-title, .title, h2, h3, h4, h5, h6');
                const priceEl = card.querySelector('.price-text, .price, .offer-price, .rbt-price-text');
                const imgEl = card.querySelector('.rbt-prd-img, img');

                const title = titleEl ? titleEl.innerText.trim() : 'Store Item';
                let price = 199.00;
                if (priceEl) {
                    const priceMatches = priceEl.innerText.match(/[\d,]+\.?\d*/g);
                    if (priceMatches && priceMatches.length > 0) {
                        price = parseFloat(priceMatches[priceMatches.length - 1].replace(/,/g, ''));
                    }
                }
                const image = imgEl ? imgEl.src : 'assets/images/product-img/electronics/electronics-bg-trans-10-a-1.webp';
                const id = 'prod_' + Math.abs(this.hashCode(title));

                this.addToCart({ id, title, price, image });
            });
        });

        this.renderCartOffcanvas();
    },

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = (hash << 5) - hash + str.charCodeAt(i);
            hash |= 0;
        }
        return hash;
    },

    renderCartOffcanvas() {
        const cart = this.getCart();
        const minicartWrapper = document.querySelector('.rbt-cart-side-menu .rbt-minicart-wrapper');
        const subtotalElements = document.querySelectorAll('.rbt-cart-subttotal .price');
        
        if (minicartWrapper && cart.length > 0) {
            minicartWrapper.innerHTML = cart.map(item => `
                <li class="minicart-item">
                    <div class="thumbnail">
                        <a href="#">
                            <img src="${item.image}" alt="${item.product_title}">
                        </a>
                    </div>
                    <div class="product-content">
                        <h3 class="title h6"><a href="#">${item.product_title}</a></h3>
                        <span class="quantity">${item.quantity}x <span class="price">₹${item.price.toFixed(2)}</span></span>
                    </div>
                    <div class="close-btn">
                        <button onclick="window.RVNStore.removeFromCart('${item.product_id}'); window.RVNStore.renderCartOffcanvas();" class="rbt-round-btn">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                </li>
            `).join('');
        }

        const total = this.getCartTotal().toFixed(2);
        if (subtotalElements.length > 0) {
            subtotalElements.forEach(el => {
                if (el.closest('.rbt-cart-subttotal')?.querySelector('.subtotal')) {
                    el.textContent = `₹${total}`;
                }
            });
        }
    },

    async loadProductDetails() {
        const urlParams = new URLSearchParams(window.location.search);
        const productId = urlParams.get('id');
        if (!productId) return;

        try {
            const res = await fetch(`${API_BASE_URL}/products/${productId}`);
            if (!res.ok) return;
            const product = await res.json();

            if (product && product.title) {
                document.querySelectorAll('.rbt-product-Name, .product-title, .rbt-single-product-title, h1.title').forEach(el => {
                    el.textContent = product.title;
                });
                document.querySelectorAll('.rbt-single-product-price, .offer-price, .price-text').forEach(el => {
                    el.textContent = `₹${parseFloat(product.price).toFixed(2)}`;
                });
                if (product.image) {
                    document.querySelectorAll('.rbt-single-product-media-area img, .rbt-thumb-img-sm img').forEach(el => {
                        el.src = product.image;
                    });
                }
                const addToCartBtn = document.querySelector('.rbt-single-product-add-to-cart, .rbt-btn-cart');
                if (addToCartBtn) {
                    addToCartBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        this.addToCart({
                            id: product.id,
                            title: product.title,
                            price: product.price,
                            image: product.image
                        });
                    });
                }
            }
        } catch (err) {
            console.error('Failed to load product details:', err);
        }
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
    },

    initSearchFeature() {
        const handleSearch = (query) => {
            if (!query) return;
            const cleanQuery = query.trim().toLowerCase();
            if (!cleanQuery) return;

            if (window.location.pathname.includes('shop')) {
                // Live filter product cards on shop page
                document.querySelectorAll('.product-grid-one, .rbt-card, [data-product-card], .col-lg-3, .col-xl-3').forEach(card => {
                    const title = card.querySelector('.rbt-title, .title, a')?.textContent.toLowerCase() || '';
                    if (title.includes(cleanQuery)) {
                        card.style.display = '';
                    } else if (title) {
                        card.style.display = 'none';
                    }
                });
            } else {
                window.location.href = `shop.html?search=${encodeURIComponent(cleanQuery)}`;
            }
        };

        // Bind storefront search inputs and forms
        document.querySelectorAll('.rbt-search-form, .search-form').forEach(form => {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                const input = form.querySelector('.search-input, input[type="text"], input[type="search"]');
                if (input) handleSearch(input.value);
            });

            const submitBtn = form.querySelector('.submit-btn a, button[type="submit"]');
            if (submitBtn) {
                submitBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const input = form.querySelector('.search-input, input[type="text"], input[type="search"]');
                    if (input) handleSearch(input.value);
                });
            }
        });

        // Auto-apply search filter if ?search= is present in URL
        const urlParams = new URLSearchParams(window.location.search);
        const searchQuery = urlParams.get('search');
        if (searchQuery && window.location.pathname.includes('shop')) {
            setTimeout(() => handleSearch(searchQuery), 300);
        }
    }
};

// Initialize Storefront safely checking document.readyState
const initStore = () => {
    window.RVNStore.updateCartBadge();
    window.RVNStore.bindExistingUI();
    window.RVNStore.loadProductDetails();
    window.RVNStore.initSearchFeature();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStore);
} else {
    initStore();
}


