// Configuração da API Backend Java (Spring Boot / Quarkus / Jakarta EE)
const API_BASE_URL = 'http://localhost:8080/api';
const FREE_SHIPPING_THRESHOLD = 150.0;

// Catálogo local de fallback caso o servidor Java não esteja rodando
const FALLBACK_PRODUCTS = [
  {
    id: 1,
    name: 'Banana Prata Orgânica',
    category: 'Hortifruti',
    unit: 'Band. ~650g',
    price: 7.49,
    oldPrice: 9.20,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=500&q=70'
  },
  {
    id: 2,
    name: 'Tomate Italiano Selecionado',
    category: 'Hortifruti',
    unit: 'Kg',
    price: 8.90,
    oldPrice: null,
    image: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=500&q=70'
  },
  {
    id: 3,
    name: 'Leite Integral Pasteurizado',
    category: 'Laticínios',
    unit: 'Caixa 1L',
    price: 4.89,
    oldPrice: 5.50,
    image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=500&q=70'
  },
  {
    id: 4,
    name: 'Queijo Mussarela Fatiado',
    category: 'Laticínios',
    unit: 'Bandeja 200g',
    price: 11.90,
    oldPrice: null,
    image: 'https://images.unsplash.com/photo-1486297678162-eb2a19b0a32d?auto=format&fit=crop&w=500&q=70'
  },
  {
    id: 5,
    name: 'Pão Francês Fresquinho',
    category: 'Padaria',
    unit: 'Pacote 6 unid.',
    price: 6.60,
    oldPrice: null,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=70'
  },
  {
    id: 6,
    name: 'Café Torrado e Moído Especial',
    category: 'Mercearia',
    unit: 'Pacote 500g',
    price: 18.50,
    oldPrice: 22.00,
    image: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=500&q=70'
  },
  {
    id: 7,
    name: 'Arroz Agulhinha Tipo 1',
    category: 'Mercearia',
    unit: 'Pacote 5kg',
    price: 26.90,
    oldPrice: 29.90,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=500&q=70'
  },
  {
    id: 8,
    name: 'Detergente Neutro Biodegradável',
    category: 'Limpeza',
    unit: 'Frasco 500ml',
    price: 2.79,
    oldPrice: null,
    image: 'https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=500&q=70'
  }
];

const CATEGORIES = ['Todos', 'Hortifruti', 'Laticínios', 'Padaria', 'Mercearia', 'Limpeza'];

// Camada de comunicação HTTP com o Backend Java via CORS
const apiClient = {
  backendOnline: false,

  async fetchProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        method: 'GET',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      this.backendOnline = true;
      return data;
    } catch (err) {
      console.warn('[CORS/API] Backend Java indisponível, usando catálogo local:', err.message);
      this.backendOnline = false;
      return FALLBACK_PRODUCTS;
    }
  },

  async submitOrder(orderPayload) {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      this.backendOnline = true;
      return await response.json();
    } catch (err) {
      console.warn('[CORS/API] Simulando resposta do pedido localmente:', err.message);
      this.backendOnline = false;
      return {
        orderId: `FM-${Math.floor(100000 + Math.random() * 900000)}`,
        status: 'CONFIRMADO_LOCAL',
        total: orderPayload.total
      };
    }
  }
};

// Estado central da aplicação
const state = {
  products: [],
  loading: true,
  category: 'Todos',
  search: '',
  sort: 'featured',
  cep: '58400-000',
  deliveryWindow: 'Hoje, em até 45 min',
  cart: JSON.parse(localStorage.getItem('freshmarket_cart') || '[]'),
  couponCode: '',
  discountPercent: 0,
  cartOpen: false,
  confirmedOrder: null
};

const appEl = document.getElementById('app');

function formatBRL(value) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function saveCart() {
  localStorage.setItem('freshmarket_cart', JSON.stringify(state.cart));
}

function showToast(message) {
  let toast = document.getElementById('fm-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'fm-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(showToast._timer);
  showToast._timer = setTimeout(() => toast.classList.remove('show'), 2400);
}

function getFilteredProducts() {
  return state.products
    .filter((item) => {
      const matchesCategory = state.category === 'Todos' || item.category === state.category;
      const q = state.search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    })
    .sort((a, b) => {
      if (state.sort === 'price-asc') return a.price - b.price;
      if (state.sort === 'price-desc') return b.price - a.price;
      return a.id - b.id;
    });
}

function getCartTotals() {
  const subtotal = state.cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const discount = subtotal * (state.discountPercent / 100);
  const afterDiscount = Math.max(0, subtotal - discount);
  const shipping = subtotal === 0 || afterDiscount >= FREE_SHIPPING_THRESHOLD ? 0 : 12.9;
  const total = afterDiscount + shipping;
  const missingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - afterDiscount);
  const progressPercent = Math.min(100, (afterDiscount / FREE_SHIPPING_THRESHOLD) * 100);

  return { subtotal, discount, shipping, total, missingForFreeShipping, progressPercent };
}

