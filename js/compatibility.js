// compatibility.js - Исправления для Edge и других браузеров

// 1. Полифилл для старых браузеров
if (!window.Promise) {
    document.write('<script src="https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js"><\/script>');
}

// 2. Полифилл для fetch
if (!window.fetch) {
    document.write('<script src="https://cdn.jsdelivr.net/npm/whatwg-fetch@3.6.0/dist/fetch.umd.min.js"><\/script>');
}

// 3. Полифилл для localStorage (на случай если отключен)
if (!window.localStorage) {
    document.write('<script src="https://cdn.jsdelivr.net/npm/localstorage-slim@2.3.0/dist/localstorage-slim.min.js"><\/script>');
}

// 4. Исправление для Edge (event.path не существует)
document.addEventListener('click', function(e) {
    if (!e.composedPath) {
        e.composedPath = function() {
            var path = [];
            var target = this.target;
            while (target) {
                path.push(target);
                target = target.parentNode;
            }
            return path;
        };
    }
});

// 5. Исправление для старых браузеров (Object.values)
if (!Object.values) {
    Object.values = function(obj) {
        var values = [];
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                values.push(obj[key]);
            }
        }
        return values;
    };
}

// 6. Загрузка продуктов с защитой от ошибок
function safeLoadProducts() {
    try {
        // Проверяем есть ли продукты в localStorage
        const savedProducts = localStorage.getItem('products');
        
        if (savedProducts && savedProducts !== 'undefined' && savedProducts !== 'null') {
            window.products = JSON.parse(savedProducts);
            console.log('Товары загружены из localStorage:', window.products.length);
        } else if (typeof products !== 'undefined') {
            // Используем из products.js
            window.products = products;
            localStorage.setItem('products', JSON.stringify(products));
            console.log('Товары загружены из products.js');
        } else {
            window.products = [];
            console.warn('Товары не найдены');
        }
    } catch (error) {
        console.error('Ошибка загрузки товаров:', error);
        window.products = [];
    }
    
    return window.products;
}

// 7. Автоматическая загрузка при старте
document.addEventListener('DOMContentLoaded', function() {
    // Загружаем продукты
    safeLoadProducts();
    
    // Задержка для инициализации магазина
    setTimeout(function() {
        if (typeof VapeShop === 'function' && !window.shop) {
            try {
                window.shop = new VapeShop();
            } catch (e) {
                console.error('Ошибка создания магазина:', e);
            }
        }
    }, 500);
});

// 8. Исправление для nodelist forEach в IE
if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = Array.prototype.forEach;
}

// 9. Исправление для Element.closest в IE
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

// 10. Исправление для Element.matches в IE
if (!Element.prototype.matches) {
    Element.prototype.matches = 
        Element.prototype.matchesSelector || 
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector || 
        Element.prototype.oMatchesSelector ||
        Element.prototype.webkitMatchesSelector ||
        function(s) {
            var matches = (this.document || this.ownerDocument).querySelectorAll(s),
                i = matches.length;
            while (--i >= 0 && matches.item(i) !== this) {}
            return i > -1;
        };
}