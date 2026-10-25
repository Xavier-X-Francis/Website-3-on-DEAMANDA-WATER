const STORAGE_KEYS = {
  settings: 'deamandaWaterSettings',
  sales: 'deamandaWaterSales',
};

const DEFAULT_SETTINGS = {
  companyName: 'DEAMANDA WATER',
  pricePerBag: 2000,
};

const managerPassword = 'intellect1';

const elements = {
  openManagerButton: document.getElementById('openManager'),
  toggleManagerPanel: document.getElementById('toggleManagerPanel'),
  managerModal: document.getElementById('managerModal'),
  managerLoginForm: document.getElementById('managerLoginForm'),
  managerPasswordInput: document.getElementById('managerPassword'),
  loginMessage: document.getElementById('loginMessage'),
  managerContent: document.getElementById('managerContent'),
  managerLockedState: document.getElementById('managerLockedState'),
  adminBadge: document.getElementById('adminBadge'),
  companyNameInput: document.getElementById('companyNameInput'),
  pricePerBagInput: document.getElementById('pricePerBagInput'),
  saveSettingsButton: document.getElementById('saveSettings'),
  resetSalesButton: document.getElementById('resetSales'),
  saleForm: document.getElementById('saleForm'),
  buyerNameInput: document.getElementById('buyerName'),
  bagsSoldInput: document.getElementById('bagsSold'),
  saleDateInput: document.getElementById('saleDate'),
  computedPriceInput: document.getElementById('computedPrice'),
  saleTotalDisplay: document.getElementById('saleTotal'),
  salesTableBody: document.getElementById('salesTableBody'),
  totalBagsDisplay: document.getElementById('totalBagsDisplay'),
  totalRevenueDisplay: document.getElementById('totalRevenueDisplay'),
  currentPriceDisplay: document.getElementById('currentPriceDisplay'),
  buyerCountDisplay: document.getElementById('buyerCountDisplay'),
  monthlySalesDisplay: document.getElementById('monthlySalesDisplay'),
  averageSaleDisplay: document.getElementById('averageSaleDisplay'),
};

let state = {
  settings: loadSettings(),
  sales: loadSales(),
  managerUnlocked: false,
};

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return '—';

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function loadSettings() {
  const storedSettings = localStorage.getItem(STORAGE_KEYS.settings);
  if (!storedSettings) {
    return { ...DEFAULT_SETTINGS };
  }

  try {
    const parsed = JSON.parse(storedSettings);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
    };
  } catch (error) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(state.settings));
}

function loadSales() {
  const storedSales = localStorage.getItem(STORAGE_KEYS.sales);

  if (!storedSales) {
    return [];
  }

  try {
    return JSON.parse(storedSales);
  } catch (error) {
    return [];
  }
}

function saveSales() {
  localStorage.setItem(STORAGE_KEYS.sales, JSON.stringify(state.sales));
}

function updatePriceDisplay() {
  const price = Number(state.settings.pricePerBag) || 0;
  elements.computedPriceInput.value = formatCurrency(price);
  elements.saleTotalDisplay.textContent = formatCurrency(price * Number(elements.bagsSoldInput.value || 0));
  elements.currentPriceDisplay.textContent = formatCurrency(price);
}