function addToCart(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;

  const existing = state.cart.find((item) => item.id === productId);
  if (existing) {
    existing.qty += 1;
  } else {
    state.cart.push({ ...product, qty: 1 });
  }
  saveCart();
  render();
  showToast(`${product.name} adicionado ao carrinho`);
}

function updateQty(productId, delta) {
  const item = state.cart.find((i) => i.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter((i) => i.id !== productId);
  }
  saveCart();
  render();
}

function applyCoupon(code) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) return;

  if (normalized === 'FRESH10') {
    state.couponCode = normalized;
    state.discountPercent = 10;
    showToast('Cupom FRESH10 aplicado (10% de desconto)');
  } else {
    state.couponCode = '';
    state.discountPercent = 0;
    showToast('Cupom inválido. Tente FRESH10');
  }
  render();
}

async function handleCheckout() {
  if (state.cart.length === 0) return;
  const totals = getCartTotals();

  const orderPayload = {
    cep: state.cep,
    coupon: state.couponCode || null,
    subtotal: Number(totals.subtotal.toFixed(2)),
    discount: Number(totals.discount.toFixed(2)),
    shipping: Number(totals.shipping.toFixed(2)),
    total: Number(totals.total.toFixed(2)),
    items: state.cart.map((item) => ({
      productId: item.id,
      name: item.name,
      quantity: item.qty,
      unitPrice: item.price
    }))
  };

  const result = await apiClient.submitOrder(orderPayload);
  state.confirmedOrder = result;
  state.cart = [];
  state.couponCode = '';
  state.discountPercent = 0;
  state.cartOpen = false;
  saveCart();
  render();
}

function renderProductsGrid(products) {
  if (state.loading) {
    return Array.from({ length: 8 })
      .map(
        () => `
        <div class="skeleton-card">
          <div class="skeleton" style="height:140px;width:100%;"></div>
          <div class="skeleton" style="height:14px;width:45%;"></div>
          <div class="skeleton" style="height:18px;width:85%;"></div>
          <div class="skeleton" style="height:34px;width:100%;margin-top:auto;"></div>
        </div>`
      )
      .join('');
  }

  if (products.length === 0) {
    return `
      <div style="grid-column:1/-1;text-align:center;padding:48px 16px;color:var(--slate-500);">
        Nenhum produto encontrado para "${state.search || state.category}".
      </div>`;
  }

  return products
    .map((p) => {
      const discountBadge = p.oldPrice
        ? `<span class="badge-discount">-${Math.round(((p.oldPrice - p.price) / p.oldPrice) * 100)}%</span>`
        : '';
      const oldPriceHtml = p.oldPrice
        ? `<span class="price-old">${formatBRL(p.oldPrice)}</span>`
        : '';

      return `
        <article class="product-card">
          ${discountBadge}
          <div>
            <div class="product-img-wrap">
              <img src="${p.image}" alt="${p.name}" loading="lazy" />
            </div>
            <span class="product-cat">${p.category}</span>
            <h3 class="product-name">${p.name}</h3>
            <p class="product-unit">${p.unit}</p>
          </div>
          <div class="product-footer">
            <div>
              ${oldPriceHtml}
              <span class="price-current">${formatBRL(p.price)}</span>
            </div>
            <button class="add-btn" data-add="${p.id}">
              <i data-lucide="plus" style="width:15px;height:15px;"></i>
              Adicionar
            </button>
          </div>
        </article>`;
    })
    .join('');
}

