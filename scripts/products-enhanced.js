// Enhanced Products Display with Brands
// Add to products.js

// Global virtual scroller instance
let virtualScroller = null;

async function initProductsWithBrands() {
    try {
        // Load brands first
        const brands = await storageService.fetchBrands();
        displayBrands(brands);
        
        // Load categories
        const categories = await storageService.fetchCategories();
        populateNavigationDropdowns(brands, categories);

        // Load and display products
        const products = await storageService.fetchProducts();
        
        // Use virtual scroller if available and product count is high
        if (typeof VirtualProductScroller !== 'undefined' && products.length > 30) {
            if (!virtualScroller) {
                virtualScroller = new VirtualProductScroller({
                    pageSize: 20,
                    loadMoreThreshold: 500
                });
            }
            virtualScroller.setProducts(products);
        } else {
            // Use standard display for smaller catalogs
            displayProducts(products);
        }
        
        populateFilters(products, categories);
        setupFiltering(products);
    } catch (error) {
        console.error('Error initializing products:', error);
    }
}

function populateNavigationDropdowns(brands, categories) {
    // Populate brands dropdown in navigation
    const brandsDropdown = document.getElementById('brandsDropdown');
    if (brandsDropdown && brands.length > 0) {
        brandsDropdown.innerHTML = brands.map(brand => {
            let logoUrl = '';
            if (brand.logoUrl) {
                // Check if external URL or blob storage URL
                if (brand.logoUrl.startsWith('http://') || brand.logoUrl.startsWith('https://')) {
                    if (brand.logoUrl.includes('blob.core.windows.net')) {
                        // Azure blob URL - append SAS token
                        logoUrl = brand.logoUrl + '?' + AZURE_CONFIG.readOnlySasToken;
                    } else {
                        // External URL - use as-is
                        logoUrl = brand.logoUrl;
                    }
                } else {
                    // Relative path - append SAS token
                    logoUrl = brand.logoUrl + '?' + AZURE_CONFIG.readOnlySasToken;
                }
            }
            const logoHtml = logoUrl ? 
                '<img src="' + logoUrl + '" alt="' + brand.name + '" onerror="this.style.display=\'none\'">' : 
                '';
            return '<a href="#products" data-brand="' + brand.name + '">' + 
                logoHtml + brand.name + '</a>';
        }).join('');
        
        // Add click handlers
        brandsDropdown.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const brandName = link.dataset.brand;
                document.getElementById('brandFilter').value = brandName;
                document.getElementById('brandFilter').dispatchEvent(new Event('change'));
                document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }
    
    // Populate categories dropdown
    const categoriesDropdown = document.getElementById('categoriesDropdown');
    if (categoriesDropdown && categories && categories.length > 0) {
        categoriesDropdown.innerHTML = categories.map(cat => 
            '<a href="#products" data-category="' + cat.name + '">' + cat.name + '</a>'
        ).join('');
        
        // Add click handlers
        categoriesDropdown.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const category = link.dataset.category;
                document.getElementById('categoryFilter').value = category;
                document.getElementById('categoryFilter').dispatchEvent(new Event('change'));
                document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
            });
        });
    }
}

