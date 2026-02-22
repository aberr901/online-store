# All Shop Wholesale - Online Store

A modern, serverless e-commerce platform built with vanilla JavaScript and Azure cloud services.

![Store Preview](https://github.com/user-attachments/assets/575a55c6-7d73-4ee5-842b-072715911994)

## 🌟 Features

### Customer-Facing Storefront
- 🛍️ **Product Catalog** - Browse hundreds of wholesale products
- 🔍 **Smart Filtering** - Filter by category, brand, and search
- 🎨 **Modern Design** - Responsive red/black/white theme
- 🛒 **Shopping Cart** - Add items with LocalStorage persistence
- ⚡ **Fast Loading** - Intelligent caching (50x faster on repeat visits)
- 📱 **Mobile Responsive** - Works on all devices

### Admin Management Panel
- ✏️ **Product CRUD** - Create, read, update, delete products
- 🏷️ **Brand Management** - Manage product brands and logos
- 📂 **Category Management** - Organize products into categories
- 🖼️ **Image Upload** - Direct upload to Azure Blob Storage
- 🔐 **Secure Authentication** - Microsoft Entra ID integration
- 📊 **Real-time Updates** - Changes reflect immediately

## 🏗️ Architecture

This application uses a **serverless, cloud-native architecture**:

- **Frontend**: Static HTML/CSS/JavaScript (no build process)
- **Storage**: Azure Blob Storage for data and images
- **Authentication**: Microsoft Entra ID (Azure AD)
- **Hosting**: GitHub Pages (free static hosting)
- **Caching**: LocalStorage with intelligent TTL

### Why This Approach?

✅ **Zero Backend** - No servers to maintain or scale  
✅ **Low Cost** - Azure Blob Storage costs ~$0.02/GB/month  
✅ **High Performance** - 50x faster loads with caching  
✅ **Enterprise Security** - Azure RBAC and Entra ID  
✅ **Simple Deployment** - Push to GitHub, automatically deployed  

For detailed architecture documentation, see **[ARCHITECTURE.md](./ARCHITECTURE.md)**.

## 📚 Documentation

| Document | Description |
|----------|-------------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | 📖 **Complete technical guide** - Philosophy, architecture, data flow, security |
| [SETUP.md](./SETUP.md) | 🚀 Local development and deployment instructions |
| [SETUP-ENTRA-ID.md](./SETUP-ENTRA-ID.md) | 🔐 Entra ID authentication setup guide |
| [IMPROVEMENTS-COMPLETE.md](./IMPROVEMENTS-COMPLETE.md) | ✨ Feature history and improvements |

## 🚀 Quick Start

### Prerequisites
- A web browser (Chrome, Firefox, Edge, Safari)
- Python or Node.js for local development
- Azure account for admin features (free tier works)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/aberr901/online-store.git
   cd online-store
   ```

2. **Start a local web server**
   ```bash
   # Using Python 3
   python -m http.server 8000
   
   # Or using Python 2
   python -m SimpleHTTPServer 8000
   
   # Or using Node.js
   npx serve -p 8000
   ```

3. **Open in browser**
   - Storefront: http://localhost:8000/index.html
   - Admin Panel: http://localhost:8000/admin.html

### Configuration (For Your Own Deployment)

1. **Copy the config template**
   ```bash
   cp scripts/config.template.js scripts/config.js
   ```

2. **Update `scripts/config.js` with your credentials**
   - Azure Storage account name
   - SAS token for read access
   - Entra ID app registration details

3. **⚠️ Important**: Add `scripts/config.js` to `.gitignore` (already done)

For detailed setup instructions, see [SETUP.md](./SETUP.md).

## 📖 How It Works

### For Customers (Public Storefront)

```
User visits index.html
         ↓
Check LocalStorage cache
         ↓
    Cache hit? ────→ Load instantly (50ms)
         │
         ↓ Cache miss
Fetch from Azure Blob Storage (500ms)
         ↓
Store in cache (1 hour TTL)
         ↓
Display products with filters
```

### For Admins (Management Panel)

```
Admin visits admin.html
         ↓
Authenticate via Entra ID
         ↓
Get access token with storage permissions
         ↓
Perform CRUD operations
         ↓
Save to Azure Blob Storage (with Bearer token)
         ↓
Clear cache & reload data
```

**See [ARCHITECTURE.md](./ARCHITECTURE.md) for complete data flow diagrams and technical details.**

## 🔒 Security

The application implements **defense-in-depth security**:

1. **Network Security**
   - HTTPS only
   - CORS restrictions
   - No credentials in client code

2. **Authentication**
   - Microsoft Entra ID (enterprise-grade)
   - OAuth 2.0 / OpenID Connect
   - Multi-factor authentication support

3. **Authorization**
   - Azure RBAC (role-based access control)
   - Least privilege principle
   - Separate read/write permissions

4. **Access Control**
   - Public: Read-only SAS tokens
   - Admin: Short-lived Bearer tokens
   - No shared keys in code

5. **Data Protection**
   - Encryption at rest (Azure default)
   - Encryption in transit (TLS 1.2+)

**Learn more in [ARCHITECTURE.md - Security Model](./ARCHITECTURE.md#security-model)**

## 🎯 Project Structure

```
online-store/
├── index.html              # Public storefront
├── admin.html              # Admin management panel
├── about.html              # About page
├── contact.html            # Contact page
├── scripts/
│   ├── config.js          # Configuration (not in git)
│   ├── config.template.js # Configuration template
│   ├── storage.js         # Azure Storage service layer
│   ├── admin.js           # Admin panel logic
│   ├── products-enhanced.js # Product display & filtering
│   ├── cart.js            # Shopping cart functionality
│   ├── auth.js            # Authentication service (MSAL)
│   └── ...
├── styles/
│   ├── main.css           # Main stylesheet (red/black/white theme)
│   ├── admin.css          # Admin panel styles
│   └── animations.css     # Animation effects
├── ARCHITECTURE.md        # 📖 Complete technical documentation
├── SETUP.md               # Setup instructions
└── README.md              # This file
```

## 🎨 Design

The store features a modern **red, black, and white** color scheme:

- **Primary Red** (#dc143c) - Crimson for primary actions and branding
- **Black** (#000000) - For accents and text
- **White** (#ffffff) - Clean backgrounds

The design is:
- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Accessible (ARIA labels, keyboard navigation)
- ✅ Fast (optimized CSS, lazy loading)
- ✅ Professional (clean typography, smooth animations)

## 🛠️ Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | HTML5, CSS3, JavaScript (ES6+) | User interface |
| **Storage** | Azure Blob Storage | Product data (JSON) and images |
| **Authentication** | Microsoft Entra ID + MSAL.js | Secure admin access |
| **Hosting** | GitHub Pages | Free static hosting |
| **Caching** | LocalStorage API | Client-side performance |
| **Fonts** | Google Fonts (Playfair Display, Inter) | Typography |

**No frameworks or build tools required** - Pure vanilla JavaScript for simplicity and performance.

## 📊 Performance

| Metric | Value | Note |
|--------|-------|------|
| First Load | 500-800ms | Network fetch + parse |
| Cached Load | 50-100ms | LocalStorage read |
| Cache Hit Rate | ~90% | For repeat visitors |
| Bandwidth Saved | 95% | With caching enabled |
| Supports | 10,000+ products | With virtual scrolling |

## 🤝 Contributing

This is a private wholesale business platform. For access or questions:

- 📧 Email: info@allshopwholesale.com
- 📞 Phone: 0050946820
- 🏢 Company: All Shop Wholesale SRL
- 📍 Location: București, România

## 📝 License

Copyright © 2026 All Shop Wholesale SRL. All rights reserved.

- VAT: RO50946820
- Website: https://allshopwholesale.com

---

## 🔗 Links

- **Live Site**: [https://aberr901.github.io/online-store/](https://aberr901.github.io/online-store/)
- **Documentation**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Setup Guide**: [SETUP.md](./SETUP.md)
- **Azure Blob Storage**: [Documentation](https://docs.microsoft.com/en-us/azure/storage/blobs/)
- **Microsoft Entra ID**: [Documentation](https://docs.microsoft.com/en-us/azure/active-directory/)

---

*For detailed information about how products are stored, loaded, and managed, please read **[ARCHITECTURE.md](./ARCHITECTURE.md)***
