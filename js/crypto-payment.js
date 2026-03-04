// crypto-payment.js - Система оплаты криптовалютой и Telegram
class CryptoPaymentSystem {
    constructor() {
        this.cryptoAddresses = {
            btc: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
            eth: '0x742d35Cc6634C0532925a3b844Bc9e90F90B7b10',
            usdt: 'TBaquinK8a5qeeWwVQkYk6P4vqz1oHbdjz',
            ton: 'EQCD39VS5jcptHL8vMjEXrzGaRcCVYto7HUn4bpAOg8xqB2N'
        };
        
        this.telegramBot = '@your_shop_bot';
        this.pendingPayments = JSON.parse(localStorage.getItem('pending_payments')) || {};
        this.init();
    }

    init() {
        this.setupPaymentListeners();
        this.checkPendingPayments();
    }

    setupPaymentListeners() {
        document.addEventListener('paymentSelected', (e) => {
            if (e.detail.method === 'crypto') {
                this.showCryptoPaymentInterface(e.detail.amount, e.detail.orderId);
            } else if (e.detail.method === 'telegram') {
                this.showTelegramPaymentInterface(e.detail.amount, e.detail.orderId);
            }
        });
    }

    showCryptoPaymentInterface(amount, orderId) {
        const modalContent = `
            <div class="crypto-payment-modal">
                <div class="payment-header">
                    <h3>Оплата криптовалютой</h3>
                    <p>Выберите криптовалюту для оплаты ${amount}$</p>
                </div>

                <div class="crypto-options">
                    ${Object.entries(this.cryptoAddresses).map(([coin, address]) => `
                        <div class="crypto-option" data-coin="${coin}">
                            <div class="coin-icon">${this.getCoinIcon(coin)}</div>
                            <div class="coin-info">
                                <h4>${this.getCoinName(coin)}</h4>
                                <p>${this.calculateCryptoAmount(coin, amount)} ${coin.toUpperCase()}</p>
                            </div>
                        </div>
                    `).join('')}
                </div>

                <div class="payment-instructions">
                    <h4>Инструкция по оплате:</h4>
                    <ol>
                        <li>Выберите криптовалюту выше</li>
                        <li>Скопируйте адрес кошелька</li>
                        <li>Отправьте точную сумму на указанный адрес</li>
                        <li>После отправки нажмите "Я оплатил"</li>
                        <li>Отправьте хеш транзакции для подтверждения</li>
                    </ol>
                </div>

                <div class="payment-actions">
                    <button class="btn btn-secondary" onclick="window.cryptoPayment.copyAddress()">
                        Копировать адрес
                    </button>
                    <button class="btn btn-primary" onclick="window.cryptoPayment.markAsPaid('${orderId}')">
                        Я оплатил
                    </button>
                </div>
            </div>
        `;

        this.showModal(modalContent);
    }

    showTelegramPaymentInterface(amount, orderId) {
        const orderData = JSON.parse(sessionStorage.getItem('pendingOrder') || '{}');
        const message = encodeURIComponent(
            `Запрос на оплату заказа #${orderId}\n\n` +
            `Сумма: ${amount}$\n` +
            `Товары: ${orderData.items?.map(i => `${i.name} × ${i.quantity}`).join(', ')}\n` +
            `Ссылка на заказ: ${window.location.href}`
        );

        const modalContent = `
            <div class="telegram-payment-modal">
                <div class="payment-header">
                    <h3>Оплата через Telegram</h3>
                    <p>Свяжитесь с нашим менеджером для обсуждения оплаты</p>
                </div>

                <div class="telegram-info">
                    <div class="telegram-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="#0088cc">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 00-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.4-1.08.39-.36-.01-1.04-.2-1.55-.37-.63-.2-1.13-.31-1.09-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.36-1.36 3.74-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z"/>
                        </svg>
                    </div>
                    
                    <div class="order-summary">
                        <h4>Данные вашего заказа:</h4>
                        <div class="order-details">
                            <p><strong>Номер заказа:</strong> ${orderId}</p>
                            <p><strong>Сумма:</strong> ${amount}$</p>
                            <p><strong>Статус:</strong> Ожидает оплаты</p>
                        </div>
                    </div>
                </div>

                <div class="telegram-actions">
                    <a href="https://t.me/${this.telegramBot}?start=${orderId}" 
                       target="_blank" 
                       class="btn btn-primary telegram-btn">
                        <svg width="20" height="20" fill="currentColor" style="margin-right: 8px;">
                            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
                        </svg>
                        Написать в Telegram
                    </a>
                    
                    <button class="btn btn-secondary" onclick="window.cryptoPayment.saveOrderForLater('${orderId}')">
                        Сохранить заказ
                    </button>
                </div>

                <div class="telegram-instructions">
                    <h5>Как это работает:</h5>
                    <ul>
                        <li>Нажмите "Написать в Telegram"</li>
                        <li>Обсудите с менеджером удобный способ оплаты</li>
                        <li>Получите реквизиты для оплаты</li>
                        <li>После оплаты отправьте чек менеджеру</li>
                        <li>Получите подтверждение заказа</li>
                    </ul>
                </div>
            </div>
        `;

        this.showModal(modalContent);
    }

