class Analytics {
    constructor() {
        this.events = JSON.parse(localStorage.getItem('analytics')) || [];
    }

    // Исправленный метод track()
track(event, data = {}) {
    let userStatus = 'guest';
    try {
        const userData = localStorage.getItem('currentUser');
        if (userData && userData !== 'null' && userData !== 'undefined') {
            userStatus = 'logged_in';
        }
    } catch (e) {
        console.error('Error reading user data:', e);
    }

    const eventData = {
        event,
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        user: userStatus,
        ...data
    };

    this.events.push(eventData);
    localStorage.setItem('analytics', JSON.stringify(this.events));
    
    // Лимитируем размер
    if (this.events.length > 1000) {
        this.events = this.events.slice(-500);
        localStorage.setItem('analytics', JSON.stringify(this.events));
    }
}

    // Трекинг просмотров товаров
    trackProductView(productId) {
        this.track('product_view', { product_id: productId });
    }

    // Трекинг добавления в корзину
    trackAddToCart(productId) {
        this.track('add_to_cart', { product_id: productId });
    }

    // Трекинг покупок
    trackPurchase(order) {
        this.track('purchase', { 
            order_id: order.id,
            total: order.total,
            items_count: order.items.length 
        });
    }
}

const analytics = new Analytics();

// Интеграция с существующим кодом
// В app.js в метод addToCart добавь:
// analytics.trackAddToCart(productId);

// В метод quickView добавь:
// analytics.trackProductView(productId);

// В метод checkout добавь:
// analytics.trackPurchase(order);