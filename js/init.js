// init.js - Единая инициализация всего проекта
class AppInitializer {
    constructor() {
        this.init();
    }

    async init() {
        console.log('🚀 Initializing ChichaShop...');
        
        try {
            // 1. Загружаем продукты глобально
            await this.loadProducts();
            
            // 2. Инициализируем безопасность
            if (window.security) {
                security.initSecuritySystems();
            }
            
            // 3. Инициализируем аналитику
            if (window.analytics) {
                console.log('📊 Analytics ready');
            }
            
            // 4. Инициализируем магазин (только на главной)
            if (window.location.pathname.includes('index.html') || 
                window.location.pathname === '/') {
                if (typeof VapeShop === 'function') {
                    window.shop = new VapeShop();
                }
            }
            
            // 5. Инициализируем единую авторизацию
            if (typeof UnifiedAuth === 'function' && !window.unifiedAuth) {
                window.unifiedAuth = new UnifiedAuth();
            }
            
            console.log('✅ App initialized successfully');
        } catch (error) {
            console.error('❌ Initialization error:', error);
            this.showError('Ошибка загрузки приложения');
        }
    }

    async loadProducts() {
        // Загружаем продукты один раз для всего приложения
        if (!window.products) {
            const savedProducts = localStorage.getItem('products');
            
            if (savedProducts && savedProducts !== 'undefined') {
                try {
                    window.products = JSON.parse(savedProducts);
                    console.log('📦 Products loaded from localStorage:', window.products.length);
                } catch (e) {
                    console.error('Error parsing products, using default', e);
                    window.products = window.defaultProducts || [];
                }
            } else {
                // Если нет в localStorage, используем из products.js
                if (typeof products !== 'undefined') {
                    window.products = products;
                    localStorage.setItem('products', JSON.stringify(products));
                    console.log('📦 Products loaded from JS file');
                } else {
                    window.products = [];
                    console.warn('⚠️ No products found');
                }
            }
        }
        
        return window.products;
    }

    showError(message) {
        // Простой fallback для ошибок
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ef4444;
            color: white;
            padding: 10px;
            text-align: center;
            z-index: 10000;
        `;
        errorDiv.textContent = `❌ ${message}`;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }
}

// Автоматическая инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    window.appInitializer = new AppInitializer();
});