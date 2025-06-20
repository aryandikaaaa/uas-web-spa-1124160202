// SCRIPT DIBAWAH INI MEMILIKI PENAMBAHAN LOGIKA UNTUK DARK MODE
// ===== BAGIAN LOGIKA TEMA (LIGHT/DARK MODE) =====
const themeToggleBtn = document.getElementById('theme-toggle');
const themeToggleDarkIcon = document.getElementById('theme-toggle-dark-icon');
const themeToggleLightIcon = document.getElementById('theme-toggle-light-icon');

// Fungsi untuk menerapkan tema
function applyTheme(theme) {
	if (theme === 'dark') {
		document.documentElement.classList.add('dark');
		themeToggleLightIcon.classList.add('hidden');
		themeToggleDarkIcon.classList.remove('hidden');
	} else {
		document.documentElement.classList.remove('dark');
		themeToggleDarkIcon.classList.add('hidden');
		themeToggleLightIcon.classList.remove('hidden');
	}
}

// Cek tema saat halaman dimuat
const savedTheme = localStorage.getItem('theme');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
applyTheme(currentTheme);

// Event listener untuk tombol toggle
themeToggleBtn.addEventListener('click', () => {
	const isDark = document.documentElement.classList.contains('dark');
	const newTheme = isDark ? 'light' : 'dark';
	localStorage.setItem('theme', newTheme);
	applyTheme(newTheme);
});

// ===== DATA & VARIABEL GLOBAL (Sama seperti sebelumnya) =====
let transactions = [];
let currentDiscount = 0;
let appliedPromoCode = '';
const promoCodes = {
	"DISKON10": {
		type: "percentage",
		discount: 10,
		description: "Potongan 10%"
	},
	"HEMAT50K": {
		type: "fixed",
		discount: 50000,
		description: "Diskon tetap Rp 50.000"
	},
	"STUDENT20": {
		type: "percentage",
		discount: 20,
		description: "Diskon 20% pelajar"
	}
};
const paymentMethodColors = {
	'transfer': 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
	'ewallet': 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300',
	'credit': 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
	'cash': 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
};
const paymentMethodNames = {
	'transfer': 'Transfer Bank',
	'ewallet': 'E-Wallet',
	'credit': 'Kartu Kredit',
	'cash': 'Bayar Tunai'
};

// ===== SELEKSI ELEMEN DOM =====
const paymentForm = document.getElementById('paymentForm');
const productSelect = document.getElementById('productSelect');
const quantity = document.getElementById('quantity');
const promoCode = document.getElementById('promoCode');
const applyPromoBtn = document.getElementById('applyPromoBtn');
const resetPromoBtn = document.getElementById('resetPromoBtn');
const subtotalEl = document.getElementById('subtotal');
const discountEl = document.getElementById('discount');
const discountRow = document.getElementById('discountRow');
const totalAmountEl = document.getElementById('totalAmount');
const transactionListBody = document.getElementById('transactionListBody');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const totalTransactionsEl = document.getElementById('totalTransactions');
const totalRevenueEl = document.getElementById('totalRevenue');
const avgTransactionEl = document.getElementById('avgTransaction');
const paymentModal = document.getElementById('paymentModal');
const paymentDetails = document.getElementById('paymentDetails');
const closeModalBtn = document.getElementById('closeModalBtn');
const toastContainer = document.getElementById('toastContainer');
const transactionTemplate = document.getElementById('transactionTemplate');

// ===== FUNGSI UTILITY & UI =====
const formatCurrency = (amount) => new Intl.NumberFormat('id-ID', {
	style: 'currency',
	currency: 'IDR',
	minimumFractionDigits: 0
}).format(amount);
const getCurrentTime = () => new Date().toLocaleTimeString('id-ID', {
	hour: '2-digit',
	minute: '2-digit'
});

