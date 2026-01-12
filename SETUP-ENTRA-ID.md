# Setting up Entra ID Authentication for Admin Panel

This guide shows how to configure Microsoft Entra ID (Azure AD) authentication for the admin panel.

## Benefits

✅ **Secure**: No exposed credentials in client code  
✅ **SSO**: Uses Microsoft/Office 365 accounts  
✅ **Audit Trail**: Track who made changes  
✅ **RBAC**: Control access with Azure roles  

## Setup Steps

### 1. Register App in Entra ID

1. Go to [Azure Portal](https://portal.azure.com) → **Microsoft Entra ID**
2. Click **App registrations** → **New registration**
3. Configure:
   - **Name**: `Online Store Admin`
   - **Supported account types**: `Accounts in this organizational directory only`
   - **Redirect URI**: 
     - Type: `Web`
     - URI: `https://<your-static-web-app>.azurestaticapps.net/.auth/login/aad/callback`
4. Click **Register**

### 2. Configure App Registration

1. Copy the **Application (client) ID** and **Directory (tenant) ID**
2. Go to **Certificates & secrets** → **New client secret**
   - Description: `Static Web App Secret`
   - Expires: Choose appropriate timeframe
   - Copy the **Value** (you won't see it again!)

### 3. Configure Azure Static Web App

#### Option A: Via Azure Portal

1. Go to your Static Web App
2. Navigate to **Configuration** → **Application settings**
3. Add these settings:
   ```
   AAD_CLIENT_ID = <your-application-client-id>
   AAD_CLIENT_SECRET = <your-client-secret-value>
   TENANT_ID = <your-tenant-id>
   ```

#### Option B: Via Azure CLI

```bash
az staticwebapp appsettings set \
  --name <your-static-web-app-name> \
  --setting-names \
    AAD_CLIENT_ID=<client-id> \
    AAD_CLIENT_SECRET=<secret> \
    TENANT_ID=<tenant-id>
```

### 4. Update staticwebapp.config.json

Replace `{TENANT_ID}` in [staticwebapp.config.json](staticwebapp.config.json):

```json
"openIdIssuer": "https://login.microsoftonline.com/YOUR-ACTUAL-TENANT-ID/v2.0"
```

### 5. Configure Storage Account Access

Grant admin users access to Azure Storage:

#### Method 1: Direct Storage Access (Advanced)

1. Go to **Storage Account** → **Access Control (IAM)**
2. Click **Add role assignment**
3. Role: **Storage Blob Data Contributor**
4. Assign access to: **User, group, or service principal**
5. Select your admin users
6. Click **Save**

⚠️ **Note**: Direct browser-to-storage requires CORS configuration:

```bash
az storage cors add \
  --account-name <storage-account> \
  --services b \
  --methods GET PUT DELETE OPTIONS \
  --origins https://<your-static-web-app>.azurestaticapps.net \
  --allowed-headers "*" \
  --exposed-headers "*" \
  --max-age 3600
```

#### Method 2: API Proxy (Recommended)

Create Azure Functions to proxy storage operations (more secure):

1. Create a `api` folder in your project
2. Add functions for product operations
3. Use Managed Identity for storage access
4. Update code to call `/api/products` instead of direct storage

### 6. Update config.js

In [scripts/config.js](scripts/config.js), set:

```javascript
authMode: 'entra-id'  // Change from 'sas'
```

### 7. Test Authentication

1. Deploy your app
2. Navigate to `/admin.html`
3. You should be redirected to Microsoft login
4. After login, you'll return to admin panel
5. Your email will display in the nav bar

## Authentication Flow

```
User visits /admin.html
    ↓
Static Web App checks auth (from staticwebapp.config.json)
    ↓
Not authenticated? → Redirect to /.auth/login/aad
    ↓
Microsoft Login Page
    ↓
User enters credentials
    ↓
Redirect back to /admin.html with auth cookie
    ↓
JavaScript calls /.auth/me to get user info
    ↓
Write operations use user's identity
```

## User Management

### Add Admin Users

Option 1: **Assign users Storage Blob Data Contributor role** (for direct access)

Option 2: **Configure allowed users in Static Web App**:
```json
{
  "routes": [
    {
      "route": "/admin.html",
      "allowedRoles": ["admin"]
    }
  ]
}
```

Then invite users via Static Web App → **Role Management**

### Remove Access

1. Go to **Storage Account** → **Access Control (IAM)**
2. Find the user → Click **Remove**

## Security Best Practices

1. **Use Managed Identity for API functions** (don't expose storage credentials)
2. **Set client secret expiration** and rotate regularly
3. **Enable audit logging** on Storage Account
4. **Use Conditional Access** policies for admin access
5. **Monitor authentication logs** in Entra ID

## Troubleshooting

### "Authentication failed" error

- Check AAD_CLIENT_ID and AAD_CLIENT_SECRET are correct
- Verify redirect URI matches exactly (including trailing slash)
- Ensure tenant ID is correct in staticwebapp.config.json

### "Access denied" to storage

- Verify user has "Storage Blob Data Contributor" role
- Check CORS settings allow your Static Web App domain
- Try incognito mode to rule out cached tokens

### Redirect loop

- Check `post_login_redirect_uri` in staticwebapp.config.json
- Ensure `/admin.html` is protected with `allowedRoles`

## API Proxy Implementation (Recommended)

For production, implement Azure Functions:

```javascript
// api/products/index.js
const { BlobServiceClient } = require('@azure/storage-blob');
const { DefaultAzureCredential } = require('@azure/identity');

module.exports = async function (context, req) {
    // Storage client with Managed Identity
    const blobServiceClient = new BlobServiceClient(
        `https://${process.env.STORAGE_ACCOUNT_NAME}.blob.core.windows.net`,
        new DefaultAzureCredential()
    );
    
    // Check if user is authenticated
    const clientPrincipal = req.headers['x-ms-client-principal'];
    if (!clientPrincipal) {
        context.res = { status: 401, body: 'Unauthorized' };
        return;
    }
    
    // Handle GET, POST, PUT, DELETE operations
    // ... implementation
};
```

This approach keeps all credentials server-side and is more secure.
