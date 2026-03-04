// telegram-auth.js - УНИФИЦИРОВАННАЯ АВТОРИЗАЦИЯ ЧЕРЕЗ TELEGRAM
class TelegramAuth {
    constructor() {
        this.pendingCodes = new Map(); // code -> {userId, telegram, expires}
        this.pendingLogins = new Map(); // tempToken -> {telegram, code, userId, expires}
        this.BACKEND_URL = 'http://localhost:8000';
        this.init();
    }

    init() {
        // Форма входа шаг 1
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.loginStep1();
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

    // ШАГ 1: Ввод Telegram и пароля
    async loginStep1() {
        const telegramInput = document.getElementById('authTelegram');
        const passwordInput = document.getElementById('authPassword');
        
        const telegram = telegramInput.value.trim();
        const password = passwordInput.value;

        if (!telegram || !password) {
            this.showNotification('Заполните все поля');
            return;
        }

        // Нормализуем username
        const normalizedTelegram = telegram.startsWith('@') ? telegram : '@' + telegram;

        try {
            const response = await fetch(`${this.BACKEND_URL}/auth/login-step1`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram: normalizedTelegram,
                    password: password
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // Сохраняем токен и переходим к шагу 2
                this.showStep2(data.tempToken, normalizedTelegram);
                this.showNotification('✅ Код отправлен в Telegram!');
            } else {
                this.showNotification(`❌ ${data.error}`);
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showNotification('Ошибка соединения с сервером');
        }
    }

    // Показать панель ввода кода
    showStep2(tempToken, telegram) {
        // Скрываем шаг 1
        document.getElementById('authForm').style.display = 'none';
        
        // Создаем или показываем шаг 2
        let step2 = document.getElementById('loginStep2');
        
        if (!step2) {
            step2 = document.createElement('div');
            step2.id = 'loginStep2';
            step2.className = 'login-step2';
            step2.innerHTML = this.getStep2HTML(telegram);
            document.querySelector('#authModal .modal').appendChild(step2);
        } else {
            step2.innerHTML = this.getStep2HTML(telegram);
            step2.style.display = 'block';
        }

        // Сохраняем tempToken в data-атрибуте
        step2.dataset.tempToken = tempToken;
        step2.dataset.telegram = telegram;
    }

    getStep2HTML(telegram) {
        return `
            <div class="step2-container">
                <div class="step2-header">
                    <h3>🔐 Введите код подтверждения</h3>
                    <p>Код отправлен в Telegram на <strong>${telegram}</strong></p>
                    <p class="hint">Проверьте ваши сообщения в Telegram</p>
                </div>
                
                <div class="code-inputs" id="codeInputs">
                    <input type="text" maxlength="1" class="code-digit" data-index="1" autocomplete="off">
                    <input type="text" maxlength="1" class="code-digit" data-index="2">
                    <input type="text" maxlength="1" class="code-digit" data-index="3">
                    <input type="text" maxlength="1" class="code-digit" data-index="4">
                    <input type="text" maxlength="1" class="code-digit" data-index="5">
                    <input type="text" maxlength="1" class="code-digit" data-index="6">
                </div>
                
                <div class="step2-actions">
                    <button class="btn btn-primary" onclick="telegramAuth.loginStep2()">
                        Подтвердить код
                    </button>
                    <button class="btn btn-ghost" onclick="telegramAuth.backToStep1()">
                        ← Назад
                    </button>
                </div>
                
                <div class="telegram-help">
                    <p>Не получили код?</p>
                    <button class="btn-link" onclick="telegramAuth.resendCode()">Отправить повторно</button>
                </div>
            </div>
        `;
    }

    // Инициализация ввода кода (автоматический переход между полями)
    initCodeInputs() {
        setTimeout(() => {
            const inputs = document.querySelectorAll('.code-digit');
            
            inputs.forEach((input, index) => {
                input.addEventListener('input', (e) => {
                    // Автопереход к следующему полю
                    if (e.target.value && index < inputs.length - 1) {
                        inputs[index + 1].focus();
                    }
                    
                    // Автоподтверждение при заполнении всех полей
                    const allFilled = Array.from(inputs).every(inp => inp.value);
                    if (allFilled) {
                        setTimeout(() => this.loginStep2(), 300);
                    }
                });
                
                // Обработка удаления
                input.addEventListener('keydown', (e) => {
                    if (e.key === 'Backspace' && !e.target.value && index > 0) {
                        inputs[index - 1].focus();
                    }
                });
            });
            
            // Фокус на первом поле
            if (inputs[0]) inputs[0].focus();
        }, 100);
    }

    // ШАГ 2: Подтверждение кода
    async loginStep2() {
        const step2 = document.getElementById('loginStep2');
        if (!step2) return;

        const tempToken = step2.dataset.tempToken;
        
        // Собираем код из всех полей
        const codeDigits = Array.from(document.querySelectorAll('.code-digit'))
            .map(input => input.value)
            .join('');
        
        if (codeDigits.length !== 6) {
            this.showNotification('❌ Введите все 6 цифр кода');
            return;
        }

        try {
            const response = await fetch(`${this.BACKEND_URL}/auth/login-step2`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tempToken: tempToken,
                    code: codeDigits
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // Сохраняем токен и пользователя
                localStorage.setItem('authToken', data.token);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                
                // Обновляем UI через unifiedAuth если он есть
                if (window.unifiedAuth) {
                    window.unifiedAuth.currentUser = data.user;
                    window.unifiedAuth.renderAuthButtons();
                }
                
                // Закрываем модалку
                this.closeAuthModal();
                
                // Показываем уведомление
                this.showNotification('✅ Вход выполнен успешно!');
                
                // Перезагружаем страницу через секунду
                setTimeout(() => location.reload(), 1000);
                
            } else {
                this.showNotification(`❌ ${data.error || 'Неверный код'}`);
                // Подсвечиваем поля с ошибкой
                document.querySelectorAll('.code-digit').forEach(input => {
                    input.classList.add('error');
                });
            }
        } catch (error) {
            console.error('Login step2 error:', error);
            this.showNotification('Ошибка соединения с сервером');
        }
    }

    // РЕГИСТРАЦИЯ
    async register() {
        const telegram = document.getElementById('regTelegram').value.trim();
        const name = document.getElementById('regName').value.trim();
        const password = document.getElementById('regPassword').value;
        const confirmPassword = document.getElementById('regPasswordConfirm').value;

        // Валидация
        if (!telegram || !name || !password || !confirmPassword) {
            this.showNotification('Заполните все поля');
            return;
        }

        if (!/^[a-zA-Z0-9_]{5,32}$/.test(telegram)) {
            this.showNotification('Telegram username должен содержать 5-32 символа (буквы, цифры, подчеркивание)');
            return;
        }

        if (password !== confirmPassword) {
            this.showNotification('Пароли не совпадают');
            return;
        }

        if (password.length < 6) {
            this.showNotification('Пароль должен быть не менее 6 символов');
            return;
        }

        try {
            const response = await fetch(`${this.BACKEND_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram: telegram,
                    password: password,
                    name: name
                })
            });

            const data = await response.json();
            
            if (data.success) {
                this.showNotification('✅ Регистрация успешна! Теперь вы можете войти.');
                this.closeRegisterModal();
                
                // Автоматически заполняем поле входа
                setTimeout(() => {
                    this.openAuthModal();
                    document.getElementById('authTelegram').value = telegram;
                }, 500);
            } else {
                this.showNotification(`❌ ${data.error || 'Ошибка регистрации'}`);
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Ошибка соединения с сервером');
        }
    }

    // Отправить код повторно
    async resendCode() {
        const step2 = document.getElementById('loginStep2');
        if (!step2) return;
        
        const telegram = step2.dataset.telegram;
        const password = document.getElementById('authPassword').value;
        
        if (!telegram || !password) {
            this.showNotification('Сначала введите логин и пароль');
            this.backToStep1();
            return;
        }
        
        try {
            const response = await fetch(`${this.BACKEND_URL}/auth/resend-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    telegram: telegram,
                    password: password
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification('✅ Новый код отправлен в Telegram!');
                // Обновляем tempToken
                step2.dataset.tempToken = data.tempToken;
                
                // Очищаем поля кода
                document.querySelectorAll('.code-digit').forEach(input => {
                    input.value = '';
                    input.classList.remove('error');
                });
                
                // Фокус на первое поле
                const inputs = document.querySelectorAll('.code-digit');
                if (inputs[0]) inputs[0].focus();
            } else {
                this.showNotification(`❌ ${data.error}`);
            }
        } catch (error) {
            console.error('Resend code error:', error);
            this.showNotification('Ошибка отправки кода');
        }
    }

    // Назад к шагу 1
    backToStep1() {
        const step2 = document.getElementById('loginStep2');
        if (step2) {
            step2.style.display = 'none';
            step2.innerHTML = '';
        }
        
        document.getElementById('authForm').style.display = 'block';
        document.getElementById('authPassword').value = '';
    }

    // Открыть модалку входа
    openAuthModal() {
        document.getElementById('authModal').style.display = 'flex';
        setTimeout(() => {
            const telegramInput = document.getElementById('authTelegram');
            if (telegramInput) telegramInput.focus();
        }, 100);
    }

    // Открыть модалку регистрации
    openRegisterModal() {
        document.getElementById('registerModal').style.display = 'flex';
        setTimeout(() => {
            const telegramInput = document.getElementById('regTelegram');
            if (telegramInput) telegramInput.focus();
        }, 100);
    }

    // Закрыть модалку входа
    closeAuthModal() {
        document.getElementById('authModal').style.display = 'none';
        this.backToStep1();
        
        // Очищаем поля
        document.getElementById('authTelegram').value = '';
        document.getElementById('authPassword').value = '';
    }

    // Закрыть модалку регистрации
    closeRegisterModal() {
        document.getElementById('registerModal').style.display = 'none';
        
        // Очищаем поля
        document.getElementById('regTelegram').value = '';
        document.getElementById('regName').value = '';
        document.getElementById('regPassword').value = '';
        document.getElementById('regPasswordConfirm').value = '';
    }

    // Уведомления
    showNotification(message) {
        if (window.shop && typeof shop.showNotification === 'function') {
            shop.showNotification(message);
        } else {
            // Простой fallback
            const notification = document.createElement('div');
            notification.className = 'simple-notification';
            notification.innerHTML = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: #b73ce7;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 9999;
                animation: slideIn 0.3s ease;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }
}

// Инициализация
const telegramAuth = new TelegramAuth();