// Virtual Scrolling / Lazy Loading for Products
// Efficiently handles hundreds of products with pagination and image lazy loading

class VirtualProductScroller {
    constructor(options = {}) {
        this.allProducts = [];
        this.displayedProducts = [];
        this.pageSize = options.pageSize || 20;
        this.currentPage = 1;
        this.loadMoreThreshold = options.loadMoreThreshold || 500; // px from bottom
        this.isLoading = false;
        this.hasMore = true;
        this.imageCache = new Map(); // Track loaded images
        
        this.setupInfiniteScroll();
        this.setupImageObserver();
    }

    setProducts(products) {
        this.allProducts = products;
        this.displayedProducts = [];
        this.currentPage = 1;
        this.hasMore = true;
        this.renderInitialBatch();
    }

    renderInitialBatch() {
        const productsGrid = document.getElementById('productsGrid');
        if (!productsGrid) return;

        // Clear existing
        productsGrid.innerHTML = '';
        
        // Load first page
        this.loadNextPage();
    }

    loadNextPage() {
        if (this.isLoading || !this.hasMore) return;

        this.isLoading = true;
        const start = (this.currentPage - 1) * this.pageSize;
        const end = start + this.pageSize;
        const nextBatch = this.allProducts.slice(start, end);

        if (nextBatch.length === 0) {
            this.hasMore = false;
            this.removeLoader();
            return;
        }

        // Append products to grid
        const productsGrid = document.getElementById('productsGrid');
        nextBatch.forEach(product => {
            const card = this.createProductCard(product);
            productsGrid.appendChild(card);
        });

        this.displayedProducts.push(...nextBatch);
        this.currentPage++;
        this.hasMore = end < this.allProducts.length;
        this.isLoading = false;

        // Show/hide loader
        if (this.hasMore) {
            this.showLoader();
        } else {
            this.removeLoader();
        }

        // Update product count
        this.updateProductCount();
    }

