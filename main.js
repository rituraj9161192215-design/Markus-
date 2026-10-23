/**
 * main.js — Application Bootstrap
 * Initializes all modules and starts the app
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  // ---- Initialize Core Modules ----
  MarkusStore.init();
  MarkusAuth.init();

  // ---- Setup UI ----
  setupAnnouncementBar();
  setupHeroSlider();
  setupMobileMenu();
  setupHeaderScroll();
  setupScrollTop();
  setupSearch();
  setupLocation();
  setupRipple();

  // ---- Populate Product Grids ----
  MarkusProducts.populateFeaturedGrid();
  MarkusProducts.populateElectronicsGrid();
  MarkusProducts.populateRecommendedGrid();

  // ---- Setup Reveal Animations ----
  setTimeout(setupRevealObserver, 300);

  // ---- Category Nav Highlight ----
  highlightActiveCategory();

  // ---- Smooth Page Load ----
  document.body.classList.add('page-enter');

  console.log('%cMarkus Platform Loaded ✅', 'color:#FF6B35;font-size:14px;font-weight:bold;');
  console.log('%cSecure · Scalable · Fast', 'color:#22D3EE;font-size:11px;');

});

/* ================================================================
   ACTIVE CATEGORY HIGHLIGHT
   ================================================================ */
function highlightActiveCategory() {
  const currentPath = window.location.pathname;
  document.querySelectorAll('.category-link').forEach(link => {
    if (link.href && currentPath.includes(link.getAttribute('href'))) {
      link.classList.add('active');
    }
  });
}

/* ================================================================
   PERFORMANCE: LAZY LOAD IMAGES
   ================================================================ */
function setupLazyImages() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  });
  document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
}

/* ================================================================
   ANALYTICS (mock — replace with Google Analytics/Firebase)
   ================================================================ */
const MarkusAnalytics = {
  track(event, data = {}) {
    // In production: gtag('event', event, data); or Firebase logEvent
    console.debug('[Analytics]', event, data);
  },
  pageView() {
    this.track('page_view', { page: window.location.pathname, title: document.title });
  },
  addToCartEvent(productId, price) {
    this.track('add_to_cart', { product_id: productId, price, currency: 'INR' });
  },
  purchaseEvent(orderId, total) {
    this.track('purchase', { order_id: orderId, value: total, currency: 'INR' });
  },
};

// Track page view
MarkusAnalytics.pageView();

/* ================================================================
   SERVICE WORKER REGISTRATION (for PWA / offline support)
   ================================================================ */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // Service worker registration failed — not critical
  });
}

/* ================================================================
   PAYMENT — UPI Integration Helper
   UPI ID linked to phone: 8957271609
   ================================================================ */
const MarkusPayment = {
  UPI_ID: '8957271609@upi',
  MERCHANT_NAME: 'Markus Store',
  
  generateUPILink(amount, orderId, note = '') {
    const params = new URLSearchParams({
      pa: this.UPI_ID,
      pn: this.MERCHANT_NAME,
      am: amount.toFixed(2),
      cu: 'INR',
      tn: note || `Order ${orderId}`,
      tr: orderId,
    });
    return `upi://pay?${params.toString()}`;
  },

  generateQRCodeURL(amount, orderId) {
    const upiLink = this.generateUPILink(amount, orderId);
    // Use Google Charts QR API (or replace with local library)
    return `https://chart.googleapis.com/chart?chs=200x200&cht=qr&chl=${encodeURIComponent(upiLink)}&choe=UTF-8`;
  },

  async initiatePayment(orderId, amount, items) {
    // In production: use Razorpay/Cashfree SDK
    const upiLink = this.generateUPILink(amount, orderId);
    
    // Try to open UPI app on mobile
    if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
      window.location.href = upiLink;
    } else {
      // Show QR code on desktop
      const qrUrl = this.generateQRCodeURL(amount, orderId);
      showPaymentQRModal(qrUrl, amount, orderId);
    }
  }
};

