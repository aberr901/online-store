// Shopping Cart Management
class ShoppingCart {
    constructor() {
        this.items = this.loadCart();
        this.initializeEventListeners();
        // Initialize cart display on page load
        this.updateCartDisplay();
    }

    loadCart() {
        const cart = localStorage.getItem(STORAGE_KEYS.cart);
        return cart ? JSON.parse(cart) : [];
    }

    saveCart() {
        localStorage.setItem(STORAGE_KEYS.cart, JSON.stringify(this.items));
        this.updateCartDisplay();
    }

    addItem(product, quantity = 1) {
        const existingItem = this.items.find(item => item.id === product.id);
        
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            this.items.push({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.imageUrl || product.image,
                quantity: quantity
            });
        }
        
        this.saveCart();
        if (typeof notify !== 'undefined') {
            notify.success('Product added to cart!');
        }
    }

    removeItem(productId) {
        this.items = this.items.filter(item => item.id !== productId);
        this.saveCart();
    }

    updateQuantity(productId, quantity) {
        const item = this.items.find(item => item.id === productId);
        if (item) {
            if (quantity <= 0) {
                this.removeItem(productId);
            } else {
                item.quantity = quantity;
                this.saveCart();
            }
        }
    }

    clearCart() {
        this.items = [];
        this.saveCart();
    }

    getTotal() {
        return this.items.reduce((total, item) => total + (item.price * item.quantity), 0);
    }

    getItemCount() {
        return this.items.reduce((count, item) => count + item.quantity, 0);
    }

    updateCartDisplay() {
        // Update cart count badge
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = this.getItemCount();
        }

        // Update cart items display
        const cartItemsContainer = document.getElementById('cartItems');
        const cartTotal = document.getElementById('cartTotal');
        
        if (!cartItemsContainer) return;

        if (this.items.length === 0) {
            cartItemsContainer.innerHTML = '<div class="empty-cart">Your cart is empty</div>';
            if (cartTotal) cartTotal.textContent = '$0.00';
            return;
        }

        cartItemsContainer.innerHTML = this.items.map(item => `
            <div class="cart-item" data-product-id="${item.id}">
                <img src="${storageService.getImageUrl(item.image)}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.name}</div>
                    <div class="cart-item-price">$${item.price.toFixed(2)}</div>
                    <div class="cart-item-quantity">
                        <button onclick="cart.updateQuantity('${item.id}', ${item.quantity - 1})">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="cart.updateQuantity('${item.id}', ${item.quantity + 1})">+</button>
                    </div>
                    <div class="remove-item" onclick="cart.removeItem('${item.id}')">Remove</div>
                </div>
            </div>
        `).join('');

        if (cartTotal) {
            cartTotal.textContent = `$${this.getTotal().toFixed(2)}`;
        }
    }

    initializeEventListeners() {
        // Open cart sidebar
        const cartIcon = document.querySelector('.cart-icon');
        if (cartIcon) {
            cartIcon.addEventListener('click', () => {
                document.getElementById('cartSidebar').classList.add('open');
            });
        }

        // Close cart sidebar
        const closeCart = document.getElementById('closeCart');
        if (closeCart) {
            closeCart.addEventListener('click', () => {
                document.getElementById('cartSidebar').classList.remove('open');
            });
        }

        // Close cart when clicking outside
        const cartSidebar = document.getElementById('cartSidebar');
        if (cartSidebar) {
            document.addEventListener('click', (e) => {
                if (!cartSidebar.contains(e.target) && !e.target.closest('.cart-icon')) {
                    cartSidebar.classList.remove('open');
                }
            });
        }
    }
}

// Initialize cart
const cart = new ShoppingCart();
