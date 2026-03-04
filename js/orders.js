// orders.js - полная версия
class OrderManager {
    constructor() {
        this.baseUrl = 'http://localhost:8000'; // ← ИЗМЕНИТЕ С 3000 на 8000
        this.statuses = {
            'pending': 'Ожидает оплаты',
            'paid': 'Оплачен',
            'processing': 'В обработке',
            'shipped': 'Отправлен',
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
    }

    async init() {
        await this.checkAuth();
        await this.loadOrdersFromServer();
        this.renderAllOrders();
        this.setupEventListeners();
    }

    async checkAuth() {
        const token = localStorage.getItem('authToken');
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        
        if (!token || !user.id) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }

    async loadOrdersFromServer() {
        try {
            const token = localStorage.getItem('authToken');
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            
            if (!token || !user.id) return;

            // Загружаем заказы с вашего бэкенда
            const response = await fetch(
                `${this.baseUrl}/api/orders/user/${user.id}?token=${token}`,
                {
                    headers: {
                        'Accept': 'application/json'
                    }
                }
            );
            
            if (response.status === 401) {
                this.handleUnauthorized();
                return;
            }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.orders) {
                // Сохраняем заказы
                user.orders = result.orders;
                localStorage.setItem('currentUser', JSON.stringify(user));
                
                // Для совместимости со старым кодом
                localStorage.setItem('user_orders', JSON.stringify(result.orders));
            }
            
        } catch (error) {
            console.error('Ошибка загрузки заказов:', error);
            // Используем локальные данные
            const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
            if (!user.orders) {
                user.orders = JSON.parse(localStorage.getItem('user_orders') || '[]');
                localStorage.setItem('currentUser', JSON.stringify(user));
            }
        }
    }

    handleUnauthorized() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    renderAllOrders() {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const orders = user.orders || [];
        
        if (orders.length === 0) {
            this.showEmptyState();
            return;
        }
        
        this.renderCurrentOrders(orders);
        this.renderHistoryOrders(orders);
    }

    renderCurrentOrders(orders) {
        const container = document.getElementById('currentOrdersList');
        if (!container) return;

        const currentOrders = orders.filter(order => 
            order.status === 'pending' || 
            order.status === 'paid' ||
            order.status === 'processing' ||
            order.status === 'shipped'
        );

        if (currentOrders.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('current');
            return;
        }

        container.innerHTML = currentOrders.map(order => this.createOrderCard(order, 'current')).join('');
    }

    renderHistoryOrders(orders) {
        const container = document.getElementById('historyOrdersList');
        if (!container) return;

        const historyOrders = orders.filter(order => 
            order.status === 'delivered' || 
            order.status === 'cancelled'
        );

        if (historyOrders.length === 0) {
            container.innerHTML = this.getEmptyStateHTML('history');
            return;
        }

        container.innerHTML = historyOrders.map(order => this.createOrderCard(order, 'history')).join('');
    }