function showToast(message, type = 'info') {
	const toast = document.createElement('div');
	const colors = {
		success: 'bg-green-500',
		error: 'bg-red-500',
		info: 'bg-teal-500'
	};
	toast.className = `p-4 rounded-lg text-white shadow-lg transform translate-x-full opacity-0 transition-all duration-300 ease-in-out ${colors[type]}`;
	toast.textContent = message;
	toastContainer.appendChild(toast);
	setTimeout(() => {
		toast.classList.remove('translate-x-full', 'opacity-0');
	}, 10);
	setTimeout(() => {
		toast.classList.add('translate-x-full', 'opacity-0');
		toast.addEventListener('transitionend', () => toast.remove());
	}, 3000);
}

function showPaymentModal(transaction) {
	paymentDetails.innerHTML = `<div class="flex justify-between"><span>ID Transaksi:</span><span class="font-medium">${transaction.id}</span></div> <div class="flex justify-between"><span>Nama:</span><span class="font-medium">${transaction.customerName}</span></div> <div class="flex justify-between"><span>Produk:</span><span class="font-medium">${transaction.productName}</span></div> <div class="flex justify-between"><span>Metode:</span><span class="font-medium">${paymentMethodNames[transaction.paymentMethod]}</span></div> ${transaction.discount > 0 ? `<div class="flex justify-between text-green-500 dark:text-green-400"><span>Diskon:</span><span class="font-medium">-${formatCurrency(transaction.discount)}</span></div>` : ''} <hr class="my-2 border-slate-200 dark:border-slate-700"><div class="flex justify-between text-lg font-semibold"><span>Total:</span><span class="text-green-600 dark:text-green-400">${formatCurrency(transaction.total)}</span></div>`;
	paymentModal.classList.remove('opacity-0', 'scale-95', 'pointer-events-none');
}

const closeModal = () => paymentModal.classList.add('opacity-0', 'scale-95', 'pointer-events-none');

// ===== FUNGSI KALKULASI & PROMO =====
function updateTotal() {
	const selectedOption = productSelect.options[productSelect.selectedIndex];
	const price = parseInt(selectedOption.dataset.price) || 0;
	const subtotal = price * (parseInt(quantity.value) || 1);
	const promoData = appliedPromoCode ? promoCodes[appliedPromoCode] : null;
	let discount = 0;
	if (promoData) {
		discount = promoData.type === 'percentage' ? Math.round(subtotal * promoData.discount / 100) : Math.min(promoData.discount, subtotal);
	}
	subtotalEl.textContent = formatCurrency(subtotal);
	discountEl.textContent = '-' + formatCurrency(discount);
	discountRow.classList.toggle('opacity-100', discount > 0);
	discountRow.classList.toggle('opacity-0', discount === 0);
	totalAmountEl.textContent = formatCurrency(subtotal - discount);
	currentDiscount = discount;
}

function applyPromo() {
	const code = promoCode.value.trim().toUpperCase();
	if (!code) return showToast('Masukkan kode promo', 'error');
	if (!promoCodes[code]) return showToast('Kode promo tidak valid', 'error');
	appliedPromoCode = code;
	updateTotal();
	showToast(`Promo "${promoCodes[code].description}" berhasil diterapkan!`, 'success');
	promoCode.disabled = true;
	applyPromoBtn.disabled = true;
	applyPromoBtn.classList.add('bg-gray-400', 'cursor-not-allowed');
}

function resetPromo() {
	appliedPromoCode = '';
	promoCode.value = '';
	promoCode.disabled = false;
	applyPromoBtn.disabled = false;
	applyPromoBtn.classList.remove('bg-gray-400', 'cursor-not-allowed');
	updateTotal();
}

// ===== FUNGSI DATA (Local Storage & Rendering) =====
const saveTransactions = () => localStorage.setItem('transactions', JSON.stringify(transactions));
const loadTransactions = () => {
	const data = localStorage.getItem('transactions');
	transactions = data ? JSON.parse(data) : [];
};

