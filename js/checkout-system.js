// checkout-system.js - РАБОЧИЙ, СОВМЕСТИМЫЙ С SERVER-PROD.JS
class CheckoutSystem {
    constructor() {
        this.order = null;
        this.selectedPayment = null;
        this.baseUrl = 'http://localhost:8000';
        this.init();
    }

    init() {
        console.log('🚀 Checkout system initializing...');
        
        this.loadOrder();
        
        if (this.order && this.order.items) {
            console.log('✅ Order loaded:', this.order);
            this.renderOrderSummary();
            this.setupEventListeners();
        } else {
            console.error('❌ No order found');
            this.showError('Корзина пуста');
            setTimeout(() => window.location.href = 'index.html', 2000);
        }
    }

    loadOrder() {
        try {
            const orderData = sessionStorage.getItem('pendingOrder');
            if (orderData) {
                this.order = JSON.parse(orderData);
            }
        } catch (error) {
            console.error('Error loading order:', error);
        }
    }

    setupEventListeners() {
        // Выбор оплаты
        document.querySelectorAll('.payment-method').forEach(method => {
            method.addEventListener('click', (e) => {
                const methodType = e.currentTarget.dataset.method;
                this.selectPaymentMethod(methodType);
            });
        });

        // Кнопка подтверждения
        const confirmBtn = document.getElementById('confirmOrder');
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.processOrder());
        }

        // Выбор криптовалюты
        const cryptoSelect = document.getElementById('cryptoCurrency');
        if (cryptoSelect) {
            cryptoSelect.addEventListener('change', () => this.updateCryptoDetails());
        }
    }

    selectPaymentMethod(method) {
        this.selectedPayment = method;
        
        // Стили
        document.querySelectorAll('.payment-method').forEach(m => {
            m.classList.remove('selected');
        });
        document.querySelector(`[data-method="${method}"]`).classList.add('selected');
        
        // Детали
        this.showPaymentDetails(method);
    }

    showPaymentDetails(method) {
        const cryptoSection = document.getElementById('cryptoPayment');
        if (!cryptoSection) return;
        
        if (method === 'crypto') {
            cryptoSection.style.display = 'block';
            this.updateCryptoDetails();
        } else {
            cryptoSection.style.display = 'none';
        }
    }

    updateCryptoDetails() {
        const cryptoDetails = document.getElementById('cryptoDetails');
        if (!cryptoDetails) return;
        
        const currency = document.getElementById('cryptoCurrency')?.value || 'btc';
        const amount = this.order?.total || 0;
        
        // Простые курсы
        const rates = { btc: 45000, usdt: 1, ton: 2.5 };
        const cryptoAmount = (amount / rates[currency]).toFixed(8);
        
        // Адреса
        const addresses = {
            btc: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            usdt: 'TBaquinK8a5qeeWwVQkYk6P4vqz1oHbdjz',
            ton: 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'
        };
        
        cryptoDetails.innerHTML = `
            <div style="margin: 20px 0;">
                <p><strong>Отправьте:</strong></p>
                <div style="font-size: 24px; color: #b73ce7; font-weight: bold; margin: 10px 0;">
                    ${cryptoAmount} ${currency.toUpperCase()}
                </div>
                
                <p><strong>На адрес:</strong></p>
                <div style="background: #0f0f1a; padding: 12px; border-radius: 8px; margin: 10px 0; 
                           font-family: monospace; word-break: break-all; color: white;">
                    ${addresses[currency]}
                </div>
                
                <button onclick="copyToClipboard('${addresses[currency]}')" 
                        style="background: #3b82f6; color: white; border: none; padding: 10px 20px; 
                               border-radius: 6px; cursor: pointer; margin: 10px 0;">
                    📋 Копировать адрес
                </button>
                
                <p style="color: #f59e0b; margin-top: 15px; font-size: 14px;">
                    ⚠️ После оплаты напишите нам в Telegram с номером заказа
                </p>
            </div>
        `;
    }

    validateForm() {
        const fields = ['fullName', 'email', 'phone', 'address'];
        let valid = true;
        
        fields.forEach(field => {
            const el = document.getElementById(field);
            if (!el || !el.value.trim()) {
                el.style.borderColor = '#ef4444';
                valid = false;
            } else {
                el.style.borderColor = '';
            }
        });
        
        return valid;
    }

 async processOrder() {
    console.log('Processing order...');
    
    // 1. Проверка формы
    if (!this.validateForm()) {
        this.showError('Заполните все поля');
        return;
    }

    // 2. Проверка оплаты
    if (!this.selectedPayment) {
        this.showError('Выберите способ оплаты');
        return;
    }

    // 3. Получаем токен ИЗ localStorage (ПРАВИЛЬНЫЙ КЛЮЧ!)
    const token = localStorage.getItem('token');  // ← token, а не authToken!
    console.log('📱 Токен из localStorage:', token ? 'Есть' : 'Нет');
    
    if (!token) {
        this.showError('Войдите в систему!');
        window.location.href = 'index.html';
        return;
    }

    // 4. Подготовка данных
    const orderData = {
        items: this.order.items || [],
        total: this.order.total || 0,
        shipping: {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            address: document.getElementById('address').value,
            comment: document.getElementById('comment')?.value || ''
        }
        // Токен НЕ в теле, а в заголовке!
    };

    console.log('📤 Отправляю заказ:', orderData);

    // 5. Отправка на сервер с токеном В ЗАГОЛОВКЕ
    try {
        const response = await fetch(`${this.baseUrl}/api/orders/create`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`  // ← ТОКЕН В ЗАГОЛОВКЕ!
            },
            body: JSON.stringify(orderData)
        });

        console.log('📥 Статус ответа:', response.status);
        
        const result = await response.json();
        console.log('📥 Тело ответа:', result);
        
        if (response.ok && result.success) {
            // 6. Успех - сохраняем заказ
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (!user.orders) user.orders = [];
            
            user.orders.unshift({
                id: result.orderId,
                items: orderData.items,
                total: orderData.total,
                shipping: orderData.shipping,
                status: 'pending',
                createdAt: new Date().toISOString()
            });
            
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // 7. Очищаем корзину
            localStorage.removeItem('cart');
            sessionStorage.removeItem('pendingOrder');
            
            // 8. Показываем успех
            this.showSuccess(result.orderId);
        } else {
            throw new Error(result.error || 'Ошибка создания заказа');
        }
        
    } catch (error) {
        console.error('❌ Ошибка:', error);
        this.showError(error.message || 'Нет связи с сервером');
    }
}

    showSuccess(orderId) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.9); display: flex; align-items: center;
            justify-content: center; z-index: 10000; animation: fadeIn 0.3s ease;
        `;
        
        modal.innerHTML = `
            <div style="background: #1a1a2e; padding: 40px; border-radius: 12px; 
                       border: 2px solid #b73ce7; max-width: 500px; text-align: center;">
                <div style="font-size: 60px; margin-bottom: 20px;">🎉</div>
                <h2 style="color: white; margin-bottom: 10px;">Заказ оформлен!</h2>
                <p style="color: #cbd5e1; margin-bottom: 20px;">
                    Номер заказа: <strong style="color: #b73ce7;">${orderId}</strong>
                </p>
                
                <p style="color: #10b981; margin-bottom: 25px;">
                    ✅ Заказ отправлен администратору в Telegram
                </p>
                
                <p style="color: #f59e0b; margin-bottom: 25px; font-size: 14px;">
                    📱 Мы свяжемся с вами для подтверждения оплаты
                </p>
                
                <div style="margin-top: 30px; display: flex; gap: 10px; justify-content: center;">
                    <button onclick="window.location.href='orders.html'"
                            style="background: #b73ce7; color: white; border: none;
                                   padding: 12px 24px; border-radius: 8px; cursor: pointer;
                                   font-size: 16px; min-width: 150px;">
                        📦 Мои заказы
                    </button>
                    <button onclick="window.location.href='index.html'"
                            style="background: #2d3748; color: white; border: none;
                                   padding: 12px 24px; border-radius: 8px; cursor: pointer;
                                   font-size: 16px; min-width: 150px;">
                        🛍️ В магазин
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    showError(message) {
        // Красивое уведомление
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: #ef4444; color: white; padding: 12px 20px;
            border-radius: 8px; z-index: 9999; animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(239,68,68,0.3);
        `;
        notification.innerHTML = `❌ ${message}`;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    renderOrderSummary() {
        const itemsContainer = document.getElementById('orderItems');
        const totalContainer = document.getElementById('orderTotal');
        
        if (itemsContainer && this.order.items) {
            itemsContainer.innerHTML = this.order.items.map(item => `
                <div class="order-item">
                    <img src="${item.image || 'images/purple.png'}" 
                         style="width: 60px; height: 60px; object-fit: contain; border-radius: 8px;">
                    <div style="flex: 1;">
                        <div style="font-weight: 500; color: white;">${item.name}</div>
                        <div style="color: #cbd5e1; font-size: 14px;">
                            ${item.quantity} × ${item.price}$
                        </div>
                    </div>
                    <div style="font-weight: bold; color: #b73ce7; font-size: 18px;">
                        ${item.price * item.quantity}$
                    </div>
                </div>
            `).join('');
        }
        
        if (totalContainer && this.order.items) {
            const total = this.order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            this.order.total = total;
            totalContainer.textContent = `Итого: ${total}$`;
        }
    }
    saveOrderToLocalStorage(orderId, orderData) {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const token = localStorage.getItem('authToken');
    
    if (!user.id || !token) return;
    
    // Создаем объект заказа
    const order = {
        id: orderId,
        items: orderData.items,
        total: orderData.total,
        shipping: orderData.shipping,
        status: 'pending',
        created_at: new Date().toISOString()
    };
    
    // Инициализируем массив заказов если его нет
    if (!user.orders) user.orders = [];
    
    // Добавляем заказ в начало массива
    user.orders.unshift(order);
    
    // Сохраняем обновленного пользователя
    localStorage.setItem('currentUser', JSON.stringify(user));
}
}

// Глобальная функция для копирования
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: #10b981; color: white; padding: 10px 15px;
            border-radius: 6px; z-index: 9999; font-size: 14px;
        `;
        notification.textContent = '✅ Адрес скопирован!';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    });
}

// Запускаем когда DOM готов
document.addEventListener('DOMContentLoaded', () => {
    window.checkoutSystem = new CheckoutSystem();
});