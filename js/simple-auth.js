// ЗАМЕНИ ВЕСЬ simple-auth.js на этот код:
class SimpleAuth {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
        
        // Создаем дефолтного админа если нет пользователей
        if (this.users.length === 0) {
            this.createDefaultAdmin();
        }
        
        this.init();
    }

    createDefaultAdmin() {
    const adminUser = {
        id: 1,
        name: "Админ",
        telegram: "@admin",
        password: this.hashPassword("admin123"),
        registrationDate: new Date().toISOString(),
        isAdmin: true,
        orders: [],
        favorites: []
    };
    
    this.users.push(adminUser);
    localStorage.setItem('users', JSON.stringify(this.users));
    console.log('Создан дефолтный админ:', adminUser.telegram, 'пароль: admin123');
}

    init() {
        this.setupAuthForms();
        this.updateUI();
        this.updateAuthModals(); // ДОБАВЬ ЭТУ СТРОЧКУ
        this.setupGlobalListeners();
    }

    setupGlobalListeners() {
        // Закрытие меню при клике вне
        document.addEventListener('click', (e) => {
            const userMenu = document.getElementById('userMenu');
            if (userMenu && !e.target.closest('.user-avatar') && !e.target.closest('#userMenu')) {
                userMenu.classList.remove('show');
            }
        });
    }


    // ДОБАВЬ метод для обновления переводов в модалках
updateAuthModals() {
    const currentLang = localStorage.getItem('language') || 'ru';
    const translations = {
        ru: {
            loginTitle: 'Вход',
            registerTitle: 'Регистрация',
            telegram: 'Telegram username',
            password: 'Пароль',
            confirmPassword: 'Подтвердите пароль',
            name: 'Ваше имя',
            loginButton: 'войти', // Изменено!
            registerButton: 'Зарегистрироваться'
        },
        en: {
            loginTitle: 'Login',
            registerTitle: 'Register',
            telegram: 'telegram username',
            password: 'Password',
            confirmPassword: 'Confirm Password',
            name: 'Name',
            loginButton: 'Login',
            registerButton: 'Register'
        },
        uk: {
            loginTitle: 'Вхід в аккаунт',
            registerTitle: 'Реєстрація',
            telegram: 'telegram username',
            password: 'Пароль',
            confirmPassword: 'Підтвердіть пароль',
            name: 'Ім\'я',
            loginButton: 'Увійти',
            registerButton: 'Зареєструватися'
        },
        
    };
    
    const t = translations[currentLang] || translations.ru;
    
    // Обновляем модалку входа
    const authTitle = document.querySelector('#authModal h2');
    const authInputs = document.querySelectorAll('#authForm input');
    const authButton = document.querySelector('#authForm button');
    
    if (authTitle) authTitle.textContent = t.loginTitle;
    if (authInputs[0]) authInputs[0].placeholder = t.telegram; // Изменено!
    if (authInputs[1]) authInputs[1].placeholder = t.password;
    if (authButton) authButton.textContent = t.loginButton;

    // Обновляем модалку регистрации
    const registerTitle = document.querySelector('#registerModal h2');
    const registerInputs = document.querySelectorAll('#registerForm input');
    const registerButton = document.querySelector('#registerForm button');
    
    if (registerTitle) registerTitle.textContent = t.registerTitle;
    if (registerInputs[0]) registerInputs[0].placeholder = t.telegram; // Изменено!
    if (registerInputs[1]) registerInputs[1].placeholder = t.name;
    if (registerInputs[2]) registerInputs[2].placeholder = t.password;
    if (registerInputs[3]) registerInputs[3].placeholder = t.confirmPassword;
    if (registerButton) registerButton.textContent = t.registerButton;
}
    setupAuthForms() {
        // Форма входа
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.login();
            });
        }

        // Форма регистрации
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.register();
            });
        }
    }

    // ОБНОВИ МЕТОД register():
