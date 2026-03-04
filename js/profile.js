class ProfilePage {
    constructor() {
        console.log('ProfilePage constructor started');
        
        // Даем время на загрузку
        setTimeout(() => {
            this.checkAuth();
        }, 100);
    }

    checkAuth() {
        console.log('Checking auth...');
        
        const userData = localStorage.getItem('currentUser');
        console.log('Current user from localStorage:', userData);
        
        if (!userData) {
            console.log('No user found, redirecting to index');
            alert('Сначала войдите в систему!');
            window.location.href = 'index.html';
            return;
        }

        try {
            this.currentUser = JSON.parse(userData);
            this.users = JSON.parse(localStorage.getItem('users')) || [];
            this.init();
        } catch (e) {
            console.error('Error parsing user data:', e);
            alert('Ошибка загрузки профиля');
            window.location.href = 'index.html';
        }
    }

    init() {
        console.log('Initializing profile page...');
        this.loadUserData();
        this.setupEventListeners();
        console.log('Profile page initialized successfully');
    }

    loadUserData() {
        console.log('Loading user data for:', this.currentUser.name);
        
        // Основная информация
        document.getElementById('userName').textContent = this.currentUser.name;
        document.getElementById('userEmail').textContent = this.currentUser.email;
        
        if (this.currentUser.registrationDate) {
            const regDate = new Date(this.currentUser.registrationDate);
            document.getElementById('userRegDate').textContent = regDate.toLocaleDateString('ru-RU');
        } else {
            document.getElementById('userRegDate').textContent = 'Не указана';
        }

        // Статистика
        const ordersCount = this.currentUser.orders ? this.currentUser.orders.length : 0;
        document.getElementById('ordersCount').textContent = ordersCount;
        
        // Для favoritesCount - либо убрать, либо заменить на что-то другое
        const favoritesCount = this.currentUser.favorites ? this.currentUser.favorites.length : 0;
        if (document.getElementById('favoritesCount')) {
            document.getElementById('favoritesCount').textContent = favoritesCount;
        }
        
        const totalSpent = this.currentUser.orders ? 
            this.currentUser.orders.reduce((sum, order) => sum + (order.total || 0), 0) : 0;
        document.getElementById('totalSpent').textContent = this.formatPrice(totalSpent);

        // Статус Gmail
        const statusElement = document.getElementById('userStatus');
        if (statusElement) {
            if (!this.currentUser.emailVerified) {
                statusElement.textContent = '✅ Подтвержден';
                statusElement.className = 'status-pending';
            } else {
                statusElement.textContent = '✅ Подтвержден';
                statusElement.className = 'status-verified';
            }
        }

        // Последние заказы
        this.renderRecentOrders();
    }

    renderRecentOrders() {
        const ordersList = document.getElementById('recentOrdersList');
        if (!ordersList) return;
        
        if (!this.currentUser.orders || this.currentUser.orders.length === 0) {
            ordersList.innerHTML = '<p class="empty">Заказов пока нет</p>';
            return;
        }

        const recentOrders = this.currentUser.orders.slice(-3).reverse();
        
        ordersList.innerHTML = recentOrders.map(order => `
            <div class="order-item-mini">
                <div class="order-header-mini">
                    <h4>Заказ #${order.id || 'N/A'}</h4>
                    <span class="order-date">${order.date ? new Date(order.date).toLocaleDateString('ru-RU') : 'Дата неизвестна'}</span>
                    </div>
                <div class="order-details-mini">
                    <span>${order.items ? order.items.length : 0} товар(ов)</span>
                    <span class="order-total-mini">${this.formatPrice(order.total || 0)}</span>
                </div>
                <div class="order-status-mini status-${order.status || 'pending'}">
                    ${this.getStatusText(order.status)}
                </div>
            </div>
        `).join('');
    }

    getStatusText(status) {
        const statuses = {
            'pending': 'В обработке',
            'shipped': 'Отправлен', 
            'delivered': 'Доставлен',
            'cancelled': 'Отменен'
        };
        return statuses[status] || 'В обработке';
    }

    formatPrice(price) {
        return price + ' $';
    }

    setupEventListeners() {
        console.log('Setting up event listeners...');
        
        // Форма смены пароля
        const passwordForm = document.getElementById('changePasswordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.changePassword();
            });
        }

        console.log('Event listeners setup complete');
    }

    changePassword() {
        if (!this.currentUser) return;

        const inputs = document.querySelectorAll('#changePasswordForm input[type="password"]');
        const currentPassword = inputs[0].value;
        const newPassword = inputs[1].value;
        const confirmPassword = inputs[2].value;

        // Проверка текущего пароля
        if (currentPassword !== this.currentUser.password) {
            alert('❌ Неверный текущий пароль');
            return;
        }

        // Проверка сложности
        if (newPassword.length < 6 || !/\d/.test(newPassword) || !/[a-zA-Z]/.test(newPassword)) {
            alert('❌ Новый пароль должен содержать: 6+ символов, цифры и буквы');
            return;
        }

        // Проверка совпадения
        if (newPassword !== confirmPassword) {
            alert('❌ Новые пароли не совпадают');
            return;
        }

        // Обновление пароля
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex].password = newPassword;
            this.currentUser.password = newPassword;
            
            localStorage.setItem('users', JSON.stringify(this.users));
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            
            alert('✅ Пароль успешно изменен!');
            closeChangePassword();
        }
    }
}

// Инициализация когда DOM загружен
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting profile page...');
    window.profilePage = new ProfilePage();
});

// Глобальные функции для модалок
function openChangePassword() {
    document.getElementById('passwordModal').style.display = 'flex';
}

function closeChangePassword() {
    document.getElementById('passwordModal').style.display = 'none';
    const form = document.getElementById('changePasswordForm');
    if (form) form.reset();
}