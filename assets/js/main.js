// ======================================================
// MAIN CONFIG & UTILITIES - NawHobby
// ======================================================
const API_BASE = 'http://localhost:5134/api';

function mapApiProduct(apiProduct) {
    const id = apiProduct.id || apiProduct.Id;
    const name = apiProduct.name || apiProduct.Name;
    const price = apiProduct.price || apiProduct.Price;
    const imageUrl = apiProduct.imageUrl || apiProduct.ImageUrl;
    const category = apiProduct.category || apiProduct.Category;
    const stock = apiProduct.stock || apiProduct.Stock;

    return {
        id: id,
        name: name,
        price: parseFloat(price), 
        image: imageUrl ? `http://localhost:5134${imageUrl}` : 'assets/images/no-image.jpg',
        grade: category || 'HG',
        stock: stock
    };
}
// Hàm "thổi hồn" cho Dropdown - Dùng chung cho toàn dự án
function initNawHobbyDropdowns() {
    if (window.bootstrap) {
        const dropdowns = document.querySelectorAll('.dropdown-toggle');
        dropdowns.forEach(dd => {
            // Xóa bỏ trạng thái cũ để tránh bị "nháy" hoặc "liệt"
            const instance = bootstrap.Dropdown.getInstance(dd);
            if (instance) instance.dispose();
            
            // Khởi tạo mới: Chế độ CLICK chuột trái
            new bootstrap.Dropdown(dd);
        });
        console.log("🔄 NawHobby: Dropdowns synchronized (Click mode)");
    }
}
async function loadProducts() {
    try {
        showLoading();
        const response = await fetch(`${API_BASE}/products`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const apiProducts = await response.json();
        return apiProducts.map(mapApiProduct);
    } catch (error) {
        console.error('Lỗi tải sản phẩm:', error.message); 
        return []; 
    } finally {
        hideLoading();
    }
}

async function searchProductsAPI(term) {
    try {
        const response = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(term)}`);
        if (!response.ok) return [];
        const apiProducts = await response.json();
        return apiProducts.map(mapApiProduct);
    } catch (error) {
        console.error('Search error:', error);
        return [];
    }
}

function showLoading() {
    const grid = document.getElementById('productGrid');
    if (grid) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><i class="fas fa-spinner fa-spin" style="font-size: 48px; color: var(--gundam-blue);"></i><p>Đang tải sản phẩm...</p></div>';
    }
}

function hideLoading() {}

// ======================================================
// LOGIN/REGISTER TABS
// ======================================================
function switchTab(tabName) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const btns = document.querySelectorAll('.tab-btn');
    if(!loginForm || !registerForm) return;

    if (tabName === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        btns[0].classList.add('active');
        if(btns[1]) btns[1].classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        btns[0].classList.remove('active');
        if(btns[1]) btns[1].classList.add('active');
    }
}

function handleLogin(event) {
    event.preventDefault();
    const email = event.target.email.value;
    const password = event.target.password.value;
    if(email && password) {
        alert(`Đăng nhập thành công!\nChào mừng Gunpla Builder: ${email}`);
        window.location.href = "index.html";
    }
}

function handleRegister(event) {
    event.preventDefault();
    alert("Đăng ký thành công! Vui lòng đăng nhập.");
    switchTab('login');
}

// ======================================================
// AUTH & USER STATE (HIỂN THỊ NÚT ADMIN Ở ĐÂY)
// ======================================================
function getJwtToken() {
    return localStorage.getItem('jwtToken') || '';
}

function isAdmin() {
    return localStorage.getItem('userRole') === 'Admin';
}

function updateUserHeader() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userName = localStorage.getItem('userName') || '';
    
    // Cập nhật tên người dùng trên thanh menu
    const userLinks = document.querySelectorAll('.user-link');
    const ordersLinks = document.querySelectorAll('.orders-link');
    
    // Toggle orders link
    ordersLinks.forEach(link => {
        link.style.display = isLoggedIn ? 'flex' : 'none';
    });
    
    userLinks.forEach(link => {
    // Quan trọng: Bỏ logic parentElement.classList.add('open') cũ nếu có
    if (isLoggedIn && userName) {
        link.innerHTML = `<span>Xin chào<br><b>${userName}</b></span><i class="fas fa-chevron-down ms-1"></i>`;
        link.href = '#'; 
        
        // Kích hoạt tính năng Click của Bootstrap
        link.classList.add('dropdown-toggle');
        link.setAttribute('data-bs-toggle', 'dropdown');
        link.setAttribute('aria-expanded', 'false');
    } else {
        link.innerHTML = '<i class="far fa-user"></i> <span>Đăng nhập</span>';
        link.href = 'login.html';
        link.classList.remove('dropdown-toggle');
        link.removeAttribute('data-bs-toggle');
    }
});

    // BẬT/TẮT NÚT QUẢN LÝ ADMIN (Lỗi bị mất ở bản trước đã được fix)
    const adminNav = document.getElementById('adminNav');
    if (adminNav) {
        adminNav.style.display = isAdmin() ? 'list-item' : 'none';
    }
}

function logout() {
    hideUserModal(); // Close modal if open
    ['isLoggedIn', 'userName', 'userEmail', 'jwtToken', 'userRole', 'userFullName', 'userEmail', 'userPhone'].forEach(key => localStorage.removeItem(key));
    localStorage.removeItem('cart');
    updateUserHeader();
    updateCartBadge();
    showNotification('success', 'Đã đăng xuất & xóa giỏ hàng!');
    setTimeout(() => { window.location.href = 'index.html'; }, 1000);
}

function toggleUserDropdown(event) {
    event.preventDefault();
    const container = event.currentTarget.parentElement;
    container.classList.toggle('open');
}

// Close dropdown when clicking outside
document.addEventListener('click', function(event) {
    const containers = document.querySelectorAll('.user-dropdown-container');
    containers.forEach(container => {
        if (!container.contains(event.target)) {
            container.classList.remove('open');
        }
    });
});

function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    const badges = document.querySelectorAll('#cartCount');
    badges.forEach(badge => badge.textContent = count);
}

// ======================================================
// NOTIFICATION CHUNG (Public + Dashboard)
// ======================================================
function showNotification(type, message) {
    if (typeof type === 'string' && type !== 'success' && type !== 'error') {
        message = type;
        type = 'success';
    }
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    
    // Fallback CSS cho trang public nếu không có file CSS của Dashboard
    if(!document.querySelector('.dashboard-container')) {
        notif.style.cssText = `position: fixed; top: 20px; right: 20px; padding: 15px 25px; background: ${type === 'success' ? '#10b981' : '#ef4444'}; color: white; border-radius: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.2); z-index: 9999; display: flex; align-items: center; gap: 10px; transition: transform 0.4s; transform: translateX(400px);`;
    }
    
    document.body.appendChild(notif);
    setTimeout(() => {
        if(!document.querySelector('.dashboard-container')) notif.style.transform = 'translateX(0)';
        else notif.classList.add('show');
    }, 100);

    setTimeout(() => {
        if(!document.querySelector('.dashboard-container')) notif.style.transform = 'translateX(400px)';
        else notif.classList.remove('show');
        setTimeout(() => notif.remove(), 400);
    }, 3000);
}

// ======================================================
// ADMIN DASHBOARD - NAVIGATION (CHỐNG NHẢY TRANG)
// ======================================================
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    
    const activeSec = document.getElementById(sectionId);
    if (activeSec) {
        activeSec.classList.add('active');
        localStorage.setItem('currentAdminTab', sectionId);
    }

    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(sectionId)) {
            link.classList.add('active');
        }
    });

    const pageTitle = document.getElementById('pageTitle');
    if (pageTitle) {
        const titles = { 'products': 'Quản lý Sản phẩm', 'inventory': 'Quản lý Kho hàng', 'orders': 'Quản lý Đơn hàng' };
        pageTitle.textContent = titles[sectionId] || 'Dashboard';
    }

    if (sectionId === 'inventory' && typeof loadInventory === 'function') {
        loadInventory();
    }
}
window.showSection = showSection;

// ======================================================
// FALLBACK & RENDER PRODUCTS (TRANG CHỦ)
// ======================================================
const fallbackProducts = [
    { id: 1, name: 'HG 1/144 XI GUNDAM', price: 350000, image: 'assets/images/hg xi.jpg', grade: 'HG', stock: 5 },
    { id: 2, name: 'HG 1/144 GUNDAM Barbatos Lupus', price: 380000, image: 'assets/images/hg lupus.jpg', grade: 'HG', stock: 2 },
    { id: 3, name: 'HG 1/144 ALYZEUS', price: 320000, image: 'assets/images/hg alyzeus.jpg', grade: 'HG', stock: 0 }
];

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function renderProducts(productList) {
    const productGrid = document.getElementById('productGrid');
    if (!productGrid) return; // Bỏ qua nếu đang ở trang Admin
    
    if (productList.length === 0) {
        productGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;"><i class="fas fa-search" style="font-size: 48px; color: #ccc; margin-bottom: 15px;"></i><p>Không tìm thấy sản phẩm nào!</p></div>';
        hideGradeFilterInfo();
        return;
    }
    
    productGrid.innerHTML = productList.map(product => `
        <div class="product-card ${product.stock === 0 ? 'out-of-stock-card' : ''}">
            <img src="${product.image}" alt="${product.name}" class="product-img" loading="lazy" onerror="this.src='assets/images/no-image.jpg'">
            <span class="product-grade">${product.grade}</span>
            <h3 class="product-name">${product.name}</h3>
            <span class="product-price">${formatPrice(product.price)}</span>
            <button class="btn-buy" onclick="addToCart(${product.id})" ${product.stock === 0 ? 'disabled' : ''}>
                <i class="fas fa-shopping-cart"></i> ${product.stock === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
            </button>
        </div>
    `).join('');
}

let currentProducts = []; 
let currentGradeFilter = null;

function addToCart(productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (!product || product.stock <= 0) {
        showNotification('error', 'Sản phẩm đã hết hàng!');
        return;
    }
    
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        if (existingItem.quantity < product.stock) existingItem.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartBadge();
    showNotification('success', 'Đã thêm "' + product.name + '" vào giỏ hàng!');
}

// ======================================================
// SEARCH & FILTER (TÌM KIẾM & BỘ LỌC TRANG CHỦ)
// ======================================================
function searchProductsLocal(productsList, keyword) {
    const searchTerm = keyword.toLowerCase().trim();
    if (!searchTerm) return productsList;
    return productsList.filter(product => 
        product.name.toLowerCase().includes(searchTerm) ||
        product.grade.toLowerCase().includes(searchTerm)
    );
}

function setupSearch() {
    const searchBox = document.querySelector('.search-box');
    if (!searchBox) return;
    
    const searchInput = searchBox.querySelector('input');
    const searchBtn = searchBox.querySelector('button');
    
    if (searchInput) {
        searchInput.addEventListener('keyup', function(event) {
            if (event.key === 'Enter') searchProductsAPIHandler(this.value);
        });
        let debounceTimer;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => searchProductsAPIHandler(this.value), 300);
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            searchProductsAPIHandler(searchInput ? searchInput.value : '');
        });
    }
}

async function searchProductsAPIHandler(term) {
    currentGradeFilter = null;
    hideGradeFilterInfo();
    
    let products;
    if (!term.trim()) {
        products = currentProducts;
    } else {
        products = await searchProductsAPI(term);
        if (products.length === 0) products = searchProductsLocal(currentProducts, term);
    }
    
    renderProducts(products);
    
    const searchInfo = document.getElementById('searchInfo');
    const searchResultText = document.getElementById('searchResultText');
    if (searchInfo && searchResultText) {
        searchInfo.style.display = term.trim() ? 'block' : 'none';
        searchResultText.innerHTML = `<i class="fas fa-search"></i> Tìm thấy <strong>${products.length}</strong> sản phẩm cho "<strong>${term}</strong>"`;
        const clearBtn = searchInfo.querySelector('button');
        if (clearBtn) clearBtn.onclick = () => { searchInput.value=''; searchProductsAPIHandler(''); };
    }
}

function filterByGrade(grade) {
    currentGradeFilter = grade.toUpperCase();
    const filteredProducts = currentProducts.filter(product => (product.grade || '').toUpperCase() === grade.toUpperCase());
    renderProducts(filteredProducts);
    updateGradeFilterUI(grade.toUpperCase(), filteredProducts.length);
    
    document.querySelectorAll('.grade-filter-link').forEach(link => link.classList.remove('grade-active'));
    if(event && event.target) event.target.classList.add('grade-active');
}

function clearGradeFilter() {
    currentGradeFilter = null;
    renderProducts(currentProducts);
    hideGradeFilterInfo();
    document.querySelectorAll('.grade-filter-link').forEach(link => link.classList.remove('grade-active'));
}

function updateGradeFilterUI(grade, count) {
    const filterInfo = document.getElementById('gradeFilterInfo');
    const filterText = document.getElementById('gradeFilterText');
    if (filterInfo && filterText) {
        filterInfo.style.display = 'flex';
        filterInfo.classList.add('show');
        filterText.innerHTML = `Đang lọc theo Grade: <strong>${grade}</strong> (<strong>${count}</strong> sản phẩm)`;
    }
}

function hideGradeFilterInfo() {
    const filterInfo = document.getElementById('gradeFilterInfo');
    if (filterInfo) filterInfo.classList.remove('show');
}

function setupGradeFilter() {
    const gradeLinks = document.querySelectorAll('.grade-filter-link');
    gradeLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            filterByGrade(this.dataset.grade);
        });
    });
    
    const clearBtn = document.getElementById('gradeFilterClear');
    if (clearBtn) clearBtn.addEventListener('click', clearGradeFilter);
}

// ======================================================
// INITIALIZATION (KHỞI TẠO HỆ THỐNG KHI LOAD TRANG)
// ======================================================
// ======================================================
 // USER MODAL FUNCTIONS (NEW - Task requirement)
 // ======================================================
 function createUserModal() {
     if (document.getElementById('userModal')) return;

     const overlay = document.createElement('div');
     overlay.id = 'modalOverlay';
     overlay.className = 'modal-overlay';

     const modal = document.createElement('div');
     modal.id = 'userModal';

     const fullName = localStorage.getItem('userFullName') || 'Nguyễn Văn A';
     const email = localStorage.getItem('userEmail') || 'admin@example.com';
     const phone = localStorage.getItem('userPhone') || '0123 456 789';

     modal.innerHTML = `
         <div class="modal-header">
             <h2 class="modal-title"><i class="fas fa-user-edit"></i> Thông tin người dùng</h2>
         </div>
         <div class="modal-body">
             <div class="form-group">
                 <label for="modalFullName">Họ và tên:</label>
                 <input type="text" id="modalFullName" value="${fullName}">
             </div>
             <div class="form-group">
                 <label for="modalEmail">Email:</label>
                 <input type="email" id="modalEmail" value="${email}">
             </div>
             <div class="form-group">
                 <label for="modalPhone">Số điện thoại:</label>
                 <input type="tel" id="modalPhone" value="${phone}">
             </div>
         </div>
         <div class="modal-footer">
             <button class="btn-modal btn-save" onclick="saveUserInfo()">Lưu</button>
             <button class="btn-modal btn-close" onclick="hideUserModal()">Đóng</button>
         </div>
     `;

     document.body.appendChild(overlay);
     document.body.appendChild(modal);
 }

 function showUserModal() {
     createUserModal();
     document.getElementById('userModal').style.display = 'block';
     document.getElementById('modalOverlay').style.display = 'block';
 }

 function hideUserModal() {
     const modal = document.getElementById('userModal');
     const overlay = document.getElementById('modalOverlay');
     if (modal) modal.style.display = 'none';
     if (overlay) overlay.style.display = 'none';
 }

 function saveUserInfo() {
     const fullName = document.getElementById('modalFullName').value;
     const email = document.getElementById('modalEmail').value;
     const phone = document.getElementById('modalPhone').value;

     localStorage.setItem('userFullName', fullName);
     localStorage.setItem('userEmail', email);
     localStorage.setItem('userPhone', phone);

     showNotification('success', 'Đã cập nhật thông tin thành công!');
     hideUserModal();
 }

 // Close modal on overlay click
 document.addEventListener('click', function(e) {
     if (e.target.id === 'modalOverlay') {
         hideUserModal();
     }
 });

// Event delegation for dropdown menu items (works after HTML update)
 document.addEventListener('click', function(e) {
     if (e.target.id === 'openUserInfo' || e.target.closest('a[id="openUserInfo"]')) {
         e.stopPropagation();
         showUserModal();
     } else if (e.target.id === 'logoutBtn' || e.target.closest('a[id="logoutBtn"]')) {
         e.stopPropagation();
         logout();
     }
 });

async function loadHeader() {
    try {
        const response = await fetch('header.html');
        if (!response.ok) throw new Error('Header fetch failed');
        const html = await response.text();
        const container = document.getElementById('header-container');
        
        if (container) {
            container.innerHTML = html;
            
            // 1. Cập nhật tên User & Badge giỏ hàng ngay lập tức
            updateUserHeader();
            updateCartBadge();

            // 2. KÍCH HOẠT SỰ KIỆN CLICK (Bắt buộc để thay thế Hover)
            if (window.bootstrap) {
                const dropdowns = document.querySelectorAll('.dropdown-toggle');
                dropdowns.forEach(dd => {
                    // Hủy các cài đặt cũ để tránh xung đột (nháy menu)
                    const instance = bootstrap.Dropdown.getInstance(dd);
                    if (instance) instance.dispose();
                    
                    // Khởi tạo mới: Bây giờ click chuột mới hiện
                    new bootstrap.Dropdown(dd);
                });
            }
            console.log('✅ Header nạp xong & Dropdown đã chuyển sang chế độ Click');
        }
    } catch (error) {
        console.error('Failed to load header:', error);
    }
    initNawHobbyDropdowns();
}
async function loadFooter() {
    try {
        const response = await fetch('footer.html');
        if (!response.ok) throw new Error('Footer fetch failed');
        const html = await response.text();
        const container = document.getElementById('footer-container');
        if (container) {
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Failed to load footer:', error);
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    // Load dynamic header/footer first
    await loadHeader();
    await loadFooter();
    
    // Existing logic after load
    // 1. Cập nhật Menu & Header (Cho tất cả trang)
    // (called in loadHeader)
    
    // Add click listeners for user dropdown (delegated globally)
    
    // 2. Chạy logic hiển thị Sản phẩm (Chỉ chạy ở trang Chủ/Sản phẩm)
    const productGrid = document.getElementById('productGrid');
    if (productGrid) {
        currentProducts = await loadProducts();
        if (currentProducts.length === 0) {
            currentProducts = fallbackProducts;
            showNotification('error', 'Sử dụng dữ liệu mẫu do không kết nối được Server.');
        }
        renderProducts(currentProducts);
        setupSearch();
        setupGradeFilter();
    }

    // 3. Form Liên hệ
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            showNotification('success', 'Cảm ơn! Chúng tôi sẽ liên hệ sớm.');
            contactForm.reset();
        });
    }
});