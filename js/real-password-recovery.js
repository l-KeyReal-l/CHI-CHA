// Создай файл js/real-password-recovery.js
class RealPasswordRecovery {
    constructor() {
        this.recoveryCodes = JSON.parse(localStorage.getItem('recovery_codes')) || {};
        this.init();
    }

    init() {
        this.setupRecoveryModal();
    }

    setupRecoveryModal() {
        // Создаем модалку восстановления
        const modalHTML = `
            <div class="modal-backdrop" id="recoveryModal" style="display: none;">
                <div class="modal" style="max-width: 450px;">
                    <button class="close" onclick="closeRecoveryModal()">✕</button>
                    
                    <!-- ШАГ 1: Ввод email -->
                    <div id="recoveryStep1">
                        <h3 style="color: #b73ce7; margin-bottom: 15px;">🔐 Восстановление пароля</h3>
                        <p style="color: #cbd5e1; margin-bottom: 20px;">
                            Введите email вашего аккаунта. Мы отправим код восстановления.
                        </p>
                        
                        <div class="form-group">
                            <input type="email" id="recoveryEmail" 
                                   placeholder="your@email.com" 
                                   style="width: 100%; padding: 12px; margin-bottom: 15px;">
                        </div>
                        
                        <button onclick="sendRecoveryCode()" 
                                class="btn btn-primary" 
                                style="width: 100%; padding: 12px;">
                            📧 Отправить код
                        </button>
                    </div>
                    
                    <!-- ШАГ 2: Ввод кода -->
                    <div id="recoveryStep2" style="display: none;">
                        <h3 style="color: #b73ce7; margin-bottom: 15px;">📧 Проверьте почту</h3>
                        <p style="color: #cbd5e1; margin-bottom: 20px;">
                            Мы отправили 6-значный код на ваш email.
                            Введите его ниже:
                        </p>
                        
                        <div class="form-group">
                            <input type="text" id="recoveryCode" 
                                   placeholder="123456" maxlength="6"
                                   style="width: 100%; padding: 12px; margin-bottom: 15px; text-align: center; font-size: 18px; letter-spacing: 5px;">
                        </div>
                        
                        <button onclick="verifyRecoveryCode()" 
                                class="btn btn-primary" 
                                style="width: 100%; padding: 12px;">
                            ✅ Проверить код
                        </button>
                        
                        <button onclick="showStep(1)" 
                                class="btn btn-ghost" 
                                style="width: 100%; margin-top: 10px; padding: 12px;">
                            ↩️ Назад
                        </button>
                    </div>
                    
                    <!-- ШАГ 3: Новый пароль -->
                    <div id="recoveryStep3" style="display: none;">
                        <h3 style="color: #b73ce7; margin-bottom: 15px;">✨ Новый пароль</h3>
                        
                        <div class="form-group">
                            <input type="password" id="newPassword" 
                                   placeholder="Новый пароль" 
                                   style="width: 100%; padding: 12px; margin-bottom: 10px;">
                        </div>
                        
                        <div class="form-group">
                            <input type="password" id="confirmPassword" 
                                   placeholder="Повторите пароль" 
                                   style="width: 100%; padding: 12px; margin-bottom: 20px;">
                        </div>
                        
                        <button onclick="setNewPassword()" 
                                class="btn btn-primary" 
                                style="width: 100%; padding: 12px;">
                            💾 Сохранить пароль
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // 1. Отправка кода на email (в реальности - на бэкенд)
    async sendRecoveryCode(email) {
        if (!this.validateEmail(email)) {
            this.showError('Введите корректный email');
            return false;
        }

        // Проверяем есть ли пользователь
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const user = users.find(u => u.email === email);
        
        if (!user) {
            this.showError('Пользователь с таким email не найден');
            return false;
        }

        // Генерируем 6-значный код
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expires = Date.now() + 15 * 60 * 1000; // 15 минут

        // Сохраняем код
        this.recoveryCodes[email] = {
            code,
            expires,
            userId: user.id,
            attempts: 0
        };
        
        localStorage.setItem('recovery_codes', JSON.stringify(this.recoveryCodes));

        // В РЕАЛЬНОМ ПРОЕКТЕ: Отправка email через бэкенд
        // fetch('/api/send-recovery-code', { email, code })
        
        // Для демо - показываем код в alert
        alert(`📧 Код восстановления для ${email}: ${code}\n\n(В реальном проекте код придет на почту)`);
        
        return true;
    }

    // 2. Проверка кода
    verifyRecoveryCode(email, code) {
        const recoveryData = this.recoveryCodes[email];
        
        if (!recoveryData) {
            this.showError('Код не найден или истек');
            return false;
        }

        if (Date.now() > recoveryData.expires) {
            delete this.recoveryCodes[email];
            localStorage.setItem('recovery_codes', JSON.stringify(this.recoveryCodes));
            this.showError('Код истек. Запросите новый.');
            return false;
        }

        if (recoveryData.attempts >= 3) {
            this.showError('Слишком много попыток. Запросите новый код.');
            return false;
        }

        if (recoveryData.code !== code) {
            recoveryData.attempts++;
            localStorage.setItem('recovery_codes', JSON.stringify(this.recoveryCodes));
            
            const attemptsLeft = 3 - recoveryData.attempts;
            this.showError(`Неверный код. Осталось попыток: ${attemptsLeft}`);
            return false;
        }

        return recoveryData.userId;
    }

    // 3. Установка нового пароля
    setNewPassword(email, newPassword, confirmPassword) {
        if (newPassword !== confirmPassword) {
            this.showError('Пароли не совпадают');
            return false;
        }

        if (newPassword.length < 6) {
            this.showError('Пароль должен быть не менее 6 символов');
            return false;
        }

        const users = JSON.parse(localStorage.getItem('users')) || [];
        const userIndex = users.findIndex(u => u.email === email);
        
        if (userIndex === -1) {
            this.showError('Пользователь не найден');
            return false;
        }

        // Обновляем пароль
        users[userIndex].password = this.hashPassword(newPassword);
        localStorage.setItem('users', JSON.stringify(users));

        // Удаляем использованный код
        delete this.recoveryCodes[email];
        localStorage.setItem('recovery_codes', JSON.stringify(this.recoveryCodes));

        return true;
    }

    // Вспомогательные методы
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    hashPassword(password) {
        // Используем ту же логику что и в unifiedAuth
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return hash.toString();
    }

    showError(message) {
        alert('❌ ' + message);
    }

    showSuccess(message) {
        alert('✅ ' + message);
    }
}

// Глобальные функции для вызова из HTML
let passwordRecovery = new RealPasswordRecovery();

function openPasswordRecovery() {
    document.getElementById('authModal').style.display = 'none';
    document.getElementById('recoveryModal').style.display = 'flex';
    showStep(1);
}

function closeRecoveryModal() {
    document.getElementById('recoveryModal').style.display = 'none';
}

function showStep(step) {
    [1, 2, 3].forEach(s => {
        document.getElementById(`recoveryStep${s}`).style.display = 'none';
    });
    document.getElementById(`recoveryStep${step}`).style.display = 'block';
}

async function sendRecoveryCode() {
    const email = document.getElementById('recoveryEmail').value.trim();
    
    if (await passwordRecovery.sendRecoveryCode(email)) {
        // Сохраняем email в sessionStorage для следующих шагов
        sessionStorage.setItem('recovery_email', email);
        showStep(2);
    }
}

function verifyRecoveryCode() {
    const email = sessionStorage.getItem('recovery_email');
    const code = document.getElementById('recoveryCode').value.trim();
    
    if (passwordRecovery.verifyRecoveryCode(email, code)) {
        showStep(3);
    }
}

function setNewPassword() {
    const email = sessionStorage.getItem('recovery_email');
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (passwordRecovery.setNewPassword(email, newPassword, confirmPassword)) {
        // Показываем милое сообщение
        const cuteModal = `
            <div class="modal-backdrop" style="display: flex; background: rgba(183, 60, 231, 0.1);">
                <div class="modal" style="max-width: 400px; text-align: center; background: linear-gradient(135deg, #1a1a2e, #2d1b42);">
                    <div style="font-size: 48px; margin-bottom: 15px;">✨</div>
                    <h3 style="color: #b73ce7; margin-bottom: 10px;">Пароль изменен!</h3>
                    <p style="color: #cbd5e1; margin-bottom: 20px; line-height: 1.6;">
                        Не забывайте его пожалуйста :)
                    </p>
                    <button onclick="closeAllModals()" 
                            class="btn btn-primary"
                            style="padding: 10px 25px;">
                        Понятно
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', cuteModal);
    }
}

function closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach(modal => {
        modal.style.display = 'none';
    });
    sessionStorage.removeItem('recovery_email');
}