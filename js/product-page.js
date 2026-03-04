// ЗАМЕНИ весь product-page.js на этот:
class ProductPage {
    constructor() {
        this.productId = this.getProductIdFromURL();
        this.init();
    }

    getProductIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return parseInt(urlParams.get('id')) || 1;
    }

    async init() {
        await this.waitForProducts();
        this.loadProduct();
        this.setupEventListeners();
    }

    async waitForProducts() {
        // Ждем загрузки products с таймаутом
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 10;
            
            const checkProducts = () => {
                if (window.products && window.products.length > 0) {
                    this.products = window.products;
                    resolve();
                } else if (attempts >= maxAttempts) {
                    // Загружаем из localStorage как fallback
                    try {
                        const saved = localStorage.getItem('products');
                        if (saved) {
                            window.products = JSON.parse(saved);
                            this.products = window.products;
                            resolve();
                        } else {
                            reject(new Error('Products not found'));
                        }
                    } catch (e) {
                        reject(e);
                    }
                } else {
                    attempts++;
                    setTimeout(checkProducts, 200);
                }
            };
            
            checkProducts();
        });
    }

    loadProduct() {
        if (!this.products || this.products.length === 0) {
            this.showError('Товары не загружены');
            return;
        }

        const product = this.products.find(p => p.id === this.productId);
        if (!product) {
            window.location.href = 'index.html';
            return;
        }

        // Безопасное заполнение информации
        this.setElementText('productTitle', product.name);
        this.setElementText('productPrice', product.price + ' $');
        this.setElementText('productDescription', product.description);
        
        const productImage = document.getElementById('productImage');
        if (productImage) {
            productImage.src = product.image;
            productImage.alt = product.name;
        }

        this.renderSpecs(product);
        this.renderSimilarProducts(product);
        
        const addToCartBtn = document.getElementById('addToCartBtn');
        if (addToCartBtn) {
            addToCartBtn.onclick = () => this.addToCart(product);
        }
    }

    setElementText(id, text) {
        const element = document.getElementById(id);
        if (element) element.textContent = text;
    }

    renderSpecs(product) {
        const specs = {
            'Бренд': product.brand,
            'Категория': this.getCategoryName(product.category),
            'Артикул': `VAPE-${product.id.toString().padStart(3, '0')}`,
            'Наличие': 'В наличии'
        };

        const specsGrid = document.getElementById('productSpecs');
        if (specsGrid) {
            specsGrid.innerHTML = Object.entries(specs).map(([key, value]) => `
                <div class="spec-item">
                    <span class="spec-key">${key}:</span>
                    <span class="spec-value">${value}</span>
                </div>
            `).join('');
        }
    }

    getCategoryName(category) {
        const categories = {
            'vape': 'Электронные сигареты',
            'liquid': 'Жидкости', 
            'mod': 'Моды',
            'atomizer': 'Атомайзеры',
            'accessory': 'Аксессуары'
        };
        return categories[category] || category;
    }

    renderSimilarProducts(currentProduct) {
        const similar = this.products
            .filter(p => p.id !== currentProduct.id && p.category === currentProduct.category)
            .slice(0, 4);

        const similarGrid = document.getElementById('similarGrid');
        if (similarGrid) {
            similarGrid.innerHTML = similar.map(product => `
                <div class="similar-card" onclick="window.location.href='product.html?id=${product.id}'">
                    <div class="similar-image">
                        <img src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="similar-info">
                        <h4>${product.name}</h4>
                        <div class="similar-price">${product.price} ₽</div>
                    </div>
                </div>
            `).join('');
        }
    }

    addToCart(product) {
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        const existingItem = cart.find(item => item.id === product.id);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }

        localStorage.setItem('cart', JSON.stringify(cart));
        this.showNotification(`${product.name} добавлен в корзину!`);
    }

    setupEventListeners() {
        const similarPrev = document.getElementById('similarPrev');
        const similarNext = document.getElementById('similarNext');
        
        if (similarPrev) similarPrev.addEventListener('click', () => this.scrollSimilar(-1));
        if (similarNext) similarNext.addEventListener('click', () => this.scrollSimilar(1));
    }

    scrollSimilar(direction) {
        const grid = document.getElementById('similarGrid');
        if (grid) {
            const scrollAmount = 300;
            grid.scrollLeft += direction * scrollAmount;
        }
    }

    showError(message) {
        const main = document.querySelector('.product-page') || document.querySelector('main');
        if (main) {
            main.innerHTML = `
                <div class="error-state" style="text-align: center; padding: 40px;">
                    <h2 style="color: #b73ce7;"> Ошибка загрузки</h2>
                    <p style="color: #cbd5e1; margin: 15px 0;">${message}</p>
                    <a href="index.html" class="btn btn-primary">Вернуться в каталог</a>
                </div>
            `;
        }
    }

    showNotification(message) {
        // Используем уведомления из shop если есть
        if (window.shop && typeof shop.showNotification === 'function') {
            shop.showNotification(message);
        } else {
            alert(message);
        }
    }
}

// Инициализация
const productPage = new ProductPage();