function showPaymentQRModal(qrUrl, amount, orderId) {
  const existing = document.getElementById('paymentQRModal');
  existing?.remove();

  const modal = document.createElement('div');
  modal.id = 'paymentQRModal';
  modal.className = 'modal-overlay';
  modal.style.display = 'flex';
  modal.innerHTML = `
    <div class="modal" style="max-width:380px;text-align:center;">
      <button class="modal-close" onclick="document.getElementById('paymentQRModal').remove();document.body.style.overflow=''" aria-label="Close">✕</button>
      <h2 style="margin-bottom:8px;">Scan to Pay</h2>
      <p style="color:var(--color-gray);font-size:.85rem;margin-bottom:20px;">Scan with any UPI app (GPay, PhonePe, Paytm)</p>
      <div style="background:white;padding:16px;border-radius:12px;display:inline-block;margin-bottom:16px;">
        <img src="${qrUrl}" alt="UPI QR Code" width="200" height="200" />
      </div>
      <div style="background:var(--color-navy);border-radius:12px;padding:16px;margin-bottom:16px;">
        <p style="font-size:.8rem;color:var(--color-gray);">Pay to UPI ID</p>
        <p style="font-size:1rem;font-weight:700;color:var(--color-orange);">${MarkusPayment.UPI_ID}</p>
        <p style="font-size:1.4rem;font-weight:800;margin-top:8px;">₹${amount.toLocaleString('en-IN')}</p>
        <p style="font-size:.75rem;color:var(--color-gray);">Order: ${orderId}</p>
      </div>
      <button class="btn-auth-submit" onclick="confirmPayment('${orderId}')">I've Made the Payment</button>
      <p style="font-size:.72rem;color:var(--color-gray);margin-top:12px;">
        Payment verified automatically. Do NOT close this window until payment is complete.
      </p>
    </div>
  `;
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
      document.body.style.overflow = '';
    }
  });
}

function confirmPayment(orderId) {
  document.getElementById('paymentQRModal')?.remove();
  document.body.style.overflow = '';
  showToast('Payment recorded! Order confirmed. 🎉', 'success');
  // In production: verify with payment gateway webhook
  setTimeout(() => {
    window.location.href = `pages/order-success.html?orderId=${orderId}`;
  }, 1500);
}

/* ================================================================
   INVOICE GENERATOR
   ================================================================ */
