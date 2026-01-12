// Product Display and Filtering
class ProductManager {
    constructor() {
        this.products = [];
        this.filteredProducts = [];
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.populateFilters();
        this.setupEventListeners();
        this.displayProducts();
    }

    async loadProducts() {
        try {
            const productsGrid = document.getElementById('productsGrid');
            productsGrid.innerHTML = '<div class="loading">Loading products...</div>';
            
            this.products = await storageService.fetchProducts();
            this.filteredProducts = [...this.products];
        } catch (error) {
            console.error('Error loading products:', error);
            document.getElementById('productsGrid').innerHTML = 
                '<div class="error">Failed to load products. Please try again later.</div>';
        }
    }

    populateFilters() {
        // Get unique categories and brands
        const categories = [...new Set(this.products.map(p => p.category))].sort();
        const brands = [...new Set(this.products.map(p => p.brand))].sort();

        // Populate category filter
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

    setupEventListeners() {
        const categoryFilter = document.getElementById('categoryFilter');
        const brandFilter = document.getElementById('brandFilter');
        const searchInput = document.getElementById('searchInput');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', () => this.applyFilters());
        }

        if (brandFilter) {
            brandFilter.addEventListener('change', () => this.applyFilters());
        }

        if (searchInput) {
            searchInput.addEventListener('input', () => this.applyFilters());
        }
    }

    applyFilters() {
        const category = document.getElementById('categoryFilter')?.value || '';
        const brand = document.getElementById('brandFilter')?.value || '';
        const search = document.getElementById('searchInput')?.value.toLowerCase() || '';

        this.filteredProducts = this.products.filter(product => {
            const matchesCategory = !category || product.category === category;
            const matchesBrand = !brand || product.brand === brand;
            const matchesSearch = !search || 
                product.name.toLowerCase().includes(search) ||
                product.description?.toLowerCase().includes(search) ||
                product.brand.toLowerCase().includes(search);

            return matchesCategory && matchesBrand && matchesSearch;
        });

        this.displayProducts();
    }

    displayProducts() {
        const productsGrid = document.getElementById('productsGrid');
        
        if (this.filteredProducts.length === 0) {
            productsGrid.innerHTML = '<div class="loading">No products found matching your criteria.</div>';
            return;
        }

        productsGrid.innerHTML = this.filteredProducts.map(product => {
            const stockClass = product.stock > 10 ? 'in-stock' : 
                              product.stock > 0 ? 'low-stock' : 'out-of-stock';
            const stockText = product.stock > 0 ? `${product.stock} in stock` : 'Out of stock';

            return `
                <div class="product-card">
                    <img src="${storageService.getImageUrl(product.image)}" 
                         alt="${product.name}" 
                         class="product-image"
                         onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                    <div class="product-info">
                        <div class="product-category">${product.category}</div>
                        <div class="product-name">${product.name}</div>
                        <div class="product-brand">${product.brand}</div>
                        ${product.description ? `<div class="product-description">${product.description}</div>` : ''}
                        <div class="product-footer">
                            <div class="product-price">$${product.price.toFixed(2)}</div>
                            <div class="product-stock ${stockClass}">${stockText}</div>
                        </div>
                        <button class="btn btn-primary btn-add-cart" 
                                onclick="productManager.addToCart('${product.id}')"
                                ${product.stock <= 0 ? 'disabled' : ''}>
                            ${product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product && product.stock > 0) {
            cart.addItem(product);
        }
    }
}

// Initialize product manager when page loads
let productManager;
document.addEventListener('DOMContentLoaded', () => {
    productManager = new ProductManager();
});
