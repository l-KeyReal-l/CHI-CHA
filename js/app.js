class VapeShop {
    constructor() {
        // ОЖИДАЕМ, что products уже загружен в products.js
        if (!window.products || window.products.length === 0) {
            console.warn('⚠️ Products not loaded yet, waiting...');
            this.loadProductsAsync();
        } else {
            this.initializeWithProducts();
        }
        
    }
    
    async loadProductsAsync() {
        // Ждём 500мс и пробуем снова
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Пробуем загрузить из localStorage
        try {
            const saved = localStorage.getItem('products');
            if (saved) {
                window.products = JSON.parse(saved);
                console.log('📦 Loaded from localStorage:', window.products.length);
            }
        } catch (e) {
            console.error('Error loading products:', e);
        }
        
        // Если всё ещё нет товаров - используем дефолтные
        if (!window.products || window.products.length === 0) {
            console.error('❌ NO PRODUCTS FOUND - check products.js file');
            window.products = [];
        }
        
        this.initializeWithProducts();
    }
    
    initializeWithProducts() {
        this.products = window.products || [];
        console.log('✅ Shop initialized with', this.products.length, 'products');
        
        this.cart = JSON.parse(localStorage.getItem('cart')) || [];
        this.filteredProducts = [...this.products];
        this.currentPage = 1;
        this.productsPerPage = 9;
        this.currentSort = 'default';
        this.currentLang = localStorage.getItem('language') || 'ru';
        
        this.init();
    }
    // ФИКС: ЗАГРУЗКА ПРОДУКТОВ ИЗ localStorage
loadProducts() {
    try {
        const savedProducts = localStorage.getItem('products');
        if (savedProducts && JSON.parse(savedProducts).length > 0) {
            return JSON.parse(savedProducts);
        }
    } catch (e) {
        console.error('Error loading products:', e);
    }
    
    // Сохраняем дефолтные продукты
    localStorage.setItem('products', JSON.stringify(products));
    return products;
}
// ФИКС: СИНХРОНИЗАЦИЯ ПРОДУКТОВ
updateProducts(newProducts) {
    this.products = newProducts;
    this.filteredProducts = [...newProducts];
    localStorage.setItem('products', JSON.stringify(newProducts));
    window.products = newProducts;
    this.renderProducts();
    this.showNotification('Продукты обновлены!');
}

    init() {
        this.renderBrandFilters();
        this.renderProducts();
        this.setupEventListeners();
        this.updateCartCount();
        this.startCarousel();
        
        // ФИКС: УСТАНАВЛИВАЕМ ВЫБРАННЫЙ ЯЗЫК В СЕЛЕКТ
        const langSelect = document.getElementById('languageSelect');
        if (langSelect) {
            langSelect.value = this.currentLang;
        }
        
        this.updateUI();

        setTimeout(() => {
            this.updateFavoriteButtons();
        }, 500);
        if (window.unifiedAuth) {
    unifiedAuth.updateUI();
    unifiedAuth.updateAuthModals();
    }
}
    


    // Перевод по data-атрибутам
    translateByDataAttributes() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.translate(key);
        });
    }

    translate(key) {
        return translations[this.currentLang][key] || key;
    }

    changeLanguage(lang) {
    // Сохраняем какие сердечки были активны
    const activeFavorites = [];
    document.querySelectorAll('.favorite-btn.active').forEach(btn => {
        const card = btn.closest('.card');
        if (card) {
            activeFavorites.push(parseInt(card.dataset.productId));
        }
    });
    
    this.currentLang = lang;
    localStorage.setItem('language', lang);
    this.updateUI();
    this.translateByDataAttributes();
    
    // Восстанавливаем сердечки после смены языка
    setTimeout(() => {
        activeFavorites.forEach(productId => {
            const btn = document.querySelector(`.card[data-product-id="${productId}"] .favorite-btn`);
            if (btn) {
                btn.innerHTML = '❤️';
                btn.classList.add('active');
            }
        });
    }, 300);
    
    if (window.unifiedAuth) {
        unifiedAuth.updateUI();
        unifiedAuth.updateAuthModals();
    }
}




    // ФИКС: ПЕРЕВОД ЦЕНЫ С УЧЕТОМ ВАЛЮТЫ
// В app.js ЗАМЕНИ метод formatPrice() на:
formatPrice(price) {
    // Единая валюта - рубли
    const symbol = this.translate('currencySymbol');
    
    // Округляем до целых рублей
    const roundedPrice = Math.round(price);
    
    // Форматируем с разделителями тысяч
    const formattedPrice = new Intl.NumberFormat('ru-RU').format(roundedPrice);
    
    return `${formattedPrice} ${symbol}`;
}

    // В app.js ЗАМЕНИ метод updateUI() на этот:
updateUI() {
    const search = document.getElementById('search');
    if (search) search.placeholder = this.translate('searchPlaceholder');
    
    localStorage.setItem('language', this.currentLang);
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) langSelect.value = this.currentLang;
    
    this.updateDropdownMenu();
    this.updateSidebar();
    this.updateToolbar();
    
    // НЕ вызываем renderProducts() здесь, только если нужно
    // this.renderProducts();
    this.renderCart();
}

    updateDropdownMenu() {
        const dropdownItems = document.querySelectorAll('.dropdown-item');
        //if (dropdownItems[0]) dropdownItems[0].textContent = this.translate('catalog');
        if (dropdownItems[1]) dropdownItems[1].textContent = this.translate('orders');
        if (dropdownItems[2]) dropdownItems[2].textContent = this.translate('profile');
    }

    // В app.js ЗАМЕНИ метод updateSidebar() на этот:
updateSidebar() {
    const filterHeaders = document.querySelectorAll('.filter-section h4');
    if (filterHeaders[0]) filterHeaders[0].textContent = this.translate('categories');
    if (filterHeaders[1]) filterHeaders[1].textContent = this.translate('brands');
    if (filterHeaders[2]) filterHeaders[2].textContent = this.translate('price');
    
    const applyBtn = document.getElementById('applyFilters');
    const clearBtn = document.getElementById('clearFilters');
    if (applyBtn) applyBtn.textContent = this.translate('apply');
    if (clearBtn) clearBtn.textContent = this.translate('clear');
    
    const minPrice = document.getElementById('minPrice');
    const maxPrice = document.getElementById('maxPrice');
    if (minPrice) minPrice.placeholder = this.translate('minPrice');
    if (maxPrice) maxPrice.placeholder = this.translate('maxPrice');
    
    // ★★★ ФИКС ПЕРЕВОДА КАТЕГОРИЙ - ПОЛНОСТЬЮ ПЕРЕЗАПИСЫВАЕМ ★★★
    const catFilters = document.getElementById('catFilters');
    if (catFilters) {
        catFilters.innerHTML = `
            <label><input type="checkbox" value="vape"> ${this.translate('vape')}</label>
            <label><input type="checkbox" value="liquid"> ${this.translate('liquid')}</label>
            <label><input type="checkbox" value="mod"> ${this.translate('mod')}</label>
            <label><input type="checkbox" value="atomizer"> ${this.translate('atomizer')}</label>
            <label><input type="checkbox" value="accessory"> ${this.translate('accessory')}</label>
        `;
        
        // Восстанавливаем выбранные чекбоксы после перерисовки
        this.restoreCategoryFilters();
    }
}

