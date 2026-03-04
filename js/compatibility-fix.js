// compatibility-fix.js - ФИКСЫ ДЛЯ EDGE И СТАРЫХ БРАУЗЕРОВ
// Функции-заглушки для избежания ошибок
window.workingAuth = window.workingAuth || {
    updateUI: function() { console.log('workingAuth placeholder'); }
};

window.updateFavoriteButtons = window.updateFavoriteButtons || function() {
    console.log('updateFavoriteButtons placeholder');
};

(function() {
    'use strict';
    
    console.log('🔧 Compatibility fixes loading...');
    
    // ============ ПОЛИФИЛЛЫ ============
    
    // Object.values для IE
    if (!Object.values) {
        Object.values = function(obj) {
            return Object.keys(obj).map(function(key) {
                return obj[key];
            });
        };
    }
    
    // Element.closest для IE
    if (!Element.prototype.closest) {
        Element.prototype.closest = function(s) {
            var el = this;
            if (!document.documentElement.contains(el)) return null;
            do {
                if (el.matches(s)) return el;
                el = el.parentElement || el.parentNode;
            } while (el !== null && el.nodeType === 1);
            return null;
        };
    }
    
    // Element.matches для IE
    if (!Element.prototype.matches) {
        Element.prototype.matches = 
            Element.prototype.msMatchesSelector || 
            Element.prototype.webkitMatchesSelector ||
            function(s) {
                var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                    i = matches.length;
                while (--i >= 0 && matches.item(i) !== this) {}
                return i > -1;
            };
    }
    
    // NodeList.forEach для IE
    if (window.NodeList && !NodeList.prototype.forEach) {
        NodeList.prototype.forEach = Array.prototype.forEach;
    }
    
    // ============ ФИКС LOCALSTORAGE ============
    
    // Проверка localStorage
    if (typeof localStorage === 'undefined') {
        console.warn('⚠️ localStorage не доступен, создаем fallback');
        window.localStorage = {
            _data: {},
            setItem: function(id, val) {
                this._data[id] = String(val);
                return this._data[id];
            },
            getItem: function(id) {
                return this._data.hasOwnProperty(id) ? this._data[id] : null;
            },
            removeItem: function(id) {
                return delete this._data[id];
            },
            clear: function() {
                this._data = {};
                return this._data;
            }
        };
    }
    
    // ============ ЗАГРУЗКА ПРОДУКТОВ ДЛЯ EDGE ============
    
    function loadProductsForEdge() {
        try {
            // Проверяем глобальные продукты
            if (typeof products !== 'undefined') {
                window.products = products;
                console.log('📦 Products loaded from global variable');
                return products;
            }
            
            // Пробуем из localStorage
            const saved = localStorage.getItem('products');
            if (saved && saved !== 'undefined' && saved !== 'null') {
                window.products = JSON.parse(saved);
                console.log('📦 Products loaded from localStorage');
                return window.products;
            }
            
            // Создаем пустой массив если ничего не найдено
            window.products = [];
            console.warn('⚠️ No products found, using empty array');
            return [];
            
        } catch (error) {
            console.error('❌ Error loading products:', error);
            window.products = [];
            return [];
        }
    }
    
    // ============ ИНИЦИАЛИЗАЦИЯ МАГАЗИНА ============
    
    function initializeShop() {
        // Загружаем продукты
        loadProductsForEdge();
        
        // Инициализируем shop если есть класс VapeShop
        if (typeof VapeShop === 'function' && !window.shop) {
            try {
                // Даем время на загрузку DOM
                setTimeout(function() {
                    window.shop = new VapeShop();
                    console.log('🏪 Shop initialized');
                }, 500);
            } catch (e) {
                console.error('❌ Error initializing shop:', e);
            }
        }
        
        // Инициализируем auth
        if (typeof UnifiedAuth === 'function' && !window.unifiedAuth) {
            setTimeout(function() {
                try {
                    window.unifiedAuth = new UnifiedAuth();
                    console.log('👤 Auth initialized');
                } catch (e) {
                    console.error('❌ Error initializing auth:', e);
                }
            }, 1000);
        }
    }
    
    // ============ ОБРАБОТЧИКИ ОШИБОК ============
    
    window.addEventListener('error', function(e) {
        console.error('🚨 Global error:', e.message, 'at', e.filename, ':', e.lineno);
    });
    
    // ============ ЗАПУСК ============
    
    document.addEventListener('DOMContentLoaded', function() {
        console.log('✅ DOM loaded, initializing compatibility...');
        
        // Инициализируем магазин
        setTimeout(initializeShop, 100);
        
        // Обновляем переводы если есть
        if (typeof shop !== 'undefined' && typeof shop.updateUI === 'function') {
            setTimeout(function() {
                shop.updateUI();
            }, 300);
        }
    });
    
    console.log('✅ Compatibility fixes loaded');
})();