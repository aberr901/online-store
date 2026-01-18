// Central Application Initialization
// This file ensures all components are properly initialized across all pages

class AppInitializer {
    constructor() {
        this.cart = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        try {
            // Wait for DOM to be fully loaded
            if (document.readyState === 'loading') {
                await new Promise(resolve => {
                    document.addEventListener('DOMContentLoaded', resolve);
                });
            }

            console.log('Initializing app...');

            // Initialize notification system
            if (typeof Notification !== 'undefined' && typeof notify === 'undefined') {
                window.notify = new Notification();
                console.log('✓ Notification system initialized');
            }

            // Initialize cart
            if (typeof ShoppingCart !== 'undefined' && !this.cart) {
                this.cart = new ShoppingCart();
                window.cart = this.cart;
                console.log('✓ Shopping cart initialized');
            }

            // Initialize privacy banner
            if (typeof PrivacyBanner !== 'undefined') {
                const privacyBanner = new PrivacyBanner();
                console.log('✓ Privacy banner initialized');
            }

            // Check authentication state
            this.checkAuthState();
            console.log('✓ Auth state checked');

            this.initialized = true;
            console.log('✅ App initialization complete!');
        } catch (error) {
            console.error('❌ Error initializing app:', error);
        }
    }

    checkAuthState() {
        const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        const userEmail = localStorage.getItem('userEmail');
        const navLoginBtn = document.getElementById('navLoginBtn');
        const adminLink = document.getElementById('adminLink');

        if (isAuthenticated && userEmail && navLoginBtn) {
            // Update login button text (handle both with and without span)
            const loginText = navLoginBtn.textContent.includes('Login') ? navLoginBtn : navLoginBtn.querySelector('span');
            if (loginText) {
                const usernameDisplay = userEmail.split('@')[0];
                if (navLoginBtn.querySelector('span')) {
                    navLoginBtn.querySelector('span').textContent = usernameDisplay;
                } else {
                    navLoginBtn.childNodes.forEach(node => {
                        if (node.nodeType === Node.TEXT_NODE && node.textContent.includes('Login')) {
                            node.textContent = usernameDisplay;
                        }
                    });
                }
            }
            console.log('✓ User authenticated:', userEmail);
        }
    }
}

// Create global app initializer instance
window.appInitializer = new AppInitializer();

// Auto-initialize
window.appInitializer.init();
