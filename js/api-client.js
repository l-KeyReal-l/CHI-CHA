// api-client.js - УПРОЩЕННЫЙ КЛИЕНТ ДЛЯ БЭКЕНДА
class ApiClient {
    constructor() {
        this.baseUrl = 'http://localhost:3000/api';
         this.checkConnection();
    }
    

    async checkConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/test`);
            if (!response.ok) throw new Error('Сервер не отвечает');
            console.log('✅ Подключение к серверу установлено');
        } catch (error) {
            console.error('❌ Не удалось подключиться к серверу:', error.message);
            this.showConnectionError();
        }
    }


    showConnectionError() {
        // Можно показать уведомление пользователю
        if (typeof shop !== 'undefined' && shop.showNotification) {
            shop.showNotification('Сервер не отвечает. Проверьте подключение.', 'error');
        }
    }
    async sendPasswordRecovery(email) {
        try {
            const response = await fetch(`${this.baseUrl}/password/recovery`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Recovery error:', error);
            return { success: false, message: 'Ошибка соединения' };
        }
    }
    
    async verifyRecoveryCode(email, code) {
        try {
            const response = await fetch(`${this.baseUrl}/password/verify-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Verify error:', error);
            return { success: false, error: 'Ошибка соединения' };
        }
    }
    
    async saveOrder(orderData) {
        try {
            const response = await fetch(`${this.baseUrl}/orders/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(orderData)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Save order error:', error);
            return { success: false, error: 'Ошибка соединения' };
        }
    }
    
    async googleAuth(googleData) {
        try {
            const response = await fetch(`${this.baseUrl}/auth/simple-google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(googleData)
            });
            
            return await response.json();
        } catch (error) {
            console.error('Google auth error:', error);
            return { success: false, error: 'Ошибка соединения' };
        }
    }
}

// Глобальный инстанс
window.apiClient = new ApiClient();