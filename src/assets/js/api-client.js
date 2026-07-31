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
        const executeSearch = (rawQuery) => {
            if (!rawQuery) return;
            const cleanQuery = rawQuery.trim();
            if (!cleanQuery) return;

            const isShop = window.location.pathname.includes('shop');
            const targetPage = isShop ? 'shop.html' : 'index.html';
            window.location.href = `${targetPage}?search=${encodeURIComponent(cleanQuery)}`;
        };

        // Attach listeners to search submit events, clicks, and Enter key
        document.addEventListener('submit', (e) => {
            const form = e.target.closest('.rbt-search-form, .search-form, form');
            if (form) {
                const input = form.querySelector('.search-input, input[type="text"], input[type="search"]');
                if (input && input.value) {
                    e.preventDefault();
                    executeSearch(input.value);
                }
            }
        });

        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.submit-btn, .submit-btn a, .inner-search-icon, .rbt-search-dropdown a.rbt-btn');
            if (btn) {
                const form = btn.closest('.rbt-search-form, .rbt-search-dropdown, form') || document;
                const input = form.querySelector('.search-input, input[type="text"], input[type="search"]');
                if (input && input.value) {
                    e.preventDefault();
                    executeSearch(input.value);
                }
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const input = e.target.closest('.search-input, input[type="search"]');
                if (input && input.value) {
                    e.preventDefault();
                    executeSearch(input.value);
                }
            }
        });
    },

    async renderDynamicProducts() {
        try {
            const products = await this.fetchProducts();
            if (!products || !products.length) return;

            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('search');
            let displayProducts = products;

            if (searchQuery) {
                const q = searchQuery.toLowerCase().trim();
                displayProducts = products.filter(p => p.title.toLowerCase().includes(q) || (p.description && p.description.toLowerCase().includes(q)));
            }

            const productContainers = document.querySelectorAll('.rbt-component-area .row.row--12, [data-product-grid], .shop-product-grid');
            if (!productContainers.length) return;

            const productCardHTML = (prod) => `
                <div class="col-xxl-3 col-xl-3 col-lg-4 col-md-6 col-sm-6 col-6 mt--24">
                    <div class="rbt-card rbt-product-card has-hover-box-shadow" style="background:#fff; border-radius:12px; padding:16px; border:1px solid #eee;">
                        <div class="inner">
                            <div class="rbt-card-img rbt-has-hover-img" style="text-align:center; background:#f9f9f9; border-radius:8px; padding:12px;">
                                <a href="product-single-default.html?id=${prod.id}">
                                    <img class="rbt-prd-img" src="${prod.image}" alt="${prod.title}" style="height:180px; object-fit:contain; max-width:100%;">
                                </a>
                            </div>
                            <div class="rbt-card-body mt--15">
                                <h4 class="rbt-card-title h6" style="font-size:15px; font-weight:600; min-height:42px;">
                                    <a href="product-single-default.html?id=${prod.id}">${prod.title}</a>
                                </h4>
                                <div class="rbt-price-wrapper mt--10" style="font-size:16px;">
                                    <span class="rbt-price-text offer-price font-bold" style="color:#215ada; font-weight:700;">₹${parseFloat(prod.price).toFixed(2)}</span>
                                    ${prod.old_price ? `<span class="regular-price ml--5 text-gray-400" style="text-decoration:line-through; font-size:13px; margin-left:8px;">₹${parseFloat(prod.old_price).toFixed(2)}</span>` : ''}
                                </div>
                                <div class="rbt-card-bottom mt--15">
                                    <button class="rbt-btn rbt-btn-sm w-100 rbt-add-to-cart-btn" style="background:#215ada; color:#fff; border:none; padding:10px; border-radius:6px; font-weight:600; width:100%; cursor:pointer;" onclick="window.RVNStore.addToCart({ id: ${prod.id}, title: '${prod.title.replace(/'/g, "\\'")}', price: ${prod.price}, image: '${prod.image}' })">
                                        Add To Cart
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            productContainers.forEach(container => {
                if (container.querySelector('.rbt-card, .col-xxl-3, .col-xl-3, .col-lg-4')) {
                    if (searchQuery && displayProducts.length === 0) {
                        container.innerHTML = `
                            <div class="col-12 text-center py-5" style="padding: 60px 0;">
                                <h3>No products found matching "${searchQuery}"</h3>
                                <p class="text-muted">Try searching for headphones, cable, smartwatch, TV, speaker, or power bank.</p>
                                <a href="index.html" class="rbt-btn btn-md mt--20" style="display:inline-block; margin-top:20px; background:#215ada; color:#fff; padding:10px 24px; border-radius:6px;">View All Products</a>
                            </div>
                        `;
                    } else {
                        container.innerHTML = displayProducts.map(productCardHTML).join('');
                    }
                }
            });
        } catch (err) {
            console.error('Error rendering dynamic products:', err);
        }
    }
};

// Initialize Storefront safely checking document.readyState
const initStore = () => {
    window.RVNStore.updateCartBadge();
    window.RVNStore.bindExistingUI();
    window.RVNStore.loadProductDetails();
    window.RVNStore.initSearchFeature();
    window.RVNStore.renderDynamicProducts();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initStore);
} else {
    initStore();
}


