# Online Store - Setup Instructions

> 📖 **For complete technical documentation**, see [ARCHITECTURE.md](./ARCHITECTURE.md)  
> This guide covers basic setup. For details on how products are stored, loaded, and managed, refer to the architecture documentation.

## Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/aberr901/online-store.git
   cd online-store
   ```

2. **Configure Azure credentials**
   - Copy `scripts/config.template.js` to `scripts/config.js`
   - Update the following values in `config.js`:
     - `storageAccountName`: Your Azure Storage account name
     - `readOnlySasToken`: Read-only SAS token for public access
     - `clientId`: Your Entra ID app registration client ID
     - `authority`: Your Entra ID tenant URL

   **⚠️ IMPORTANT**: Never commit `scripts/config.js` to Git!

3. **Serve locally**
   ```bash
   # Using Python
   python -m http.server 3000
   
   # Or using Node.js
   npx serve -p 3000
   ```

4. **Access the application**
   - Storefront: http://localhost:3000/index.html
   - Admin Panel: http://localhost:3000/admin.html

## Deployment to GitHub Pages

Your site is deployed at: **https://aberr901.github.io/online-store/**

For the admin panel to work on GitHub Pages:
1. Add this redirect URI to your Entra ID app: `https://aberr901.github.io/online-store/admin.html`
2. Update config in production (see below)

## Production Configuration

Since `config.js` is not in the repository, you'll need to inject configuration for production:

### Option 1: GitHub Actions (Recommended)
Store secrets in GitHub repository settings and inject during deployment.

### Option 2: Azure Static Web Apps
Use environment variables and Azure Functions for backend API.

### Option 3: Manual Deployment
Create `config.js` on the server after deployment.

## Security Notes

- ✅ The SAS token is **read-only** - safe for public use
- ✅ `config.js` is excluded from Git history
- ✅ Client ID and Tenant ID are removed from repository
- ⚠️ Admin access requires Azure RBAC role assignment

## Contributing

1. Never commit `scripts/config.js`
2. Use `scripts/config.template.js` as reference
3. Keep sensitive credentials local only

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete technical documentation including:
  - Philosophy and design decisions
  - Storage layer architecture (Azure Blob Storage)
  - Data flow diagrams
  - Admin management system
  - Authentication and security model
  - Caching strategy
- **[README.md](./README.md)** - Project overview and quick start
- **[SETUP-ENTRA-ID.md](./SETUP-ENTRA-ID.md)** - Detailed Entra ID setup guide
