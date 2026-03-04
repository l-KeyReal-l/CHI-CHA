// config.js - ВСЕ настройки в одном месте
const CONFIG = {
    // Оставьте пустым, в реальном проекте будете получать с сервера
    GOOGLE_CLIENT_ID: '',
    TELEGRAM_BOT_TOKEN: 'ВАШ_ТОКЕН_БЕЗ_ТОГО_ЧТО_В_КОДЕ',
    PAYMENT_ADDRESSES: {
        BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        USDT: 'TBaquinK8a5qeeWwVQkYk6P4vqz1oHbdjz'
    }
};

// Экспортируем только нужное
window.SITE_CONFIG = Object.freeze({
    paymentAddresses: CONFIG.PAYMENT_ADDRESSES,
    version: '1.0.0'
});