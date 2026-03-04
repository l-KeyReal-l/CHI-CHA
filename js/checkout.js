class SimpleCheckout {
    constructor() {
        this.methods = ['crypto', 'telegram'];
    }
    
    process(order) {
        // Только 2 метода: крипта или telegram
        return {
            success: true,
            orderId: 'ORDER_' + Date.now(),
            instructions: this.getInstructions(order.method)
        };
    }
    
    getInstructions(method) {
        if (method === 'crypto') {
            return `Оплатите на адрес: ${window.SITE_CONFIG.paymentAddresses.BTC}`;
        }
        return `Напишите в Telegram: @ваш_магазин`;
    }
}