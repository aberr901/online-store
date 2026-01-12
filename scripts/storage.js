// Azure Blob Storage Helper Functions
class StorageService {
    constructor() {
        this.productsFileName = 'products.json';
    }

    /**
     * Fetch all products from Azure Blob Storage
     */
    async fetchProducts() {
        try {
            const url = AZURE_CONFIG.getBlobUrl(AZURE_CONFIG.dataContainerName, this.productsFileName);
            const response = await fetch(url);
            
            if (!response.ok) {
                // If file doesn't exist, return empty array
                if (response.status === 404) {
                    console.log('Products file not found, returning empty array');
                    return [];
                }
                throw new Error(`Failed to fetch products: ${response.statusText}`);
            }
            
            const products = await response.json();
            return products;
        } catch (error) {
            console.error('Error fetching products:', error);
            // Return cached products if available
            const cached = localStorage.getItem(STORAGE_KEYS.products);
            return cached ? JSON.parse(cached) : [];
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
            return 'https://via.placeholder.com/300x300?text=No+Image';
        }
        
        // If it's already a full URL with our storage account, add SAS token if needed
        if (imageUrl.includes(AZURE_CONFIG.storageAccountName) && AZURE_CONFIG.sasToken) {
            return `${imageUrl}?${AZURE_CONFIG.sasToken}`;
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