function renderTransactions() {
	transactionListBody.innerHTML = '';
	if (transactions.length === 0) {
		transactionListBody.innerHTML = `<tr><td colspan="5" class="text-center text-slate-500 py-8">Belum ada transaksi</td></tr>`;
		clearHistoryBtn.classList.add('opacity-0', 'hidden');
	} else {
		clearHistoryBtn.classList.remove('opacity-0', 'hidden');
		transactions.forEach(transaction => {
			const row = transactionTemplate.content.cloneNode(true).querySelector('tr');
			row.querySelector('.transaction-customer').textContent = transaction.customerName;
			row.querySelector('.transaction-product').textContent = `${transaction.productName} (${transaction.quantity}x)`;
			row.querySelector('.transaction-method').innerHTML = `<span class="px-2 py-1 text-xs font-medium rounded-full ${paymentMethodColors[transaction.paymentMethod]}">${paymentMethodNames[transaction.paymentMethod]}</span>`;
			row.querySelector('.transaction-amount').textContent = formatCurrency(transaction.total);
			row.querySelector('.transaction-time').textContent = transaction.time;
			row.classList.add('opacity-0', 'translate-y-2', 'transition-all', 'duration-300');
			transactionListBody.prepend(row);
			setTimeout(() => row.classList.remove('opacity-0', 'translate-y-2'), 50);
		});
	}
	updateStatistics();
}

function updateStatistics() {
	const totalTrans = transactions.length;
	const totalRev = transactions.reduce((sum, t) => sum + t.total, 0);
	const avgTrans = totalTrans > 0 ? totalRev / totalTrans : 0;
	totalTransactionsEl.textContent = totalTrans;
	totalRevenueEl.textContent = formatCurrency(totalRev);
	avgTransactionEl.textContent = formatCurrency(avgTrans);
}

// ===== FUNGSI UTAMA (Event Handlers) =====
function processPayment(e) {
	e.preventDefault();
	const formData = new FormData(paymentForm);
	if (!formData.get('paymentMethod')) return showToast('Pilih metode pembayaran!', 'error');
	const subtotal = (parseInt(productSelect.options[productSelect.selectedIndex].dataset.price) || 0) * (parseInt(formData.get('quantity')) || 1);
	const total = subtotal - currentDiscount;
	if (total < 0) return showToast('Total tidak boleh negatif!', 'error');
	const newTransaction = {
		id: 'TRX' + Date.now().toString().slice(-6),
		customerName: formData.get('customerName'),
		productName: productSelect.options[productSelect.selectedIndex].text.split(' - ')[0],
		quantity: parseInt(formData.get('quantity')),
		paymentMethod: formData.get('paymentMethod'),
		discount: currentDiscount,
		total: total,
		time: getCurrentTime()
	};
	transactions.push(newTransaction);
	saveTransactions();
	renderTransactions();
	showPaymentModal(newTransaction);
	paymentForm.reset();
	resetPromo();
}

function clearAllHistory() {
	if (confirm('Anda yakin ingin menghapus SEMUA riwayat transaksi? Aksi ini tidak dapat dibatalkan.')) {
		transactions = [];
		localStorage.removeItem('transactions');
		renderTransactions();
		showToast('Riwayat transaksi telah dihapus.', 'info');
	}
}

// ===== INISIALISASI & EVENT LISTENERS =====
function initApp() {
	paymentForm.addEventListener('submit', processPayment);
	productSelect.addEventListener('change', updateTotal);
	quantity.addEventListener('input', updateTotal);
	applyPromoBtn.addEventListener('click', applyPromo);
	resetPromoBtn.addEventListener('click', resetPromo);
	clearHistoryBtn.addEventListener('click', clearAllHistory);
	closeModalBtn.addEventListener('click', closeModal);
	paymentModal.addEventListener('click', (e) => e.target === paymentModal && closeModal());
	document.addEventListener('keydown', (e) => e.key === 'Escape' && closeModal());

	loadTransactions();
	renderTransactions();
	updateTotal();
	document.getElementById('customerName').focus();
}

document.addEventListener('DOMContentLoaded', initApp);