// ДОБАВЬ этот метод в класс VapeShop:
restoreCategoryFilters() {
    // Проверяем есть ли фильтры
    if (!this.filters) return;
    
    const selectedCategories = this.filters.categories || [];
    selectedCategories.forEach(category => {
        const checkbox = document.querySelector(`#catFilters input[value="${category}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });
}

    updateToolbar() {
        const foundText = document.querySelector('.toolbar div strong');
        if (foundText) foundText.textContent = this.translate('found');
        
        const sortSelect = document.getElementById('sort');
        if (sortSelect) {
            sortSelect.innerHTML = `
                <option value="default">${this.translate('sortDefault')}</option>
                <option value="price-asc">${this.translate('sortPriceAsc')}</option>
                <option value="price-desc">${this.translate('sortPriceDesc')}</option>
                <option value="name">${this.translate('sortName')}</option>
            `;
        }
    }

    updateModals() {
        // Auth modal
        const authTitle = document.querySelector('#authModal h2');
        const authInputs = document.querySelectorAll('#authForm input');
        const authButton = document.querySelector('#authForm button');
        
        if (authTitle) authTitle.textContent = this.translate('loginTitle');
        if (authInputs[0]) authInputs[0].placeholder = this.translate('email');
        if (authInputs[1]) authInputs[1].placeholder = this.translate('password');
        if (authButton) authButton.textContent = this.translate('loginButton');

        // Register modal  
        const registerTitle = document.querySelector('#registerModal h2');
        const registerInputs = document.querySelectorAll('#registerForm input');
        const registerButton = document.querySelector('#registerForm button');
        
        if (registerTitle) registerTitle.textContent = this.translate('registerTitle');
        if (registerInputs[0]) registerInputs[0].placeholder = this.translate('name');
        if (registerInputs[1]) registerInputs[1].placeholder = this.translate('email');
        if (registerInputs[2]) registerInputs[2].placeholder = this.translate('password');
        if (registerInputs[3]) registerInputs[3].placeholder = this.translate('confirmPassword');
        if (registerButton) registerButton.textContent = this.translate('registerButton');

        // Cart modal
        const cartTitle = document.querySelector('#cartModal h2');
        if (cartTitle) cartTitle.textContent = this.translate('cart');
    }

    // Рендер фильтров брендов
    renderBrandFilters() {
    const brandFilters = document.getElementById('brandFilters');
    if (!brandFilters) return;
    
    // Собираем все уникальные бренды из продуктов
    const brands = [...new Set(this.products.map(product => product.brand))];
    
    brandFilters.innerHTML = brands.map(brand => `
        <label class="filter-checkbox">
            <input type="checkbox" value="${brand}">
            <span class="checkbox-custom"></span>
            <span>${brand}</span>
        </label>
    `).join('');
}

renderProducts() {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    grid.classList.add('updating');
    const startIndex = (this.currentPage - 1) * this.productsPerPage;
    const endIndex = startIndex + this.productsPerPage;
    const productsToShow = this.filteredProducts.slice(startIndex, endIndex);

    if (productsToShow.length === 0) {
        grid.innerHTML = `
            <div class="empty" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                <h3>Товары не найдены</h3>
                <p>Попробуйте изменить параметры фильтрации</p>
            </div>
        `;
    } else {
        grid.innerHTML = productsToShow.map(product => {
            const name = security ? security.escapeHTML(product.name) : product.name;
            const description = security ? security.escapeHTML(product.description) : product.description;
            const price = this.formatPrice(product.price);
            
            // Бейдж наличия
            let stockBadge = '';
            if (product.inStock) {
                stockBadge = '<span class="badge in-stock"> В наличии</span>';
            } else {
                stockBadge = '<span class="badge out-of-stock"> Нет в наличии</span>';
            }
            
            // Кнопка в корзину
            const cartButton = product.inStock 
                ? `<button class="btn btn-primary" onclick="event.stopPropagation(); shop.addToCart(${product.id})">${this.translate('addToCart')}</button>`
                : `<button class="btn btn-secondary" disabled style="opacity:0.5; cursor:not-allowed;">Нет в наличии</button>`;
            
            return `
                <div class="card" data-product-id="${product.id}" onclick="shop.quickView(${product.id})" style="cursor: pointer;">
                    <div class="media">
                        <img src="${product.image}" alt="${name}" onerror="this.src='https://via.placeholder.com/300x300/1a1a2e/b73ce7?text=Product+Image'">
                        
                        <button class="favorite-btn" 
                                onclick="event.stopPropagation(); handleFavoriteClick(${product.id}, this)">
                            🤍
                        </button>
                    </div>
                    <div class="body">
                        <h3>${name}</h3>
                        <div style="margin: 5px 0;">${stockBadge}</div>
                        <p>${description}</p>
                        <div class="price">${price}</div>
                        <div class="actions">
                            ${cartButton}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    setTimeout(() => {
        grid.classList.remove('updating');
        grid.style.opacity = '1';
    }, 300);
    
    this.updateResultsCount();
    this.renderPagination();
}

    // Пагинация
    renderPagination() {
        const pagination = document.getElementById('pagination');
        if (!pagination) return;
        
        const totalPages = Math.ceil(this.filteredProducts.length / this.productsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        if (this.currentPage > 1) {
            paginationHTML += `<button class="page-btn" onclick="shop.changePage(${this.currentPage - 1})">‹</button>`;
        }

        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="page-btn active">${i}</button>`;
            } else {
                paginationHTML += `<button class="page-btn" onclick="shop.changePage(${i})">${i}</button>`;
            }
        }

        if (this.currentPage < totalPages) {
            paginationHTML += `<button class="page-btn" onclick="shop.changePage(${this.currentPage + 1})">›</button>`;
        }

        pagination.innerHTML = paginationHTML;
    }

    changePage(page) {
        this.currentPage = page;
        this.renderProducts();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Обновление счетчика результатов
    updateResultsCount() {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            resultsCount.textContent = this.filteredProducts.length;
        }
    }

    // Поиск и фильтрация
    setupEventListeners() {
    const searchInput = document.getElementById('search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            this.handleSearch(e.target.value);
        });

        const prevBtn = document.getElementById('prev');
        const nextBtn = document.getElementById('next');

if (prevBtn) {
    prevBtn.addEventListener('click', () => this.prevSlide());
}
if (nextBtn) {
    nextBtn.addEventListener('click', () => this.nextSlide());
}
        
        // Enter-tast søk
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearchImmediate(e.target.value);
            }
        });
    }
    // ... resten av event listeners
    

    // Смена языка
    const langSelect = document.getElementById('languageSelect');
    if (langSelect) {
        langSelect.addEventListener('change', (e) => {
            this.changeLanguage(e.target.value);
        });
    }

    // Фильтры категорий
    document.querySelectorAll('#catFilters input').forEach(checkbox => {
        checkbox.addEventListener('change', () => this.applyFilters());
    });

    // Фильтры брендов
    document.querySelectorAll('#brandFilters input').forEach(checkbox => {
        checkbox.addEventListener('change', () => this.applyFilters());
    });

    // Фильтры цены
    const applyFiltersBtn = document.getElementById('applyFilters');
    const clearFiltersBtn = document.getElementById('clearFilters');
    if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', () => this.applyFilters());
    if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => this.clearFilters());

    // Сортировка
    const sortSelect = document.getElementById('sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            this.applySorting();
            this.renderProducts();
        });
    }

    // Корзина
    const cartFab = document.getElementById('cartFab');
    const cartClose = document.getElementById('cartClose');
    const clearCartBtn = document.getElementById('clearCartBtn');
    const checkoutBtn = document.getElementById('checkoutBtn');
    
    if (cartFab) cartFab.addEventListener('click', () => this.openCart());
    if (cartClose) cartClose.addEventListener('click', () => this.closeCart());
    if (clearCartBtn) clearCartBtn.addEventListener('click', () => this.clearCart());
    if (checkoutBtn) checkoutBtn.addEventListener('click', () => this.checkout());

    // ВЫПАДАЮЩЕЕ МЕНЮ - ОСТАВЛЯЕМ ТОЛЬКО ЭТО
    const dotsMenu = document.querySelector('.dots-menu button');
    if (dotsMenu) {
        dotsMenu.addEventListener('click', (e) => {
            e.stopPropagation();
            document.querySelector('.dropdown-content').classList.toggle('show');
        });
    }

    // Закрытие выпадающего меню при клике вне
    document.addEventListener('click', () => {
        const dropdown = document.querySelector('.dropdown-content');
        if (dropdown) dropdown.classList.remove('show');
    });

    // Карусель
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');
    
    if (prevBtn) prevBtn.addEventListener('click', () => {
        this.pauseAutoPlay();
        this.prevSlide();
        this.restartAutoPlay();
    });
    
    if (nextBtn) nextBtn.addEventListener('click', () => {
        this.pauseAutoPlay();
        this.nextSlide();
        this.restartAutoPlay();
    });

}

    handleSearch(searchTerm) {
    // Søk bare når Enter trykkes eller etter 500ms pause
    clearTimeout(this.searchTimeout);
    
    this.searchTimeout = setTimeout(() => {
        if (searchTerm.length === 0) {
            this.filteredProducts = [...this.products];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredProducts = this.products.filter(product => 
                product.name.toLowerCase().includes(term) ||
                product.description.toLowerCase().includes(term) ||
                product.brand.toLowerCase().includes(term)
            );
        }
        this.currentPage = 1;
        this.applySorting();
        this.renderProducts();
    }, searchTerm.length > 2 ? 300 : 500); // Kortere ventetid for lengre søk
}

    // В app.js заменяем метод handleSearchImmediate:
handleSearchImmediate(searchTerm) {
    if (searchTerm.length === 0) {
        this.filteredProducts = [...this.products];
    } else {
        const term = searchTerm.toLowerCase();
        this.filteredProducts = this.products.filter(product => 
            product.name.toLowerCase().includes(term) ||
            product.description.toLowerCase().includes(term) ||
            product.brand.toLowerCase().includes(term)
        );
    }
    
    this.currentPage = 1;
    this.applySorting();
    this.renderProducts();
    
    // ПЛАВНАЯ ПРОКРУТКА К РЕЗУЛЬТАТАМ
    setTimeout(() => {
        const productGrid = document.getElementById('productGrid');
        if (productGrid) {
            // Прокручиваем не сразу к гриду, а чуть выше
            const gridPosition = productGrid.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = gridPosition - 160; // 100px выше
            
            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    }, 100);
}

applyFilters() {
    const selectedCategories = [];
    document.querySelectorAll('#catFilters input:checked').forEach(checkbox => {
        selectedCategories.push(checkbox.value);
    });

    const selectedBrands = [];
    document.querySelectorAll('#brandFilters input:checked').forEach(checkbox => {
        selectedBrands.push(checkbox.value);
    });

    const minPrice = document.getElementById('minPrice').value ? 
        parseInt(document.getElementById('minPrice').value) : 0;
    const maxPrice = document.getElementById('maxPrice').value ? 
        parseInt(document.getElementById('maxPrice').value) : Number.MAX_SAFE_INTEGER;
    
    // Проверка "В наличии"
    const inStockOnly = document.getElementById('inStockFilter')?.checked || false;

    this.filters = {
        categories: selectedCategories,
        brands: selectedBrands,
        minPrice,
        maxPrice,
        inStockOnly
    };

    this.filteredProducts = this.products.filter(product => {
        if (this.filters.categories.length > 0 && !this.filters.categories.includes(product.category)) {
            return false;
        }

        if (this.filters.brands.length > 0 && !this.filters.brands.includes(product.brand)) {
            return false;
        }

        if (product.price < this.filters.minPrice) {
            return false;
        }
        if (product.price > this.filters.maxPrice) {
            return false;
        }
        
        // Фильтр по наличию
        if (this.filters.inStockOnly && !product.inStock) {
            return false;
        }

        return true;
    });

    this.currentPage = 1;
    this.applySorting();
    this.renderProducts();
    
    setTimeout(() => {
        const productGrid = document.getElementById('productGrid');
        if (productGrid) {
            productGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, 100);
}

    clearFilters() {
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });

        document.getElementById('minPrice').value = '';
        document.getElementById('maxPrice').value = '';

        this.filters = {
            categories: [],
            brands: [],
            minPrice: null,
            maxPrice: null
        };

        this.filteredProducts = [...this.products];
        this.currentPage = 1;
        this.applySorting();
        this.renderProducts();
    }

    applySorting() {
        switch (this.currentSort) {
            case 'price-asc':
                this.filteredProducts.sort((a, b) => a.price - b.price);
                break;
            case 'price-desc':
                this.filteredProducts.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                this.filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
                break;
            default:
                break;
        }
    }

    // 1. Метод addToCart - с автоматическим обновлением
// В VapeShop классе ЗАМЕНИ метод addToCart:
addToCart(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    this.cart = cart;
    
    // ВСЕГДА ОБНОВЛЯЕМ СЧЕТЧИК
    this.updateCartCount();
    
    // ЕСЛИ КОРЗИНА ОТКРЫТА - ПЕРЕРИСОВЫВАЕМ ЕЁ СРАЗУ!
    const cartModal = document.getElementById('cartModal');
    if (cartModal && cartModal.style.display === 'flex') {
        this.renderCart();
    }
    
    this.showNotification(`🛒 ${product.name} добавлен в корзину!`);
}
    removeFromCart(productId) {
    console.log('Removing product from cart:', productId);
    
    const itemIndex = this.cart.findIndex(item => item.id === productId);
    if (itemIndex === -1) return;
    
    const removedItem = this.cart[itemIndex];
    this.cart.splice(itemIndex, 1);
    
    this.saveCart();
    this.updateCartCount();
    this.renderCart(); // СРАЗУ ПЕРЕРИСОВЫВАЕМ
    
    // Показываем уведомление с названием товара
    this.showNotification(`🗑️ ${removedItem.name} удален из корзины`);
}

    updateQuantity(productId, change) {
    console.log('Updating quantity for product:', productId, 'change:', change);
    
    const itemIndex = this.cart.findIndex(item => item.id === productId);
    if (itemIndex === -1) return;
    
    this.cart[itemIndex].quantity += change;
    
    if (this.cart[itemIndex].quantity <= 0) {
        this.removeFromCart(productId);
    } else {
        this.saveCart();
        this.updateCartCount();
        this.renderCart(); // СРАЗУ ПЕРЕРИСОВЫВАЕМ
        //this.showNotification('Количество обновлено');
    }
}


    clearCart() {
    this.cart = [];
    localStorage.setItem('cart', JSON.stringify(this.cart));
    this.updateCartCount();
    this.renderCart();
    this.showNotification('Корзина очищена');
}

    saveCart() {
    localStorage.setItem('cart', JSON.stringify(this.cart));
    // СИНХРОНИЗАЦИЯ МЕЖДУ ВКЛАДКАМИ
    const event = new Event('storage');
    event.key = 'cart';
    event.newValue = JSON.stringify(this.cart);
    window.dispatchEvent(event);
}

    updateCartCount() {
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }

    openCart() {
    // ПЕРЕЗАГРУЖАЕМ КОРЗИНУ ПЕРЕД ОТКРЫТИЕМ
    this.cart = JSON.parse(localStorage.getItem('cart')) || [];
    this.renderCart();
    document.getElementById('cartModal').style.display = 'flex';
}

    closeCart() {
        document.getElementById('cartModal').style.display = 'none';
    }

    renderCart() {
    const cartItems = document.getElementById('cartItems');
    if (!cartItems) return;
    
    if (this.cart.length === 0) {
        cartItems.innerHTML = '<p class="empty">Корзина пуста</p>';
        document.getElementById('cartTotal').textContent = '0';
        return;
    }

    const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    cartItems.innerHTML = this.cart.map(item => `
        <div class="cart-item">
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <div class="cart-item-price">${item.price} $ × ${item.quantity}</div>
            </div>
            <div class="cart-item-actions">
                <button class="quantity-btn" onclick="shop.updateQuantity(${item.id}, -1)">-</button>
                <span>${item.quantity}</span>
                <button class="quantity-btn" onclick="shop.updateQuantity(${item.id}, 1)">+</button>
                <button class="btn btn-ghost" onclick="shop.removeFromCart(${item.id})">✕</button>
            </div>
        </div>
    `).join('');

    document.getElementById('cartTotal').textContent = total;
}

    // Модальные окна
    openAuthModal() {
        document.getElementById('authModal').style.display = 'flex';
    }

    closeAuthModal() {
        document.getElementById('authModal').style.display = 'none';
    }

    openRegisterModal() {
        document.getElementById('registerModal').style.display = 'flex';
    }

    closeRegisterModal() {
        document.getElementById('registerModal').style.display = 'none';
    }

    // Карусель
    startCarousel() {
    this.currentSlide = 0;
    this.slides = document.querySelectorAll('.carousel .slide');
    this.slidesContainer = document.querySelector('.carousel .slides');
    
    if (this.slides.length > 0) {
        this.showSlide(0);
        
        // Автопрокрутка каждые 5 секунд
        this.autoPlayInterval = setInterval(() => {
            this.nextSlide();
        }, 5000);
    }
}

    showSlide(n) {
    if (this.slidesContainer) {
        this.slidesContainer.style.transform = `translateX(-${n * 100}%)`;
        this.slidesContainer.style.transition = 'transform 0.5s ease';
    }
    this.currentSlide = n;
}


    nextSlide() {
    let next = this.currentSlide + 1;
    if (next >= this.slides.length) next = 0;
    this.showSlide(next);
    
    // Сбрасываем таймер автопрокрутки
    this.resetAutoPlay();
}

    prevSlide() {
    let prev = this.currentSlide - 1;
    if (prev < 0) prev = this.slides.length - 1;
    this.showSlide(prev);
    
    // Сбрасываем таймер автопрокрутки
    this.resetAutoPlay();
}

resetAutoPlay() {
    // Останавливаем старый интервал
    if (this.autoPlayInterval) {
        clearInterval(this.autoPlayInterval);
    }
    
    // Запускаем новый
    this.autoPlayInterval = setInterval(() => {
        this.nextSlide();
    }, 5000);
}
    // Уведомления
    showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'success' ? '' : type === 'error' ? '❌' : 'ℹ️'}</span>
            <span class="notification-text">${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Анимация появления
    setTimeout(() => notification.classList.add('show'), 100);
    
    // Автоудаление
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

   quickView(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;
 this.currentReviewProductId = productId;

    const similarProducts = this.products
        .filter(p => p.id !== product.id && p.category === product.category)
        .slice(0, 4);

    // ПРОВЕРЯЕМ ИЗБРАННОЕ ЧЕРЕЗ ТУ ЖЕ СИСТЕМУ
    const user = JSON.parse(localStorage.getItem('currentUser'));
    let isFavorite = false;
    
    if (user && user.favorites) {
        isFavorite = user.favorites.some(fav => fav.id === productId);
    }

    const modalContent = `
         <div class="modal-backdrop quick-view-modal" data-product-id="${product.id}">
         <div class="quick-view-modal-content">
            <button class="quick-view-close" onclick="shop.closeQuickView()">✕</button>
            
            <div class="quick-view-layout">
                <div class="quick-view-image">
                    <img src="${product.image}" alt="${product.name}">
                </div>
                
                <div class="quick-view-info">
                    <h2 class="quick-view-title">${product.name}</h2>
                    
                    <div class="quick-view-price">${this.formatPrice(product.price)}</div>
                    
                    <div class="quick-view-meta">
                        <div class="meta-item">
                            <span class="meta-label">Бренд:</span>
                            <span class="meta-value">${product.brand}</span>
                        </div>
                        <div class="meta-item">
                            <span class="meta-label">Категория:</span>
                            <span class="meta-value">${this.getCategoryName(product.category)}</span>
                        </div>
                    </div>
                    
                    <div class="quick-view-description">
                        <h3>Описание</h3>
                        <p>${product.description}</p>
                    </div>
                    
                    <div class="quick-view-badges">
                        ${product.badges ? product.badges.map(badge => `
                            <span class="badge ${badge}">${badge}</span>
                        `).join('') : ''}
                    </div>
                    
                    <div class="quick-view-actions">
    ${product.inStock 
        ? `<button class="btn btn-primary" onclick="shop.addToCart(${product.id}); shop.closeQuickView()">
               🛒 В корзину
           </button>`
        : `<button class="btn btn-secondary" disabled style="opacity:0.5; cursor:not-allowed;">
                Нет в наличии
           </button>`
    }
    <button class="btn btn-ghost favorite-btn-quick ${isFavorite ? 'active' : ''}" 
            onclick="toggleFavoriteQuick(${product.id}, this)">
        ${isFavorite ? '❤️' : '🤍'} ${isFavorite ? 'В избранном' : 'В избранное'}
    </button>
</div>
                </div>
            </div>
            
            ${similarProducts.length > 0 ? `
            <div class="quick-view-similar">
                <h3>Похожие товары</h3>
                <div class="similar-products-row">
                    ${similarProducts.map(similar => `
                        <div class="similar-product-card" onclick="shop.quickView(${similar.id})">
                            <img src="${similar.image}" alt="${similar.name}">
                            <div class="similar-product-name">${similar.name}</div>
                            <div class="similar-product-price">${this.formatPrice(similar.price)}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            ` : ''}
            <!-- ===== БЛОК ОТЗЫВОВ ===== -->
<div class="quick-view-reviews">
    <div class="reviews-header">
        <h3>📝 Отзывы <span class="reviews-count">0</span></h3>
        
        <!-- Кнопка добавить отзыв (только для авторизованных) -->
        <button class="btn-add-review" onclick="shop.openReviewForm()">
             Написать отзыв
        </button>
    </div>

    <!-- Форма добавления отзыва (изначально скрыта) -->
    <div class="review-form-container" id="reviewForm" style="display: none;">
        <div class="review-form">
            <h4>Оставить отзыв</h4>
            
            <!-- Рейтинг звездами -->
            <div class="rating-select">
                <span class="rating-star" data-rating="1">★</span>
                <span class="rating-star" data-rating="2">★</span>
                <span class="rating-star" data-rating="3">★</span>
                <span class="rating-star" data-rating="4">★</span>
                <span class="rating-star" data-rating="5">★</span>
            </div>
            
            <textarea 
                class="review-textarea" 
                placeholder="Поделитесь впечатлениями о товаре..."
                rows="4"
            ></textarea>
            
            <div class="review-form-actions">
                <button class="btn btn-primary" onclick="shop.submitReview()">
                    Отправить
                </button>
                <button class="btn btn-ghost" onclick="shop.closeReviewForm()">
                    Отмена
                </button>
            </div>
        </div>
    </div>

    <!-- Список отзывов -->
    <div class="reviews-list" id="reviewsList">
        <!-- Отзывы будут загружаться сюда -->
        <div class="reviews-loading">Загрузка отзывов...</div>
    </div>
</div>
        </div>
       </div> 
    `;
 this.showCustomModal(modalContent);
    
    // 👇 ВОТ СЮДА
     setTimeout(() => {
        this.initRatingStars();
        this.loadReviews(productId); // Передаем ID явно
    }, 100);
}

// Добавь метод для мгновенной покупки
buyNow(productId) {
    const product = this.products.find(p => p.id === productId);
    if (!product) return;
    
    // Очищаем корзину и добавляем товар
    this.cart = [{
        ...product,
        quantity: 1
    }];
    this.saveCart();
    
    // Переходим к оплате
    this.checkout();
}

// Добавь метод для выбора оплаты
selectPayment(method) {
    this.selectedPayment = method;
    
    // Показываем детали оплаты
    const paymentDetails = document.querySelector('.payment-details');
    if (paymentDetails) {
        if (method === 'crypto') {
            paymentDetails.innerHTML = this.getCryptoPaymentDetails();
        } else if (method === 'telegram') {
            paymentDetails.innerHTML = this.getTelegramPaymentDetails();
        }
    }
}

getCryptoPaymentDetails() {
    return `
        <div class="crypto-payment-details">
            <h4>Оплата криптовалютой</h4>
            <p>Выберите валюту для оплаты:</p>
            <select class="crypto-select">
                <option value="btc">Bitcoin (BTC)</option>
                <option value="eth">Ethereum (ETH)</option>
                <option value="usdt">USDT (TRC-20)</option>
                <option value="ton">TON</option>
            </select>
            <div class="crypto-address">
                <p>Адрес для оплаты:</p>
                <code class="address-code">bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh</code>
                <button class="btn-copy" onclick="navigator.clipboard.writeText('bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh')">
                    Копировать
                </button>
            </div>
            <p class="crypto-note">После оплаты пришлите хеш транзакции в Telegram для подтверждения</p>
        </div>
    `;
}

getTelegramPaymentDetails() {
    return `
        <div class="telegram-payment-details">
            <h4>Оплата через Telegram</h4>
            <p>Напишите нашему менеджеру для обсуждения условий оплаты:</p>
            <a href="https://t.me/ваш_магазин" target="_blank" class="btn btn-primary">
                Написать в Telegram
            </a>
            <p class="telegram-note">Мы поможем выбрать удобный способ оплаты и ответим на все вопросы</p>
        </div>
    `;
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

    // В метод showCustomModal() добавь анимацию:
showCustomModal(content) {
    const oldModal = document.querySelector('.modal-backdrop.quick-view-modal');
    if (oldModal) oldModal.remove();
    
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop quick-view-modal';
    backdrop.innerHTML = content;
    
    // Закрытие по клику на фон
    backdrop.addEventListener('click', function(e) {
    if (e.target === this) { // Клик именно на фон
        shop.closeQuickView(); // Удалит весь backdrop с модалкой
    }
});
    
    // Предотвращаем всплытие клика с контента на фон
    const contentElement = backdrop.querySelector('.quick-view-modal-content');
    if (contentElement) {
        contentElement.addEventListener('click', function(e) {
            e.stopPropagation();  // Останавливаем всплытие
        });
    }
    
    document.body.appendChild(backdrop);
     
    
    // 👇 ВОТ СЮДА (в самый конец метода)
    setTimeout(() => {
        this.initRatingStars();
    }, 100);
}

closeQuickView() {
    // Находим фон (родительский элемент)
    const backdrop = document.querySelector('.modal-backdrop.quick-view-modal');
    if (backdrop) {
        backdrop.remove(); // Удаляет и фон, и модалку внутри него
    }
}

    showLoading(message = 'Загрузка...') {
    // Убираем существующий лоадер
    this.hideLoading();
    
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.id = 'loadingOverlay';
    
    overlay.innerHTML = `
        <div class="loading-content">
            <div class="vape-spinner"></div>
            <div class="loading-text">${message}</div>
        </div>
    `;
    
    document.body.appendChild(overlay);
}

hideLoading() {
    const existingOverlay = document.getElementById('loadingOverlay');
    if (existingOverlay) {
        existingOverlay.remove();
    }
}

showButtonLoading(button, text = 'Загрузка...') {
    button.disabled = true;
    button.dataset.originalText = button.textContent;
    button.classList.add('btn-loading');
    button.innerHTML = text;
}

hideButtonLoading(button) {
    button.disabled = false;
    button.classList.remove('btn-loading');
    button.textContent = button.dataset.originalText || button.textContent;
}

    // Оформление заказа
    // Обновленный метод checkout
    // В app.js ЗАМЕНИ метод checkout на этот:
// В app.js замени метод checkout() на этот:
async checkout() {
    console.log('Checkout started...');
    
    if (this.cart.length === 0) {
        this.showNotification('Корзина пуста');
        return;
    }

    // Проверка авторизации
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        this.showNotification('Войдите для оформления заказа');
        setTimeout(() => {
            if (window.unifiedAuth) unifiedAuth.openAuthModal();
        }, 500);
        return;
    }

    // Сохраняем заказ для checkout страницы
    const orderData = {
        items: [...this.cart],
        total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        user: currentUser
    };
    
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    
    // Переходим на страницу оформления
    window.location.href = 'checkout.html';
    // После создания заказа отправляем в Telegram
    if (window.telegramBot) {
        await telegramBot.sendOrder({
            orderId: order.id,
            user: currentUser,
            items: this.cart,
            total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            phone: 'телефон клиента', // нужно добавить поле
            address: 'адрес клиента'  // нужно добавить поле
        });
    }
}

saveOrderForCheckout() {
    const orderData = {
        id: 'order_' + Date.now(),
        items: [...this.cart],
        total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
        user: JSON.parse(localStorage.getItem('currentUser')),
        timestamp: Date.now()
    };
    
    // Сохраняем заказ в sessionStorage для checkout страницы
    sessionStorage.setItem('pendingOrder', JSON.stringify(orderData));
    console.log('Order saved for checkout:', orderData);
}

    // Страница оформления заказа
    showCheckoutPage() {
        const orderData = {
            id: security.generateSecureId('order'),
            items: this.cart,
            total: this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            user: window.unifiedAuth.currentUser,
            timestamp: Date.now()
        };

        const checkoutHTML = `
            <div class="checkout-overlay">
                <div class="checkout-modal">
                    <button class="close" onclick="shop.closeCheckout()">✕</button>
                    <h2>💳 Оформление заказа</h2>
                    
                    <div class="order-summary">
                        <h4>Ваш заказ:</h4>
                        ${this.cart.map(item => `
                            <div class="checkout-item">
                                <span>${item.name} × ${item.quantity}</span>
                                <span>${item.price * item.quantity} $</span>
                            </div>
                        `).join('')}
                        <div class="checkout-total">
                            <strong>Итого: ${orderData.total} $</strong>
                        </div>
                    </div>
                    
                    <div class="payment-methods">
                        <h4>Способ оплаты:</h4>
                        
                        <div class="payment-method" onclick="shop.selectPayment('vipps')">
                            <span>📱</span>
                            <span>Vipps</span>
                        </div>
                        
                        <div class="payment-method" onclick="shop.selectPayment('monobank')">
                            <span>💙</span>
                            <span>Monobank</span>
                        </div>
                        
                        <div class="payment-method" onclick="shop.selectPayment('revolut')">
                            <span>💳</span>
                            <span>Revolut</span>
                        </div>
                        
                        <div class="payment-method" onclick="shop.selectPayment('crypto')">
                            <span>₿</span>
                            <span>Криптовалюта</span>
                        </div>
                    </div>
                    
                    <button class="btn btn-primary" onclick="shop.processPayment()">
                        Подтвердить заказ
                    </button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', checkoutHTML);
        
        // Сохраняем заказ
        this.currentOrder = orderData;
    }

    // Выбор способа оплаты
    selectPayment(method) {
        document.querySelectorAll('.payment-method').forEach(el => {
            el.classList.remove('selected');
        });
        
        event.target.closest('.payment-method').classList.add('selected');
        this.selectedPaymentMethod = method;
    }

    // Обработка платежа
    async processPayment() {
        if (!this.selectedPaymentMethod) {
            this.showNotification('❌ Выберите способ оплаты');
            return;
        }

        this.showLoading('Обработка платежа...');

        try {
            // Симуляция платежа
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const paymentResult = {
                success: true,
                orderId: this.currentOrder.id,
                paymentMethod: this.selectedPaymentMethod,
                transactionId: security.generateSecureId('txn')
            };

            if (paymentResult.success) {
                this.completeOrder(paymentResult);
            }
        } catch (error) {
            this.showNotification('❌ Ошибка оплаты');
        } finally {
            this.hideLoading();
        }
    }

    // Завершение заказа
    completeOrder(paymentResult) {
        const order = {
            ...this.currentOrder,
            status: 'confirmed',
            payment: paymentResult,
            date: new Date().toISOString(),
            id: "order_" + Date.now( )
        };

        // Сохраняем заказ пользователю
        if (window.unifiedAuth && window.unifiedAuth.currentUser) {
            const userIndex = unifiedAuth.users.findIndex(u => u.id === unifiedAuth.currentUser.id);
            if (userIndex !== -1) {
                if (!unifiedAuth.users[userIndex].orders) {
                    unifiedAuth.users[userIndex].orders = [];
                }
                unifiedAuth.users[userIndex].orders.push(order);
                localStorage.setItem('users', JSON.stringify(unifiedAuth.users));
                
                // Обновляем текущего пользователя
                unifiedAuth.currentUser.orders = unifiedAuth.users[userIndex].orders;
                localStorage.setItem('currentUser', JSON.stringify(unifiedAuth.currentUser));
            }
        }

        this.clearCart();
        this.closeCheckout();
        this.showNotification('✅ Заказ оплачен и оформлен!');
        
        setTimeout(() => {
            window.location.href = 'orders.html';
        }, 1500);
         if (window.analytics) {
        const orderData = {
            order_id: order.id,
            total: order.total,
            items_count: order.items.length,
            payment_method: paymentResult.paymentMethod
        };
        analytics.trackPurchase(orderData);
    }
    }

    closeCheckout() {
        const overlay = document.querySelector('.checkout-overlay');
        if (overlay) overlay.remove();
    }


    
            async processPayment(orderTotal) {
    // Интеграция с PayPal
    return new Promise((resolve) => {
        // Здесь будет вызов PayPal API
        setTimeout(() => {
            resolve({ 
                success: true, 
                transactionId: 'PAYPAL_' + Date.now(),
                paymentSystem: 'paypal'
            });
        }, 2000);
    });
}

// ДОБАВЬ ЭТОТ МЕТОД В САМЫЙ КОНЕЦ КЛАССА VapeShop (перед последней закрывающей фигурной скобкой)
updateFavoriteButtons() {
    if (!window.unifiedAuth) return;
    
    document.querySelectorAll('.favorite-btn').forEach(btn => {
        const card = btn.closest('.card');
        const productId = parseInt(card.dataset.productId);
        
        if (unifiedAuth.isFavorite(productId)) {
            btn.innerHTML = '❤️';
            btn.classList.add('active');
        } else {
            btn.innerHTML = '🤍';
            btn.classList.remove('active');
        }
    });
}

// ===== СИСТЕМА ОТЗЫВОВ =====

// Открыть форму отзыва
openReviewForm(productId) {
    const form = document.getElementById('reviewForm');
    if (!form) return;
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        this.showNotification('Войдите чтобы оставить отзыв');
        if (window.unifiedAuth) unifiedAuth.openAuthModal();
        return;
    }
    
    // СОХРАНЯЕМ PRODUCTId
    if (productId) {
        this.currentReviewProductId = productId;
    } else {
        // Если productId не передан, пробуем найти из модалки
        const modal = document.querySelector('.quick-view-modal');
        const productCard = modal?.querySelector('[data-product-id]');
        if (productCard) {
            this.currentReviewProductId = parseInt(productCard.dataset.productId);
        }
    }
    
    form.style.display = 'block';
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Сбрасываем звезды
    this.selectedRating = null;
    document.querySelectorAll('.rating-star').forEach(star => {
        star.classList.remove('active');
    });
}

// Закрыть форму отзыва
closeReviewForm() {
    const form = document.getElementById('reviewForm');
    if (form) {
        form.style.display = 'none';
        // Очищаем форму
        const textarea = form.querySelector('textarea');
        if (textarea) textarea.value = '';
        document.querySelectorAll('.rating-star').forEach(star => {
            star.classList.remove('active');
        });
    }
}

// Инициализация звезд рейтинга
initRatingStars() {
    document.querySelectorAll('.rating-star').forEach(star => {
        star.addEventListener('click', function() {
            const rating = this.dataset.rating;
            const stars = this.parentElement.querySelectorAll('.rating-star');
            
            stars.forEach((s, index) => {
                if (index < rating) {
                    s.classList.add('active');
                } else {
                    s.classList.remove('active');
                }
            });
            
            shop.selectedRating = parseInt(rating);
        });
    });
}

// Отправить отзыв
async submitReview() {
    console.log('1. submitReview started');
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        this.showNotification('Войдите чтобы оставить отзыв');
        return;
    }
    
    // БЕРЕМ ID НАПРЯМУЮ ИЗ МОДАЛКИ
    const modal = document.querySelector('.quick-view-modal');
    const productCard = modal?.querySelector('[data-product-id]');
    
    if (!productCard) {
        console.error('Product card not found in modal');
        this.showNotification('Ошибка: товар не найден');
        return;
    }
    
    const productId = parseInt(productCard.dataset.productId);
    
    const textarea = document.querySelector('.review-textarea');
    const text = textarea.value.trim();
    
    if (!text) {
        this.showNotification('Напишите текст отзыва');
        return;
    }
    
    if (!this.selectedRating) {
        this.showNotification('Поставьте оценку');
        return;
    }
    
    try {
        this.showLoading('Отправка отзыва...');
        
        const token = localStorage.getItem('authToken');
        if (!token) {
            throw new Error('Не найден токен авторизации');
        }
        
        const response = await fetch('http://localhost:8000/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                product_id: productId,
                rating: this.selectedRating,
                text: text
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка при отправке отзыва');
        }
        
        this.hideLoading();
        this.showNotification('✅ Отзыв опубликован!');
        this.closeReviewForm();
        
        // Перезагружаем отзывы
        await this.loadReviews(productId);
        
    } catch (error) {
        this.hideLoading();
        console.error('Error submitting review:', error);
        this.showNotification('❌ ' + error.message, 'error');
    }
}
// Загрузить отзывы для товара
async loadReviews(productId) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    
    try {
        reviewsList.innerHTML = '<div class="reviews-loading">Загрузка отзывов...</div>';
        
        // ТОЖЕ ИСПРАВЛЕНО - ИСПОЛЬЗУЕМ authToken
        const token = localStorage.getItem('authToken'); // ИСПРАВЛЕНО
        
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`http://localhost:8000/api/reviews/product/${productId}`, {
            headers: headers
        });
        
        if (!response.ok) {
            throw new Error('Ошибка загрузки отзывов');
        }
        
        const data = await response.json();
        this.renderReviews(data.reviews);
        
        // Обновляем счетчик
        const countSpan = document.querySelector('.reviews-count');
        if (countSpan) {
            countSpan.textContent = data.total;
        }
        
    } catch (error) {
        console.error('Error loading reviews:', error);
        reviewsList.innerHTML = '<div class="no-reviews">❌ Ошибка загрузки отзывов</div>';
    }
}

// Отрендерить отзывы
renderReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    if (!reviewsList) return;
    
    if (!reviews || reviews.length === 0) {
        reviewsList.innerHTML = `
            <div class="no-reviews">
                <div class="no-reviews-icon">💬</div>
                <h4>Пока нет отзывов</h4>
                <p>Будьте первым, кто поделится впечатлениями!</p>
            </div>
        `;
        return;
    }
    
    reviewsList.innerHTML = reviews.map(review => this.renderReviewCard(review)).join('');
}

// Рендер одной карточки отзыва
renderReviewCard(review) {
    const date = new Date(review.created_at).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const stars = Array(5).fill('').map((_, i) => 
        `<span class="review-star ${i < review.rating ? 'filled' : ''}">★</span>`
    ).join('');
    
    const userInitial = review.user_name ? review.user_name[0].toUpperCase() : '?';
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const canDelete = currentUser && (currentUser.id === review.user_id || currentUser.isAdmin);
    
    return `
        <div class="review-card" data-review-id="${review.id}">
            <div class="review-header">
                <div class="review-user">
                    <div class="review-avatar">${userInitial}</div>
                    <div class="review-user-info">
                        <span class="review-user-name">${review.user_name}</span>
                        <span class="review-date">${date}</span>
                    </div>
                </div>
                <div class="review-rating">
                    ${stars}
                </div>
            </div>
            
            <div class="review-text">
                ${this.escapeHtml(review.text)}
            </div>
            
            <div class="review-actions">
                <button class="review-like ${review.user_liked ? 'liked' : ''}" 
                        onclick="shop.toggleLike(${review.id}, this)">
                    <span class="like-icon">${review.user_liked ? '❤️' : '🤍'}</span>
                    <span class="like-count">${review.likes}</span>
                </button>
                
                <button class="review-reply-btn" onclick="shop.openReplyForm(${review.id})">
                    <span>💬 Ответить</span>
                </button>
                
                ${canDelete ? `
                    <button class="review-delete-btn" onclick="shop.deleteReview(${review.id})">
                        <span>🗑️ Удалить</span>
                    </button>
                ` : ''}
            </div>
            
            <!-- Форма ответа -->
            <div class="reply-form-container" id="replyForm-${review.id}" style="display: none;">
                <div class="reply-form">
                    <textarea placeholder="Напишите ответ..." rows="2" id="replyText-${review.id}"></textarea>
                    <div class="reply-form-actions">
                        <button class="btn btn-primary" onclick="shop.submitReply(${review.id})">
                            Отправить
                        </button>
                        <button class="btn btn-ghost" onclick="shop.closeReplyForm(${review.id})">
                            Отмена
                        </button>
                    </div>
                </div>
            </div>
            
            ${this.renderReplies(review)}
        </div>
    `;
}
renderReplyCard(reply) {
    const date = new Date(reply.created_at).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const userInitial = reply.user_name ? reply.user_name[0].toUpperCase() : '?';
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const canDelete = currentUser && (currentUser.id === reply.user_id || currentUser.isAdmin);
    
    return `
        <div class="reply-card" data-review-id="${reply.id}" data-parent-id="${reply.parent_id}">
            <div class="reply-header">
                <div class="reply-user">
                    <div class="reply-avatar">${userInitial}</div>
                    <div class="reply-user-info">
                        <span class="reply-user-name">${reply.user_name}</span>
                        <span class="reply-date">${date}</span>
                    </div>
                </div>
            </div>
            
            <div class="reply-text">
                ${this.escapeHtml(reply.text)}
            </div>
            
            <div class="reply-actions">
                <button class="reply-like ${reply.user_liked ? 'liked' : ''}" 
                        onclick="shop.toggleLike(${reply.id}, this)">
                    <span class="like-icon">${reply.user_liked ? '❤️' : '🤍'}</span>
                    <span class="like-count">${reply.likes}</span>
                </button>
                
                <button class="reply-reply-btn" onclick="shop.openReplyForm(${reply.id})">
                    <span>💬 Ответить</span>
                </button>
                
                ${canDelete ? `
                    <button class="reply-delete-btn" onclick="shop.deleteReview(${reply.id})">
                        <span>🗑️ Удалить</span>
                    </button>
                ` : ''}
            </div>
            
            <!-- Форма ответа на ответ -->
            <div class="reply-form-container" id="replyForm-${reply.id}" style="display: none;">
                <div class="reply-form">
                    <textarea placeholder="Напишите ответ..." rows="2" id="replyText-${reply.id}"></textarea>
                    <div class="reply-form-actions">
                        <button class="btn btn-primary" onclick="shop.submitReply(${reply.id})">
                            Отправить
                        </button>
                        <button class="btn btn-ghost" onclick="shop.closeReplyForm(${reply.id})">
                            Отмена
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Вложенные ответы (рекурсивно) -->
            ${reply.replies && reply.replies.length > 0 ? 
                `<div class="nested-replies">
                    ${reply.replies.map(r => this.renderReplyCard(r)).join('')}
                </div>` : ''}
        </div>
    `;
}
// Новый метод для рендера ответов с пагинацией
renderReplies(review) {
    if (!review.replies || review.replies.length === 0) {
        return '';
    }
    
    const replies = review.replies;
    const totalReplies = replies.length;
    const showCount = 5; // Показываем первые 5
    
    const visibleReplies = replies.slice(0, showCount);
    const hiddenReplies = replies.slice(showCount);
    
    let html = `<div class="review-replies" data-review-id="${review.id}">`;
    
    // Рендерим видимые ответы
    visibleReplies.forEach(reply => {
        html += this.renderReplyCard(reply);
    });
    
    // Если есть скрытые ответы
    if (hiddenReplies.length > 0) {
        html += `
            <div class="replies-hidden" id="hidden-replies-${review.id}" style="display: none;">
                ${hiddenReplies.map(reply => this.renderReplyCard(reply)).join('')}
            </div>
            
            <div class="replies-pagination">
                <button class="show-more-replies" onclick="shop.toggleReplies(${review.id}, this)">
                    <span class="show-more-icon">▼</span>
                    <span>Показать еще ${hiddenReplies.length} ${this.pluralize(hiddenReplies.length, 'ответ', 'ответа', 'ответов')}</span>
                </button>
                
                <button class="show-all-replies" onclick="shop.showAllReplies(${review.id})" style="display: none;">
                    Показать все ${totalReplies} ответов
                </button>
            </div>
        `;
    }
    
    html += `</div>`;
    return html;
}
// Вспомогательный метод для склонения
pluralize(count, one, few, many) {
    const mod10 = count % 10;
    const mod100 = count % 100;
    
    if (mod100 >= 11 && mod100 <= 19) {
        return many;
    }
    if (mod10 === 1) {
        return one;
    }
    if (mod10 >= 2 && mod10 <= 4) {
        return few;
    }
    return many;
}
// Метод для показа всех ответов
showAllReplies(reviewId) {
    const hiddenDiv = document.getElementById(`hidden-replies-${reviewId}`);
    const showMoreBtn = hiddenDiv?.parentElement.querySelector('.show-more-replies');
    
    if (hiddenDiv) {
        hiddenDiv.style.display = 'block';
        
        // Меняем текст на "Скрыть"
        if (showMoreBtn) {
            showMoreBtn.querySelector('.show-more-icon').innerHTML = '▲';
            showMoreBtn.querySelector('.show-more-text').innerHTML = 'Скрыть';
        }
        
        // Прячем кнопку "Показать все"
        const showAllBtn = hiddenDiv.parentElement.querySelector('.show-all-replies');
        if (showAllBtn) {
            showAllBtn.style.display = 'none';
        }
    }
}
// Добавь метод для цвета аватара
getAvatarColor(userId) {
    const colors = [
        'linear-gradient(135deg, #c24bff, #8f5eff)',
        'linear-gradient(135deg, #ff6b6b, #ff4757)',
        'linear-gradient(135deg, #4ecdc4, #45b7d1)',
        'linear-gradient(135deg, #feca57, #ff9f43)',
        'linear-gradient(135deg, #54a0ff, #5f27cd)'
    ];
    return colors[userId % colors.length];
}
// Экранирование HTML
escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Лайк отзыва
async toggleLike(reviewId, button) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        this.showNotification('Войдите чтобы ставить лайки');
        if (window.unifiedAuth) unifiedAuth.openAuthModal();
        return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
        const response = await fetch(`http://localhost:8000/api/reviews/${reviewId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Анимация
            button.classList.add(data.liked ? 'liked' : '');
            button.querySelector('.like-icon').textContent = data.liked ? '❤️' : '🤍';
            button.querySelector('.like-count').textContent = data.likes;
            
            // Анимация попа
            button.querySelector('.like-icon').style.animation = 'likePop 0.3s ease';
            setTimeout(() => {
                button.querySelector('.like-icon').style.animation = '';
            }, 300);
        }
        
    } catch (error) {
        console.error('Error toggling like:', error);
    }
}
// Метод для сворачивания/разворачивания ответов
toggleReplies(reviewId, button) {
    const hiddenDiv = document.getElementById(`hidden-replies-${reviewId}`);
    const showAllBtn = button.parentElement.querySelector('.show-all-replies');
    
    if (hiddenDiv) {
        if (hiddenDiv.style.display === 'none') {
            // Показываем скрытые
            hiddenDiv.style.display = 'block';
            button.querySelector('.show-more-icon').innerHTML = '▲';
            button.querySelector('.show-more-text').innerHTML = 'Скрыть';
            
            // Показываем кнопку "Показать все"
            if (showAllBtn) {
                showAllBtn.style.display = 'inline-block';
            }
        } else {
            // Скрываем
            hiddenDiv.style.display = 'none';
            button.querySelector('.show-more-icon').innerHTML = '▼';
            button.querySelector('.show-more-text').innerHTML = 'Показать еще';
            
            // Скрываем кнопку "Показать все"
            if (showAllBtn) {
                showAllBtn.style.display = 'none';
            }
        }
    }
}
// Открыть форму ответа
openReplyForm(reviewId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        this.showNotification('Войдите чтобы ответить');
        if (window.unifiedAuth) unifiedAuth.openAuthModal();
        return;
    }
    
    // Закрываем все другие формы
    document.querySelectorAll('.reply-form-container').forEach(form => {
        if (form.id !== `replyForm-${reviewId}`) {
            form.style.display = 'none';
        }
    });
    
    const form = document.getElementById(`replyForm-${reviewId}`);
    if (form) {
        form.style.display = 'block';
        const textarea = document.getElementById(`replyText-${reviewId}`);
        if (textarea) {
            textarea.focus();
            textarea.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}
// Закрыть форму ответа
closeReplyForm(reviewId) {
    const form = document.getElementById(`replyForm-${reviewId}`);
    if (form) {
        form.style.display = 'none';
        const textarea = document.getElementById(`replyText-${reviewId}`);
        if (textarea) textarea.value = '';
    }
}

// Отправить ответ
async submitReply(parentId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        this.showNotification('Войдите чтобы ответить');
        return;
    }
    
    // БЕРЕМ ID ИЗ МОДАЛКИ
    const modal = document.querySelector('.quick-view-modal');
    const productCard = modal?.querySelector('[data-product-id]');
    
    if (!productCard) {
        console.error('Product card not found in modal');
        this.showNotification('Ошибка: товар не найден');
        return;
    }
    
    const productId = parseInt(productCard.dataset.productId);
    
    const textarea = document.getElementById(`replyText-${parentId}`);
    if (!textarea) {
        console.error('Textarea not found');
        return;
    }
    
    const text = textarea.value.trim();
    
    if (!text) {
        this.showNotification('Напишите текст ответа');
        return;
    }
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        this.showNotification('Ошибка авторизации');
        return;
    }
    
    try {
        this.showLoading('Отправка ответа...');
        
        const response = await fetch('http://localhost:8000/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                product_id: productId,
                rating: 5,
                text: text,
                parent_id: parentId
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка при отправке ответа');
        }
        
        this.hideLoading();
        this.showNotification('✅ Ответ отправлен!');
        this.closeReplyForm(parentId);
        
        // Очищаем поле
        textarea.value = '';
        
        // Перезагружаем отзывы
        await this.loadReviews(productId);
        
    } catch (error) {
        this.hideLoading();
        console.error('Error submitting reply:', error);
        this.showNotification('❌ ' + error.message, 'error');
    }
}

// Открыть форму ответа
openReplyForm(reviewId) {
    // Проверяем авторизацию
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        this.showNotification('Войдите чтобы ответить');
        if (window.unifiedAuth) unifiedAuth.openAuthModal();
        return;
    }
    
    // Закрываем все другие открытые формы
    document.querySelectorAll('.reply-form-container').forEach(form => {
        form.style.display = 'none';
    });
    
    const form = document.getElementById(`replyForm-${reviewId}`);
    if (form) {
        form.style.display = 'block';
        // Скроллим к форме
        form.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Закрыть форму ответа
closeReplyForm(reviewId) {
    const form = document.getElementById(`replyForm-${reviewId}`);
    if (form) {
        form.style.display = 'none';
        const textarea = document.getElementById(`replyText-${reviewId}`);
        if (textarea) textarea.value = '';
    }
}

// Отправить ответ
async submitReply(parentId) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        this.showNotification('Войдите чтобы ответить');
        return;
    }
    
    // БЕРЕМ ID ИЗ МОДАЛКИ
    const modal = document.querySelector('.quick-view-modal');
    const productCard = modal?.querySelector('[data-product-id]');
    
    if (!productCard) {
        console.error('Product card not found in modal');
        this.showNotification('Ошибка: товар не найден');
        return;
    }
    
    const productId = parseInt(productCard.dataset.productId);
    
    const textarea = document.getElementById(`replyText-${parentId}`);
    if (!textarea) {
        console.error('Textarea not found');
        return;
    }
    
    const text = textarea.value.trim();
    
    if (!text) {
        this.showNotification('Напишите текст ответа');
        return;
    }
    
    const token = localStorage.getItem('authToken');
    if (!token) {
        this.showNotification('Ошибка авторизации');
        return;
    }
    
    try {
        this.showLoading('Отправка ответа...');
        
        const response = await fetch('http://localhost:8000/api/reviews', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                product_id: productId,
                rating: 5,
                text: text,
                parent_id: parentId
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Ошибка при отправке ответа');
        }
        
        this.hideLoading();
        this.showNotification('✅ Ответ отправлен!');
        this.closeReplyForm(parentId);
        
        // Очищаем поле
        textarea.value = '';
        
        // Перезагружаем отзывы
        await this.loadReviews(productId);
        
    } catch (error) {
        this.hideLoading();
        console.error('Error submitting reply:', error);
        this.showNotification('❌ ' + error.message, 'error');
    }
}

// Удалить отзыв
async deleteReview(reviewId) {
    if (!confirm('🗑️ Удалить этот отзыв?')) return;
    
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        this.showNotification('Войдите чтобы удалить отзыв');
        return;
    }
    
    const modal = document.querySelector('.quick-view-modal');
    const productCard = modal?.querySelector('[data-product-id]');
    if (!productCard) return;
    
    const productId = parseInt(productCard.dataset.productId);
    const token = localStorage.getItem('authToken');
    
    try {
        this.showLoading('Удаление...');
        
        const response = await fetch(`http://localhost:8000/api/reviews/${reviewId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) throw new Error('Ошибка при удалении');
        
        this.hideLoading();
        this.showNotification('✅ Удалено');
        
        // Плавное удаление
        const element = document.querySelector(`[data-review-id="${reviewId}"]`);
        if (element) {
            element.style.transition = 'all 0.3s ease';
            element.style.opacity = '0';
            element.style.transform = 'translateX(-20px)';
            setTimeout(() => {
                element.remove();
                // Если это был последний ответ, показываем "нет ответов"
                const repliesContainer = document.querySelector(`.review-replies[data-review-id="${productId}"]`);
                if (repliesContainer && repliesContainer.children.length === 0) {
                    repliesContainer.remove();
                }
            }, 300);
        } else {
            await this.loadReviews(productId);
        }
        
    } catch (error) {
        this.hideLoading();
        this.showNotification('❌ Ошибка удаления');
    }
}




        }
