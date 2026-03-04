// products.js - ЕДИНСТВЕННЫЙ файл с товарами
window.products = [
    {
        id: 1,
        name: "Vape Pro 2000",
        price: 67,
        category: "vape",
        brand: "VapeMaster",
        image: "images/purple.png",
        description: "Современная электронная сигарета",
        badges: ["new", "popular"],
        inStock: true  // Добавлено
    },
    {
        id: 2,
        name: "Fruit Mix Liquid",
        price: 100,
        category: "liquid",
        brand: "JuiceBox",
        image: "images/KEY REAL.jpg",
        description: "Фруктовая смесь",
        badges: ["sale"],
        inStock: true  // Добавлено
    },
    {
        id: 3,
        name: "Power Mod X",
        price: 1,
        category: "mod",
        brand: "VapeTech",
        image: "images/KEY REAL.jpg",
        description: "Мощный мод с регулируемой мощностью",
        badges: ["new"],
        inStock: true  // Добавлено
    },
    {
        id: 4,
        name: "Cloud Atomizer",
        price: 1,
        category: "atomizer",
        brand: "CloudMaster",
        image: "images/KEY REAL.jpg",
        description: "Атомайзер для плотного пара",
        badges: [],
        inStock: true  // Добавлено
    },
    {
        id: 5,
        name: "Starter Kit Basic",
        price: 1,
        category: "vape",
        brand: "VapeMaster",
        image: "images/purple.png",
        description: "Набор для начинающих",
        badges: ["sale"],
        inStock: true  // Добавлено
    },
    {
        id: 6,
        name: "Menthol Ice Liquid",
        price: 1,
        category: "liquid",
        brand: "IceFlow",
        image: "images/key.jpg",
        description: "Освежающий ментол с ледяным эффектом",
        badges: [],
        inStock: false  //ne Добавлено
    },
    {
        id: 7,
        name: "Advanced Mod Pro",
        price: 1,
        category: "mod",
        brand: "VapeTech",
        image: "images/purple.png",
        description: "Профессиональный мод с расширенными настройками",
        badges: ["new"],
        inStock: true  // Добавлено
    },
    {
        id: 8,
        name: "Charging Cable",
        price: 1,
        category: "accessory",
        brand: "VapeMaster",
        image: "images/purple.png",
        description: "USB кабель для зарядки",
        badges: [],
        inStock: true  // Добавлено
    },
    {
        id: 9,
        name: "Premium Liquid Pack",
        price: 1,
        category: "liquid",
        brand: "JuiceBox",
        image: "images/purple.png",
        description: "Набор премиальных жидкостей",
        badges: ["new"],
        inStock: true  // Добавлено

    },
    {
        id: 10,
        name: "Vape Case",
        price: 1,
        category: "accessory",
        brand: "VapeMaster",
        image: "images/purple.png",
        description: "Чехол для переноски",
        badges: [],
        inStock: true  // Добавлено
    },
    {
        id: 11,
        name: "Vape Case",
        price: 11,
        category: "accessory",
        brand: "VapeMaster",
        image: "images/purple.png",
        description: "Чехол для переноски",
        badges: [],
        inStock: true  // Добавлено
    },
    
];
if (FORCE_UPDATE || !localStorage.getItem('products')) {
    // ЕСЛИ ХОЧЕМ ОБНОВИТЬ ИЛИ localStorage ПУСТОЙ
    console.log('🔄 ЗАГРУЖАЕМ ИЗ ФАЙЛА');
    window.products = defaultProducts;
    localStorage.setItem('products', JSON.stringify(defaultProducts));
} else {
    // ИНАЧЕ берем из localStorage
    console.log('📦 БЕРЕМ ИЗ localStorage');
    window.products = JSON.parse(localStorage.getItem('products'));
}

console.log('✅ Товаров загружено:', window.products.length);