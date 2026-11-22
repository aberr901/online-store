# Azure Storage Setup Complete

## Storage Account Details
- **Account Name:** allshopwholesale
- **Resource Group:** allshop-rg
- **Location:** East US
- **SKU:** Standard_LRS (Locally Redundant Storage)
- **Account Kind:** StorageV2
- **Access Tier:** Hot

## Containers Created
1. **product-data** - Public blob access (read-only)
   - Contains: products.json, brands.json, categories.json
2. **product-images** - Public blob access (read-only)
   - Ready for product images

## Access Configuration

### Public Access (Read-Only)
- **SAS Token:** Configured with Read + List permissions
- **Expiration:** 2027-01-15
- **Protocol:** HTTPS only
- **Services:** Blob storage
- **Resource Types:** Service, Container, Object

### Admin Access (Full Access)
- **Authentication:** Azure AD (Entra ID) via MSAL.js
- **App Registration ID:** 5ad34e8e-91ea-4264-bfdb-0f71d1fb5258
- **Tenant ID:** 7155ba15-8532-4d67-8c0b-dce23ad3c48f
- **RBAC Role:** Storage Blob Data Contributor
- **Assigned To:** abraham@vetdist.com (User Principal ID: 167a4b6d-b177-4b6e-b480-5be626c18909)

## Uploaded Files
1. **products.json** (9,558 bytes) - 20 home and kitchen appliance products
2. **brands.json** (3,053 bytes) - 19 brand definitions
3. **categories.json** (447 bytes) - 4 category definitions

## Configuration Updates

### scripts/config.js
- Updated `storageAccountName` from 'onlinestore5521' to 'allshopwholesale'
- Updated `readOnlySasToken` with new 1-year token
- `redirectUri` already set to dynamic: `window.location.origin + '/admin.html'`

### scripts/storage.js
- Changed `productsFileName` from 'products-home-kitchen.json' to 'products.json'
- Set `useLocalFiles` to `false` (now using Azure storage)

## Storage Endpoints
- **Blob Service:** https://allshopwholesale.blob.core.windows.net/
- **Product Data:** https://allshopwholesale.blob.core.windows.net/product-data/
- **Product Images:** https://allshopwholesale.blob.core.windows.net/product-images/

## Access Patterns

### Public Users (Storefront)
- Use read-only SAS token appended to blob URLs
- Can read and list blobs in both containers
- No write or delete permissions

### Admin Users
- Authenticate via Azure AD using MSAL.js
- Obtain Azure Storage Bearer token
- Full read/write/delete permissions via RBAC
- No SAS token needed for authenticated requests

## Next Steps
1. Test the website to ensure products load from Azure storage
2. Upload product images to the `product-images` container
3. Test admin authentication and data management features
4. Consider deploying as Azure Static Web App for production

## Security Notes
- Public access is read-only via SAS token
- Admin access requires Azure AD authentication
- SAS token expires January 15, 2027
- SSL/TLS enforced for all connections
- Storage account keys should be rotated periodically
- RBAC provides fine-grained access control without sharing account keys
