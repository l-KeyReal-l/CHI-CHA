// ЗАМЕНИ весь security.js на этот код:
class Security {
    constructor() {
        this.xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<\s*iframe/gi,
            /<\s*form/gi,
            /<\s*meta/gi,
            /<\s*object/gi,
            /<\s*embed/gi
        ];
    }

    // Экранирование HTML
    escapeHTML(unsafe) {
        if (typeof unsafe !== 'string') return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Валидация email
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email) && email.length <= 255;
    }

    // Валидация пароля
    validatePassword(password) {
        return password && password.length >= 6 && password.length <= 100;
    }

    // Валидация имени
    validateName(name) {
        return name && name.length >= 2 && name.length <= 50 && /^[a-zA-Zа-яА-ЯёЁ\s\-]+$/.test(name);
    }

    // Защита от XSS
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        let sanitized = this.escapeHTML(input.trim());
        
        // Дополнительная защита от XSS
        this.xssPatterns.forEach(pattern => {
            sanitized = sanitized.replace(pattern, '');
        });
        
        return sanitized;
    }

    // Валидация цены
    validatePrice(price) {
        return !isNaN(price) && price >= 0 && price <= 1000000;
    }

    // Валидация ID
    validateId(id) {
        return !isNaN(id) && id > 0 && id <= 999999;
    }

    // Генерация CSRF токена
    generateCSRFToken() {
        return 'csrf_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
    }

    // Проверка CSRF токена
    verifyCSRFToken(token, storedToken) {
        return token && storedToken && token === storedToken;
    }

    // Логирование подозрительной активности
    logSuspiciousActivity(action, data) {
        console.warn('🚨 Подозрительная активность:', {
            action,
            data,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
        });
    }

    // Шифрование данных
    encryptData(data) {
        try {
            const jsonString = JSON.stringify(data);
            const encoded = btoa(unescape(encodeURIComponent(jsonString)));
            return 'secure_' + Date.now() + '_' + encoded;
        } catch (error) {
            console.error('Encryption error:', error);
            return null;
        }
    }


    sanitizeUserInput(input) {
    if (typeof input !== 'string') return '';
    
    // Убираем опасные символы
    let sanitized = input
        .replace(/[<>]/g, '') // Убираем HTML теги
        .replace(/javascript:/gi, '') // Убираем JS
        .replace(/on\w+=/gi, '') // Убираем обработчики событий
        .trim();
    
    // Ограничиваем длину
    return sanitized.substring(0, 500);
}

validateProductData(product) {
    if (!product || typeof product !== 'object') return false;
    
    return this.validateId(product.id) &&
           this.validatePrice(product.price) &&
           this.sanitizeUserInput(product.name).length > 0 &&
           this.sanitizeUserInput(product.description).length > 0;
}

// ЗАЩИТА ОТ XSS В КОММЕНТАРИЯХ И ОПИСАНИЯХ
sanitizeHTML(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;");
}

// ПРОВЕРКА ДОСТУПА К СТРАНИЦАМ
checkPageAccess(user, requiredRole = 'user') {
    if (!user) return false;
    
    if (requiredRole === 'admin' && !user.isAdmin) {
        return false;
    }
    
    return true;
}

    // Дешифровка данных
    decryptData(encryptedData) {
        try {
            if (!encryptedData.startsWith('secure_')) {
                throw new Error('Invalid encrypted data');
            }
            
            const parts = encryptedData.split('_');
            const encodedData = parts[2];
            const decoded = decodeURIComponent(escape(atob(encodedData)));
            return JSON.parse(decoded);
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    // Маскирование чувствительных данных
    maskSensitive(text) {
        if (!text || text.length < 4) return '***';
        return '*'.repeat(text.length - 4) + text.slice(-4);
    }

    // Валидация email с защитой от временных почт
    validateSecureEmail(email) {
        if (!this.validateEmail(email)) return false;
        
        const tempDomains = [
            'tempmail', '10minutemail', 'guerrillamail', 
            'mailinator', 'yopmail', 'throwaway'
        ];
        
        const domain = email.split('@')[1].toLowerCase();
        return !tempDomains.some(temp => domain.includes(temp));
    }

    // Сильная вадидация пароля
    validateStrongPassword(password) {
        const requirements = {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /\d/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
        
        return {
            isValid: Object.values(requirements).every(Boolean),
            requirements: requirements
        };
    }

    // Генерация безопасного ID
    generateSecureId(prefix = '') {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 9);
        return `${prefix}${timestamp}_${random}`.toUpperCase();
    }


    

// МАКСИМАЛЬНАЯ ЗАЩИТА ОТ XSS
sanitizeHTML(unsafe) {
    if (typeof unsafe !== 'string') return '';
    
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;")
        .replace(/\\/g, "&#x5C;")
        .replace(/`/g, "&#96;");
}

// ЗАЩИТА ОТ SQL-ИНЪЕКЦИЙ (даже на клиенте)
sanitizeSQL(input) {
    if (typeof input !== 'string') return '';
    
    const sqlKeywords = ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'UNION', 'OR', 'AND'];
    let sanitized = input;
    
    sqlKeywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        sanitized = sanitized.replace(regex, '');
    });
    
    return sanitized.replace(/[;'"\\]/g, '');
}

// ЗАЩИТА ОТ CSRF
generateCSRFToken() {
    const token = 'csrf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 16);
    sessionStorage.setItem('csrf_token', token);
    return token;
}

validateCSRFToken(token) {
    const storedToken = sessionStorage.getItem('csrf_token');
    return token && storedToken && token === storedToken;
}

// ЗАЩИТА ОТ БРУТФОРСА
setupBruteForceProtection() {
    const maxAttempts = 5;
    const lockoutTime = 15 * 60 * 1000; // 15 минут
    
    window.loginAttempts = window.loginAttempts || { count: 0, lastAttempt: 0 };
    
    // Сбрасываем счетчик если прошло больше lockoutTime
    if (Date.now() - window.loginAttempts.lastAttempt > lockoutTime) {
        window.loginAttempts.count = 0;
    }
}

checkBruteForce() {
    this.setupBruteForceProtection();
    
    if (window.loginAttempts.count >= 5) {
        const timeLeft = (window.loginAttempts.lastAttempt + (15 * 60 * 1000) - Date.now()) / 1000 / 60;
        throw new Error(`Слишком много попыток. Попробуйте через ${Math.ceil(timeLeft)} минут.`);
    }
    
    window.loginAttempts.count++;
    window.loginAttempts.lastAttempt = Date.now();
}

// ШИФРОВАНИЕ ДАННЫХ В LOCALSTORAGE НАХУЙ


// ЗАПУСК ВСЕХ СИСТЕМ БЕЗОПАСНОСТИ
initSecuritySystems() {
    this.setupBruteForceProtection();
    
    // УБРАЛ debugger и опасный код
    console.log('🔒 Security systems activated');
}

// Добавить в конец класса Security:
validateAdminAccess() {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!user.isAdmin) {
        // Не показываем alert, а сразу редиректим
        window.location.replace('index.html');
        return false;
    }
    return true;
}

preventXSS() {
    // Запрещаем опасные события
    document.addEventListener('DOMContentLoaded', () => {
        const scripts = document.querySelectorAll('script:not([src])');
        scripts.forEach(script => script.remove());
    });
}
}


// АВТОМАТИЧЕСКИЙ ЗАПУСК СИСТЕМ БЕЗОПАСНОСТИ
document.addEventListener('DOMContentLoaded', function() {
    security.initSecuritySystems();
});

const security = new Security();

