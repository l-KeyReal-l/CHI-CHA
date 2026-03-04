class ErrorHandler {
    constructor() {
        this.init();
    }

    init() {
        window.addEventListener('online', () => this.hideOfflineMessage());
        window.addEventListener('offline', () => this.showOfflineMessage());
        
        if (!navigator.onLine) {
            this.showOfflineMessage();
        }
    }

    showOfflineMessage() {
        if (document.querySelector('.offline-message')) return;
        
        const offlineHTML = `
            <div class="offline-message">
                <div class="offline-content">
                    <div class="offline-icon">📡</div>
                    <h3>Нет соединения с интернетом</h3>
                    <p>Проверьте подключение к сети и попробуйте снова</p>
                    <button onclick="location.reload()" class="btn btn-primary">Обновить страницу</button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', offlineHTML);
    }

    hideOfflineMessage() {
        const offlineMsg = document.querySelector('.offline-message');
        if (offlineMsg) {
            offlineMsg.remove();
        }
    }
}

const errorHandler = new ErrorHandler();
