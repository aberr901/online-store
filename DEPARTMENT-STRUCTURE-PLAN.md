# Multi-Department Store Structure - Implementation Plan

## ✅ Completed Steps

### 1. Data Structure Created
- **departments.json** - Created with 2 departments:
  - Home & Kitchen (home-kitchen)
  - Pet Products (pet-products)
  
- **categories.json** - Updated with 8 categories:
  - 4 Home & Kitchen categories (Kitchen Appliances, Home Appliances, Cookware, Kitchen Tools)
  - 4 Pet Products categories (Pet Food, Pet Health, Pet Toys, Pet Accessories)
  - Each category now has `departmentId` field

- **brands.json** - Updated with departmentIds array:
  - 19 existing Home & Kitchen brands
  - 4 new Pet Product brands (Purina, KONG, Royal Canin, Hill's Pet)
  - Each brand has `departmentIds` array (supports multiple departments)

### 2. Azure Storage Updated
- All 3 files uploaded to `allshopwholesale` storage account
- Files are in the `product-data` container
- Available via SAS token for public read access

## 📋 Next Steps Required

### Phase 1: Update Storage Service
**File: scripts/storage.js**
- Add `fetchDepartments()` method to load departments.json
- Update category and brand methods to filter by department
- Cache departments data

### Phase 2: Create Department Store Pages

#### A. Home & Kitchen Store Page
**File: home-kitchen.html**
- Copy structure from index.html
- Modify to show only Home & Kitchen products
- Filter categories and brands by department
- Update navigation to link between departments

#### B. Pet Products Store Page
**File: pet-products.html**
- Similar structure to home-kitchen.html
- Show only Pet Products
- Department-specific filtering

### Phase 3: Redesign Homepage
**File: index.html**
- Remove current product listings
- Add department cards section with:
  - Department name and description
  - Department image
  - Link to department store page
  - Product count per department
- Keep cart, authentication, and navigation

### Phase 4: Update Products Script
**File: scripts/products-enhanced.js**
- Add department filtering logic
- Load department from URL parameter or page context
- Filter products by category's department
- Update brand/category filters to show only relevant items

### Phase 5: Update Admin Panel
**File: admin.html + scripts/admin.js**

#### Department Management
- Add department management tab
- CRUD operations for departments
- Upload department images

#### Category Form Updates
- Add department dropdown to category form
- Required field: must select department
- Show department name in category list

#### Brand Form Updates
- Add multi-select for departments
- Brands can belong to multiple departments
- Show department badges in brand list

#### Product Form
- Category dropdown filters by selected department
- Brand dropdown shows brands for that department
- Department is automatically inherited from category

### Phase 6: Navigation Updates
**All HTML files**
- Add department links to main navigation
- Dropdown with both departments
- Active state for current department
- Breadcrumbs showing: Home > Department > Category

### Phase 7: URL Structure
- Homepage: `/` or `/index.html`
- Home & Kitchen: `/home-kitchen.html`
- Pet Products: `/pet-products.html`
- Admin: `/admin.html`

## 🎨 Design Considerations

### Homepage Department Cards
```html
<section class="departments">
  <div class="container">
    <h2>Shop by Department</h2>
    <div class="department-grid">
      <a href="home-kitchen.html" class="department-card">
        <img src="[department.image]" alt="Home & Kitchen">
        <div class="department-info">
          <span class="department-icon">🏠</span>
          <h3>Home & Kitchen</h3>
          <p>Everything for your home and kitchen</p>
          <span class="product-count">20 Products</span>
        </div>
      </a>
      <!-- Repeat for Pet Products -->
    </div>
  </div>
</section>
```

### Department Page Header
```html
<section class="department-hero">
  <div class="container">
    <h1>
      <span class="department-icon">🏠</span>
      Home & Kitchen
    </h1>
    <p>From large appliances to small gadgets</p>
  </div>
</section>
```

## 📊 Data Flow

### Product Display Logic
1. Load departments.json
2. Determine current department (from URL or page)
3. Load all categories, filter by departmentId
4. Load all brands, filter by departmentIds containing current department
5. Load products, filter by category's department
6. Display filtered products with department-specific brands/categories

### Admin Product Creation
1. Admin selects category
2. System loads category details including departmentId
3. Brand dropdown filtered to show only brands with that departmentId
4. Product inherits department through category
5. Product appears on correct department page

## 🔄 Migration Path

### For Existing Products
- All current products use Home & Kitchen categories
- They will automatically appear on home-kitchen.html
- No data migration needed

### Adding Pet Products
1. Admin goes to admin panel
2. Adds pet products using new categories
3. Products automatically route to pet-products.html

## 🚀 Implementation Order

1. **Start Here**: Update storage.js to add fetchDepartments()
2. Create home-kitchen.html (copy from index.html, add filtering)
3. Create pet-products.html (copy from home-kitchen.html)
4. Update index.html to show department cards only
5. Update products-enhanced.js with department filtering
6. Update admin panel with department fields
7. Test flow: Admin adds category → product → appears on correct page
8. Add navigation between departments
9. Style refinements

## 💡 Future Enhancements

- Add more departments (Electronics, Clothing, etc.)
- Department-specific promotions
- Cross-department search
- Department landing page customization
- Analytics per department
