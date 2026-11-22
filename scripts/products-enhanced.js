// Enhanced Products Display with Brands
// Add to products.js

// Global virtual scroller instance
let virtualScroller = null;

async function initProductsWithBrands() {
    try {
        // Check if on department-specific page
        const currentDepartment = window.CURRENT_DEPARTMENT || null;
        
        // Load departments, brands, and categories
        const departments = await storageService.fetchDepartments();
        const allBrands = await storageService.fetchBrands();
        const allCategories = await storageService.fetchCategories();
        
        // Filter brands and categories by department if applicable
        let brands = allBrands;
        let categories = allCategories;
        
        if (currentDepartment) {
            // Filter brands that belong to this department
            brands = allBrands.filter(brand => 
                brand.departmentIds && brand.departmentIds.includes(currentDepartment)
            );
            
            // Filter categories that belong to this department
            categories = allCategories.filter(category => 
                category.departmentId === currentDepartment
            );
        }
        
        displayBrands(brands);
        populateNavigationDropdowns(brands, categories);

        // Load and display products
        let products = await storageService.fetchProducts();
        
        // Filter products by department if applicable
        if (currentDepartment) {
            const departmentCategoryIds = categories.map(c => c.id);
            products = products.filter(product => 
                departmentCategoryIds.includes(product.categoryId)
            );
        }
        
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
        
        populateFilters(products, brands, categories);
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
                
                // Close mobile menu if open
                const navMenu = document.getElementById('navMenu');
                const menuToggle = document.getElementById('mobileMenuToggle');
                if (navMenu) navMenu.classList.remove('active');
                if (menuToggle) menuToggle.classList.remove('active');
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
                
                // Close mobile menu if open
                const navMenu = document.getElementById('navMenu');
                const menuToggle = document.getElementById('mobileMenuToggle');
                if (navMenu) navMenu.classList.remove('active');
                if (menuToggle) menuToggle.classList.remove('active');
            });
        });
    }
}

function displayBrands(brands) {
    // Try modern carousel first, fall back to classic grid
    let brandsContainer = document.getElementById('brandsCarousel');
    const isModernLayout = !!brandsContainer;
    
    if (!brandsContainer) {
        brandsContainer = document.getElementById('brandsGrid');
    }
    
    if (!brandsContainer || brands.length === 0) return;

    if (isModernLayout && typeof window.createModernBrandCard === 'function') {
        // Use modern carousel design
        brandsContainer.innerHTML = '';
        brands.forEach(brand => {
            const card = window.createModernBrandCard(brand);
            brandsContainer.appendChild(card);
        });
    } else {
        // Use classic grid design (existing code)
        brandsContainer.innerHTML = brands.map(brand => {
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
    }

    // Click brand to filter
    document.querySelectorAll('.brand-card, .brand-card-modern').forEach(card => {
        card.addEventListener('click', () => {
            const brandName = card.dataset.brand;
            document.getElementById('brandFilter').value = brandName;
            document.getElementById('brandFilter').dispatchEvent(new Event('change'));
            document.getElementById('products').scrollIntoView({ behavior: 'smooth' });
        });
    });
}

function displayProducts(products) {
    // Try modern grid first, fall back to classic
    let productsGrid = document.getElementById('productsGridModern');
    const isModernLayout = !!productsGrid;
    
    if (!productsGrid) {
        productsGrid = document.getElementById('productsGrid');
    }
    
    if (!productsGrid) return;

    if (products.length === 0) {
        productsGrid.innerHTML = '<p class="no-products">No products found</p>';
        return;
    }

    // Update products count if element exists
    const productsCount = document.getElementById('productsCount');
    if (productsCount) {
        productsCount.textContent = `Showing ${products.length} product${products.length !== 1 ? 's' : ''}`;
    }

    if (isModernLayout && typeof window.createModernProductCard === 'function') {
        // Use modern card design
        productsGrid.innerHTML = '';
        products.forEach(product => {
            const card = window.createModernProductCard(product);
            productsGrid.appendChild(card);
        });
    } else {
        // Use classic card design (existing code)
        productsGrid.innerHTML = products.map(product => {
            let imageUrl = '';
            // Check both imageUrl and image for backward compatibility
            const productImage = product.imageUrl || product.image;
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
                <div class="product-image-container">
                    <img src="${imageUrl}" alt="${product.name}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23ddd%22 width=%22300%22 height=%22300%22/%3E%3Ctext fill=%22%23666%22 font-family=%22Arial%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3E${product.name}%3C/text%3E%3C/svg%3E'">
                </div>
                <div class="product-info">
                    <span class="product-brand">${product.brand || ''}</span>
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">$${parseFloat(product.price).toFixed(2)}</div>
                    
                    <!-- Hidden input for compatibility with cart logic -->
                    <input type="hidden" id="qty-${product.id}" value="1">
                    
                    <button class="btn-add-cart" data-product='${JSON.stringify(product)}' ${product.stock === 0 ? 'disabled' : ''}>
                        ${product.stock > 0 ? 'ADD TO CART' : 'OUT OF STOCK'}
                    </button>
                </div>
            </div>
            `;
        }).join('');
    }
    
    // Cleanup old listeners if any (implicit in replacement)

    // Add click handlers for add to cart buttons (updated selector)
    document.querySelectorAll('.btn-add-cart').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const product = JSON.parse(e.target.dataset.product);
            const qtyInput = document.getElementById(`qty-${product.id}`);
            const quantity = qtyInput ? parseInt(qtyInput.value) : 1;
            
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

async function populateFilters(products, allBrands, allCategories) {
    // Populate category filter - use all categories from storage
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter && allCategories && allCategories.length > 0) {
        // Clear existing options except the first "All Categories"
        while (categoryFilter.options.length > 1) {
            categoryFilter.remove(1);
        }
        
        allCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            categoryFilter.appendChild(option);
        });
    }

    // Populate brand filter - use all brands from storage
    const brandFilter = document.getElementById('brandFilter');
    if (brandFilter && allBrands && allBrands.length > 0) {
        // Clear existing options except the first "All Brands"
        while (brandFilter.options.length > 1) {
            brandFilter.remove(1);
        }
        
        allBrands.forEach(brand => {
            const option = document.createElement('option');
            option.value = brand.name;
            option.textContent = brand.name;
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