    createOrderCard(order, type = 'current') {
        const itemsTotal = order.items ? order.items.reduce((sum, item) => 
            sum + (item.price * item.quantity), 0) : 0;
        
        const orderDate = order.createdAt ? new Date(order.createdAt) : new Date();
        const formattedDate = orderDate.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        return `
            <div class="order-card" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-info">
                        <h3>Заказ #${order.id.replace('ORDER_', '')}</h3>
                        <span class="order-date">${formattedDate}</span>
                    </div>
                    <div class="order-status status-${order.status}">
                        ${this.getStatusText(order.status)}
                    </div>
                </div>
                
                ${order.items && order.items.length > 0 ? `
                    <div class="order-items">
                        ${order.items.slice(0, 3).map(item => `
                            <div class="order-item">
                                <img src="${item.image || 'images/purple.png'}" 
                                     alt="${item.name}"
                                     onerror="this.src='images/purple.png'">
                                <div class="item-info">
                                    <h4>${item.name}</h4>
                                    <span>${item.quantity} шт. × ${item.price}₽</span>
                                </div>
                                <div class="item-total">${item.price * item.quantity}₽</div>
                            </div>
                        `).join('')}
                        
                        ${order.items.length > 3 ? `
                            <div class="more-items">
                                +${order.items.length - 3} товаров
                            </div>
                        ` : ''}
                    </div>
                ` : ''}
                
                <div class="order-footer">
                    <div class="order-details">
                        <div class="shipping-info">
                            <p><strong>Получатель:</strong> ${order.shipping?.fullName || 'Не указан'}</p>
                            <p><strong>Телефон:</strong> ${order.shipping?.phone || 'Не указан'}</p>
                            ${type === 'current' && order.shipping?.address ? `
                                <p><strong>Адрес доставки:</strong> ${order.shipping.address}</p>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="order-summary">
                        <div class="order-total">
                            <span>Итого:</span>
                            <strong>${order.total || itemsTotal}₽</strong>
                        </div>
                        
                        ${type === 'current' ? this.getActionButtons(order) : ''}
                    </div>
                </div>
            </div>
        `;
    }

    getActionButtons(order) {
        const buttons = [];
        
        if (order.status === 'pending') {
            buttons.push(`
                <button onclick="orderManager.payOrder('${order.id}')" 
                        class="btn btn-primary">
                    💳 Оплатить заказ
                </button>
            `);
        }
        
        if (order.status === 'paid' || order.status === 'processing') {
            buttons.push(`
                <button onclick="orderManager.trackOrder('${order.id}')" 
                        class="btn btn-secondary">
                    🚚 Отследить
                </button>
            `);
        }
        
        if (order.status !== 'delivered' && order.status !== 'cancelled') {
            buttons.push(`
                <button onclick="orderManager.cancelOrder('${order.id}')" 
                        class="btn btn-danger">
                    ❌ Отменить
                </button>
            `);
        }
        
        return buttons.length > 0 ? 
            `<div class="order-actions">${buttons.join('')}</div>` : '';
    }

    async payOrder(orderId) {
        try {
            const token = localStorage.getItem('authToken');
            
            // Обновляем статус локально
            this.updateOrderStatus(orderId, 'paid');
            
            // Отправляем на сервер
            const response = await fetch(`${this.baseUrl}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'paid',
                    token: token
                })
            });
            
            if (response.ok) {
                this.showNotification('✅ Оплата подтверждена!');
                await this.loadOrdersFromServer();
                this.renderAllOrders();
            }
            
        } catch (error) {
            console.error('Ошибка оплаты:', error);
            this.showNotification('❌ Ошибка при оплате');
        }
    }

    async cancelOrder(orderId) {
        if (!confirm('Вы уверены, что хотите отменить заказ?')) return;
        
        try {
            const token = localStorage.getItem('authToken');
            
            // Обновляем статус локально
            this.updateOrderStatus(orderId, 'cancelled');
            
            // Отправляем на сервер
            const response = await fetch(`${this.baseUrl}/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    status: 'cancelled',
                    token: token
                })
            });
            
            if (response.ok) {
                this.showNotification('✅ Заказ отменен');
                await this.loadOrdersFromServer();
                this.renderAllOrders();
            }
            
        } catch (error) {
            console.error('Ошибка отмены:', error);
            this.showNotification('❌ Ошибка при отмене заказа');
        }
    }

    updateOrderStatus(orderId, newStatus) {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        if (!user.orders) return false;
        
        const orderIndex = user.orders.findIndex(o => o.id === orderId);
        if (orderIndex === -1) return false;
        
        user.orders[orderIndex].status = newStatus;
        user.orders[orderIndex].statusUpdated = new Date().toISOString();
        
        localStorage.setItem('currentUser', JSON.stringify(user));
        return true;
    }

    getStatusText(status) {
        const statusMap = {
            'pending': '⏳ Ожидает оплаты',
            'paid': '💰 Оплачен',
            'processing': '🔄 В обработке',
            'shipped': '🚚 Отправлен',
            'delivered': '✅ Доставлен',
            'cancelled': '❌ Отменен'
        };
        return statusMap[status] || status;
    }

    showEmptyState() {
        const containers = ['currentOrdersList', 'historyOrdersList'];
        containers.forEach(containerId => {
            const container = document.getElementById(containerId);
            if (container) {
                container.innerHTML = this.getEmptyStateHTML(
                    containerId.includes('current') ? 'current' : 'history'
                );
            }
        });
    }

    getEmptyStateHTML(type) {
        if (type === 'current') {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📦</div>
                    <h3>Нет активных заказов</h3>
                    <p>Ваши новые заказы появятся здесь</p>
                    <a href="index.html" class="btn btn-primary">Сделать заказ</a>
                </div>
            `;
        } else {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h3>История заказов пуста</h3>
                    <p>Здесь появятся завершенные заказы</p>
                </div>
            `;
        }
    }

    showNotification(message) {
        // Создаем уведомление
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    setupEventListeners() {
        // Обработчики для табов
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.getAttribute('onclick').match(/'(\w+)'/)[1];
                this.switchTab(tabName);
            });
        });
    }

    switchTab(tabName) {
        // Убираем активные классы
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Добавляем активные классы
        document.getElementById(`${tabName}-orders`)?.classList.add('active');
        event.target.classList.add('active');
        
        // Обновляем отображение если нужно
        if (tabName === 'wishlist') {
            // Загружаем избранное
            if (window.loadWishlist) loadWishlist();
        }
    }

    trackOrder(orderId) {
        alert(`Отслеживание заказа #${orderId}\nСвяжитесь с поддержкой для получения информации о доставке.`);
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.orderManager = new OrderManager();
    window.orderManager.init();
});

// Глобальные функции для кнопок
function payOrder(orderId) {
    if (window.orderManager) {
        window.orderManager.payOrder(orderId);
    }
}

function cancelOrder(orderId) {
    if (window.orderManager) {
        window.orderManager.cancelOrder(orderId);
    }
}