// Функция для избранного в модалке (СТАРАЯ АНИМАЦИЯ)
function toggleFavoriteQuick(productId, button) {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    
    if (!user) {
        alert('Войдите в систему');
        if (window.unifiedAuth) unifiedAuth.openAuthModal();
        return;
    }
    
    if (!user.favorites) user.favorites = [];
    
    const existingIndex = user.favorites.findIndex(fav => fav.id === productId);
    
     // Анимация
    button.style.transform = 'scale(1.1)';
    setTimeout(() => {
        button.style.transform = 'scale(1)';
    }, 200);
    
    setTimeout(() => {
        button.style.animation = '';
        
        if (existingIndex === -1) {
            user.favorites.push({id: productId});
            button.innerHTML = '❤️ В избранном';
            button.classList.add('active');
        } else {
            user.favorites.splice(existingIndex, 1);
            button.innerHTML = '🤍 В избранное';
            button.classList.remove('active');
        }
        
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        if (window.unifiedAuth && window.unifiedAuth.currentUser) {
            window.unifiedAuth.currentUser.favorites = user.favorites;
        }
        
        // Обновляем кнопку на карточке
        const cardBtn = document.querySelector(`.card[data-product-id="${productId}"] .favorite-btn`);
        if (cardBtn) {
            if (existingIndex === -1) {
                cardBtn.innerHTML = '❤️';
                cardBtn.classList.add('active');
            } else {
                cardBtn.innerHTML = '🤍';
                cardBtn.classList.remove('active');
            }
        }
    }, 200);
}
function toggleFavorite(productId, button) {
    if (!window.unifiedAuth) {
        alert('Войдите в систему');
        return;
    }
    
    unifiedAuth.toggleFavorite(productId);
    
    // Обновляем кнопку
    const isFavorite = unifiedAuth.isFavorite(productId);
    if (isFavorite) {
        button.innerHTML = '❤️';
        button.classList.add('active');
    } else {
        button.innerHTML = '🤍';
        button.classList.remove('active');
    }
}

// Инициализация приложения
const shop = new VapeShop();

// Закрытие модальных окон при клике вне
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
        shop.closeQuickView(); // Вызываем тот же метод
    }
});

// Предотвращение закрытия при клике на само модальное окно
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        e.stopPropagation();
    });
});