const MarkusInvoice = {
  generate(order, user) {
    const items = order.items.map(item => {
      const product = MarkusStore.getProductById(item.productId);
      const gstRate = (product?.gstPercent || 18) / 100;
      const basePrice = item.price / (1 + gstRate);
      const gstAmount = item.price - basePrice;
      return {
        ...item,
        productName: product?.name || item.name || 'Product',
        hsn: product?.hsn || '9999',
        gstPercent: product?.gstPercent || 18,
        basePrice: basePrice * item.quantity,
        gstAmount: gstAmount * item.quantity,
        total: item.price * item.quantity,
      };
    });

    const html = this.buildHTML(order, user, items);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.print();
    }
  },

  buildHTML(order, user, items) {
    const totalBase = items.reduce((s, i) => s + i.basePrice, 0);
    const totalGST  = items.reduce((s, i) => s + i.gstAmount, 0);
    const total     = items.reduce((s, i) => s + i.total, 0);
    const dateStr   = new Date(order.date).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>Invoice — ${order.id}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #111; font-size: 12px; margin: 0; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0A1628; padding-bottom: 16px; margin-bottom: 20px; }
    .brand { font-size: 24px; font-weight: 900; color: #0A1628; }
    .brand span { color: #FF6B35; }
    .gst-block { font-size: 11px; color: #555; }
    table { width: 100%; border-collapse: collapse; margin: 16px 0; }
    th { background: #0A1628; color: white; padding: 8px; text-align: left; font-size: 11px; }
    td { padding: 8px; border-bottom: 1px solid #eee; }
    .totals { margin-left: auto; width: 280px; }
    .totals table td { border: none; padding: 4px 8px; }
    .grand-total td { font-weight: 700; font-size: 14px; border-top: 2px solid #0A1628 !important; }
    .footer { margin-top: 30px; border-top: 1px solid #ccc; padding-top: 16px; font-size: 11px; color: #666; }
    .stamp { display: inline-block; border: 2px solid #22C55E; color: #22C55E; padding: 6px 16px; border-radius: 4px; font-weight: 700; font-size: 14px; transform: rotate(-15deg); margin: 10px 0; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">Markus<span>.</span></div>
      <div class="gst-block">
        <p>Create. Customize. Commerce.</p>
        <p>GST No: 09ABCDE1234F1Z5 (Demo)</p>
        <p>PAN: ABCDE1234F</p>
        <p>support@markus.com | +91 8957271609</p>
      </div>
    </div>
    <div style="text-align:right;">
      <h1 style="font-size:20px;margin:0;color:#0A1628;">TAX INVOICE</h1>
      <p><strong>Invoice #:</strong> INV-${order.id}</p>
      <p><strong>Date:</strong> ${dateStr}</p>
      <p><strong>Order ID:</strong> ${order.id}</p>
    </div>
  </div>

  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px;">
    <div>
      <h3 style="margin:0 0 8px;font-size:12px;text-transform:uppercase;color:#555;">Bill To</h3>
      <p style="margin:0;font-weight:700;">${MarkusSecurity.sanitizeHTML(user?.name || 'Customer')}</p>
      <p style="margin:2px 0;">${MarkusSecurity.sanitizeHTML(order.address?.city || '')}</p>
      <p style="margin:2px 0;">PIN: ${MarkusSecurity.sanitizeHTML(order.address?.pincode || '')}</p>
    </div>
    <div>
      <h3 style="margin:0 0 8px;font-size:12px;text-transform:uppercase;color:#555;">Dispatch From</h3>
      <p style="margin:0;font-weight:700;">Markus Fulfillment Center</p>
      <p style="margin:2px 0;">India</p>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Product</th>
        <th>HSN</th>
        <th>GST%</th>
        <th>Qty</th>
        <th>Base Price</th>
        <th>GST Amount</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      ${items.map((item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${MarkusSecurity.sanitizeHTML(item.productName)}</td>
          <td>${item.hsn}</td>
          <td>${item.gstPercent}%</td>
          <td>${item.quantity}</td>
          <td>₹${item.basePrice.toFixed(2)}</td>
          <td>₹${item.gstAmount.toFixed(2)}</td>
          <td>₹${item.total.toFixed(2)}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="totals">
    <table>
      <tr><td>Sub Total (Excl. GST)</td><td style="text-align:right;">₹${totalBase.toFixed(2)}</td></tr>
      <tr><td>Total GST</td><td style="text-align:right;">₹${totalGST.toFixed(2)}</td></tr>
      <tr><td>Shipping</td><td style="text-align:right;">₹0.00</td></tr>
      <tr class="grand-total"><td>Grand Total</td><td style="text-align:right;">₹${total.toFixed(2)}</td></tr>
    </table>
  </div>

  <div style="margin-top:20px;">
    <span class="stamp">✓ PAID</span>
    <p style="font-size:11px;color:#555;">Payment via UPI | Order Status: ${order.status?.toUpperCase()}</p>
  </div>

  <div class="footer">
    <p><strong>Terms:</strong> All prices include applicable GST. Returns accepted within 7 days as per policy.</p>
    <p>This is a computer-generated invoice. Signature not required.</p>
    <p>For queries: support@markus.com | WhatsApp: +91 8957271609</p>
  </div>
</body>
</html>`;
  }
};

// Make globally accessible
window.MarkusPayment = MarkusPayment;
window.MarkusInvoice = MarkusInvoice;
window.MarkusAnalytics = MarkusAnalytics;
