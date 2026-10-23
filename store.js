/**
 * store.js — Global State Management
 * Handles: cart, wishlist, user session, product data
 */

'use strict';

const MarkusStore = (() => {

  /* ================================================================
     PRODUCT DATABASE (Mock — replace with API calls)
     ================================================================ */
  const PRODUCTS = [
    {
      id: 'elec-001', category: 'electronics', brand: 'Markus Kits',
      name: 'Arduino Uno Starter Kit with 30+ Components',
      price: 899, originalPrice: 1499, discount: 40,
      rating: 4.7, reviewCount: 312,
      stock: 150, gstPercent: 18,
      hsn: '8537', gstCategory: 'Electronic Components',
      badges: ['bestseller'], emoji: '⚡',
      tags: ['arduino', 'starter', 'electronics', 'kit'],
      description: 'Complete Arduino Uno kit with breadboard, LEDs, resistors, sensors, and full assembly guide video.',
      specs: { 'Microcontroller': 'ATmega328P', 'Voltage': '5V', 'Digital I/O': '14', 'Components': '30+' }
    },
    {
      id: 'elec-002', category: 'electronics', brand: 'Markus Kits',
      name: 'ESP32 WiFi + Bluetooth IoT Development Kit',
      price: 649, originalPrice: 999, discount: 35,
      rating: 4.8, reviewCount: 198,
      stock: 80, gstPercent: 18,
      hsn: '8471', gstCategory: 'Electronic Components',
      badges: ['new'], emoji: '📡',
      tags: ['esp32', 'iot', 'wifi', 'bluetooth'],
      description: 'ESP32 development board with sensors, OLED display, and complete IoT project guide.',
      specs: { 'WiFi': '802.11 b/g/n', 'Bluetooth': '4.2/BLE', 'RAM': '520KB', 'Flash': '4MB' }
    },
    {
      id: 'elec-003', category: 'electronics', brand: 'Markus Kits',
      name: 'Raspberry Pi 4B Complete Starter Kit 4GB',
      price: 5499, originalPrice: 6999, discount: 21,
      rating: 4.9, reviewCount: 521,
      stock: 25, gstPercent: 18,
      hsn: '8471', gstCategory: 'Single Board Computer',
      badges: ['hot'], emoji: '🖥️',
      tags: ['raspberry pi', 'linux', 'sbc'],
      description: 'Complete RPi 4 4GB kit with case, power supply, SD card pre-loaded with Raspberry Pi OS.',
      specs: { 'CPU': 'Cortex-A72 1.8GHz', 'RAM': '4GB', 'USB': '2x USB 3.0', 'Display': 'Dual 4K HDMI' }
    },
    {
      id: 'robot-001', category: 'robotics', brand: 'Markus Robo',
      name: 'Desk Robo — 6-DOF Desktop Robotic Arm Kit',
      price: 2499, originalPrice: 3999, discount: 38,
      rating: 4.9, reviewCount: 284,
      stock: 50, gstPercent: 18,
      hsn: '8479', gstCategory: 'Robotic Kit',
      badges: ['bestseller'], emoji: '🦾',
      tags: ['robot', 'arm', 'arduino', 'diy'],
      description: 'Build your own 6-DOF desktop robotic arm. Arduino-powered with full assembly video guide.',
      specs: { 'Degrees of Freedom': '6-DOF', 'Controller': 'Arduino Nano', 'Servos': '6x MG996R', 'Payload': '200g' }
    },
    {
      id: 'robot-002', category: 'robotics', brand: 'Markus Robo',
      name: 'Octa Robo — 8-Leg Spider Robot Kit',
      price: 3299, originalPrice: 4999, discount: 34,
      rating: 4.8, reviewCount: 156,
      stock: 30, gstPercent: 18,
      hsn: '8479', gstCategory: 'Robotic Kit',
      badges: ['new'], emoji: '🕷️',
      tags: ['robot', 'spider', 'bluetooth', 'servo'],
      description: 'Build an 8-legged spider robot with Bluetooth app control. Complete DIY kit with instructional video.',
      specs: { 'Legs': '8', 'Servos': '16x SG90', 'Controller': 'ESP32', 'Control': 'Bluetooth App' }
    },
    {
      id: 'robot-003', category: 'robotics', brand: 'Markus Robo',
      name: 'Mini Racing Drone Kit — DIY Build & Fly',
      price: 4299, originalPrice: 6499, discount: 34,
      rating: 4.6, reviewCount: 89,
      stock: 20, gstPercent: 18,
      hsn: '8806', gstCategory: 'Unmanned Aircraft',
      badges: ['hot'], emoji: '🚁',
      tags: ['drone', 'racing', 'fpv', 'diy'],
      description: 'Build your own racing drone from scratch. Includes frame, motors, ESCs, flight controller, and goggles.',
      specs: { 'Frame': '210mm', 'Motors': '2204 2300KV', 'Flight Time': '10-12 min', 'Range': '500m' }
    },
    {
      id: 'print-001', category: '3dprint', brand: 'Markus Print',
      name: 'Custom 3D Printed Enclosure — Any Design',
      price: 299, originalPrice: 499, discount: 40,
      rating: 4.7, reviewCount: 445,
      stock: 999, gstPercent: 18,
      hsn: '3926', gstCategory: '3D Printed Parts',
      badges: ['new'], emoji: '🖨️',
      tags: ['3d print', 'custom', 'enclosure', 'pla'],
      description: 'Upload your STL file and get a precision 3D printed part. PLA/ABS/PETG options. Pan-India shipping.',
      specs: { 'Material': 'PLA / ABS / PETG', 'Layer': '0.2mm', 'Infill': 'Custom', 'Color': '20+ options' }
    },
    {
      id: 'laptop-001', category: 'laptops', brand: 'Certified Refurbished',
      name: 'Dell Latitude E7480 — i5 7th Gen, 8GB, 256GB SSD',
      price: 16999, originalPrice: 25000, discount: 32,
      rating: 4.5, reviewCount: 203,
      stock: 8, gstPercent: 12,
      hsn: '8471', gstCategory: 'Laptop Computer',
      badges: ['limited'], emoji: '💻',
      tags: ['laptop', 'dell', 'i5', 'refurbished'],
      description: 'Certified refurbished Dell Latitude. Tested, cleaned, Windows 11 Pro installed. 6-month warranty.',
      specs: { 'CPU': 'Intel i5-7300U', 'RAM': '8GB DDR4', 'SSD': '256GB', 'Display': '14" FHD', 'OS': 'Windows 11 Pro' }
    },
    {
      id: 'fashion-001', category: 'fashion', brand: 'Markus Style',
      name: 'Maker Culture Oversized Hoodie — Circuit Print',
      price: 799, originalPrice: 1299, discount: 38,
      rating: 4.6, reviewCount: 167,
      stock: 200, gstPercent: 5,
      hsn: '6110', gstCategory: 'Apparel',
      badges: ['new'], emoji: '👕',
      tags: ['hoodie', 'maker', 'fashion', 'circuit'],
      description: 'Soft cotton-blend hoodie with glow-in-dark circuit board print. Perfect for makers and geeks.',
      specs: { 'Material': '80% Cotton 20% Polyester', 'Fit': 'Oversized', 'Print': 'Glow in Dark', 'Sizes': 'S-3XL' }
    },
    {
      id: 'decor-001', category: 'homedecor', brand: 'Markus Home',
      name: 'LED Circuit Board Desk Lamp — Warm White',
      price: 1299, originalPrice: 1999, discount: 35,
      rating: 4.8, reviewCount: 312,
      stock: 75, gstPercent: 18,
      hsn: '9405', gstCategory: 'Lamps & Lighting',
      badges: ['bestseller'], emoji: '💡',
      tags: ['lamp', 'led', 'desk', 'decor', 'circuit'],
      description: 'Unique circuit-board-inspired desk lamp with warm/cool white modes. USB-powered, touch control.',
      specs: { 'Power': '10W LED', 'Color Temp': '3000K/6500K', 'Input': 'USB-C 5V', 'Modes': '3 brightness' }
    },
    {
      id: 'pcb-001', category: 'gerber', brand: 'Markus PCB',
      name: 'Custom PCB Fabrication — 10x Boards (100x100mm)',
      price: 499, originalPrice: 799, discount: 38,
      rating: 4.9, reviewCount: 89,
      stock: 999, gstPercent: 18,
      hsn: '8534', gstCategory: 'PCB',
      badges: ['new'], emoji: '📐',
      tags: ['pcb', 'gerber', 'custom', 'fabrication'],
      description: 'Upload your Gerber file, get 10 high-quality PCBs in 5-7 days. 1-4 layer support.',
      specs: { 'Layers': '1-4', 'Min Track': '0.1mm', 'Finish': 'HASL/ENIG', 'Delivery': '5-7 days' }
    },
    {
      id: 'elec-004', category: 'electronics', brand: 'Markus Kits',
      name: 'Sensor Pack — 37-in-1 Sensor Module Kit',
      price: 599, originalPrice: 999, discount: 40,
      rating: 4.5, reviewCount: 421,
      stock: 200, gstPercent: 18,
      hsn: '8542', gstCategory: 'Electronic Sensors',
      badges: [], emoji: '🔬',
      tags: ['sensor', 'arduino', 'kit', 'modules'],
      description: '37-piece sensor kit: temperature, humidity, IR, ultrasonic, gyro, and more.',
      specs: { 'Sensors': '37 types', 'Compatibility': 'Arduino/RPi', 'Interface': 'Digital/Analog', 'Voltage': '3.3V/5V' }
    },
  ];

  /* ================================================================
     CART STATE
     ================================================================ */
  let _cart = [];

  function loadCart() {
    try {
      const saved = MarkusSecurity.storage.get('cart');
      _cart = saved ? JSON.parse(JSON.stringify(saved)) : [];
    } catch { _cart = []; }
  }

  function saveCart() {
    MarkusSecurity.storage.set('cart', _cart);
    updateCartBadge();
    updateFloatingCart();
  }

  function getCart() { return [..._cart]; }

  function getCartCount() { return _cart.reduce((sum, item) => sum + item.quantity, 0); }

  function getCartTotal() { return _cart.reduce((sum, item) => sum + (item.price * item.quantity), 0); }

  function getCartGST() {
    return _cart.reduce((sum, item) => {
      const product = getProductById(item.productId);
      const gstRate = (product?.gstPercent || 18) / 100;
      const basePrice = item.price / (1 + gstRate);
      return sum + ((item.price - basePrice) * item.quantity);
    }, 0);
  }

  function addToCart(productId, quantity = 1) {
    loadCart();
    const product = getProductById(productId);
    if (!product) return { success: false, message: 'Product not found' };
    if (product.stock < 1) return { success: false, message: 'Out of stock' };

    const existing = _cart.find(i => i.productId === productId);
    if (existing) {
      if (existing.quantity + quantity > product.stock) {
        return { success: false, message: `Only ${product.stock} items in stock` };
      }
      existing.quantity += quantity;
    } else {
      _cart.push({
        productId,
        name: product.name,
        price: product.price,
        gstPercent: product.gstPercent,
        quantity,
        emoji: product.emoji,
        addedAt: Date.now(),
      });
    }
    saveCart();
    return { success: true, message: 'Added to cart!' };
  }

  function removeFromCart(productId) {
    loadCart();
    _cart = _cart.filter(i => i.productId !== productId);
    saveCart();
  }

  function updateCartQuantity(productId, quantity) {
    loadCart();
    const item = _cart.find(i => i.productId === productId);
    if (!item) return;
    if (quantity <= 0) { removeFromCart(productId); return; }
    const product = getProductById(productId);
    if (product && quantity > product.stock) {
      quantity = product.stock;
    }
    item.quantity = quantity;
    saveCart();
  }

  function clearCart() { _cart = []; saveCart(); }

  /* ================================================================
     WISHLIST STATE
     ================================================================ */
  let _wishlist = [];

  function loadWishlist() {
    try {
      const saved = MarkusSecurity.storage.get('wishlist');
      _wishlist = saved ? [...saved] : [];
    } catch { _wishlist = []; }
  }

  function saveWishlist() {
    MarkusSecurity.storage.set('wishlist', _wishlist);
    updateWishlistBadge();
  }

  function getWishlist() { return [..._wishlist]; }

  function isInWishlist(productId) { return _wishlist.includes(productId); }

  function toggleWishlist(productId) {
    loadWishlist();
    const idx = _wishlist.indexOf(productId);
    if (idx === -1) {
      _wishlist.push(productId);
      saveWishlist();
      return { added: true };
    } else {
      _wishlist.splice(idx, 1);
      saveWishlist();
      return { added: false };
    }
  }

  /* ================================================================
     PRODUCT HELPERS
     ================================================================ */
  function getAllProducts() { return [...PRODUCTS]; }

  function getProductById(id) { return PRODUCTS.find(p => p.id === id) || null; }

  function getProductsByCategory(category) { return PRODUCTS.filter(p => p.category === category); }

  function searchProducts(query, category = 'all') {
    const q = query.toLowerCase().trim();
    return PRODUCTS.filter(p => {
      const matchCat = category === 'all' || p.category === category;
      const matchQuery = !q || p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.includes(q)) ||
        p.brand.toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }

  function getFeaturedProducts() {
    return PRODUCTS.filter(p => p.badges.includes('bestseller') || p.badges.includes('hot')).slice(0, 8);
  }

  function getRecommendedProducts() {
    // Shuffle for personalized feel
    return [...PRODUCTS].sort(() => Math.random() - 0.5).slice(0, 8);
  }

  function getElectronicsProducts() {
    return PRODUCTS.filter(p => p.category === 'electronics').slice(0, 4);
  }

  /* ================================================================
     ORDERS (localStorage mock)
     ================================================================ */
  function getOrders() {
    try {
      const saved = MarkusSecurity.storage.get('orders');
      return saved ? JSON.parse(JSON.stringify(saved)) : getMockOrders();
    } catch { return getMockOrders(); }
  }

  function getMockOrders() {
    return [
      {
        id: 'ORD-MKS-001234',
        date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        status: 'shipped',
        items: [{ productId: 'elec-001', quantity: 1, price: 899 }],
        total: 899, gst: 137.7,
        shipping: { courier: 'Delhivery', trackingId: 'DEL123456789IN' },
        address: { name: 'Rahul Sharma', city: 'Delhi', pincode: '110001' },
      },
      {
        id: 'ORD-MKS-001198',
        date: new Date(Date.now() - 12 * 24 * 3600 * 1000).toISOString(),
        status: 'delivered',
        items: [{ productId: 'robot-001', quantity: 1, price: 2499 }],
        total: 2499, gst: 381.2,
        shipping: { courier: 'DTDC', trackingId: 'DTDC987654321' },
        address: { name: 'Rahul Sharma', city: 'Delhi', pincode: '110001' },
      },
    ];
  }

  async function fetchLiveOrders() {
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.orders) {
          MarkusSecurity.storage.set('orders', data.orders);
          return data.orders;
        }
      }
    } catch (e) {
      // Server not reachable, use local fallback
    }
    return getOrders();
  }

  async function placeOrder(orderData) {
    // Orders must be persisted by the server. Never report a local-only order as confirmed.
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success || !data.orderId) {
        return { success: false, message: data.message || 'We could not place your order. Please try again.' };
      }
      const orders = getOrders();
      orders.unshift({ id: data.orderId, date: new Date().toISOString(), status: 'processing', ...orderData });
      MarkusSecurity.storage.set('orders', orders);
      clearCart();
      return { success: true, orderId: data.orderId, waAlertUrl: data.waAlertUrl || null };
    } catch (e) {
      console.error('Order API unavailable:', e);
      return { success: false, message: 'Checkout is temporarily unavailable. Please try again when the store connection is restored.' };
    }
  }

  /* ================================================================
     UI UPDATE HELPERS
     ================================================================ */
  function updateCartBadge() {
    const badge = document.getElementById('cartBadge');
    const count = getCartCount();
    if (badge) {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    }
  }

  function updateWishlistBadge() {
    const badge = document.getElementById('wishlistBadge');
    if (badge) {
      loadWishlist();
      badge.textContent = _wishlist.length;
      badge.style.display = _wishlist.length > 0 ? 'flex' : 'none';
    }
  }

  function updateFloatingCart() {
    const bar = document.getElementById('floatingCartBar');
    const text = document.getElementById('floatingCartText');
    if (!bar || !text) return;
    const count = getCartCount();
    if (count > 0) {
      text.textContent = `${count} item${count > 1 ? 's' : ''} — ₹${getCartTotal().toLocaleString('en-IN')}`;
      bar.style.display = 'flex';
    } else {
      bar.style.display = 'none';
    }
  }

  /* ================================================================
     INITIALIZE
     ================================================================ */
  function init() {
    loadCart();
    loadWishlist();
    updateCartBadge();
    updateWishlistBadge();
    updateFloatingCart();
  }

  /* ================================================================
     PUBLIC API
     ================================================================ */
  return {
    init,
    // Products
    getAllProducts,
    getProductById,
    getProductsByCategory,
    searchProducts,
    getFeaturedProducts,
    getRecommendedProducts,
    getElectronicsProducts,
    // Cart
    getCart,
    getCartCount,
    getCartTotal,
    getCartGST,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    // Wishlist
    getWishlist,
    isInWishlist,
    toggleWishlist,
    // Orders
    getOrders,
    fetchLiveOrders,
    placeOrder,
    // UI
    updateCartBadge,
    updateWishlistBadge,
    updateFloatingCart,
  };

})();
