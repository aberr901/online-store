// Admin Product Management
class AdminManager {
    constructor() {
        this.products = [];
        this.currentEditingId = null;
        this.accessToken = null;
        this.init();
    }

    async init() {
        try {
            // Initialize authentication
            const isAuth = await authService.initialize();
            
            if (!isAuth) {
                // Not authenticated, trigger automatic sign-in
                this.showLoginMessage();
                authService.signInRedirect();
                return;
            }
            
            // Get access token for storage operations
            this.accessToken = await authService.getStorageAccessToken();
            
            if (!this.accessToken) {
                // Token acquisition triggered redirect, wait for it
                return;
            }
            
            storageService.setAccessToken(this.accessToken);
            
            // Display user info
            const user = authService.getCurrentUser();
            const userEmail = document.getElementById('userEmail');
            if (userEmail && user) {
                userEmail.textContent = user.username || user.name;
            }
            
            await this.loadProducts();
            this.setupEventListeners();
            this.displayProductsTable();
            
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('Failed to initialize. Please refresh the page.');
        }
    }

    showLoginMessage() {
        const container = document.querySelector('.admin-layout');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <h2>Signing you in...</h2>
                    <p style="margin: 1rem 0;">Redirecting to Microsoft authentication...</p>
                    <div style="margin: 2rem 0;">
                        <div class="spinner"></div>
                    </div>
                </div>
            `;
        }
    }

    async loadProducts() {
        try {
            this.products = await storageService.fetchProducts();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showNotification('Failed to load products', 'error');
        }
    }

    setupEventListeners() {
        const form = document.getElementById('productForm');
        const cancelBtn = document.getElementById('cancelBtn');
        const searchInput = document.getElementById('adminSearchInput');
        const imageInput = document.getElementById('productImage');
        const logoutBtn = document.getElementById('logoutBtn');

        if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.resetForm());
        if (logoutBtn) logoutBtn.addEventListener('click', () => authService.signOut());
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterProducts(e.target.value));
        }

        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.previewImage(e));
        }
    }

    previewImage(event) {
        const file = event.target.files[0];
        const preview = document.getElementById('imagePreview');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    }

    async handleSubmit(event) {
        event.preventDefault();

        const submitBtn = event.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            const formData = {
                id: this.currentEditingId || storageService.generateId(),
                name: document.getElementById('productName').value,
                category: document.getElementById('productCategory').value,
                brand: document.getElementById('productBrand').value,
                description: document.getElementById('productDescription').value,
                price: parseFloat(document.getElementById('productPrice').value),
                stock: parseInt(document.getElementById('productStock').value),
                image: null
            };

            // Handle image upload
            const imageFile = document.getElementById('productImage').files[0];
            if (imageFile) {
                formData.image = await storageService.uploadImage(imageFile, this.accessToken);
            } else if (this.currentEditingId) {
                // Keep existing image if editing and no new image selected
                const existingProduct = this.products.find(p => p.id === this.currentEditingId);
                formData.image = existingProduct?.image;
            }

            // Update or add product
            if (this.currentEditingId) {
                const index = this.products.findIndex(p => p.id === this.currentEditingId);
                if (index !== -1) {
                    this.products[index] = formData;
                }
            } else {
                this.products.push(formData);
            }

            // Save to storage
            await storageService.saveProducts(this.products);

            this.showNotification(
                this.currentEditingId ? 'Product updated successfully!' : 'Product added successfully!',
                'success'
            );

            this.resetForm();
            this.displayProductsTable();
        } catch (error) {
            console.error('Error saving product:', error);
            this.showNotification('Failed to save product. Please try again.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Product';
        }
    }

    editProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        this.currentEditingId = productId;
        
        document.getElementById('productId').value = product.id;
        document.getElementById('productName').value = product.name;
        document.getElementById('productCategory').value = product.category;
        document.getElementById('productBrand').value = product.brand;
        document.getElementById('productDescription').value = product.description || '';
        document.getElementById('productPrice').value = product.price;
        document.getElementById('productStock').value = product.stock;
        
        // Show image preview if exists
        if (product.image) {
            document.getElementById('imagePreview').innerHTML = 
                `<img src="${storageService.getImageUrl(product.image)}" alt="Current image">`;
        }

        document.getElementById('formTitle').textContent = 'Edit Product';
        
        // Scroll to form
        document.querySelector('.product-form-section').scrollIntoView({ behavior: 'smooth' });
    }

    async deleteProduct(productId) {
        if (!confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            const product = this.products.find(p => p.id === productId);
            
            // Delete image from storage if exists
            if (product?.image) {
                await storageService.deleteImage(product.image);
            }

            // Remove from array
            this.products = this.products.filter(p => p.id !== productId);

            // Save to storage with access token
            await storageService.saveProducts(this.products, this.accessToken);

            this.showNotification('Product deleted successfully!', 'success');
            this.displayProductsTable();
        } catch (error) {
            console.error('Error deleting product:', error);
            this.showNotification('Failed to delete product. Please try again.', 'error');
        }
    }

    resetForm() {
        document.getElementById('productForm').reset();
        document.getElementById('productId').value = '';
        document.getElementById('imagePreview').innerHTML = '';
        document.getElementById('formTitle').textContent = 'Add New Product';
        this.currentEditingId = null;
    }

    filterProducts(searchTerm) {
        const term = searchTerm.toLowerCase();
        const filtered = this.products.filter(p => 
            p.name.toLowerCase().includes(term) ||
            p.category.toLowerCase().includes(term) ||
            p.brand.toLowerCase().includes(term)
        );
        this.displayProductsTable(filtered);
    }

    displayProductsTable(productsToDisplay = null) {
        const products = productsToDisplay || this.products;
        const tbody = document.getElementById('productsTableBody');

        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center;">No products found</td></tr>';
            return;
        }

        tbody.innerHTML = products.map(product => `
            <tr>
                <td>
                    <img src="${storageService.getImageUrl(product.image)}" 
                         alt="${product.name}" 
                         class="product-thumbnail"
                         onerror="this.src='https://via.placeholder.com/50x50?text=No+Image'">
                </td>
                <td>${product.name}</td>
                <td>${product.category}</td>
                <td>${product.brand}</td>
                <td>$${product.price.toFixed(2)}</td>
                <td>${product.stock}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="adminManager.editProduct('${product.id}')">Edit</button>
                        <button class="btn-delete" onclick="adminManager.deleteProduct('${product.id}')">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = type === 'error' ? 'error' : 'success';
        notification.textContent = message;
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.right = '20px';
        notification.style.zIndex = '1001';
        notification.style.minWidth = '300px';
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 4000);
    }
}

// Initialize admin manager when page loads
let adminManager;
document.addEventListener('DOMContentLoaded', () => {
    adminManager = new AdminManager();
});