register() {
    const telegram = document.getElementById('regTelegram')?.value.trim();
    const name = document.getElementById('regName')?.value.trim();
    const password = document.getElementById('regPassword')?.value;
    const confirmPassword = document.getElementById('regPasswordConfirm')?.value;
    
    console.log('Register attempt:', { telegram, name });
    
    // ВАЛИДАЦИЯ
    if (!telegram || !name || !password || !confirmPassword) {
        this.showNotification('❌ Заполните все поля');
        return false;
    }

    // Нормализуем Telegram username
    const normalizedTelegram = telegram.startsWith('@') ? telegram : '@' + telegram;
    
    // Проверяем username
    if (!/^@[a-zA-Z0-9_]{5,32}$/.test(normalizedTelegram)) {
        this.showNotification('❌ Telegram username должен быть 5-32 символа (только буквы, цифры, подчеркивание)');
        return false;
    }

    // Проверяем пароли
    if (password !== confirmPassword) {
        this.showNotification('❌ Пароли не совпадают');
        return false;
    }

    if (password.length < 6) {
        this.showNotification('❌ Пароль должен быть не менее 6 символов');
        return false;
    }

    // Проверяем существующего пользователя
    if (this.users.find(u => u.telegram === normalizedTelegram)) {
        this.showNotification('❌ Этот Telegram уже занят');
        return false;
    }

    // СОЗДАЕМ ПОЛЬЗОВАТЕЛЯ
    const newUser = {
        id: Date.now(),
        name,
        telegram: normalizedTelegram,
        password: this.hashPassword(password),
        registrationDate: new Date().toISOString(),
        isAdmin: false,
        orders: [],
        favorites: []
    };

    this.users.push(newUser);
    this.currentUser = newUser;

    localStorage.setItem('users', JSON.stringify(this.users));
    localStorage.setItem('currentUser', JSON.stringify(newUser));

    this.closeAuthModals();
    this.updateUI();
    this.showNotification(`🎉 Добро пожаловать, ${name}!`);
    
    // Открываем модалку входа (чтобы сразу вошли)
    setTimeout(() => {
        this.openAuthModal();
        document.getElementById('authTelegram').value = normalizedTelegram.replace('@', '');
    }, 500);
    
    return true;
}

    
validatePassword(password) {
    return password.length >= 6;
}

validateName(name) {
    return name.length >= 2 && name.length <= 50;
}
    
    login() {
    const telegramInput = document.getElementById('authTelegram');
    const passwordInput = document.getElementById('authPassword');
    
    const telegram = telegramInput?.value.trim();
    const password = passwordInput?.value;

    console.log('Login attempt:', telegram);

    if (!telegram || !password) {
        this.showNotification('❌ Заполните все поля');
        return;
    }

    // Нормализуем Telegram username
    const normalizedTelegram = telegram.startsWith('@') ? telegram : '@' + telegram;
    
    // ИЩЕМ ПОЛЬЗОВАТЕЛЯ ПО TELEGRAM
    const user = this.users.find(u => 
        u.telegram === normalizedTelegram && 
        u.password === this.hashPassword(password)
    );
    
    if (user) {
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        this.closeAuthModals();
        this.updateUI();
        this.showNotification(`👋 Привет, ${user.name}!`);
        
        // Перезагружаем страницу через секунду
        setTimeout(() => location.reload(), 1000);
    } else {
        this.showNotification('❌ Неверный Telegram или пароль');
        if (passwordInput) passwordInput.value = '';
    }
}
    // В simple-auth.js ДОБАВЬ после метода login():
addToFavorites(productId) {
    if (!this.currentUser) {
        this.showNotification('Войдите в систему чтобы добавить в избранное');
        this.openAuthModal();
        return;
    }

    if (!this.currentUser.favorites) {
        this.currentUser.favorites = [];
    }

    const product = window.products.find(p => p.id === productId);
    if (!product) return;

    const existingIndex = this.currentUser.favorites.findIndex(fav => fav.id === productId);
    
    if (existingIndex === -1) {
        this.currentUser.favorites.push(product);
        this.showNotification('✅ Добавлено в избранное');
    } else {
        this.currentUser.favorites.splice(existingIndex, 1);
        this.showNotification('🗑️ Удалено из избранного');
    }

    // Обновляем localStorage
    const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
    if (userIndex !== -1) {
        this.users[userIndex].favorites = this.currentUser.favorites;
        localStorage.setItem('users', JSON.stringify(this.users));
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }
}

