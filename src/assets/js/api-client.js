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

    async bindExistingUI() {
        try {
            const products = await this.fetchProducts();
            if (!products || !products.length) return;

            const urlParams = new URLSearchParams(window.location.search);
            const searchQuery = urlParams.get('search')?.toLowerCase().trim();

            // Target main grid product cards explicitly
            const cards = document.querySelectorAll('.rbt-filterproduct-row .rbt-card, .rbt-component-area .rbt-card, .row--12 .rbt-card, [data-product-grid] .rbt-card, .rbt-card');

            cards.forEach((card, index) => {
                const titleEl = card.querySelector('.rbt-card-title a, .title a, h2 a, h3 a, h4 a, h5 a, h6 a');
                const priceEl = card.querySelector('.price-text, .price, .offer-price, .rbt-price-text');
                const imgEls = card.querySelectorAll('.rbt-prd-img, .rbt-hover-img, img');
                const linkEls = card.querySelectorAll('a[href*="product-single"]');

                const prod = products[index % products.length];

                if (titleEl && prod) {
                    titleEl.textContent = prod.title;
                }

                if (priceEl && prod) {
                    priceEl.textContent = `₹${parseFloat(prod.price).toFixed(2)}`;
                }

                if (imgEls.length > 0 && prod && prod.image) {
                    imgEls.forEach(img => img.src = prod.image);
                }

                if (linkEls.length > 0 && prod) {
                    linkEls.forEach(link => {
                        link.href = `product-single-default.html?id=${prod.id}`;
                    });
                }

                // Filter native card by search query if search query is active
                if (searchQuery && prod) {
                    const titleText = (prod.title + ' ' + (prod.description || '')).toLowerCase();
                    if (titleText.includes(searchQuery)) {
                        card.closest('.col-xxl-3, .col-xl-3, .col-lg-4, .col-md-6, .col-sm-6, .col-6, .swiper-slide')?.style.setProperty('display', '', 'important');
                    } else {
                        card.closest('.col-xxl-3, .col-xl-3, .col-lg-4, .col-md-6, .col-sm-6, .col-6, .swiper-slide')?.style.setProperty('display', 'none', 'important');
                    }
                }

                // Attach Add To Cart listener
                const cartBtn = card.querySelector('.rbt-cart-sidenav-activation, .rbt-add-to-cart-btn, .addto-cart-btn, [data-add-cart], .add-itembtn, button');
                if (cartBtn) {
                    cartBtn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const currentProd = (products && products[index]) ? products[index] : null;
                        const title = currentProd ? currentProd.title : (titleEl ? titleEl.innerText.trim() : 'Store Item');
                        const price = currentProd ? currentProd.price : (priceEl ? parseFloat(priceEl.innerText.replace(/[^\d.]/g, '')) || 199 : 199);
                        const image = currentProd ? currentProd.image : (imgEl ? imgEl.src : '');
                        const id = currentProd ? currentProd.id : 'prod_' + Math.abs(this.hashCode(title));

                        this.addToCart({ id, title, price, image });
                    });
                }
            });
        } catch (err) {
            console.error('Error binding native template UI:', err);
        }

        this.renderCartOffcanvas();
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
                // Update product title elements
                document.querySelectorAll('.rbt-single-product-title, .rbt-card-title, h1.title, h2.rbt-card-title, .product-title').forEach(el => {
                    if (el.closest('.rbt-single-product-content, .rbt-single-product-area, main, .container')) {
                        el.textContent = product.title;
                    }
                });

                // Update breadcrumbs
                const breadcrumbTitle = document.querySelector('.breadcrumb, nav[aria-label="breadcrumb"], .rbt-breadcrumb-item.active, .breadcrumb-item.active');
                if (breadcrumbTitle) breadcrumbTitle.textContent = product.title;

                // Update pricing
                document.querySelectorAll('.pricing-part .price-text:not(del), .rbt-single-product-price, .offer-price').forEach(el => {
                    el.textContent = `₹${parseFloat(product.price).toFixed(2)}`;
                });

                if (product.old_price) {
                    document.querySelectorAll('.pricing-part del').forEach(el => {
                        el.textContent = `₹${parseFloat(product.old_price).toFixed(2)}`;
                    });
                }

                // Update description
                if (product.description) {
                    document.querySelectorAll('.description-text, .product-description, .rbt-single-product-content p').forEach(el => {
                        el.textContent = product.description;
                    });
                }

                // Update product image
                if (product.image) {
                    document.querySelectorAll('.rbt-product-single-img img, .product-single-slider-two-activation img, .rbt-thumb-img-sm img').forEach(el => {
                        el.src = product.image;
                    });
                }

                // Bind Add to Cart button
                document.querySelectorAll('.rbt-single-product-add-to-cart, .rbt-btn-cart, .rbt-cart-sidenav-activation').forEach(btn => {
                    if (btn.closest('.rbt-single-product-content, .rbt-single-product-area')) {
                        btn.addEventListener('click', (e) => {
                            e.preventDefault();
                            this.addToCart({
                                id: product.id,
                                title: product.title,
                                price: product.price,
                                image: product.image
                            });
                        });
                    }
                });
            }
        } catch (err) {
            console.error('Failed to load product details:', err);
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

        // Listen for submit events, click on search button/icon, and Enter key
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


