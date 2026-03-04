// auth-system-fixed.js - РАБОЧАЯ СИСТЕМА АВТОРИЗАЦИИ
class AuthSystem {
    constructor() {
        this.baseUrl = 'http://localhost:8000';
        this.tempToken = null;
        this.currentUser = null;
        this.codeExpiryInterval = null;
        this.codeExpiryTime = null;
        
        this.init();
    }
    
    init() {
        console.log('🔐 AuthSystem инициализирован');
        this.loadUser();
        this.setupForms();
        this.updateUI();
    }
    
    loadUser() {
        try {
            const userData = localStorage.getItem('currentUser');
            const token = localStorage.getItem('authToken');
            
            if (userData && token) {
                this.currentUser = JSON.parse(userData);
                console.log('👤 Загружен пользователь:', this.currentUser.name);
            }
        } catch (e) {
            console.error('Ошибка загрузки пользователя:', e);
            this.logout();
        }
    }
    
    setupForms() {
        // Форма входа
        const authForm = document.getElementById('authForm');
        if (authForm) {
            const newForm = authForm.cloneNode(true);
            authForm.parentNode.replaceChild(newForm, authForm);
            
            document.getElementById('authForm').addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('📤 Отправка формы входа');
                this.loginStep1();
            });
        }
        
        // Форма регистрации
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            const newForm = registerForm.cloneNode(true);
            registerForm.parentNode.replaceChild(newForm, registerForm);
            
            document.getElementById('registerForm').addEventListener('submit', (e) => {
                e.preventDefault();
                console.log('📤 Отправка формы регистрации');
                this.register();
            });
        }
    }
    
    // РЕГИСТРАЦИЯ
    async register() {
        const telegram = document.getElementById('regTelegram')?.value.trim();
        const name = document.getElementById('regName')?.value.trim();
        const password = document.getElementById('regPassword')?.value;
        const confirmPassword = document.getElementById('regPasswordConfirm')?.value;
        
        console.log('📝 Регистрация:', { telegram, name });
        
        if (!telegram || !name || !password || !confirmPassword) {
            this.showError('Заполните все поля');
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('Пароли не совпадают');
            return;
        }
        
        if (password.length < 6) {
            this.showError('Пароль должен быть не менее 6 символов');
            return;
        }
        
        const normalizedTelegram = telegram.startsWith('@') ? telegram : '@' + telegram;
        
        try {
            console.log('📤 Отправка запроса регистрации...');
            
            const response = await fetch(`${this.baseUrl}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    telegram: normalizedTelegram,
                    name: name,
                    password: password
                })
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка регистрации');
            }
            
            const data = await response.json();
            console.log('✅ Регистрация успешна:', data);
            
            if (data.success) {
                this.showSuccess('✅ Регистрация успешна! Теперь войдите в аккаунт.');
                
                this.closeModal('registerModal');
                
                document.getElementById('regTelegram').value = '';
                document.getElementById('regName').value = '';
                document.getElementById('regPassword').value = '';
                document.getElementById('regPasswordConfirm').value = '';
                
                setTimeout(() => {
                    this.openModal('authModal');
                    document.getElementById('authTelegram').value = normalizedTelegram.replace('@', '');
                }, 500);
            }
            
        } catch (error) {
            console.error('❌ Ошибка регистрации:', error);
            this.showError(error.message || 'Ошибка регистрации');
        }
    }
    
    // ЛОГИН ШАГ 1
    async loginStep1() {
        const telegramEl = document.getElementById('authTelegram');
        const passwordEl = document.getElementById('authPassword');
        
        const telegram = telegramEl?.value.trim();
        const password = passwordEl?.value;
        
        console.log('🔐 Вход:', { telegram, password: password ? '***' : 'нет' });
        
        if (!telegram || !password) {
            this.showError('Введите Telegram и пароль');
            return;
        }
        
        const normalizedTelegram = telegram.startsWith('@') ? telegram : '@' + telegram;
        
        try {
            console.log('📤 Отправка запроса входа...');
            
            const response = await fetch(`${this.baseUrl}/api/auth/login-step1`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    telegram: normalizedTelegram,
                    password: password
                })
            });
            
            console.log('📥 Получен ответ входа, статус:', response.status);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка входа');
            }
            
            const data = await response.json();
            console.log('✅ Успешный ответ:', data);
            
            if (data.success) {
                // Используем tempToken для совместимости со старым кодом
                this.tempToken = data.tempToken || data.temp_token;
                this.codeExpiryTime = Date.now() + (data.expires_in * 1000);
                
                this.showCodeInputPanel(normalizedTelegram, data.message);
                this.startSessionTimer();
                
                if (data.need_start) {
                    this.showWarning('⚠️ ' + data.message);
                } else {
                    this.showSuccess('✅ ' + data.message);
                }
            }
            
        } catch (error) {
            console.error('❌ Ошибка входа:', error);
            this.showError(error.message || 'Ошибка входа');
        }
    }
    
    startSessionTimer() {
        if (this.codeExpiryInterval) {
            clearInterval(this.codeExpiryInterval);
        }
        
        this.codeExpiryInterval = setInterval(() => {
            this.checkSessionValidity();
        }, 30000);
    }
    
    async checkSessionValidity() {
        if (!this.tempToken) return;
        
        try {
            const response = await fetch(`${this.baseUrl}/api/auth/check-session?temp_token=${this.tempToken}`);
            if (response.ok) {
                const data = await response.json();
                if (!data.active) {
                    this.showSessionExpired();
                    clearInterval(this.codeExpiryInterval);
                }
            }
        } catch (error) {
            console.error('Ошибка проверки сессии:', error);
        }
    }
    
    showSessionExpired() {
        const codePanel = document.getElementById('codePanel');
        if (codePanel) {
            codePanel.innerHTML = `
                <div style="text-align: center; padding: 30px;">
                    <div style="font-size: 48px; color: #ef4444;">⏰</div>
                    <h3 style="color: white; margin: 20px 0;">Сессия истекла</h3>
                    <p style="color: #cbd5e1; margin-bottom: 25px;">
                        Время для ввода кода истекло. Пожалуйста, начните вход заново.
                    </p>
                    <button onclick="window.authSystem.backToLogin()" 
                            class="btn btn-primary"
                            style="padding: 12px 30px; font-size: 16px;">
                        🔄 Начать заново
                    </button>
                </div>
            `;
        }
    }
    
    // Показать панель ввода кода
    showCodeInputPanel(telegram, message) {
        const authForm = document.getElementById('authForm');
        if (!authForm) return;
        
        authForm.style.display = 'none';
        
        const codeHTML = `
            <div id="codePanel" style="margin-top: 20px; animation: fadeIn 0.3s ease;">
                <h3 style="text-align: center; color: white; margin-bottom: 10px;">
                    📱 Введите код из Telegram
                </h3>
                
                <p style="text-align: center; color: #cbd5e1; margin-bottom: 10px;">
                    ${message}
                </p>
                
                <p style="text-align: center; color: #cbd5e1; margin-bottom: 10px;">
                    Код отправлен на <strong style="color: #b73ce7;">${telegram}</strong>
                </p>
                
                <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-bottom: 20px;" id="timerDisplay">
                    ⏱️ Код действителен: <span id="countdown">05:00</span>
                </p>
                
                <div style="display: flex; gap: 8px; justify-content: center; margin: 25px 0;">
                    ${Array.from({length: 6}).map((_, i) => `
                        <input type="text" maxlength="1" class="code-digit" 
                               style="width: 45px; height: 55px; text-align: center; 
                                      font-size: 22px; font-weight: bold;
                                      border: 2px solid #b73ce7; border-radius: 8px; 
                                      background: #1a1a2e; color: white;"
                               data-index="${i}">
                    `).join('')}
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                    <button onclick="window.authSystem.verifyCode()" 
                            class="btn btn-primary"
                            style="padding: 12px 30px; font-size: 16px;">
                        ✅ Подтвердить код
                    </button>
                    <button onclick="window.authSystem.backToLogin()" 
                            class="btn btn-ghost"
                            style="margin-left: 10px; padding: 12px 20px;">
                        ↩️ Назад
                    </button>
                </div>
                
                <div style="text-align: center; margin: 20px 0;">
                    <button onclick="window.authSystem.resendCode()" 
                            class="btn btn-secondary"
                            style="padding: 10px 20px; font-size: 14px; background: #4f46e5;">
                       ↻ Отправить код повторно
                    </button>
                </div>
                
                <p style="text-align: center; color: #94a3b8; font-size: 12px; margin-top: 10px;">
                    💡 Проверьте сообщения в Telegram. Если не видите код, 
                    проверьте что написали /start боту
                </p>
                
                <p style="text-align: center; color: #f59e0b; font-size: 12px; margin-top: 10px;">
                    🔗 Ссылка на бота: <a href="https://t.me/chichashop_auth_bot" target="_blank" style="color: #f59e0b;">@chichashop_auth_bot</a>
                </p>
            </div>
        `;
        
        const modalContent = document.querySelector('#authModal .modal');
        if (modalContent) {
            const oldPanel = document.getElementById('codePanel');
            if (oldPanel) oldPanel.remove();
            
            modalContent.insertAdjacentHTML('beforeend', codeHTML);
            
            setTimeout(() => {
                this.setupCodeInputs();
                this.startCountdown();
            }, 100);
        }
    }
    
    startCountdown() {
        if (!this.codeExpiryTime) return;
        
        const updateTimer = () => {
            const now = Date.now();
            const diff = this.codeExpiryTime - now;
            
            if (diff <= 0) {
                document.getElementById('countdown').textContent = '00:00';
                this.showSessionExpired();
                return;
            }
            
            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            
            document.getElementById('countdown').textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                
            // Меняем цвет при малом времени
            if (minutes === 0 && seconds < 30) {
                document.getElementById('countdown').style.color = '#ef4444';
            }
        };
        
        updateTimer();
        setInterval(updateTimer, 1000);
    }
    
    setupCodeInputs() {
        const inputs = document.querySelectorAll('.code-digit');
        
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                const value = e.target.value.replace(/[^0-9]/g, '');
                e.target.value = value;
                
                if (value && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
                
                const allFilled = Array.from(inputs).every(inp => inp.value);
                if (allFilled) {
                    setTimeout(() => this.verifyCode(), 300);
                }
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                    inputs[index - 1].value = '';
                }
            });
            
            input.addEventListener('paste', (e) => {
                e.preventDefault();
                const pasteData = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
                if (pasteData.length === 6) {
                    inputs.forEach((input, i) => {
                        input.value = pasteData[i] || '';
                    });
                    setTimeout(() => this.verifyCode(), 300);
                }
            });
        });
        
        if (inputs[0]) {
            inputs[0].focus();
        }
    }
    
    // ЛОГИН ШАГ 2
    async verifyCode() {
        if (!this.tempToken) {
            this.showError('Сессия истекла. Начните вход заново');
            this.backToLogin();
            return;
        }
        
        const inputs = document.querySelectorAll('.code-digit');
        const code = Array.from(inputs).map(input => input.value).join('');
        
        if (code.length !== 6) {
            this.showError('Введите все 6 цифр кода');
            return;
        }
        
        console.log('✅ Проверка кода:', { tempToken: this.tempToken, code });
        
        try {
            // Отправляем оба варианта для совместимости
            const response = await fetch(`${this.baseUrl}/api/auth/login-step2`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tempToken: this.tempToken,  // camelCase для фронтенда
                    temp_token: this.tempToken, // snake_case для бэкенда
                    code: code
                })
            });
            
            console.log('📥 Ответ проверки кода, статус:', response.status);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка проверки кода');
            }
            
            const data = await response.json();
            console.log('✅ Код верный!', data);
            
            if (data.success && data.token) {
                this.handleSuccessfulLogin(data);
            }
            
        } catch (error) {
            console.error('❌ Ошибка проверки кода:', error);
            this.showError(error.message || 'Неверный код');
            
            // Подсвечиваем ошибку
            document.querySelectorAll('.code-digit').forEach(input => {
                input.style.borderColor = '#ef4444';
            });
            
            // Сбрасываем через 2 секунды
            setTimeout(() => {
                document.querySelectorAll('.code-digit').forEach(input => {
                    input.style.borderColor = '#b73ce7';
                });
            }, 2000);
        }
    }
    
    async resendCode() {
        if (!this.tempToken) {
            this.showError('Сессия истекла. Начните вход заново');
            this.backToLogin();
            return;
        }
        
        try {
            this.showInfo('📤 Отправляю новый код...');
            
            const response = await fetch(`${this.baseUrl}/api/auth/resend-code`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    tempToken: this.tempToken,
                    temp_token: this.tempToken
                })
            });
            
            console.log('📥 Ответ повторной отправки:', response.status);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Ошибка отправки кода');
            }
            
            const data = await response.json();
            console.log('✅ Новый код отправлен:', data);
            
            this.showSuccess(data.message || '✅ Новый код отправлен!');
            
            // Сбрасываем таймер
            this.codeExpiryTime = Date.now() + (data.expires_in * 1000);
            this.startCountdown();
            
        } catch (error) {
            console.error('❌ Ошибка повторной отправки:', error);
            this.showError(error.message || 'Не удалось отправить новый код');
        }
    }
    
    handleSuccessfulLogin(data) {
    this.currentUser = data.user;
    localStorage.setItem('currentUser', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
        
        this.closeModal('authModal');
        
        if (this.codeExpiryInterval) {
            clearInterval(this.codeExpiryInterval);
        }
        
        this.tempToken = null;
        this.codeExpiryTime = null;
        
        this.updateUI();
        
        this.showSuccess(`🎉 Добро пожаловать, ${data.user.name}!`);
        
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    }
    
    backToLogin() {
        if (this.codeExpiryInterval) {
            clearInterval(this.codeExpiryInterval);
        }
        
        this.tempToken = null;
        this.codeExpiryTime = null;
        
        const codePanel = document.getElementById('codePanel');
        if (codePanel) {
            codePanel.remove();
        }
        
        const authForm = document.getElementById('authForm');
        if (authForm) {
            authForm.style.display = 'block';
        }
        
        const passwordInput = document.getElementById('authPassword');
        if (passwordInput) {
            passwordInput.value = '';
        }
        
        const telegramInput = document.getElementById('authTelegram');
        if (telegramInput) {
            telegramInput.focus();
        }
    }
    
    logout() {
        this.currentUser = null;
        this.tempToken = null;
        localStorage.removeItem('currentUser');
        localStorage.removeItem('authToken');
        
        if (this.codeExpiryInterval) {
            clearInterval(this.codeExpiryInterval);
        }
        
        this.updateUI();
        this.showSuccess('👋 Вы вышли из системы');
    }
    
    updateUI() {
    const authBtn = document.getElementById('authBtn');
    const registerBtn = document.getElementById('registerBtn');
    
    if (!authBtn) return;
    
    if (this.currentUser) {
        // Это старый стиль из первоначального кода
        authBtn.innerHTML = `
            <div class="user-avatar" onclick="window.location.href='profile.html'" 
                 style="cursor: pointer; display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 20px;">👤</span>
                <span>${this.currentUser.name}</span>
                ${this.currentUser.isAdmin ? '<span style="color: #f59e0b;">⚡</span>' : ''}
            </div>
        `;
        authBtn.onclick = null;
        
        if (registerBtn) {
            registerBtn.style.display = 'none';
        }
    } else {
        // Не вошел
        authBtn.innerHTML = 'Войти';
        authBtn.onclick = () => this.openModal('authModal');
        
        if (registerBtn) {
            registerBtn.innerHTML = 'Регистрация';
            registerBtn.style.display = 'block';
            registerBtn.onclick = () => this.openModal('registerModal');
        }
    }
}
    
    showProfileMenu() {
        // Создаем меню профиля
        const menuHTML = `
            <div id="profileMenu" style="position: absolute; top: 60px; right: 20px; 
                 background: #1a1a2e; border: 1px solid #374151; border-radius: 8px; 
                 padding: 10px; min-width: 200px; z-index: 1000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);">
                <div style="padding: 10px; border-bottom: 1px solid #374151;">
                    <strong style="color: white;">${this.currentUser.name}</strong>
                    <div style="color: #94a3b8; font-size: 12px;">${this.currentUser.telegram}</div>
                </div>
                <div style="padding: 5px 0;">
                    <button onclick="window.authSystem.goToProfile()" 
                            style="width: 100%; text-align: left; padding: 8px 12px; 
                                   background: none; border: none; color: #cbd5e1; cursor: pointer;
                                   border-radius: 4px;">
                        👤 Мой профиль
                    </button>
                    <button onclick="window.authSystem.logout()" 
                            style="width: 100%; text-align: left; padding: 8px 12px; 
                                   background: none; border: none; color: #ef4444; cursor: pointer;
                                   border-radius: 4px; margin-top: 5px;">
                        🚪 Выйти
                    </button>
                </div>
            </div>
        `;
        
        // Удаляем старое меню
        const oldMenu = document.getElementById('profileMenu');
        if (oldMenu) oldMenu.remove();
        
        document.body.insertAdjacentHTML('beforeend', menuHTML);
        
        // Закрытие по клику вне меню
        setTimeout(() => {
            document.addEventListener('click', (e) => {
                const menu = document.getElementById('profileMenu');
                const authBtn = document.getElementById('authBtn');
                if (menu && !menu.contains(e.target) && 
                    (!authBtn || !authBtn.contains(e.target))) {
                    menu.remove();
                }
            }, { once: true });
        }, 100);
    }
    
    goToProfile() {
        alert('Страница профиля в разработке...');
    }
    
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            
            setTimeout(() => {
                const input = modal.querySelector('input');
                if (input) input.focus();
            }, 100);
        }
    }
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
        
        // Удаляем меню профиля если открыто
        const profileMenu = document.getElementById('profileMenu');
        if (profileMenu) profileMenu.remove();
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showWarning(message) {
        this.showNotification(message, 'warning');
    }
    
    showInfo(message) {
        this.showNotification(message, 'info');
    }
    
    showNotification(message, type = 'info') {
        const colors = {
            error: '#ef4444',
            success: '#10b981',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        
        const icons = {
            error: '❌',
            success: '✅',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
            word-break: break-word;
        `;
        notification.innerHTML = `${icons[type]} ${message}`;
        
        // Удаляем старые уведомления
        const oldNotifications = document.querySelectorAll('[data-notification]');
        oldNotifications.forEach(n => n.remove());
        
        notification.setAttribute('data-notification', 'true');
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
}

// Добавляем CSS анимации
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
document.head.appendChild(style);

// Глобальный экземпляр
window.authSystem = new AuthSystem();

// Глобальные функции для HTML
window.openAuthModal = () => window.authSystem.openModal('authModal');
window.openRegisterModal = () => window.authSystem.openModal('registerModal');
window.closeModal = (id) => window.authSystem.closeModal(id);