function renderCartDrawer() {
  const totals = getCartTotals();
  const totalCount = state.cart.reduce((sum, i) => sum + i.qty, 0);

  const itemsHtml =
    state.cart.length === 0
      ? `<div class="empty-cart">
           <p style="font-weight:600;margin-bottom:4px;">Seu carrinho está vazio</p>
           <p style="font-size:0.84rem;">Adicione itens da vitrine para começar.</p>
         </div>`
      : state.cart
          .map(
            (item) => `
            <div class="cart-item">
              <img src="${item.image}" alt="${item.name}" />
              <div class="cart-item-info">
                <div class="cart-item-title">${item.name}</div>
                <div class="cart-item-price">${formatBRL(item.price)} • ${item.unit}</div>
                <div class="qty-controls">
                  <button class="qty-btn" data-qty-id="${item.id}" data-delta="-1">−</button>
                  <span style="font-size:0.84rem;font-weight:600;">${item.qty}</span>
                  <button class="qty-btn" data-qty-id="${item.id}" data-delta="1">+</button>
                </div>
              </div>
              <div style="font-weight:700;font-size:0.88rem;">
                ${formatBRL(item.price * item.qty)}
              </div>
            </div>`
          )
          .join('');

  return `
    <div class="backdrop ${state.cartOpen ? 'open' : ''}" id="cart-backdrop"></div>
    <aside class="drawer ${state.cartOpen ? 'open' : ''}" aria-label="Carrinho de compras">
      <div class="drawer-header">
        <h2>Carrinho (${totalCount})</h2>
        <button class="close-btn" id="close-cart-btn" aria-label="Fechar carrinho">
          <i data-lucide="x" style="width:18px;height:18px;"></i>
        </button>
      </div>

      <div class="shipping-progress">
        <div>
          ${
            totals.missingForFreeShipping === 0 && totals.subtotal > 0
              ? 'Você garantiu <strong>frete grátis</strong>!'
              : `Faltam <strong>${formatBRL(totals.missingForFreeShipping)}</strong> para frete grátis`
          }
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width:${totals.progressPercent}%;"></div>
        </div>
      </div>

      <div class="drawer-body">${itemsHtml}</div>

      <div class="drawer-footer">
        <form class="coupon-row" id="coupon-form">
          <input
            type="text"
            class="coupon-input"
            id="coupon-input"
            placeholder="Cupom (ex: FRESH10)"
            value="${state.couponCode}"
          />
          <button type="submit" class="coupon-btn">Aplicar</button>
        </form>

        <div class="summary-line">
          <span>Subtotal</span>
          <span>${formatBRL(totals.subtotal)}</span>
        </div>
        ${
          totals.discount > 0
            ? `<div class="summary-line" style="color:var(--emerald-700);">
                 <span>Desconto (${state.couponCode})</span>
                 <span>-${formatBRL(totals.discount)}</span>
               </div>`
            : ''
        }
        <div class="summary-line">
          <span>Entrega</span>
          <span>${totals.shipping === 0 ? 'Grátis' : formatBRL(totals.shipping)}</span>
        </div>
        <div class="summary-total">
          <span>Total</span>
          <span>${formatBRL(totals.total)}</span>
        </div>

        <button class="checkout-btn" id="checkout-btn" ${state.cart.length === 0 ? 'disabled' : ''}>
          Finalizar Pedido
        </button>
      </div>
    </aside>`;
}

