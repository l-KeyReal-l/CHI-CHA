// Создай файл js/auto-translate.js
class AutoTranslator {
    constructor() {
        this.currentLang = localStorage.getItem('language') || 'ru';
        this.translations = translations; // из translations.js
        this.init();
    }

    init() {
        this.translatePage();
        this.setupLanguageSwitcher();
    }

    translatePage() {
        // 1. Все элементы с data-i18n
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (this.translations[this.currentLang] && this.translations[this.currentLang][key]) {
                el.textContent = this.translations[this.currentLang][key];
            }
        });

        // 2. Плейсхолдеры
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (this.translations[this.currentLang] && this.translations[this.currentLang][key]) {
                el.placeholder = this.translations[this.currentLang][key];
            }
        });

        // 3. Alt текст
        document.querySelectorAll('[data-i18n-alt]').forEach(el => {
            const key = el.getAttribute('data-i18n-alt');
            if (this.translations[this.currentLang] && this.translations[this.currentLang][key]) {
                el.alt = this.translations[this.currentLang][key];
            }
        });

        // 4. Title атрибуты
        document.querySelectorAll('[data-i18n-title]').forEach(el => {
            const key = el.getAttribute('data-i18n-title');
            if (this.translations[this.currentLang] && this.translations[this.currentLang][key]) {
                el.title = this.translations[this.currentLang][key];
            }
        });

        console.log('🌍 Page translated to:', this.currentLang);
    }

    setupLanguageSwitcher() {
        const langSelect = document.getElementById('languageSelect');
        if (langSelect) {
            langSelect.value = this.currentLang;
            langSelect.addEventListener('change', (e) => {
                this.currentLang = e.target.value;
                localStorage.setItem('language', this.currentLang);
                this.translatePage();
                
                // Обновляем магазин если есть
                if (window.shop) {
                    shop.changeLanguage(this.currentLang);
                }
            });
        }
    }
}

// Запускаем при загрузке
document.addEventListener('DOMContentLoaded', function() {
    window.translator = new AutoTranslator();
});