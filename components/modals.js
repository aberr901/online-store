// Reusable Modal Components (Login and Cart)
// Matches the original store pages (home-kitchen.html, pet-supplies.html)
class ModalComponent {
    renderLoginModal() {
        return `
    <!-- Login Modal -->
    <div class="login-modal" id="loginModal">
        <div class="login-container">
            <button class="login-close" id="closeLogin">&times;</button>
            <div class="login-header">
                <h2>Sign in to All Shop Wholesale</h2>
                <p>Continue to complete your order</p>
            </div>
            <div class="login-body">
                <button class="btn-google-sso" id="googleBtn">
                    <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"></path><path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"></path><path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"></path><path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"></path></svg>
                    Continue with Google
                </button>
                <div class="login-divider">
                    <span>OR</span>
                </div>
                <form class="login-form" id="loginForm">
                    <div class="form-group">
                        <label for="loginEmail">Email address</label>
                        <input type="email" id="loginEmail" placeholder="name@example.com" required>
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" placeholder="Enter your password" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-block">Sign In</button>
                </form>
                <div class="login-footer">
                    <p>Don't have an account? <a href="#" id="createAccountLink">Create account</a></p>
                </div>
            </div>
        </div>
    </div>
        `;
    }

    renderCartSidebar() {
        return `
    <!-- Cart Sidebar -->
    <div class="cart-sidebar" id="cartSidebar">
        <div class="cart-header">
            <h2>Shopping Cart</h2>
            <button class="close-cart" id="closeCart">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
            </button>
        </div>
        <div class="cart-items" id="cartItems">
            <p class="cart-empty">Your cart is empty</p>
        </div>
        <div class="cart-footer">
            <div class="cart-total">
                <span>Total:</span>
                <span class="total-amount" id="cartTotal">$0.00</span>
            </div>
            <button class="btn btn-primary btn-checkout">Checkout</button>
        </div>
    </div>
    <div class="cart-overlay" id="cartOverlay"></div>
        `;
    }

    mount(targetElement) {
        if (typeof targetElement === 'string') {
            targetElement = document.querySelector(targetElement);
        }
        if (targetElement) {
            targetElement.innerHTML = this.renderLoginModal() + this.renderCartSidebar();
            this.initializeEvents();
        }
    }

    initializeEvents() {
        // Login Modal Events
        const navLoginBtn = document.getElementById('navLoginBtn');
        const loginModal = document.getElementById('loginModal');
        const closeLogin = document.getElementById('closeLogin');
        const loginForm = document.getElementById('loginForm');
        const googleBtn = document.getElementById('googleBtn');
        const createAccountLink = document.getElementById('createAccountLink');
        const checkoutBtn = document.querySelector('.btn-checkout');

        // Cart Sidebar Events
        const cartBtn = document.getElementById('cartBtn');
        const cartSidebar = document.getElementById('cartSidebar');
        const closeCart = document.getElementById('closeCart');
        const cartOverlay = document.getElementById('cartOverlay');

        // Open login from nav button
        if (navLoginBtn) {
            navLoginBtn.addEventListener('click', () => {
                if (loginModal) {
                    loginModal.classList.add('active');
                }
            });
        }

        // Open login on checkout
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (!window.cart || window.cart.items.length === 0) {
                    if (typeof notify !== 'undefined') {
                        notify.warning('Your cart is empty!');
                    }
                    return;
                }
                if (loginModal) {
                    loginModal.classList.add('active');
                }
            });
        }

        // Close login modal
        if (closeLogin && loginModal) {
            closeLogin.addEventListener('click', () => {
                loginModal.classList.remove('active');
            });
            
            // Close on background click
            loginModal.addEventListener('click', (e) => {
                if (e.target === loginModal) {
                    loginModal.classList.remove('active');
                }
            });
        }

        // Cart button - open cart
        if (cartBtn) {
            cartBtn.addEventListener('click', () => {
                if (cartSidebar) {
                    cartSidebar.classList.add('active');
                }
                if (cartOverlay) {
                    cartOverlay.classList.add('active');
                }
            });
        }

        // Close cart
        if (closeCart) {
            closeCart.addEventListener('click', () => {
                if (cartSidebar) {
                    cartSidebar.classList.remove('active');
                }
                if (cartOverlay) {
                    cartOverlay.classList.remove('active');
                }
            });
        }

        // Close cart on overlay click
        if (cartOverlay) {
            cartOverlay.addEventListener('click', () => {
                if (cartSidebar) {
                    cartSidebar.classList.remove('active');
                }
                cartOverlay.classList.remove('active');
            });
        }

        // Google login
        if (googleBtn) {
            googleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof notify !== 'undefined') {
                    notify.info('To create a wholesale account, please contact us at info@allshopwholesale.com or call 0050946820');
                }
            });
        }

        // Login form submission
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const email = document.getElementById('loginEmail').value;
                
                // Simulate login success (replace with actual authentication)
                localStorage.setItem('isAuthenticated', 'true');
                localStorage.setItem('userEmail', email);
                
                if (typeof notify !== 'undefined') {
                    notify.success('Welcome! You are now signed in.');
                }
                
                if (loginModal) {
                    loginModal.classList.remove('active');
                }
                
                // Update login button
                if (navLoginBtn) {
                    const loginText = navLoginBtn.querySelector('span') || navLoginBtn;
                    loginText.textContent = email.split('@')[0];
                }
                
                loginForm.reset();
            });
        }

        // Create account link
        if (createAccountLink) {
            createAccountLink.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof notify !== 'undefined') {
                    notify.info('To create a wholesale account, please contact us at info@allshopwholesale.com or call 0050946820', 6000);
                }
            });
        }
    }
}

// Auto-initialize if modalsPlaceholder exists
document.addEventListener('DOMContentLoaded', () => {
    const modalsPlaceholder = document.getElementById('modalsPlaceholder');
    if (modalsPlaceholder) {
        const modals = new ModalComponent();
        modals.mount(modalsPlaceholder);
    }
});