function displayBrands(brands) {
    const brandsGrid = document.getElementById('brandsGrid');
    if (!brandsGrid || brands.length === 0) return;

    brandsGrid.innerHTML = brands.map(brand => {
        let logoUrl = '';
        if (brand.logoUrl) {
            // Check if external URL (http/https) or blob storage URL
            if (brand.logoUrl.startsWith('http://') || brand.logoUrl.startsWith('https://')) {
                if (brand.logoUrl.includes('blob.core.windows.net')) {
                    // Azure blob URL - append SAS token (check if already has query params)
                    logoUrl = brand.logoUrl.includes('?') ? 
                        brand.logoUrl + '&' + AZURE_CONFIG.readOnlySasToken :
                        brand.logoUrl + '?' + AZURE_CONFIG.readOnlySasToken;
                } else {
                    // External URL (e.g., Wikipedia) - use as-is
                    logoUrl = brand.logoUrl;
                }
            } else {
                // Relative path - append SAS token
                logoUrl = brand.logoUrl + '?' + AZURE_CONFIG.readOnlySasToken;
            }
        } else {
            logoUrl = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%23ddd"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23666" font-family="Arial" font-size="14">' + brand.name + '</text></svg>');
        }
        
        return `
        <div class="brand-card" data-brand="${brand.name}">
            <img class="brand-logo" src="${logoUrl}" alt="${brand.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2280%22 height=%2280%22%3E%3Crect fill=%22%23ddd%22 width=%2280%22 height=%2280%22/%3E%3Ctext fill=%22%23666%22 font-family=%22Arial%22 font-size=%2212%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3E${brand.name}%3C/text%3E%3C/svg%3E'">
            <div class="brand-name">${brand.name}</div>
        </div>
        `;
    }).join('');

    // Click brand to filter
    document.querySelectorAll('.brand-card').forEach(card => {
        card.addEventListener('click', () => {
            const brandName = card.dataset.brand;
            document.getElementById('brandFilter').value = brandName;
            document.getElementById('brandFilter').dispatchEvent(new Event('change'));
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

function displayProducts(products) {
    const productsGrid = document.getElementById('productsGrid');
    if (!productsGrid) return;

    if (products.length === 0) {
        productsGrid.innerHTML = '<p class="no-products">No products found</p>';
        return;
    }

    productsGrid.innerHTML = products.map(product => {
        let imageUrl = '';
        // Check both image and imageUrl for backward compatibility
        const productImage = product.image || product.imageUrl;
        if (productImage) {
            // Check if external URL or blob storage URL
            if (productImage.startsWith('http://') || productImage.startsWith('https://')) {
                if (productImage.includes('blob.core.windows.net')) {
                    // Azure blob URL - append SAS token
                    imageUrl = productImage + '?' + AZURE_CONFIG.readOnlySasToken;
                } else {
                    // External URL - use as-is
                    imageUrl = productImage;
                }
            } else {
                // Relative path - append SAS token
                imageUrl = productImage + '?' + AZURE_CONFIG.readOnlySasToken;
            }
        } else {
            imageUrl = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23ddd%22 width=%22300%22 height=%22300%22/%3E%3Ctext fill=%22%23666%22 font-family=%22Arial%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3E' + encodeURIComponent(product.name) + '%3C/text%3E%3C/svg%3E';
        }
        
        return `
        <div class="product-card" data-category="${product.category}" data-brand="${product.brand}">
            <div class="product-image">
                <img src="${imageUrl}" alt="${product.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23ddd%22 width=%22300%22 height=%22300%22/%3E%3Ctext fill=%22%23666%22 font-family=%22Arial%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3E${product.name}%3C/text%3E%3C/svg%3E'">
                ${product.brand ? `<div class="product-brand">${product.brand}</div>` : ''}
                <div class="product-stock ${product.stock < 10 ? 'low-stock' : ''}">
                    ${product.stock > 0 ? `✓ ${product.stock} in stock` : '❌ Out of stock'}
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category || ''}</div>
                <h3 class="product-name">${product.name}</h3>
                <p class="product-description">${product.description || ''}</p>
                <div class="product-footer">
                    <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
                    <div class="product-actions">
                        <div class="quantity-selector">
                            <button class="qty-btn qty-minus" data-product-id="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>−</button>
                            <input type="number" class="qty-input" id="qty-${product.id}" value="1" min="1" max="${product.stock}" ${product.stock === 0 ? 'disabled' : ''}>
                            <button class="qty-btn qty-plus" data-product-id="${product.id}" ${product.stock === 0 ? 'disabled' : ''}>+</button>
                        </div>
                        <button class="add-to-cart" data-product='${JSON.stringify(product)}' ${product.stock === 0 ? 'disabled' : ''}>Add to Cart</button>
                    </div>
                </div>
            </div>
        </div>
        `;
    }).join('');
    
    // Add click handlers for quantity buttons
    document.querySelectorAll('.qty-minus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = e.target.dataset.productId;
            const input = document.getElementById(`qty-${productId}`);
            if (input.value > 1) {
                input.value = parseInt(input.value) - 1;
            }
        });
    });
    
    document.querySelectorAll('.qty-plus').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const productId = e.target.dataset.productId;
            const input = document.getElementById(`qty-${productId}`);
            const maxStock = parseInt(input.getAttribute('max'));
            if (parseInt(input.value) < maxStock) {
                input.value = parseInt(input.value) + 1;
            }
        });
    });
    
    // Add click handlers for add to cart buttons
    document.querySelectorAll('.add-to-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const product = JSON.parse(e.target.dataset.product);
            const quantity = parseInt(document.getElementById(`qty-${product.id}`).value) || 1;
            
            // Check stock availability
            if (product.stock === 0) {
                notify.error('This product is currently out of stock.');
                return;
            }
            
            if (quantity > product.stock) {
                notify.warning(`Only ${product.stock} units available in stock. Please adjust the quantity.`);
                document.getElementById(`qty-${product.id}`).value = product.stock;
                return;
            }
            
            if (window.cart) {
                window.cart.addItem(product, quantity);
            }
        });
    });
}

function populateFilters(products) {
    // Populate category filter
    const categories = [...new Set(products.map(p => p.category))].filter(Boolean).sort();
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            categoryFilter.appendChild(option);
        });
    }

    // Populate brand filter
    const brands = [...new Set(products.map(p => p.brand))].filter(Boolean).sort();
    const brandFilter = document.getElementById('brandFilter');
    if (brandFilter) {
        brands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand;
            option.textContent = brand;
            brandFilter.appendChild(option);
        });
    }
}

function setupFiltering(products) {
    const categoryFilter = document.getElementById('categoryFilter');
    const brandFilter = document.getElementById('brandFilter');
    const searchInput = document.getElementById('searchInput');

    function applyFilters() {
        const category = categoryFilter?.value || '';
        const brand = brandFilter?.value || '';
        const search = searchInput?.value.toLowerCase() || '';

        const filtered = products.filter(product => {
            const matchesCategory = !category || product.category === category;
            const matchesBrand = !brand || product.brand === brand;
            const matchesSearch = !search || 
                product.name.toLowerCase().includes(search) ||
                (product.description && product.description.toLowerCase().includes(search));

            return matchesCategory && matchesBrand && matchesSearch;
        });

        // Use virtual scroller if available and initialized
        if (virtualScroller && products.length > 30) {
            virtualScroller.setProducts(filtered);
        } else {
            displayProducts(filtered);
        }

        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = `Showing ${filtered.length} of ${products.length} products`;
        }
    }

    categoryFilter?.addEventListener('change', applyFilters);
    brandFilter?.addEventListener('change', applyFilters);
    searchInput?.addEventListener('input', applyFilters);
}

// Cart functionality handled by cart.js and event listeners above

// Initialize when page loads
window.cart = null;

document.addEventListener('DOMContentLoaded', () => {
    window.cart = new ShoppingCart();
    initProductsWithBrands();
    setupCartToggle();
});

function setupCartToggle() {
    const cartBtn = document.getElementById('cartBtn');
    const cartSidebar = document.getElementById('cartSidebar');
    const cartOverlay = document.getElementById('cartOverlay');
    const closeCart = document.getElementById('closeCart');

    cartBtn?.addEventListener('click', () => {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
    });

    closeCart?.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    });

    cartOverlay?.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
    });
}
