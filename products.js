/**
 * products.js — Product Rendering & Display
 */

'use strict';

const MarkusProducts = (() => {

  /* ================================================================
     RENDER PRODUCT CARD
     ================================================================ */
  const CATEGORY_IMAGES = {
    electronics: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=85',
    robotics: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=900&q=85',
    laptops: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=85',
    fashion: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=85',
    homedecor: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=85',
    '3dprint': 'https://images.unsplash.com/photo-1631553127985-9f9f7c5c4c6c?auto=format&fit=crop&w=900&q=85',
    gerber: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=900&q=85'
  };

  function productImage(product) {
    const src = product.imageUrl || CATEGORY_IMAGES[product.category] || CATEGORY_IMAGES.electronics;
    return `<img src="${src}" alt="${MarkusSecurity.sanitizeHTML(product.name)}" loading="lazy" onerror="this.onerror=null;this.closest('.product-card-image').classList.add('image-fallback');this.remove();">`;
  }

  function renderProductCard(product) {
    const inWishlist = MarkusStore.isInWishlist(product.id);
    const discountBadge = product.discount > 0 ? `<span class="product-badge badge-sale">${product.discount}% OFF</span>` : '';
    const badgeHTML = product.badges.map(b => {
      const map = { new: 'badge-new', hot: 'badge-hot', bestseller: 'badge-sale', limited: 'badge-limited' };
      const labels = { new: 'NEW', hot: 'HOT 🔥', bestseller: '⭐ Top Pick', limited: 'Limited' };
      return `<span class="product-badge ${map[b] || ''}">${labels[b] || b}</span>`;
    }).join('');

    const stars = generateStars(product.rating);
    const priceFormatted = formatPrice(product.price);
    const originalFormatted = formatPrice(product.originalPrice);

    const stockWarning = product.stock <= 10 && product.stock > 0
      ? `<div style="font-size:0.7rem;color:#F59E0B;margin-bottom:4px;">⚠️ Only ${product.stock} left in stock!</div>`
      : '';

    return `
      <article class="product-card reveal hover-lift" data-product-id="${MarkusSecurity.sanitizeHTML(product.id)}">
        <div class="product-card-image">
          <div class="product-badge-group">
            ${discountBadge}
            ${badgeHTML}
          </div>
          <div class="product-image-placeholder product-photo">
            ${productImage(product)}
          </div>
          <div class="product-card-actions" role="group" aria-label="Product actions">
            <button
              class="product-action-btn wishlist-toggle ${inWishlist ? 'active' : ''}"
              onclick="toggleWishlist('${product.id}')"
              data-product-id="${product.id}"
              aria-label="${inWishlist ? 'Remove from' : 'Add to'} wishlist"
              title="${inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}"
            >❤️</button>
            <button
              class="product-action-btn"
              onclick="openQuickView('${product.id}')"
              aria-label="Quick view"
              title="Quick View"
            >👁️</button>
            <button
              class="product-action-btn"
              onclick="shareProduct('${product.id}')"
              aria-label="Share product"
              title="Share"
            >🔗</button>
          </div>
          <div class="product-quick-add">
            <button class="btn-add-cart full-width" onclick="addToCart('${product.id}')">+ Add to Cart</button>
          </div>
        </div>

        <div class="product-card-body">
          <p class="product-brand">${MarkusSecurity.sanitizeHTML(product.brand)}</p>
          <a href="pages/product.html?id=${product.id}" aria-label="${MarkusSecurity.sanitizeHTML(product.name)}">
            <h3 class="product-name">${MarkusSecurity.sanitizeHTML(product.name)}</h3>
          </a>
          <div class="product-rating">
            <span class="stars" aria-label="${product.rating} out of 5 stars">${stars}</span>
            <span class="rating-count">(${product.reviewCount.toLocaleString('en-IN')})</span>
          </div>
          ${stockWarning}
          <div class="product-price-row">
            <span class="price-current">₹${priceFormatted}</span>
            ${product.originalPrice > product.price ? `<span class="price-original">₹${originalFormatted}</span>` : ''}
            ${product.discount > 0 ? `<span class="price-discount">${product.discount}% off</span>` : ''}
          </div>
        </div>

        <div class="product-card-footer">
          <button class="btn-add-cart" onclick="addToCart('${product.id}')" aria-label="Add ${MarkusSecurity.sanitizeHTML(product.name)} to cart">Add to Cart</button>
          <a href="pages/product.html?id=${product.id}" class="btn-buy-now" aria-label="Buy ${MarkusSecurity.sanitizeHTML(product.name)} now">Buy Now</a>
        </div>
      </article>
    `;
  }

  /* ================================================================
     RENDER SKELETON CARDS
     ================================================================ */
  function renderSkeletons(count = 4) {
    return Array.from({ length: count }, () => `
      <div class="product-card skeleton-card">
        <div class="skeleton-img skeleton"></div>
        <div class="skeleton-body">
          <div class="skeleton skeleton-text short"></div>
          <div class="skeleton skeleton-text full"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text short"></div>
        </div>
      </div>
    `).join('');
  }

  /* ================================================================
     POPULATE GRIDS
     ================================================================ */
  async function populateFeaturedGrid() {
    const grid = document.getElementById('featuredProductsGrid');
    if (!grid) return;
    grid.innerHTML = renderSkeletons(8);
    await delay(400);
    const products = MarkusStore.getFeaturedProducts();
    grid.innerHTML = products.map(renderProductCard).join('');
    initRevealAnimations();
  }

  async function populateElectronicsGrid() {
    const grid = document.getElementById('electronicsGrid');
    if (!grid) return;
    grid.innerHTML = renderSkeletons(4);
    await delay(600);
    const products = MarkusStore.getElectronicsProducts();
    grid.innerHTML = products.map(renderProductCard).join('');
    initRevealAnimations();
  }

  async function populateRecommendedGrid() {
    const grid = document.getElementById('recommendedGrid');
    if (!grid) return;
    grid.innerHTML = renderSkeletons(4);
    await delay(800);
    const products = MarkusStore.getRecommendedProducts().slice(0, 4);
    grid.innerHTML = products.map(renderProductCard).join('');
    initRevealAnimations();
  }

  /* ================================================================
     SEARCH RESULTS
     ================================================================ */
  function populateSearchResults(query, category = 'all') {
    const products = MarkusStore.searchProducts(query, category);
    return {
      count: products.length,
      html: products.length > 0
        ? products.map(renderProductCard).join('')
        : `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--color-gray);">
            <div style="font-size:3rem;margin-bottom:16px;">🔍</div>
            <p>No products found for "<strong>${MarkusSecurity.sanitizeHTML(query)}</strong>"</p>
            <p style="margin-top:8px;font-size:0.85rem;">Try different keywords or browse categories.</p>
           </div>`,
    };
  }

  /* ================================================================
     QUICK VIEW MODAL
     ================================================================ */
  function openQuickView(productId) {
    const product = MarkusStore.getProductById(productId);
    if (!product) return;

    // Remove existing quick view
    document.getElementById('quickViewModal')?.remove();

    const modal = document.createElement('div');
    modal.id = 'quickViewModal';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'quickViewTitle');

    const gstRate = product.gstPercent / 100;
    const basePrice = product.price / (1 + gstRate);
    const gstAmount = product.price - basePrice;

    modal.innerHTML = `
      <div class="modal" style="max-width:640px;">
        <button class="modal-close" onclick="document.getElementById('quickViewModal').remove()" aria-label="Close quick view">✕</button>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
          <div style="background:linear-gradient(135deg,#112040,#1E3A5F);border-radius:12px;display:flex;align-items:center;justify-content:center;min-height:200px;font-size:5rem;">
            ${MarkusSecurity.sanitizeHTML(product.emoji)}
          </div>
          <div>
            <p style="font-size:0.75rem;color:var(--color-gray);text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">${MarkusSecurity.sanitizeHTML(product.brand)}</p>
            <h2 id="quickViewTitle" style="font-size:1rem;font-weight:700;margin-bottom:12px;">${MarkusSecurity.sanitizeHTML(product.name)}</h2>
            <div class="product-rating" style="margin-bottom:12px;">
              <span class="stars">${generateStars(product.rating)}</span>
              <span style="font-size:.78rem;color:var(--color-gray);">(${product.reviewCount})</span>
            </div>
            <div class="product-price-row" style="margin-bottom:12px;">
              <span class="price-current" style="font-size:1.4rem;">₹${formatPrice(product.price)}</span>
              ${product.originalPrice > product.price ? `<span class="price-original">₹${formatPrice(product.originalPrice)}</span>` : ''}
              ${product.discount > 0 ? `<span class="price-discount">${product.discount}% off</span>` : ''}
            </div>
            <p style="font-size:0.75rem;color:var(--color-gray);margin-bottom:4px;">
              GST (${product.gstPercent}%): ₹${gstAmount.toFixed(2)} | Base: ₹${basePrice.toFixed(2)}
            </p>
            <p style="font-size:0.72rem;color:var(--color-gray);margin-bottom:16px;">HSN: ${product.hsn} | ${product.gstCategory}</p>
            <p style="font-size:0.85rem;color:var(--color-silver);margin-bottom:16px;line-height:1.5;">${MarkusSecurity.sanitizeHTML(product.description)}</p>
            ${product.stock > 0 && product.stock <= 10 ? `<p style="font-size:.75rem;color:#F59E0B;margin-bottom:12px;">⚠️ Only ${product.stock} left!</p>` : ''}
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <button class="btn-add-cart" style="flex:1;" onclick="addToCart('${product.id}');document.getElementById('quickViewModal').remove();">Add to Cart</button>
              <a href="pages/product.html?id=${product.id}" class="btn-buy-now" style="flex:1;">View Full Details</a>
            </div>
          </div>
        </div>
        ${Object.keys(product.specs).length > 0 ? `
          <div style="margin-top:20px;border-top:1px solid var(--color-navy-border);padding-top:16px;">
            <h3 style="font-size:.8rem;font-weight:700;text-transform:uppercase;color:var(--color-gray);letter-spacing:.08em;margin-bottom:10px;">Specifications</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 16px;">
              ${Object.entries(product.specs).map(([k,v]) => `
                <div style="display:flex;gap:8px;font-size:.8rem;">
                  <span style="color:var(--color-gray);min-width:100px;flex-shrink:0;">${MarkusSecurity.sanitizeHTML(k)}</span>
                  <span style="color:var(--color-white);font-weight:600;">${MarkusSecurity.sanitizeHTML(v)}</span>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}
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

  /* ================================================================
     HELPERS
     ================================================================ */
  function generateStars(rating) {
    const full  = Math.floor(rating);
    const half  = rating % 1 >= 0.5 ? 1 : 0;
    const empty = 5 - full - half;
    return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
  }

  function formatPrice(price) {
    return Math.round(price).toLocaleString('en-IN');
  }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

  function initRevealAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));
  }

  /* ================================================================
     PUBLIC API
     ================================================================ */
  return {
    renderProductCard,
    renderSkeletons,
    populateFeaturedGrid,
    populateElectronicsGrid,
    populateRecommendedGrid,
    populateSearchResults,
    openQuickView,
    generateStars,
    formatPrice,
    initRevealAnimations,
  };

})();

// Global helpers called from HTML
function openQuickView(id)  { MarkusProducts.openQuickView(id); }

function shareProduct(id) {
  const product = MarkusStore.getProductById(id);
  if (!product) return;
  const url = `${window.location.origin}/pages/product.html?id=${id}`;
  if (navigator.share) {
    navigator.share({ title: product.name, text: `Check out ${product.name} on Markus!`, url });
  } else {
    navigator.clipboard.writeText(url).then(() => showToast('Product link copied!', 'success'));
  }
}
