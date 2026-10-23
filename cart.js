/**
 * cart.js — Cart Functionality
 */

'use strict';

const MarkusCart = (() => {

  function renderCartPage() {
    const cartContainer = document.getElementById('cartItemsContainer');
    if (!cartContainer) return;

    const items = MarkusStore.getCart();

    if (items.length === 0) {
      cartContainer.innerHTML = `
        <div class="empty-cart">
          <div style="font-size:4rem;margin-bottom:16px;">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added anything yet.</p>
          <a href="../index.html" class="btn-primary-hero" style="margin-top:24px;">Start Shopping</a>
        </div>
      `;
      return;
    }

    cartContainer.innerHTML = items.map(item => {
      const product = MarkusStore.getProductById(item.productId);
      const gstRate = (item.gstPercent || 18) / 100;
      const basePrice = item.price / (1 + gstRate);
      const gstAmount = item.price - basePrice;

      return `
        <div class="cart-item" data-product-id="${item.productId}">
          <div class="cart-item-image">
            <span style="font-size:2.5rem;">${MarkusSecurity.sanitizeHTML(item.emoji || '📦')}</span>
          </div>
          <div class="cart-item-details">
            <h3 class="cart-item-name">${MarkusSecurity.sanitizeHTML(item.name)}</h3>
            <p class="cart-item-meta">GST ${item.gstPercent || 18}% included | Base: ₹${basePrice.toFixed(2)} + GST: ₹${gstAmount.toFixed(2)}</p>
            <div class="cart-item-actions">
              <div class="quantity-control">
                <button onclick="updateQty('${item.productId}', ${item.quantity - 1})" aria-label="Decrease quantity">−</button>
                <span class="qty-value">${item.quantity}</span>
                <button onclick="updateQty('${item.productId}', ${item.quantity + 1})" aria-label="Increase quantity">+</button>
              </div>
              <button class="cart-remove-btn" onclick="removeFromCartUI('${item.productId}')" aria-label="Remove item">🗑️ Remove</button>
              <button class="cart-wishlist-btn" onclick="moveToWishlist('${item.productId}')" aria-label="Save for later">❤️ Save</button>
            </div>
          </div>
          <div class="cart-item-price">
            <span class="price-current">₹${(item.price * item.quantity).toLocaleString('en-IN')}</span>
            ${item.quantity > 1 ? `<span style="font-size:.75rem;color:var(--color-gray);">₹${item.price.toLocaleString('en-IN')} each</span>` : ''}
          </div>
        </div>
      `;
    }).join('');

    updateCartSummary();
  }

  function updateCartSummary() {
    const total = MarkusStore.getCartTotal();
    const gst   = MarkusStore.getCartGST();
    const base  = total - gst;
    const shipping = total >= 499 ? 0 : 49;
    const grandTotal = total + shipping;

    const ids = {
      subtotal: 'cartSubtotal',
      gst: 'cartGST',
      shipping: 'cartShipping',
      total: 'cartTotal',
      savings: 'cartSavings',
    };

    setIfExists(ids.subtotal, `₹${base.toFixed(2)}`);
    setIfExists(ids.gst, `₹${gst.toFixed(2)}`);
    setIfExists(ids.shipping, shipping === 0 ? 'FREE' : `₹${shipping}`);
    setIfExists(ids.total, `₹${grandTotal.toLocaleString('en-IN')}`);

    // Calculate savings
    const items = MarkusStore.getCart();
    const originalTotal = items.reduce((sum, item) => {
      const product = MarkusStore.getProductById(item.productId);
      return sum + ((product?.originalPrice || item.price) * item.quantity);
    }, 0);
    const savings = originalTotal - total;
    setIfExists(ids.savings, savings > 0 ? `₹${savings.toLocaleString('en-IN')}` : '₹0');
  }

  function setIfExists(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  return {
    renderCartPage,
    updateCartSummary,
  };
})();

// Global helpers
function addToCart(productId, qty = 1) {
  const result = MarkusStore.addToCart(productId, qty);
  if (result.success) {
    showToast(`${result.message} 🛒`, 'success');
    // Animate badge
    const badge = document.getElementById('cartBadge');
    if (badge) {
      badge.classList.remove('bounce');
      void badge.offsetWidth;
      badge.classList.add('bounce');
    }
  } else {
    showToast(result.message, 'error');
  }
}

function removeFromCartUI(productId) {
  MarkusStore.removeFromCart(productId);
  showToast('Removed from cart', 'info');
  MarkusCart.renderCartPage();
}

function updateQty(productId, qty) {
  MarkusStore.updateCartQuantity(productId, qty);
  MarkusCart.renderCartPage();
}

function moveToWishlist(productId) {
  MarkusStore.removeFromCart(productId);
  MarkusStore.toggleWishlist(productId);
  showToast('Moved to Wishlist ❤️', 'success');
  MarkusCart.renderCartPage();
}

function addToWishlist(productId) {
  const result = MarkusStore.toggleWishlist(productId);
  if (result.added) {
    showToast('Added to Wishlist ❤️', 'success');
    // Update all wishlist buttons for this product
    document.querySelectorAll(`[data-product-id="${productId}"].wishlist-toggle`).forEach(btn => {
      btn.classList.add('active');
      btn.setAttribute('aria-label', 'Remove from wishlist');
    });
  } else {
    showToast('Removed from Wishlist', 'info');
    document.querySelectorAll(`[data-product-id="${productId}"].wishlist-toggle`).forEach(btn => {
      btn.classList.remove('active');
      btn.setAttribute('aria-label', 'Add to wishlist');
    });
  }
}

function toggleWishlist(productId) { addToWishlist(productId); }