isFavorite(productId) {
    if (!this.currentUser || !this.currentUser.favorites) return false;
    return this.currentUser.favorites.some(fav => fav.id === productId);
}

removeFromFavorites(productId) {
    if (!this.currentUser || !this.currentUser.favorites) return;
    
    this.currentUser.favorites = this.currentUser.favorites.filter(fav => fav.id !== productId);
    
    const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
    if (userIndex !== -1) {
        this.users[userIndex].favorites = this.currentUser.favorites;
        localStorage.setItem('users', JSON.stringify(this.users));
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
    }
    
    this.showNotification('🗑️ Удалено из избранного');
}

    hashPassword(password) {
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    logout() {
        if (confirm('Точно хотите выйти?')) {
            this.currentUser = null;
            localStorage.removeItem('currentUser');
            this.updateUI();
            this.showNotification('👋 Вы вышли из системы');
            
            // Редирект если на защищенных страницах
            setTimeout(() => {
                if (window.location.pathname.includes('profile.html') || 
                    window.location.pathname.includes('orders.html') ||
                    window.location.pathname.includes('admin.html')) {
                    window.location.href = 'index.html';
                }
            }, 1000);
        }
    }

    updateUI() {
    const authBtn = document.getElementById('authBtn');
    const registerBtn = document.getElementById('registerBtn');

    if (!authBtn) return;

    if (this.currentUser) {
        // ПОКАЗЫВАЕМ АВАТАР - ПРИ КЛИКЕ ПЕРЕХОД НА ПРОФИЛЬ
        authBtn.innerHTML = `
            <div class="user-avatar" onclick="window.location.href='profile.html'">
                <span class="avatar-icon">👤</span>
                <span class="avatar-name">${this.currentUser.name}</span>
                ${this.currentUser.isAdmin ? '<span class="admin-badge" title="Администратор">⚡</span>' : ''}
            </div>
        `;
        
        // Скрываем кнопку регистрации
        if (registerBtn) {
            registerBtn.style.display = 'none';
        }
        
    } else {
        // ПОКАЗЫВАЕМ КНОПКИ ВХОДА И РЕГИСТРАЦИИ С ПЕРЕВОДАМИ
        const currentLang = localStorage.getItem('language') || 'ru';
        const translations = {
            ru: { login: 'Войти', register: 'Регистрация' },
            en: { login: 'Login', register: 'Register' },
            uk: { login: 'Увійти', register: 'Реєстрація' },
            no: { login: 'Logg inn', register: 'Registrer' }
        };
        
        const t = translations[currentLang] || translations.ru;
        
        authBtn.innerHTML = t.login;
        authBtn.onclick = () => this.openAuthModal();
        
        if (registerBtn) {
            registerBtn.style.display = 'block';
            registerBtn.textContent = t.register;
            registerBtn.onclick = () => this.openRegisterModal();
        }
    }
}


    // В класс SimpleAuth:
// forgotPassword(email) {
//     if (!this.validateEmail(email)) {
//         this.showNotification('❌ Введите корректный email');
//         return;
//     }

//     const user = this.users.find(u => u.email === email);
//     if (!user) {
//         this.showNotification('❌ Пользователь с таким email не найден');
//         return;
//     }

//     // В реальном приложении здесь бы отправлялось письмо
//     this.showNotification('📧 Инструкция по восстановлению отправлена на ваш email');
// }

    openAuthModal() {
        document.getElementById('authModal').style.display = 'flex';
    }

    openRegisterModal() {
        document.getElementById('registerModal').style.display = 'flex';
    }

    closeAuthModals() {
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('registerModal').style.display = 'none';
        
        // Очищаем формы
        document.querySelectorAll('#authForm input, #registerForm input').forEach(input => {
            input.value = '';
        });
    }

    showNotification(message) {
        if (window.shop && typeof shop.showNotification === 'function') {
            shop.showNotification(message);
        } else {
            // Fallback уведомление
            alert(message);
        }
    }

    // Проверка авторизации для защищенных страниц
    requireAuth() {
        if (!this.currentUser) {
            this.showNotification('❌ Войдите в систему');
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
}

// Глобальный инстанс
const proAuth = new SimpleAuth();