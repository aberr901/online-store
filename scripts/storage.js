// Azure Blob Storage Helper Functions
class StorageService {
    constructor() {
        this.productsFileName = 'products.json';
        this.brandsFileName = 'brands.json';
        this.categoriesFileName = 'categories.json';
        this.departmentsFileName = 'departments.json';
        this.CACHE_TTL = 3600000; // 1 hour in milliseconds
        this.useLocalFiles = false; // Use Azure storage
    }

    /**
     * Check if cached data is still valid
     */
    isCacheValid(cacheKey) {
        const cached = localStorage.getItem(cacheKey);
        if (!cached) return false;
        
        try {
            const { timestamp, ttl = this.CACHE_TTL } = JSON.parse(cached);
            return timestamp && (Date.now() - timestamp < ttl);
        } catch {
            return false;
        }
    }

    /**
     * Get cached data if valid
     */
    getCachedData(cacheKey) {
        if (!this.isCacheValid(cacheKey)) return null;
        
        try {
            const cached = JSON.parse(localStorage.getItem(cacheKey));
            return cached.data;
        } catch {
            return null;
        }
    }

    /**
     * Set cached data with timestamp
     */
    setCachedData(cacheKey, data) {
        const cacheObject = {
            data: data,
            timestamp: Date.now(),
            ttl: this.CACHE_TTL
        };
        localStorage.setItem(cacheKey, JSON.stringify(cacheObject));
    }

    /**
     * Clear specific cache or all caches
     */
    clearCache(cacheKey = null) {
        if (cacheKey) {
            localStorage.removeItem(cacheKey);
            console.log(`Cache cleared: ${cacheKey}`);
        } else {
            // Clear all caches
            localStorage.removeItem('categories_cache');
            localStorage.removeItem('brands_cache');
            localStorage.removeItem('products_cache');
            console.log('All caches cleared');
        }
    }

    /**
     * Fetch all categories from Azure Blob Storage or local file
     */
    async fetchCategories() {
        // Check cache first
        const cachedCategories = this.getCachedData('categories_cache');
        if (cachedCategories) {
            console.log('Using cached categories');
            return cachedCategories;
        }

        try {
            // Use local file if flag is set
            const url = this.useLocalFiles ? 
                this.categoriesFileName : 
                AZURE_CONFIG.getBlobUrl(AZURE_CONFIG.dataContainerName, this.categoriesFileName);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('Categories file not found, returning default categories');
                    const defaults = this.getDefaultCategories();
                    this.setCachedData('categories_cache', defaults);
                    return defaults;
                }
                throw new Error('Failed to fetch categories: ' + response.statusText);
            }
            
