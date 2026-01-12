# Setup Guide: Static Store with Entra ID Admin

This guide shows how to set up a fully static online store where:
- **Public users** access products via read-only SAS token (no authentication)
- **Admin users** authenticate via Entra ID in their browser and access storage directly

## Architecture

```
┌─────────────────┐
│  GitHub Pages   │  Static files (HTML/CSS/JS)
│  or Static Web  │  
└────────┬────────┘
         │
    ┌────▼─────┐
    │  Browser │
    └────┬─────┘
         │
    ┌────▼──────────────────────┐
    │ Read?  │  Write (Admin)?  │
    └────┬───┴─────────┬────────┘
         │             │
    ┌────▼─────┐  ┌───▼──────────┐
    │ Storage  │  │ Entra ID     │
    │ (+ SAS)  │  │ Auth → Token │
    └──────────┘  └───┬──────────┘
                      │
                 ┌────▼─────┐
                 │ Storage  │
                 │ (Bearer) │
                 └──────────┘
```

## Step 1: Create Storage Account

1. Go to [Azure Portal](https://portal.azure.com)
2. Create a Storage Account
3. Create two containers:
   - `product-data` (for products.json)
   - `product-images` (for product images)

## Step 2: Configure CORS on Storage

**Important**: Enable CORS for browser access

```bash
az storage cors add \
  --services b \
  --methods GET PUT DELETE OPTIONS \
  --origins https://yourdomain.com \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600 \
  --account-name YOUR_STORAGE_ACCOUNT
```

Or in Azure Portal:
1. Storage Account → Resource sharing (CORS)
2. Blob service:
   - Allowed origins: `https://yourdomain.com` or `*` for testing
   - Allowed methods: `GET, PUT, DELETE, OPTIONS`
   - Allowed headers: `*`
   - Exposed headers: `*`
   - Max age: `3600`

## Step 3: Generate Read-Only SAS Token

For public storefront access:

1. Go to Storage Account → Shared access signature
2. Configure:
   - **Allowed services**: ☑ Blob
   - **Allowed resource types**: ☑ Object, ☑ Container
   - **Allowed permissions**: ☑ Read, ☑ List
   - **Start/Expiry time**: Set appropriate timeframe (e.g., 1 year)
   - **Allowed protocols**: HTTPS only
3. Click "Generate SAS and connection string"
4. Copy the **SAS token** (starts with `?sv=...`)

## Step 4: Register App in Entra ID

For admin authentication:

1. Go to **Microsoft Entra ID** → **App registrations** → **New registration**
2. Configure:
   - **Name**: `Online Store Admin`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: 
     - Platform: `Single-page application (SPA)`
     - URI: `https://yourdomain.com/admin.html`
3. Click **Register**
4. **Copy the Application (client) ID and Directory (tenant) ID**

### Configure API Permissions

1. Go to **API permissions** → **Add a permission**
2. Click **Azure Storage** → **Delegated permissions**
3. Select **user_impersonation**
4. Click **Add permissions**
5. Click **Grant admin consent** (if you have permissions)

## Step 5: Assign Storage Permissions to Admin Users

Admin users need direct access to storage:

```bash
# Assign role to specific user
az role assignment create \
  --role "Storage Blob Data Contributor" \
  --assignee user@yourdomain.com \
  --scope /subscriptions/{subscription-id}/resourceGroups/{rg-name}/providers/Microsoft.Storage/storageAccounts/{storage-account-name}
```

Or in Azure Portal:
1. Go to Storage Account → Access Control (IAM)
2. Click **Add role assignment**
3. Role: **Storage Blob Data Contributor**
4. Assign to: **User, group, or service principal**
5. Select your admin users
6. Click **Save**

## Step 6: Configure the Application

Update [scripts/config.js](scripts/config.js):

```javascript
const AZURE_CONFIG = {
    storageAccountName: 'yourstorageaccount',
    dataContainerName: 'product-data',
    imagesContainerName: 'product-images',
    readOnlySasToken: 'YOUR_READ_ONLY_SAS_TOKEN'  // From Step 3
};

const MSAL_CONFIG = {
    auth: {
        clientId: 'YOUR_CLIENT_ID',  // From Step 4
        authority: 'https://login.microsoftonline.com/YOUR_TENANT_ID',
        redirectUri: 'https://yourdomain.com/admin.html'
    },
    cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false
    }
};
```

## Step 7: Initialize Products Data

Create an empty products.json file:

```json
[]
```

Upload to `product-data` container in Azure Storage.

## Step 8: Deploy to GitHub Pages or Azure Static Web Apps

### Option A: GitHub Pages

1. Push code to GitHub repository
2. Go to repository Settings → Pages
3. Source: Deploy from branch `main`
4. Save

### Option B: Azure Static Web Apps

```bash
# Install SWA CLI
npm install -g @azure/static-web-apps-cli

# Login to Azure
az login

# Deploy
az staticwebapp create \
  --name online-store \
  --resource-group YOUR_RG \
  --source https://github.com/YOUR_USERNAME/YOUR_REPO \
  --location eastus2 \
  --branch main \
  --app-location "/" \
  --output-location ""
```

## How It Works

### Public Storefront (index.html)

1. Browser loads static HTML/CSS/JS from GitHub/CDN
2. JavaScript fetches `products.json` from Azure Storage
3. URL includes read-only SAS token: `https://storage.../products.json?sv=...`
4. Products display, users can browse and add to cart

### Admin Panel (admin.html)

1. Browser loads static HTML/CSS/JS
2. MSAL.js library initializes
3. If not authenticated → User clicks "Sign in with Microsoft"
4. Popup/redirect to Microsoft login page
5. User enters credentials (SSO if already logged in)
6. Microsoft returns to app with authentication
7. App requests Azure Storage token: `acquireTokenSilent()`
8. Token has scope: `https://storage.azure.com/user_impersonation`
9. JavaScript makes direct API calls to storage with Bearer token:
   ```
   PUT https://storage.../products.json
   Authorization: Bearer eyJ0eXAiOi...
   ```
10. Azure verifies user has "Storage Blob Data Contributor" role
11. If authorized, updates blob

## Security Notes

✅ **Read-only SAS**: Public users can only read, not modify  
✅ **Entra ID**: Admin identity verified by Microsoft  
✅ **Direct auth**: No credentials exposed in code  
✅ **RBAC**: Fine-grained access control per user  
✅ **Audit logs**: All storage operations logged  

## Testing

### Test Public Access

1. Open `index.html` in browser (or deployed URL)
2. Products should load without authentication
3. Try adding items to cart

### Test Admin Access

1. Open `admin.html` in browser (or deployed URL)
2. Should see "Sign in with Microsoft" button
3. Click to authenticate
4. After login, should see product management interface
5. Try adding/editing/deleting a product
6. Check `products.json` in storage to verify changes

## Troubleshooting

### Products won't load
- Check read-only SAS token is valid and not expired
- Verify CORS is configured correctly
- Check browser console for errors

### Admin can't authenticate
- Verify clientId and tenantId in config.js
- Check redirect URI matches exactly in App Registration
- Ensure user is in the correct tenant

### Admin authenticated but can't save
- Verify user has "Storage Blob Data Contributor" role
- Check CORS settings include your domain
- Check browser console for 403 errors
- Verify API permissions include Azure Storage delegation

### CORS errors
- Make sure CORS is configured on Storage Account
- Include your exact domain (no wildcards in production)
- Allow OPTIONS method

## Cost Estimate

- **Storage Account**: ~$0.02/GB/month
- **Bandwidth**: ~$0.087/GB outbound
- **Entra ID**: Free for basic authentication
- **GitHub Pages**: Free
- **Azure Static Web Apps**: Free tier available

**Estimated**: < $5/month for small store
