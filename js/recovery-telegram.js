// recovery-telegram.js
class TelegramRecovery {
    constructor() {
        this.recoveryData = null;
        this.init();
    }

    init() {
        // Инициализация полей ввода кода
        setTimeout(() => this.initCodeInputs(), 100);
    }

    initCodeInputs() {
        const inputs = document.querySelectorAll('.recovery-code-digit');
        
        inputs.forEach((input, index) => {
            input.addEventListener('input', (e) => {
                if (e.target.value && index < inputs.length - 1) {
                    inputs[index + 1].focus();
                }
                
                // Автоподтверждение
                const allFilled = Array.from(inputs).every(inp => inp.value);
                if (allFilled) {
                    setTimeout(() => verifyRecoveryCode(), 300);
                }
            });
            
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Backspace' && !e.target.value && index > 0) {
                    inputs[index - 1].focus();
                }
            });
        });
    }

    // Открыть восстановление
    openRecovery() {
        document.getElementById('authModal').style.display = 'none';
        document.getElementById('recoveryModal').style.display = 'flex';
        showRecoveryStep(1);
    }

    // Отправка кода восстановления
    async sendRecoveryCode() {
        const telegramInput = document.getElementById('recoveryTelegram');
        const telegram = telegramInput.value.trim();
        
        if (!telegram) {
            this.showError('Введите Telegram username');
            return;
        }
        
        const normalizedTelegram = telegram.startsWith('@') ? telegram : '@' + telegram;
        
        try {
            const response = await fetch('http://localhost:3000/api/auth/recovery-step1', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ telegram: normalizedTelegram })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Сохраняем данные для следующих шагов
                this.recoveryData = {
                    telegram: normalizedTelegram,
                    tempToken: data.tempToken
                };
                
                // Показываем шаг 2
                document.getElementById('recoveryUser').textContent = normalizedTelegram;
                showRecoveryStep(2);
                
                // Фокус на первое поле кода
                setTimeout(() => {
                    const inputs = document.querySelectorAll('.recovery-code-digit');
                    if (inputs[0]) inputs[0].focus();
                }, 100);
                
                this.showSuccess('Код отправлен в Telegram!');
            } else {
                this.showError(data.error || 'Пользователь не найден');
            }
        } catch (error) {
            console.error('Recovery error:', error);
            this.showError('Ошибка соединения с сервером');
        }
    }

    // Проверка кода
    async verifyRecoveryCode() {
        if (!this.recoveryData) return;
        
        const codeDigits = Array.from(document.querySelectorAll('.recovery-code-digit'))
            .map(input => input.value)
            .join('');
        
        if (codeDigits.length !== 6) {
            this.showError('Введите все 6 цифр кода');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:3000/api/auth/recovery-step2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tempToken: this.recoveryData.tempToken,
                    code: codeDigits
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Переходим к шагу 3 (смена пароля)
                showRecoveryStep(3);
                this.showSuccess('Код подтверждён! Теперь установите новый пароль.');
            } else {
                this.showError(data.error || 'Неверный код');
                // Подсвечиваем ошибку
                document.querySelectorAll('.recovery-code-digit').forEach(input => {
                    input.style.borderColor = '#ef4444';
                });
            }
        } catch (error) {
            console.error('Verify error:', error);
            this.showError('Ошибка проверки кода');
        }
    }

    // Установка нового пароля
    async setNewPassword() {
        if (!this.recoveryData) return;
        
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;
        
        if (!newPassword || !confirmPassword) {
            this.showError('Заполните все поля');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showError('Пароль должен быть не менее 6 символов');
            return;
        }
        
        if (newPassword !== confirmPassword) {
            this.showError('Пароли не совпадают');
            return;
        }
        
        try {
            const response = await fetch('http://localhost:3000/api/auth/recovery-step3', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tempToken: this.recoveryData.tempToken,
                    newPassword: newPassword
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showSuccess('Пароль успешно изменён! Теперь вы можете войти.');
                
                // Закрываем модалку и открываем вход
                setTimeout(() => {
                    closeRecoveryModal();
                    document.getElementById('authModal').style.display = 'flex';
                    document.getElementById('authTelegram').value = this.recoveryData.telegram;
                }, 1500);
            } else {
                this.showError(data.error || 'Ошибка смены пароля');
            }
        } catch (error) {
            console.error('Password change error:', error);
            this.showError('Ошибка смены пароля');
        }
    }

    // Вспомогательные функции
    showError(message) {
        alert('❌ ' + message);
    }

    showSuccess(message) {
        if (window.shop && shop.showNotification) {
            shop.showNotification('✅ ' + message);
        } else {
            alert('✅ ' + message);
        }
    }
}

// Глобальные функции для HTML
const telegramRecovery = new TelegramRecovery();

function openPasswordRecovery() {
    telegramRecovery.openRecovery();
}

function closeRecoveryModal() {
    document.getElementById('recoveryModal').style.display = 'none';
    // Сброс
    telegramRecovery.recoveryData = null;
    showRecoveryStep(1);
    
    // Очистка полей
    document.getElementById('recoveryTelegram').value = '';
    document.querySelectorAll('.recovery-code-digit').forEach(input => {
        input.value = '';
        input.style.borderColor = '';
    });
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
}

function showRecoveryStep(step) {
    [1, 2, 3].forEach(s => {
        document.getElementById(`recoveryStep${s}`).style.display = 'none';
    });
    document.getElementById(`recoveryStep${step}`).style.display = 'block';
}

function sendRecoveryCode() {
    telegramRecovery.sendRecoveryCode();
}

function verifyRecoveryCode() {
    telegramRecovery.verifyRecoveryCode();
}

function setNewPassword() {
    telegramRecovery.setNewPassword();
}

function resendRecoveryCode() {
    // Отправляем код повторно
    sendRecoveryCode();
    telegramRecovery.showSuccess('Новый код отправлен!');
}

function backToLogin() {
    closeRecoveryModal();
    document.getElementById('authModal').style.display = 'flex';
}