            const categories = await response.json();
            const result = categories.length > 0 ? categories : this.getDefaultCategories();
            this.setCachedData('categories_cache', result);
            return result;
        } catch (error) {
            console.error('Error fetching categories:', error);
            const cached = this.getCachedData('categories_cache');
            return cached || this.getDefaultCategories();
        }
    }

    /**
     * Save categories to Azure Blob Storage
     */
    async saveCategories(categories, accessToken = null) {
        try {
            localStorage.setItem('categories', JSON.stringify(categories));
            
            const url = AZURE_CONFIG.getBlobUrl(AZURE_CONFIG.dataContainerName, this.categoriesFileName, true);
            
            const headers = {
                'Content-Type': 'application/json',
                'x-ms-blob-type': 'BlockBlob',
                'x-ms-version': '2021-08-06'
            };
            
            if (accessToken) {
                headers['Authorization'] = 'Bearer ' + accessToken;
            }
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(categories)
            });
            
            if (!response.ok) {
                throw new Error('Failed to save categories: ' + response.statusText);
            }
            
            // Clear cache to force refresh
            this.clearCache('categories_cache');
            
            return true;
        } catch (error) {
            console.error('Error saving categories:', error);
            throw error;
        }
    }

    /**
     * Get default categories
     */
    getDefaultCategories() {
        return [
            { id: 'cat_1', name: 'Electronics' },
            { id: 'cat_2', name: 'Clothing' },
            { id: 'cat_3', name: 'Home & Kitchen' },
            { id: 'cat_4', name: 'Sports & Outdoors' },
            { id: 'cat_5', name: 'Toys & Games' }
        ];
    }

    /**
     * Fetch all brands from Azure Blob Storage or local file
     */
    async fetchBrands() {
        // Check cache first
        const cachedBrands = this.getCachedData('brands_cache');
        if (cachedBrands) {
            console.log('Using cached brands');
            return cachedBrands;
        }

        try {
            // Use local file if flag is set
            const url = this.useLocalFiles ? 
                this.brandsFileName : 
                AZURE_CONFIG.getBlobUrl(AZURE_CONFIG.dataContainerName, this.brandsFileName);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('Brands file not found, returning empty array');
                    this.setCachedData('brands_cache', []);
                    return [];
                }
                throw new Error(`Failed to fetch brands: ${response.statusText}`);
            }
            
            const brands = await response.json();
            this.setCachedData('brands_cache', brands);
            return brands;
        } catch (error) {
            console.error('Error fetching brands:', error);
            const cached = this.getCachedData('brands_cache');
            return cached || [];
        }
    }

    /**
     * Save brands to Azure Blob Storage
     */
    async saveBrands(brands, accessToken = null) {
        try {
            localStorage.setItem('brands', JSON.stringify(brands));
            
            const url = AZURE_CONFIG.getBlobUrl(AZURE_CONFIG.dataContainerName, this.brandsFileName, true);
            
            const headers = {
                'Content-Type': 'application/json',
                'x-ms-blob-type': 'BlockBlob',
                'x-ms-version': '2021-08-06'
            };
            
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(brands)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to save brands: ${response.statusText}`);
            }
            
            // Clear cache to force refresh
            this.clearCache('brands_cache');
            
            return true;
        } catch (error) {
            console.error('Error saving brands:', error);
            throw error;
        }
    }

    /**
     * Fetch all departments
     */
    async fetchDepartments() {
        // Check cache first
        const cachedDepartments = this.getCachedData('departments_cache');
        if (cachedDepartments) {
            console.log('Using cached departments');
            return cachedDepartments;
        }

        try {
            const url = this.useLocalFiles ? 
                this.departmentsFileName : 
                AZURE_CONFIG.getBlobUrl(AZURE_CONFIG.dataContainerName, this.departmentsFileName);
            
            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 404) {
                    console.log('Departments file not found, returning defaults');
                    const defaults = this.getDefaultDepartments();
                    this.setCachedData('departments_cache', defaults);
                    return defaults;
                }
                throw new Error(`Failed to fetch departments: ${response.statusText}`);
            }
            
            const departments = await response.json();
            this.setCachedData('departments_cache', departments);
            return departments;
        } catch (error) {
            console.error('Error fetching departments:', error);
            const cached = this.getCachedData('departments_cache');
            return cached || this.getDefaultDepartments();
        }
    }

    /**
     * Get default departments (hardcoded)
     */
    getDefaultDepartments() {
        return [
            {
                id: "home-kitchen",
                name: "Home & Kitchen",
                description: "Everything for your home and kitchen - from large appliances to small gadgets",
                icon: "🏠",
                slug: "home-kitchen",
                image: "https://images.unsplash.com/photo-1556911220-bff31c812dba?w=800&h=600&fit=crop"
            },
            {
                id: "pet-products",
                name: "Pet Products",
                description: "Complete pet care solutions - food, health products, toys and accessories",
                icon: "🐾",
                slug: "pet-products",
                image: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=800&h=600&fit=crop"
            }
        ];
    }

    /**
     * Fetch all products from Azure Blob Storage or local file
     */
    async fetchProducts() {
        console.log('[Storage] Fetching products...');
        
        // Check cache first
        const cachedProducts = this.getCachedData('products_cache');
        if (cachedProducts) {
            console.log('[Storage] Using cached products');
            return cachedProducts;
        }

        try {
            // Use local file if flag is set
            const url = this.useLocalFiles ? 
                this.productsFileName : 
                AZURE_CONFIG.getBlobUrl(AZURE_CONFIG.dataContainerName, this.productsFileName);
            
            console.log('[Storage] Products URL:', url);
            const response = await fetch(url);
            console.log('[Storage] Products response status:', response.status);
            
            if (!response.ok) {
                // If file doesn't exist, return empty array
                if (response.status === 404) {
                    console.log('[Storage] Products file not found, returning empty array');
                    this.setCachedData('products_cache', []);
                    return [];
                }
                console.error('[Storage] Failed to fetch products:', response.statusText);
                throw new Error(`Failed to fetch products: ${response.statusText}`);
            }
            
            const products = await response.json();
            console.log('[Storage] Products fetched successfully:', products.length, 'items');
            this.setCachedData('products_cache', products);
            return products;
        } catch (error) {
            console.error('[Storage] Error fetching products:', error);
            const cached = this.getCachedData('products_cache');
            return cached || [];
        }
    }

    /**
     * Save products to Azure Blob Storage
     * Requires user to be authenticated via Entra ID with Storage Blob Data Contributor role
     */
    async saveProducts(products, accessToken = null) {
        try {
            // Cache locally
            localStorage.setItem(STORAGE_KEYS.products, JSON.stringify(products));
            
            const url = AZURE_CONFIG.getBlobUrl(AZURE_CONFIG.dataContainerName, this.productsFileName, true);
            
            const headers = {
                'Content-Type': 'application/json',
                'x-ms-blob-type': 'BlockBlob',
                'x-ms-version': '2021-08-06'
            };
            
            // Add bearer token from Entra ID authentication
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(products)
            });
            
            if (!response.ok) {
                throw new Error(`Failed to save products: ${response.statusText}`);
            }
            
            // Clear cache to force refresh
            this.clearCache('products_cache');
            
            return true;
        } catch (error) {
            console.error('Error saving products:', error);
            throw error;
        }
    }

    /**
     * Upload image to Azure Blob Storage
     */
    async uploadImage(file, accessToken = null) {
        try {
            const fileName = `${Date.now()}_${file.name}`;
            const url = AZURE_CONFIG.getBlobUrl(AZURE_CONFIG.imagesContainerName, fileName, true);
            
            const headers = {
                'Content-Type': file.type,
                'x-ms-blob-type': 'BlockBlob',
                'x-ms-version': '2021-08-06'
            };
            
            // Add bearer token from Entra ID authentication
            if (accessToken) {
                headers['Authorization'] = `Bearer ${accessToken}`;
            }
            
            const response = await fetch(url, {
                method: 'PUT',
                headers: headers,
                body: file
            });
            
            if (!response.ok) {
                throw new Error(`Failed to upload image: ${response.statusText}`);
            }
            
            // Return the URL without SAS token for storage
            return `${AZURE_CONFIG.storageUrl}/${AZURE_CONFIG.imagesContainerName}/${fileName}`;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    /**
     * Get image URL with SAS token
     */
    getImageUrl(imageUrl) {
        if (!imageUrl) {
            return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22300%22 height=%22300%22%3E%3Crect fill=%22%23ddd%22 width=%22300%22 height=%22300%22/%3E%3Ctext fill=%22%23666%22 font-family=%22Arial%22 font-size=%2220%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3ENo Image%3C/text%3E%3C/svg%3E';
        }
        
        // If it's an external URL (starts with http:// or https://), return as-is
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
            // Only add SAS token if it's our storage account
            if (imageUrl.includes(AZURE_CONFIG.storageAccountName) && AZURE_CONFIG.sasToken) {
                const separator = imageUrl.includes('?') ? '&' : '?';
                return `${imageUrl}${separator}${AZURE_CONFIG.sasToken}`;
            }
            return imageUrl;
        }
        
        // If it's a relative path, construct full Azure blob URL with SAS token
        if (AZURE_CONFIG.sasToken) {
            return AZURE_CONFIG.getBlobUrl(AZURE_CONFIG.imagesContainerName, imageUrl);
        }
        
        return imageUrl;
    }

    /**
     * Delete image from Azure Blob Storage
     */
    async deleteImage(imageUrl) {
        try {
            if (!imageUrl || !imageUrl.includes(AZURE_CONFIG.storageAccountName)) {
                return;
            }
            
            // Extract blob name from URL
            const urlParts = imageUrl.split('/');
            const blobName = urlParts[urlParts.length - 1];
            
            const url = AZURE_CONFIG.getBlobUrl(AZURE_CONFIG.imagesContainerName, blobName, true);
            
            const headers = {
                'x-ms-version': '2021-08-06'
            };
            
            // Add bearer token if provided (from Entra ID)
            if (this.currentAccessToken) {
                headers['Authorization'] = `Bearer ${this.currentAccessToken}`;
            }
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers: headers
            });
            
            if (!response.ok && response.status !== 404) {
                throw new Error(`Failed to delete image: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Error deleting image:', error);
        }
    }

    /**
     * Generate a unique product ID
     */
    generateId() {
        return `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Set the access token for authenticated operations
     */
    setAccessToken(token) {
        this.currentAccessToken = token;
    }
}

// Create a singleton instance
const storageService = new StorageService();
