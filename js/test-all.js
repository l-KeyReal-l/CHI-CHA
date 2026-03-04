// test.js - тестируем все компоненты
const axios = require('axios');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api';

async function testAll() {
    console.log('🧪 Тестирование ChichaShop Backend\n');
    
    try {
        // 1. Проверка сервера
        console.log('1. Проверка сервера...');
        const health = await axios.get(`${BASE_URL}/test`);
        console.log('✅ Сервер:', health.data);
        
        // 2. Тест восстановления пароля
        console.log('\n2. Тест восстановления пароля...');
        const testEmail = 'test@example.com';
        const recoveryRes = await axios.post(`${BASE_URL}/password/recovery`, {
            email: testEmail
        });
        console.log('✅ Recovery:', recoveryRes.data.message);
        
        // 3. Тест Google OAuth
        console.log('\n3. Тест Google OAuth...');
        if (process.env.GOOGLE_CLIENT_ID) {
            const googleUrl = await axios.get(`${BASE_URL}/auth/google/url`);
            console.log('✅ Google URL готов:', googleUrl.data.url ? 'да' : 'нет');
        } else {
            console.log('⚠️ Google OAuth не настроен');
        }
        
        // 4. Тест сохранения заказа
        console.log('\n4. Тест сохранения заказа...');
        const testOrder = {
            user: { id: 'test_user', name: 'Тестовый пользователь', email: 'test@example.com' },
            items: [{ id: 1, name: 'Тестовый товар', price: 100, quantity: 1 }],
            total: 100,
            shipping: {
                fullName: 'Иванов Иван',
                email: 'test@example.com',
                phone: '+79999999999',
                address: 'Тестовый адрес'
            },
            payment: { method: 'crypto' }
        };
        
        const orderRes = await axios.post(`${BASE_URL}/orders/save`, testOrder);
        console.log('✅ Заказ сохранен:', orderRes.data.orderId);
        
        console.log('\n🎉 Все тесты пройдены успешно!');
        
    } catch (error) {
        console.error('\n❌ Ошибка тестирования:', error.message);
        if (error.response) {
            console.error('Детали:', error.response.data);
        }
    }
}

testAll();