// Category Manager
class CategoryManager {
    constructor(authService) {
        this.authService = authService;
        this.categories = [];
        this.currentEditingCategoryId = null;
    }

    async init() {
        await this.loadCategories();
        this.setupCategoryEventListeners();
    }

    async loadCategories() {
        try {
            this.categories = await storageService.fetchCategories();
            this.displayCategoriesGrid();
            this.populateCategorySelect();
        } catch (error) {
            console.error('Error loading categories:', error);
            this.categories = [];
        }
    }

    populateCategorySelect() {
        const categorySelect = document.getElementById('productCategory');
        if (!categorySelect) return;

        categorySelect.innerHTML = '<option value="">Select Category</option>';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.name;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }

    displayCategoriesGrid() {
        const grid = document.getElementById('categoriesGridAdmin');
        if (!grid) return;

        if (this.categories.length === 0) {
            grid.innerHTML = '<p style="text-align:center;color:#666;padding:2rem;">No categories yet. Add your first category above!</p>';
            return;
        }

        grid.innerHTML = this.categories.map(category => {
            const departmentLabel = category.department === 'home-kitchen' ? 'Home & Kitchen' : 
                                   category.department === 'pet-supplies' ? 'Pet Supplies' : 'No Department';
            const departmentColor = category.department === 'home-kitchen' ? '#3498db' : '#e74c3c';
            
            return '<div class="category-card-admin">' +
                '<h3>' + category.name + '</h3>' +
                (category.description ? '<p style="color: #666; font-size: 0.9rem; margin: 0.5rem 0;">' + category.description + '</p>' : '') +
                '<span style="display: inline-block; padding: 0.25rem 0.75rem; background: ' + departmentColor + '; color: white; border-radius: 12px; font-size: 0.75rem; margin-top: 0.5rem;">' + departmentLabel + '</span>' +
                '<div class="action-buttons">' +
                '<button class="btn-edit" onclick="categoryManager.editCategory(\'' + category.id + '\')" title="Edit category">Edit</button>' +
                '<button class="btn-delete" onclick="categoryManager.deleteCategory(\'' + category.id + '\')" title="Delete category">Delete</button>' +
                '</div>' +
                '</div>';
        }).join('');
    }

    setupCategoryEventListeners() {
        const categoryForm = document.getElementById('categoryForm');
        const cancelBtn = document.getElementById('cancelCategoryBtn');

        if (categoryForm) {
            categoryForm.addEventListener('submit', (e) => this.handleCategorySubmit(e));
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.resetCategoryForm());
        }
    }

    async handleCategorySubmit(e) {
        e.preventDefault();

        const categoryName = document.getElementById('categoryName').value;
        const categoryDescription = document.getElementById('categoryDescription').value;
        const categoryDepartment = document.getElementById('categoryDepartment').value;

        try {
            const categoryData = {
                id: this.currentEditingCategoryId || this.generateCategoryId(),
                name: categoryName,
                description: categoryDescription,
                department: categoryDepartment
            };

            // Update or add category
            if (this.currentEditingCategoryId) {
                const index = this.categories.findIndex(c => c.id === this.currentEditingCategoryId);
                if (index !== -1) {
                    this.categories[index] = categoryData;
                }
            } else {
                this.categories.push(categoryData);
            }

            // Save to storage
            const token = await this.authService.getStorageAccessToken();
            await storageService.saveCategories(this.categories, token);

            this.showNotification(
                this.currentEditingCategoryId ? 'Category updated successfully!' : 'Category added successfully!',
                'success'
            );

            this.resetCategoryForm();
            await this.loadCategories();

        } catch (error) {
            console.error('Error saving category:', error);
            this.showNotification('Failed to save category.', 'error');
        }
    }

    editCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        if (!category) return;

        this.currentEditingCategoryId = categoryId;
        document.getElementById('categoryName').value = category.name;
        document.getElementById('categoryDescription').value = category.description || '';
        document.getElementById('categoryDepartment').value = category.department || '';
        document.getElementById('categoryFormTitle').textContent = 'Edit Category';

        // Scroll to form
        document.getElementById('categoryForm').scrollIntoView({ behavior: 'smooth' });
    }

    async deleteCategory(categoryId) {
        const category = this.categories.find(c => c.id === categoryId);
        const categoryName = category ? category.name : 'this category';
        
        // Check if any products use this category
        const products = await storageService.fetchProducts();
        const relatedProducts = products.filter(p => 
            p.categoryId === categoryId || p.category === categoryName
        );
        
        if (relatedProducts.length > 0) {
            this.showNotification(
                `Cannot delete "${categoryName}" because ${relatedProducts.length} product(s) are using it. Please reassign or delete those products first.`,
                'error'
            );
            return;
        }
        
        if (!confirm('Are you sure you want to delete "' + categoryName + '"?\n\nThis action cannot be undone.')) return;

        try {
            this.categories = this.categories.filter(c => c.id !== categoryId);
            
            const token = await this.authService.getStorageAccessToken();
            await storageService.saveCategories(this.categories, token);

            this.showNotification('Category deleted successfully!', 'success');
            await this.loadCategories();

        } catch (error) {
            console.error('Error deleting category:', error);
            this.showNotification('Failed to delete category.', 'error');
        }
    }

    resetCategoryForm() {
        document.getElementById('categoryForm').reset();
        document.getElementById('categoryFormTitle').textContent = 'Add New Category';
        this.currentEditingCategoryId = null;
    }

    generateCategoryId() {
        return 'cat_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    showNotification(message, type) {
        // Reuse the notification function from AdminManager if available
        if (typeof adminManager !== 'undefined' && adminManager.showNotification) {
            adminManager.showNotification(message, type);
            return;
        }

        const notification = document.createElement('div');
        notification.className = type === 'error' ? 'error' : 'success';
        notification.textContent = message;
        notification.style.cssText = 'position:fixed;top:20px;right:20px;padding:1rem 2rem;border-radius:4px;' +
            'background:' + (type === 'error' ? '#dc2626' : '#059669') + ';color:white;z-index:1001;';
        
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 4000);
    }
}