    getCoinIcon(coin) {
        const icons = {
            btc: '₿',
            eth: 'Ξ',
            usdt: '💵',
            ton: '⚡'
        };
        return icons[coin] || '₿';
    }

    getCoinName(coin) {
        const names = {
            btc: 'Bitcoin',
            eth: 'Ethereum',
            usdt: 'USDT (TRC-20)',
            ton: 'TON'
        };
        return names[coin] || coin.toUpperCase();
    }

    calculateCryptoAmount(coin, usdAmount) {
        const rates = {
            btc: 45000,
            eth: 3000,
            usdt: 1,
            ton: 2.5
        };
        return (usdAmount / rates[coin]).toFixed(8);
    }

    copyAddress() {
        const selectedCoin = document.querySelector('.crypto-option.selected')?.dataset.coin;
        if (!selectedCoin) {
            alert('Сначала выберите криптовалюту');
            return;
        }

        const address = this.cryptoAddresses[selectedCoin];
        navigator.clipboard.writeText(address).then(() => {
            this.showNotification('Адрес скопирован в буфер обмена');
        });
    }

    markAsPaid(orderId) {
        const transactionHash = prompt('Введите хеш транзакции (если нет, оставьте пустым):');
        
        this.pendingPayments[orderId] = {
            status: 'pending_confirmation',
            transactionHash: transactionHash || null,
            timestamp: Date.now()
        };
        
        localStorage.setItem('pending_payments', JSON.stringify(this.pendingPayments));
        
        this.showNotification('Оплата подтверждена. Мы проверим транзакцию и свяжемся с вами.');
        
        // Отправляем уведомление в Telegram (в реальном проекте через API)
        this.notifyTelegramAboutPayment(orderId, transactionHash);
        
        this.closeModal();
    }

    saveOrderForLater(orderId) {
        const savedOrders = JSON.parse(localStorage.getItem('saved_orders') || '[]');
        const orderData = JSON.parse(sessionStorage.getItem('pendingOrder') || '{}');
        
        savedOrders.push({
            id: orderId,
            data: orderData,
            savedAt: Date.now()
        });
        
        localStorage.setItem('saved_orders', JSON.stringify(savedOrders));
        this.showNotification('Заказ сохранен. Вы можете оплатить его позже в разделе "Мои заказы"');
        this.closeModal();
    }

    notifyTelegramAboutPayment(orderId, transactionHash) {
        // В реальном проекте это будет API вызов
        console.log('Payment notification:', { orderId, transactionHash });
        
        fetch('/api/notify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ orderId, transactionHash })
        }).catch(err => console.error('Notification error:', err));
    }

    checkPendingPayments() {
        // Проверяем статусы платежей каждые 30 секунд
        setInterval(() => {
            for (const [orderId, payment] of Object.entries(this.pendingPayments)) {
                if (payment.status === 'pending_confirmation' && 
                    Date.now() - payment.timestamp > 300000) { // 5 минут
                    this.verifyPaymentStatus(orderId);
                }
            }
        }, 30000);
    }

    verifyPaymentStatus(orderId) {
        // Проверяем статус платежа через API блокчейна
        fetch(`/api/verify-payment/${orderId}`)
            .then(res => res.json())
            .then(data => {
                if (data.confirmed) {
                    this.pendingPayments[orderId].status = 'confirmed';
                    localStorage.setItem('pending_payments', JSON.stringify(this.pendingPayments));
                    this.showNotification(`Платеж по заказу #${orderId} подтвержден!`);
                }
            })
            .catch(console.error);
    }

    showModal(content) {
        const modal = document.createElement('div');
        modal.className = 'payment-modal-backdrop';
        modal.innerHTML = `
            <div class="payment-modal">
                <button class="close-btn" onclick="window.cryptoPayment.closeModal()">×</button>
                ${content}
            </div>
        `;
        document.body.appendChild(modal);
    }

    closeModal() {
        const modal = document.querySelector('.payment-modal-backdrop');
        if (modal) modal.remove();
    }

    showNotification(message) {
        if (window.shop && shop.showNotification) {
            shop.showNotification(message);
        } else {
            alert(message);
        }
    }
}

// Инициализация системы
window.cryptoPayment = new CryptoPaymentSystem();