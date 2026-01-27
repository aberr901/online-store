// Reusable Footer Component
class FooterComponent {
    render() {
        return `
    <footer class="footer">
        <div class="container">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>About Us</h4>
                    <p>All Shop Wholesale SRL - Your trusted partner in premium wholesale products across Europe.</p>
                </div>
                <div class="footer-section">
                    <h4>Shop</h4>
                    <ul>
                        <li><a href="home-kitchen.html">Home & Kitchen</a></li>
                        <li><a href="pet-supplies.html">Pet Supplies</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="index.html">Home</a></li>
                        <li><a href="about.html">About Us</a></li>
                        <li><a href="contact.html">Contact</a></li>
                        <li><a href="admin.html">Admin</a></li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Contact</h4>
                    <ul class="contact-list">
                        <li><span class="footer-icon">✉</span> info@allshopwholesale.com</li>
                        <li><span class="footer-icon">☎</span> +40 50 946 820</li>
                        <li><span class="footer-icon">⚐</span> București, România</li>
                    </ul>
                </div>
                <div class="footer-section">
                    <h4>Legal</h4>
                    <ul>
                        <li>All Shop Wholesale SRL</li>
                        <li>Serving retailers across the EU</li>
                    </ul>
                </div>
            </div>
            <div class="footer-bottom">
                <p>&copy; ${new Date().getFullYear()} All Shop Wholesale SRL. All rights reserved.</p>
            </div>
        </div>
    </footer>
        `;
    }

    mount(targetElement) {
        if (typeof targetElement === 'string') {
            targetElement = document.querySelector(targetElement);
        }
        if (targetElement) {
            targetElement.innerHTML = this.render();
        }
    }
}

// Auto-initialize if footerPlaceholder exists
document.addEventListener('DOMContentLoaded', () => {
    const footerPlaceholder = document.getElementById('footerPlaceholder');
    if (footerPlaceholder) {
        const footer = new FooterComponent();
        footer.mount(footerPlaceholder);
    }
});
