// Modern Features JavaScript
// Handles all the new innovative UI components

document.addEventListener('DOMContentLoaded', () => {
    // === Animated Stats Counter ===
    const animateStats = () => {
        const stats = document.querySelectorAll('.stat-number');
        
        const observerOptions = {
            threshold: 0.5,
            rootMargin: '0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = parseInt(entry.target.getAttribute('data-target'));
                    const duration = 2000; // 2 seconds
                    const increment = target / (duration / 16); // 60fps
                    let current = 0;
                    
                    const updateCounter = () => {
                        current += increment;
                        if (current < target) {
                            entry.target.textContent = Math.ceil(current) + '+';
                            requestAnimationFrame(updateCounter);
                        } else {
                            entry.target.textContent = target + '+';
                        }
                    };
                    
                    updateCounter();
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        stats.forEach(stat => observer.observe(stat));
    };
    
    animateStats();
    
    // === Particles Background (Simple Canvas Animation) ===
    const initParticles = () => {
        const canvas = document.getElementById('particles');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        const particles = [];
        const particleCount = 50;
        
        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 1;
                this.speedX = Math.random() * 0.5 - 0.25;
                this.speedY = Math.random() * 0.5 - 0.25;
            }
            
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                
                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }
            
            draw() {
                ctx.fillStyle = 'rgba(220, 20, 60, 0.5)';
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        for (let i = 0; i < particleCount; i++) {
            particles.push(new Particle());
        }
        
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(particle => {
                particle.update();
                particle.draw();
            });
            requestAnimationFrame(animate);
        }
        
        animate();
        
        window.addEventListener('resize', () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        });
    };
    
    initParticles();
    
    // === Brands Carousel ===
    const brandsCarousel = document.getElementById('brandsCarousel');
    const prevBtn = document.getElementById('brandsPrev');
    const nextBtn = document.getElementById('brandsNext');
    
    if (brandsCarousel && prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            brandsCarousel.scrollBy({
                left: -300,
                behavior: 'smooth'
            });
        });
        
        nextBtn.addEventListener('click', () => {
            brandsCarousel.scrollBy({
                left: 300,
                behavior: 'smooth'
            });
        });
    }
    
    // === Filter Sidebar Toggle (Mobile) ===
    const toggleFiltersBtn = document.getElementById('toggleFilters');
    const filterSidebar = document.getElementById('filterSidebar');
    
    if (toggleFiltersBtn && filterSidebar) {
        toggleFiltersBtn.addEventListener('click', () => {
            filterSidebar.classList.toggle('active');
        });
        
        // Close sidebar when clicking outside
        document.addEventListener('click', (e) => {
            if (!filterSidebar.contains(e.target) && !toggleFiltersBtn.contains(e.target)) {
                filterSidebar.classList.remove('active');
            }
        });
    }
    
    // === View Toggle (Grid/List) ===
    const viewBtns = document.querySelectorAll('.view-btn');
    const productsGrid = document.getElementById('productsGridModern');
    
    viewBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            viewBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const view = btn.getAttribute('data-view');
            if (view === 'list') {
                productsGrid.style.gridTemplateColumns = '1fr';
            } else {
                productsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
            }
        });
    });
    
    // === Active Filters Chips ===
    const activeFiltersContainer = document.getElementById('activeFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');
    
    function addFilterChip(label, value) {
        const chip = document.createElement('div');
        chip.className = 'filter-chip';
        chip.innerHTML = `
            ${label}
            <button onclick="this.parentElement.remove()">&times;</button>
        `;
        activeFiltersContainer.appendChild(chip);
    }
    
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', () => {
            activeFiltersContainer.innerHTML = '';
            // Reset all checkboxes
            document.querySelectorAll('.filter-checkbox input[type="checkbox"]').forEach(cb => {
                cb.checked = false;
            });
            // Reset price ranges
            document.getElementById('priceMin').value = 0;
            document.getElementById('priceMax').value = 1000;
            document.getElementById('priceMinVal').textContent = '$0';
            document.getElementById('priceMaxVal').textContent = '$1000';
        });
    }
    
    // === Price Range Sliders ===
    const priceMin = document.getElementById('priceMin');
    const priceMax = document.getElementById('priceMax');
    const priceMinVal = document.getElementById('priceMinVal');
    const priceMaxVal = document.getElementById('priceMaxVal');
    
    if (priceMin && priceMax) {
        priceMin.addEventListener('input', (e) => {
            priceMinVal.textContent = '$' + e.target.value;
        });
        
        priceMax.addEventListener('input', (e) => {
            priceMaxVal.textContent = '$' + e.target.value;
        });
    }
    
    // === Newsletter Form ===
    const newsletterForm = document.getElementById('newsletterForm');
    
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = newsletterForm.querySelector('input[type="email"]').value;
            
            // Show notification (using existing notification system)
            if (window.showNotification) {
                showNotification('Thank you for subscribing!', 'success');
            } else {
                alert('Thank you for subscribing!');
            }
            
            newsletterForm.reset();
        });
    }
    
    // === Image Stack Hover Effects ===
    const imageStacks = document.querySelectorAll('.image-stack');
    
    imageStacks.forEach((stack, index) => {
        stack.addEventListener('mouseenter', () => {
            stack.style.zIndex = 10;
        });
        
        stack.addEventListener('mouseleave', () => {
            stack.style.zIndex = 3 - index;
        });
    });
    
    // === Smooth Scroll for Navigation Links ===
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href !== '#' && document.querySelector(href)) {
                e.preventDefault();
                document.querySelector(href).scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    // === Load Product Cards with New Design ===
    window.createModernProductCard = function(product) {
        const card = document.createElement('div');
        card.className = 'product-card-modern';
        card.setAttribute('data-category', product.category || '');
        card.setAttribute('data-brand', product.brand || '');
        
        const isNew = product.isNew || false;
        const onSale = product.discount > 0;
        const originalPrice = onSale ? product.price / (1 - product.discount / 100) : null;
        
        card.innerHTML = `
            <div class="product-image-wrapper">
                <img src="${product.image || 'https://via.placeholder.com/400x400?text=No+Image'}" 
                     alt="${product.name}"
                     onerror="this.src='https://via.placeholder.com/400x400?text=No+Image'">
                <div class="product-badges">
                    ${isNew ? '<span class="badge badge-new">New</span>' : ''}
                    ${onSale ? '<span class="badge badge-sale">Sale</span>' : ''}
                </div>
                <div class="product-actions">
                    <button class="action-btn" title="Add to Wishlist" onclick="event.stopPropagation();">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                        </svg>
                    </button>
                    <button class="action-btn" title="Quick View" onclick="event.stopPropagation();">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                        </svg>
                    </button>
                    <button class="action-btn" title="Compare" onclick="event.stopPropagation();">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
                            <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/>
                            <line x1="4" y1="4" x2="9" y2="9"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div class="product-info">
                <div class="product-category">${product.category || 'General'}</div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">
                    <span class="price-current">$${product.price.toFixed(2)}</span>
                    ${originalPrice ? `<span class="price-original">$${originalPrice.toFixed(2)}</span>` : ''}
                </div>
                <div class="product-rating">
                    <div class="stars">
                        ${generateStars(product.rating || 4.5)}
                    </div>
                    <span class="rating-count">(${product.reviews || 0})</span>
                </div>
                <button class="btn-add-cart" onclick="addToCart(${product.id}, '${product.name}', ${product.price}, '${product.image}')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                    </svg>
                    Add to Cart
                </button>
            </div>
        `;
        
        return card;
    };
    
    function generateStars(rating) {
        let stars = '';
        for (let i = 0; i < 5; i++) {
            if (i < Math.floor(rating)) {
                stars += `<svg class="star" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>`;
            } else {
                stars += `<svg class="star" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>`;
            }
        }
        return stars;
    }
    
    // === Load Modern Brand Cards ===
    window.createModernBrandCard = function(brand) {
        const card = document.createElement('div');
        card.className = 'brand-card-modern';
        card.onclick = () => {
            // Filter products by brand
            if (window.filterProductsByBrand) {
                filterProductsByBrand(brand.name);
            }
        };
        
        card.innerHTML = `
            <img src="${brand.logo || 'https://via.placeholder.com/200x100?text=' + brand.name}" 
                 alt="${brand.name}"
                 onerror="this.src='https://via.placeholder.com/200x100?text=${brand.name}'">
            <h4>${brand.name}</h4>
            <p>${brand.productCount || 0} Products</p>
        `;
        
        return card;
    };
});