    createProductCard(product) {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        let imageUrl = '';
        const productImage = product.image || product.imageUrl;
        if (productImage) {
            imageUrl = storageService.getImageUrl(productImage);
        }

        // Use data-src for lazy loading
        const imgSrc = imageUrl || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23e5e7eb" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="20"%3ENo Image%3C/text%3E%3C/svg%3E';

        // Stock badge
        let stockBadge = '';
        if (product.stock !== undefined) {
            if (product.stock === 0) {
                stockBadge = '<div class="product-stock">❌ Out of stock</div>';
            } else {
                const lowStockClass = product.stock < 10 ? 'low-stock' : '';
                stockBadge = `<div class="product-stock ${lowStockClass}">✓ ${product.stock} in stock</div>`;
            }
        }

        // Disable attributes
        const isOutOfStock = product.stock === 0;
        const disabledAttr = isOutOfStock ? 'disabled' : '';
        const maxStock = product.stock || 999;

        card.innerHTML = `
            <div class="product-image">
                <img 
                    data-src="${imgSrc}" 
                    class="lazy-image" 
                    alt="${product.name}"
                    src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3C/svg%3E"
                >
                ${stockBadge}
            </div>
            <div class="product-content">
                <h3 class="product-title">${product.name}</h3>
                <p class="product-category">${product.category || ''}</p>
                <p class="product-price">$${parseFloat(product.price).toFixed(2)}</p>
                <div class="product-actions">
                    <div class="qty-controls">
                        <button class="qty-btn qty-minus" data-id="${product.id}" ${disabledAttr}>-</button>
                        <input type="number" class="qty-input" id="qty-${product.id}" value="1" min="1" max="${maxStock}" ${disabledAttr}>
                        <button class="qty-btn qty-plus" data-id="${product.id}" data-stock="${maxStock}" ${disabledAttr}>+</button>
                    </div>
                    <button class="add-to-cart" data-product='${JSON.stringify(product)}' ${disabledAttr}>
                        Add to Cart
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        this.attachCardEventListeners(card, product);

        return card;
    }

    attachCardEventListeners(card, product) {
        const qtyMinus = card.querySelector('.qty-minus');
        const qtyPlus = card.querySelector('.qty-plus');
        const qtyInput = card.querySelector('.qty-input');
        const addToCartBtn = card.querySelector('.add-to-cart');

        qtyMinus?.addEventListener('click', () => {
            if (qtyInput.value > 1) {
                qtyInput.value = parseInt(qtyInput.value) - 1;
            }
        });

        qtyPlus?.addEventListener('click', (e) => {
            const maxStock = parseInt(e.target.dataset.stock) || 999;
            if (parseInt(qtyInput.value) < maxStock) {
                qtyInput.value = parseInt(qtyInput.value) + 1;
            }
        });

        addToCartBtn?.addEventListener('click', (e) => {
            const productData = JSON.parse(e.target.dataset.product);
            const quantity = parseInt(qtyInput.value) || 1;

            if (productData.stock === 0) {
                notify.error('This product is currently out of stock.');
                return;
            }

            if (quantity > productData.stock) {
                notify.warning(`Only ${productData.stock} units available in stock. Please adjust the quantity.`);
                qtyInput.value = productData.stock;
                return;
            }

            window.cart.addItem({
                id: productData.id,
                name: productData.name,
                price: productData.price,
                quantity: quantity,
                imageUrl: storageService.getImageUrl(productData.image || productData.imageUrl)
            });

            notify.success(`${productData.name} added to cart!`);
            qtyInput.value = 1;
        });
    }

    setupInfiniteScroll() {
        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                const scrollPosition = window.innerHeight + window.scrollY;
                const bottomPosition = document.documentElement.offsetHeight;

                if (bottomPosition - scrollPosition < this.loadMoreThreshold) {
                    this.loadNextPage();
                }
            }, 100); // Debounce scroll events
        });
    }

    setupImageObserver() {
        // Intersection Observer for lazy loading images
        if ('IntersectionObserver' in window) {
            this.imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        const src = img.dataset.src;
                        
                        if (src && !img.classList.contains('loaded')) {
                            img.src = src;
                            img.classList.add('loaded');
                            this.imageObserver.unobserve(img);
                            
                            // Cache image URL
                            this.imageCache.set(src, true);
                        }
                    }
                });
            }, {
                rootMargin: '50px 0px', // Start loading 50px before visible
                threshold: 0.01
            });

            // Observe images as they're added
            const observeNewImages = () => {
                document.querySelectorAll('img.lazy-image:not(.loaded)').forEach(img => {
                    this.imageObserver.observe(img);
                });
            };

            // Initial observation
            setTimeout(observeNewImages, 100);

            // Re-observe when new products added
            const originalLoadNextPage = this.loadNextPage.bind(this);
            this.loadNextPage = function() {
                originalLoadNextPage();
                setTimeout(observeNewImages, 100);
            };
        }
    }

    showLoader() {
        let loader = document.getElementById('productsLoader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'productsLoader';
            loader.className = 'products-loader';
            loader.innerHTML = `
                <div class="loader-spinner"></div>
                <p>Loading more products...</p>
            `;
            const productsGrid = document.getElementById('productsGrid');
            productsGrid?.parentElement?.appendChild(loader);
        }
        loader.style.display = 'flex';
    }

    removeLoader() {
        const loader = document.getElementById('productsLoader');
        if (loader) {
            loader.style.display = 'none';
        }
    }

    updateProductCount() {
        const showing = this.displayedProducts.length;
        const total = this.allProducts.length;
        
        let countElement = document.getElementById('productCount');
        if (!countElement) {
            countElement = document.createElement('div');
            countElement.id = 'productCount';
            countElement.className = 'product-count';
            const productsSection = document.getElementById('products');
            const container = productsSection?.querySelector('.container');
            if (container) {
                container.insertBefore(countElement, container.firstChild);
            }
        }
        countElement.textContent = `Showing ${showing} of ${total} products`;
    }

    clearCache() {
        this.imageCache.clear();
    }
}

// Export for use
window.VirtualProductScroller = VirtualProductScroller;