function renderOrderModal() {
  const order = state.confirmedOrder;
  return `
    <div class="modal-backdrop ${order ? 'open' : ''}" id="order-modal">
      <div class="modal-card">
        <div class="modal-icon">
          <i data-lucide="check" style="width:26px;height:26px;"></i>
        </div>
        <h3>Pedido Confirmado!</h3>
        ${
          order
            ? `<p>Código do pedido: <strong>#${order.orderId}</strong><br/>Total: <strong>${formatBRL(Number(order.total || 0))}</strong></p>`
            : ''
        }
        <button class="modal-btn" id="close-modal-btn">Continuar comprando</button>
      </div>
    </div>`;
}

function render() {
  const filtered = getFilteredProducts();
  const totalQty = state.cart.reduce((sum, i) => sum + i.qty, 0);

  appEl.innerHTML = `
    <header class="header">
      <div class="container header-inner">
        <button class="brand" id="reset-home-btn">
          <div class="brand-icon">
            <i data-lucide="shopping-basket" style="width:22px;height:22px;"></i>
          </div>
          <div>
            <div class="brand-name">Fresh<span>Market</span></div>
            <div class="brand-sub">Supermercado Online</div>
          </div>
        </button>

        <div class="search-box">
          <span class="search-icon">
            <i data-lucide="search" style="width:17px;height:17px;"></i>
          </span>
          <input
            type="search"
            class="search-input"
            id="search-input"
            placeholder="Buscar frutas, laticínios, limpeza..."
            value="${state.search}"
          />
          ${
            state.search
              ? `<button class="search-clear" id="clear-search-btn" aria-label="Limpar busca">
                   <i data-lucide="x" style="width:15px;height:15px;"></i>
                 </button>`
              : ''
          }
        </div>

        <div class="header-actions">
          <div class="api-status ${apiClient.backendOnline ? 'online' : ''}" title="Status de conexão CORS com localhost:8080">
            <span class="status-dot"></span>
            <span>${apiClient.backendOnline ? 'Java API' : 'Modo Local'}</span>
          </div>

          <button class="cart-btn" id="open-cart-btn">
            <i data-lucide="shopping-cart" style="width:18px;height:18px;"></i>
            <span>Carrinho</span>
            <span class="cart-badge">${totalQty}</span>
          </button>
        </div>
      </div>
    </header>

    <div class="delivery-bar">
      <div class="container delivery-inner">
        <div class="delivery-info">
          <i data-lucide="map-pin" style="width:15px;height:15px;"></i>
          <span>Entrega para <strong>${state.cep}</strong> • ${state.deliveryWindow}</span>
        </div>
        <form class="cep-form" id="cep-form">
          <input type="text" class="cep-input" id="cep-input" value="${state.cep}" maxlength="9" placeholder="00000-000" />
          <button type="submit" class="cep-btn">Alterar CEP</button>
        </form>
      </div>
    </div>

    <main class="container">
      <section class="hero">
        <div>
          <div class="hero-tag">
            <i data-lucide="sparkles" style="width:14px;height:14px;"></i>
            <span>Ofertas do dia com entrega rápida</span>
          </div>
          <h1>Frescor direto para a sua despensa</h1>
          <p>Hortifruti selecionado, itens básicos e limpeza com frete grátis acima de R$ 150,00 ou 10% OFF usando o cupom <strong>FRESH10</strong>.</p>
        </div>
        <button class="hero-cta" id="hero-offers-btn">Ver ofertas</button>
      </section>

      <div class="toolbar">
        <div class="categories" role="tablist" aria-label="Categorias">
          ${CATEGORIES.map(
            (cat) => `
              <button class="cat-btn ${state.category === cat ? 'active' : ''}" data-cat="${cat}">
                ${cat}
              </button>`
          ).join('')}
        </div>

        <div class="sort-box">
          <label for="sort-select">Ordenar por:</label>
          <select id="sort-select" class="sort-select">
            <option value="featured" ${state.sort === 'featured' ? 'selected' : ''}>Destaques</option>
            <option value="price-asc" ${state.sort === 'price-asc' ? 'selected' : ''}>Menor preço</option>
            <option value="price-desc" ${state.sort === 'price-desc' ? 'selected' : ''}>Maior preço</option>
          </select>
        </div>
      </div>

      <div class="section-header" id="catalog-section">
        <h2 class="section-title">${state.category === 'Todos' ? 'Todos os produtos' : state.category}</h2>
        <span class="section-count">${state.loading ? 'Carregando...' : `${filtered.length} itens`}</span>
      </div>

      <div class="products-grid">
        ${renderProductsGrid(filtered)}
      </div>
    </main>

    <footer class="footer">
      <div class="container">
        FreshMarket • Frontend HTML/CSS/JS integrado via CORS com backend Java (<code>${API_BASE_URL}</code>)
      </div>
    </footer>

    ${renderCartDrawer()}
    ${renderOrderModal()}
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }

  bindEvents();
}

function bindEvents() {
  document.getElementById('reset-home-btn')?.addEventListener('click', () => {
    state.category = 'Todos';
    state.search = '';
    state.sort = 'featured';
    render();
  });

  const searchInput = document.getElementById('search-input');
  searchInput?.addEventListener('input', (e) => {
    state.search = e.target.value;
    render();
    const updatedInput = document.getElementById('search-input');
    if (updatedInput) {
      updatedInput.focus();
      updatedInput.setSelectionRange(updatedInput.value.length, updatedInput.value.length);
    }
  });

  document.getElementById('clear-search-btn')?.addEventListener('click', () => {
    state.search = '';
    render();
  });

  document.getElementById('cep-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = document.getElementById('cep-input')?.value.trim();
    if (val) {
      state.cep = val;
      showToast(`CEP atualizado para ${val}`);
      render();
    }
  });

  document.getElementById('hero-offers-btn')?.addEventListener('click', () => {
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  });

  document.querySelectorAll('.cat-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.category = btn.dataset.cat;
      render();
    });
  });

  document.getElementById('sort-select')?.addEventListener('change', (e) => {
    state.sort = e.target.value;
    render();
  });

  document.querySelectorAll('.add-btn').forEach((btn) => {
    btn.addEventListener('click', () => addToCart(Number(btn.dataset.add)));
  });

  document.getElementById('open-cart-btn')?.addEventListener('click', () => {
    state.cartOpen = true;
    render();
  });

  const closeCart = () => {
    state.cartOpen = false;
    render();
  };

  document.getElementById('close-cart-btn')?.addEventListener('click', closeCart);
  document.getElementById('cart-backdrop')?.addEventListener('click', closeCart);

  document.querySelectorAll('.qty-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      updateQty(Number(btn.dataset.qtyId), Number(btn.dataset.delta));
    });
  });

  document.getElementById('coupon-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = document.getElementById('coupon-input')?.value || '';
    applyCoupon(code);
  });

  document.getElementById('checkout-btn')?.addEventListener('click', handleCheckout);

  document.getElementById('close-modal-btn')?.addEventListener('click', () => {
    state.confirmedOrder = null;
    render();
  });
}

(async function init() {
  render();
  state.products = await apiClient.fetchProducts();
  state.loading = false;
  render();
})();