function renderSalesTable() {
  if (!state.sales.length) {
    elements.salesTableBody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">No sales recorded yet.</td>
      </tr>
    `;
    return;
  }

  const rows = state.sales
    .slice()
    .reverse()
    .map(
      (sale) => `
        <tr>
          <td>${sale.buyerName}</td>
          <td>${sale.bagsSold}</td>
          <td>${formatCurrency(sale.pricePerBag)}</td>
          <td>${formatCurrency(sale.totalPrice)}</td>
          <td>${formatDate(sale.date)}</td>
        </tr>
      `,
    )
    .join('');

  elements.salesTableBody.innerHTML = rows;
}

function renderSummary() {
  const totalBags = state.sales.reduce((sum, item) => sum + Number(item.bagsSold || 0), 0);
  const totalRevenue = state.sales.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0);
  const buyerCount = new Set(state.sales.map((item) => item.buyerName.toLowerCase().trim())).size;
  const averageSale = state.sales.length ? totalRevenue / state.sales.length : 0;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlySales = state.sales.reduce((sum, item) => {
    const saleDate = new Date(item.date);
    if (
      saleDate.getMonth() === currentMonth &&
      saleDate.getFullYear() === currentYear
    ) {
      return sum + Number(item.totalPrice || 0);
    }
    return sum;
  }, 0);

  elements.totalBagsDisplay.textContent = totalBags.toLocaleString();
  elements.totalRevenueDisplay.textContent = formatCurrency(totalRevenue);
  elements.buyerCountDisplay.textContent = buyerCount.toLocaleString();
  elements.monthlySalesDisplay.textContent = formatCurrency(monthlySales);
  elements.averageSaleDisplay.textContent = formatCurrency(averageSale);

  const companyName = state.settings.companyName || DEFAULT_SETTINGS.companyName;
  document.title = `${companyName} | Sales Tracker`;
  document.querySelector('.brand-wrap h1').textContent = companyName;
}

function syncSettingsForm() {
  elements.companyNameInput.value = state.settings.companyName || DEFAULT_SETTINGS.companyName;
  elements.pricePerBagInput.value = Number(state.settings.pricePerBag) || DEFAULT_SETTINGS.pricePerBag;
  updatePriceDisplay();
}

function setManagerAccess(isUnlocked) {
  state.managerUnlocked = isUnlocked;
  elements.managerContent.classList.toggle('hidden', !isUnlocked);
  elements.managerLockedState.classList.toggle('hidden', isUnlocked);
  elements.adminBadge.textContent = isUnlocked ? 'Unlocked' : 'Locked';
  elements.adminBadge.classList.toggle('success', isUnlocked);
  elements.adminBadge.classList.toggle('muted', !isUnlocked);
}

function openManagerModal() {
  elements.managerModal.classList.remove('hidden');
  elements.managerModal.setAttribute('aria-hidden', 'false');
  elements.managerPasswordInput.value = '';
  elements.loginMessage.textContent = '';
  elements.managerPasswordInput.focus();
}

function closeManagerModal() {
  elements.managerModal.classList.add('hidden');
  elements.managerModal.setAttribute('aria-hidden', 'true');
}

function handleLogin(event) {
  event.preventDefault();
  const password = elements.managerPasswordInput.value.trim();

  if (password === managerPassword) {
    setManagerAccess(true);
    closeManagerModal();
    return;
  }

  elements.loginMessage.textContent = 'Incorrect password. Please try again.';
}

function handleSaveSettings() {
  const companyName = elements.companyNameInput.value.trim() || DEFAULT_SETTINGS.companyName;
  const pricePerBag = Number(elements.pricePerBagInput.value) || DEFAULT_SETTINGS.pricePerBag;

  state.settings = {
    companyName,
    pricePerBag,
  };

  saveSettings();
  syncSettingsForm();
  renderSummary();
  renderSalesTable();
  alert('Settings saved successfully.');
}

function handleResetSales() {
  if (!window.confirm('This will clear all sales records. Continue?')) {
    return;
  }

  state.sales = [];
  saveSales();
  renderSalesTable();
  renderSummary();
}

function handleSaleSubmit(event) {
  event.preventDefault();

  const buyerName = elements.buyerNameInput.value.trim();
  const bagsSold = Number(elements.bagsSoldInput.value);
  const date = elements.saleDateInput.value;

  if (!buyerName || !bagsSold || !date) {
    alert('Please complete buyer name, bags sold, and date before saving.');
    return;
  }

  const sale = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    buyerName,
    bagsSold,
    pricePerBag: Number(state.settings.pricePerBag) || DEFAULT_SETTINGS.pricePerBag,
    totalPrice: Number(state.settings.pricePerBag) * bagsSold,
    date,
  };

  state.sales.push(sale);
  saveSales();
  renderSalesTable();
  renderSummary();
  event.target.reset();
  elements.bagsSoldInput.value = 1;
  const today = new Date().toISOString().split('T')[0];
  elements.saleDateInput.value = today;
  updatePriceDisplay();
}

function initializeDateField() {
  const today = new Date().toISOString().split('T')[0];
  elements.saleDateInput.value = today;
}

function bindEvents() {
  elements.openManagerButton.addEventListener('click', openManagerModal);
  elements.toggleManagerPanel.addEventListener('click', openManagerModal);
  elements.managerLoginForm.addEventListener('submit', handleLogin);
  elements.saveSettingsButton.addEventListener('click', handleSaveSettings);
  elements.resetSalesButton.addEventListener('click', handleResetSales);
  elements.saleForm.addEventListener('submit', handleSaleSubmit);
  elements.bagsSoldInput.addEventListener('input', updatePriceDisplay);

  document.querySelectorAll('[data-close="true"]').forEach((trigger) => {
    trigger.addEventListener('click', closeManagerModal);
  });
}

function init() {
  state.settings = loadSettings();
  state.sales = loadSales();
  bindEvents();
  initializeDateField();
  syncSettingsForm();
  renderSummary();
  renderSalesTable();
  setManagerAccess(false);
}

window.addEventListener('DOMContentLoaded', init);
// C:\Users\kenechukwu!\Documents\Practice VS Code\Website 3 on DEAMANDA WATER