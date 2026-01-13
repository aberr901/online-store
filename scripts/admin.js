// Admin Product Management
class AdminManager {
    constructor() {
        this.products = [];
        this.currentEditingId = null;
        this.accessToken = null;
        this.init();
    }

    async init() {
        console.log('[AdminManager] Starting initialization...');
        console.log('[AdminManager] Current URL:', window.location.href);
        
        try {
            // Initialize authentication
            console.log('[AdminManager] Initializing authentication...');
            const isAuth = await authService.initialize();
            console.log('[AdminManager] Authentication result:', isAuth);
            
            if (!isAuth) {
                // Not authenticated, trigger automatic sign-in
                console.log('[AdminManager] Not authenticated, showing login message...');
                this.showLoginMessage();
                
                // Prevent infinite redirect loop - check if we just came back from login
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.has('code') || urlParams.has('error')) {
                    console.error('[AdminManager] Auth callback detected but authentication failed');
                    this.showError('Authentication failed. Please try again or check browser console for details.');
                    return;
                }
                
                console.log('[AdminManager] Redirecting to sign in...');
                setTimeout(() => {
                    authService.signInRedirect();
                }, 1000);
                return;
            }
            
            // Get access token for storage operations
            console.log('[AdminManager] Getting storage access token...');
            this.accessToken = await authService.getStorageAccessToken();
            console.log('[AdminManager] Access token obtained:', this.accessToken ? 'YES' : 'NO');
            
            if (!this.accessToken) {
                // Token acquisition triggered redirect, wait for it
                console.log('[AdminManager] Waiting for token redirect...');
                return;
            }
            
            storageService.setAccessToken(this.accessToken);
            
            // Display user info
            const user = authService.getCurrentUser();
            const userEmail = document.getElementById('userEmail');
            if (userEmail && user) {
                userEmail.textContent = user.username || user.name;
            }
            console.log('[AdminManager] User:', user?.username || user?.name);
            
            console.log('[AdminManager] Loading products...');
            await this.loadProducts();
            console.log('[AdminManager] Products loaded:', this.products.length);
            
            this.setupEventListeners();
            this.displayProductsTable();
            console.log('[AdminManager] Initialization complete!');
            
        } catch (error) {
            console.error('[AdminManager] Initialization error:', error);
            this.showError('Failed to initialize: ' + error.message);
        }
    }

    showError(message) {
        const container = document.querySelector('.admin-layout');
        if (container) {
            container.innerHTML = `
                <div style="text-align: center; padding: 3rem;">
                    <h2 style="color: #dc2626;">Error</h2>
                    <p style="margin: 1rem 0; color: #666;">${message}</p>
                    <button onclick="window.location.reload()" class="btn btn-primary">Retry</button>
                    <button onclick="authService.signOut()" class="btn btn-secondary">Sign Out</button>
                </div>
            `;
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
        const imageUrlInput = document.getElementById('productImageUrl');
        const logoutBtn = document.getElementById('logoutBtn');
        
        // Image type toggle
        const imageTypeRadios = document.querySelectorAll('input[name="imageType"]');
        imageTypeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                const uploadSection = document.getElementById('uploadImageSection');
                const urlSection = document.getElementById('urlImageSection');
                if (e.target.value === 'upload') {
                    uploadSection.style.display = 'block';
                    urlSection.style.display = 'none';
                } else {
                    uploadSection.style.display = 'none';
                    urlSection.style.display = 'block';
                }
            });
        });

        if (form) form.addEventListener('submit', (e) => this.handleSubmit(e));
        if (cancelBtn) cancelBtn.addEventListener('click', () => this.resetForm());
        if (logoutBtn) logoutBtn.addEventListener('click', () => authService.signOut());
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.filterProducts(e.target.value));
        }

        if (imageInput) {
            imageInput.addEventListener('change', (e) => this.previewImage(e));
        }
        
        if (imageUrlInput) {
            imageUrlInput.addEventListener('input', (e) => this.previewImageUrl(e));
        }
        
        if (imageUrlInput) {
            imageUrlInput.addEventListener('input', (e) => this.previewImageUrl(e));
        }
    }

    previewImage(e) {
        const file = e.target.files[0];
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

    previewImageUrl(e) {
        const url = e.target.value;
        const preview = document.getElementById('imagePreview');
        
        if (url) {
            preview.innerHTML = `<img src="${url}" alt="Preview" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23ddd%22 width=%22200%22 height=%22200%22/%3E%3Ctext fill=%22%23666%22 font-family=%22Arial%22 font-size=%2216%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EInvalid URL%3C/text%3E%3C/svg%3E'">`;
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

            // Handle image - check if URL or file upload
            const imageType = document.querySelector('input[name="imageType"]:checked').value;
            const imageUrl = document.getElementById('productImageUrl').value;
            const imageFile = document.getElementById('productImage').files[0];
            
            if (imageType === 'url' && imageUrl) {
                // Using external URL - just save the URL
                // Delete old image if it was an uploaded file
                if (this.currentEditingId) {
                    const existingProduct = this.products.find(p => p.id === this.currentEditingId);
                    if (existingProduct?.image && this.isAzureBlobUrl(existingProduct.image)) {
                        await storageService.deleteImage(existingProduct.image);
                    }
                }
                formData.image = imageUrl;
            } else if (imageType === 'upload' && imageFile) {
                // Uploading new file - delete old uploaded file if exists
                if (this.currentEditingId) {
                    const existingProduct = this.products.find(p => p.id === this.currentEditingId);
                    if (existingProduct?.image && this.isAzureBlobUrl(existingProduct.image)) {
                        await storageService.deleteImage(existingProduct.image);
                    }
                }
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

            // Save to storage - get fresh token
            const token = await authService.getStorageAccessToken();
            await storageService.saveProducts(this.products, token);

            this.showNotification(
                this.currentEditingId ? 'Product updated successfully!' : 'Product added successfully!',
                'success'
            );

            this.resetForm();
            this.displayProductsTable();
        } catch (error) {
            console.error('Error saving product:', error);
            
            // Provide specific error messages based on error type
            let errorMessage = 'Failed to save product. Please try again.';
            
            if (error.message && error.message.includes('403')) {
                errorMessage = 'Permission denied. Your account does not have write access to Azure storage. Please contact an administrator.';
            } else if (error.message && error.message.includes('401')) {
                errorMessage = 'Authentication failed. Please sign out and sign back in.';
            } else if (error.message && error.message.includes('Network')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }
            
            this.showNotification(errorMessage, 'error');
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
            // Determine if URL or uploaded file
            if (this.isAzureBlobUrl(product.image)) {
                document.querySelector('input[name="imageType"][value="upload"]').checked = true;
            } else {
                document.querySelector('input[name="imageType"][value="url"]').checked = true;
                document.getElementById('productImageUrl').value = product.image;
                document.getElementById('uploadImageSection').style.display = 'none';
                document.getElementById('urlImageSection').style.display = 'block';
            }
            document.getElementById('imagePreview').innerHTML = 
                `<img src="${storageService.getImageUrl(product.image)}" alt="Current image">`;
        }

        document.getElementById('formTitle').textContent = 'Edit Product';
        
        // Scroll to form
        document.querySelector('.product-form-section').scrollIntoView({ behavior: 'smooth' });
    }

    async deleteProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        const productName = product ? product.name : 'this product';
        
        // Use custom confirm dialog instead of browser confirm
        if (typeof notify !== 'undefined' && notify.confirm) {
            notify.confirm(
                `Are you sure you want to delete "${productName}"? This action cannot be undone.`,
                async () => {
                    await this.performDelete(productId, product);
                }
            );
        } else {
            if (!confirm(`Are you sure you want to delete "${productName}"?\n\nThis action cannot be undone.`)) {
                return;
            }
            await this.performDelete(productId, product);
        }
    }
    
    async performDelete(productId, product) {
        try {
            // Delete image from storage if exists and is Azure Blob
            if (product?.image && this.isAzureBlobUrl(product.image)) {
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
            
            let errorMessage = 'Failed to delete product. Please try again.';
            
            if (error.message && error.message.includes('403')) {
                errorMessage = 'Permission denied. Your account does not have delete access to Azure storage. Please contact an administrator.';
            } else if (error.message && error.message.includes('401')) {
                errorMessage = 'Authentication failed. Please sign out and sign back in.';
            } else if (error.message) {
                errorMessage = `Error: ${error.message}`;
            }
            
            this.showNotification(errorMessage, 'error');
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
                        <button class="btn-edit" onclick="adminManager.editProduct('${product.id}')" title="Edit product">Edit</button>
                        <button class="btn-delete" onclick="adminManager.deleteProduct('${product.id}')" title="Delete product">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    showNotification(message, type = 'success') {
        if (typeof notify !== 'undefined') {
            // Use the global notify system
            if (type === 'error') {
                notify.error(message);
            } else if (type === 'warning') {
                notify.warning(message);
            } else if (type === 'info') {
                notify.info(message);
            } else {
                notify.success(message);
            }
        } else {
            // Fallback to simple notification
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
    
    isAzureBlobUrl(url) {
        return url && url.includes(AZURE_CONFIG.storageAccountName) && url.includes('blob.core.windows.net');
    }
}

// Initialize admin manager when page loads
let adminManager;
let brandManager;
let categoryManager;

document.addEventListener('DOMContentLoaded', async () => {
    // Setup tabs immediately
    setupTabs();
    
    // Initialize admin manager (handles products and its own auth)
    adminManager = new AdminManager();
    
    // Wait for auth to be ready then initialize brand and category managers
    const waitForAuth = setInterval(async () => {
        if (typeof authService !== 'undefined' && authService && authService.currentAccount) {
            clearInterval(waitForAuth);
            
            try {
                brandManager = new BrandManager(authService);
                await brandManager.loadBrands();
                brandManager.setupBrandEventListeners();
                
                categoryManager = new CategoryManager(authService);
                await categoryManager.init();
                
                console.log('Brand and category managers initialized successfully');
            } catch (error) {
                console.error('Error initializing brand/category managers:', error);
            }
        }
    }, 500);
    
    // Safety timeout - stop waiting after 10 seconds
    setTimeout(() => {
        clearInterval(waitForAuth);
        if (!brandManager || !categoryManager) {
            console.error('Brand/Category managers failed to initialize - auth timeout');
        }
    }, 10000);
});

// Tab switching functionality
function setupTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.dataset.tab;

            // Remove active class from all
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));

            // Add active to clicked
            btn.classList.add('active');
            const tabContent = document.getElementById(tabName + '-tab');
            if (tabContent) {
                tabContent.classList.add('active');
            }
        });
    });
}
