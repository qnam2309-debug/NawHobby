// ======================================================
// CHECKOUT LOGIC - NAWHOBBY (FULL VERSION - NO DELETION)
// ======================================================

const CHECKOUT_API = 'http://localhost:5134/api';

document.addEventListener('DOMContentLoaded', function() {
    // 1. Kiểm tra đăng nhập ngay khi vào trang
    checkAuthOnLoad();

    // 2. Tự điền tên từ Google/Tài khoản thường nếu form trống
    const savedName = localStorage.getItem('userName');
    if (savedName && document.getElementById('fullName') && !document.getElementById('fullName').value) {
        document.getElementById('fullName').value = savedName;
    }

    renderCheckout();
    setupPaymentToggle(); 
    
    // 3. Khởi tạo danh sách địa chỉ đã lưu (Shopee Style - LocalStorage)
    renderAddressBook();
    
    // 4. Load API addresses (Database)
    loadUserAddresses();

    const form = document.getElementById('checkoutForm');
    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            placeOrder();
        });
    }
});

// HÀM KIỂM TRA ĐĂNG NHẬP
function checkAuthOnLoad() {
    const token = localStorage.getItem('jwtToken');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';

    if (!token && !isLoggedIn) {
        localStorage.setItem('redirectAfterLogin', window.location.href);
        window.location.href = 'login.html';
    }
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

// HÀM HIỂN THỊ GIỎ HÀNG
function renderCheckout() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const container = document.getElementById('checkout-items');
    const totalAmountEl = document.getElementById('total-amount');
    
    if (cart.length === 0) {
        if (container) container.innerHTML = '<div class="p-4 text-center">Giỏ hàng trống!</div>';
        return;
    }

    let subtotal = 0;
    let html = '';

    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        html += `
            <div class="item-row p-3 d-flex align-items-center" style="border-bottom: 1px solid #eee;">
                <img src="${item.image}" class="item-img me-3" style="width:60px; height:60px; object-fit:contain;">
                <div class="flex-grow-1">
                    <h6 class="mb-0 fw-bold">${item.name}</h6>
                    <small class="text-muted">SL: ${item.quantity} x ${formatPrice(item.price)}</small>
                </div>
                <div class="text-end fw-bold text-primary">${formatPrice(itemTotal)}</div>
            </div>`;
    });

    if (container) container.innerHTML = html;
    
const shipping = 0;  // Luôn miễn phí mọi đơn hàng
    const total = subtotal;

    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('shippingFee').textContent = "Miễn phí";
    if (totalAmountEl) totalAmountEl.textContent = formatPrice(total);
}

// HÀM XỬ LÝ CHỌN PHƯƠNG THỨC THANH TOÁN
function setupPaymentToggle() {
    const radios = document.querySelectorAll('input[name="paymentMethod"]');
    const qrContainer = document.getElementById('qrCodeContainer');
    const submitBtn = document.getElementById('placeOrderBtn'); 
    
    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.value === 'BANK') {
                const totalText = document.getElementById('total-amount').textContent.replace(/[^\d]/g, '');
                const totalAmount = parseInt(totalText) || 0;
                
                qrContainer.classList.remove('d-none');
                qrContainer.innerHTML = `
                    <div class="p-3 border rounded bg-white shadow-sm w-100 text-center">
                        <p class="mb-2 text-primary fw-bold">Quét mã VietQR để thanh toán ${formatPrice(totalAmount)}</p>
                        <div id="qr-placeholder" class="d-flex align-items-center justify-content-center border rounded" style="height: 220px; background: #f8fafc;">
                            <div class="text-center">
                                <i class="fas fa-spinner fa-spin fa-2x mb-2 text-primary"></i>
                                <p class="small text-muted mb-0">Mã QR chính xác sẽ hiện<br>sau khi bạn nhấn Đặt hàng</p>
                            </div>
                        </div>
                        <p class="small text-danger mt-2 mb-0"><i class="fas fa-exclamation-circle"></i> Vui lòng không tắt trang web cho đến khi nhận được thông báo thành công!</p>
                    </div>`;
                
                submitBtn.innerHTML = '<i class="fas fa-qrcode me-2"></i>XÁC NHẬN & HIỆN MÃ QR';
                submitBtn.style.backgroundColor = '#10b981';
            } else {
                qrContainer.classList.add('d-none');
                qrContainer.innerHTML = '';
                submitBtn.innerHTML = '<i class="fas fa-check me-2"></i>ĐẶT HÀNG NGAY';
                submitBtn.style.backgroundColor = ''; 
            }
        });
    });
}

// HÀM ĐẶT HÀNG CHÍNH
async function placeOrder() {
    const btn = document.getElementById('placeOrderBtn');
    const originalText = btn.innerHTML;
    const originalColor = btn.style.backgroundColor;
    
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const token = localStorage.getItem('jwtToken');

    // Lấy dữ liệu từ các ô input địa chỉ
    const fullName = document.getElementById('fullName').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const province = document.getElementById('province').value;
    const district = document.getElementById('district').value;
    const ward = document.getElementById('ward').value;
    const detailed = document.getElementById('detailedAddress').value;

    const fullShippingAddress = `${detailed}, ${ward}, ${district}, ${province}`;

    const paymentMethodRadio = document.querySelector('input[name="paymentMethod"]:checked');
    const paymentMethod = paymentMethodRadio ? paymentMethodRadio.value : 'COD';

    const orderData = {
        CustomerName: fullName,
        Phone: phoneNumber,
        ShippingAddress: fullShippingAddress,
        PaymentMethod: paymentMethod === 'BANK' ? 'SEPAY' : paymentMethod,
        Items: cart.map(item => ({
            ProductId: parseInt(item.id),
            Quantity: parseInt(item.quantity)
        }))
    };

    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Đang xử lý đơn hàng...';

    try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${CHECKOUT_API}/orders`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(orderData)
    });

    if (response.ok) {
        const result = await response.json(); 

        if (paymentMethod === 'BANK') {
            // ĐÃ SỬA: Lấy trực tiếp giá trị từ Backend (ví dụ 2000), không nhân 1000 nữa
            const finalAmountForQR = result.totalAmount;
            
            // TẠO QR Chuẩn SePay lấy từ số tiền Backend trả về
            const qrUrl = generateSepayQR(finalAmountForQR, result.orderCode);
            
            const qrPlaceholder = document.getElementById('qr-placeholder');
            if (qrPlaceholder) {
                qrPlaceholder.innerHTML = `
                    <div class="p-2 text-center">
                        <img src="${qrUrl}" class="img-fluid mb-2" style="border-radius: 8px; border: 1px solid #eee; max-height: 250px;">
                        <div class="bg-light p-2 rounded small text-start">
                            <p class="mb-1 text-dark">Số tiền: <strong class="text-danger">${formatPrice(finalAmountForQR)}</strong></p>
                            <p class="mb-0 text-dark">Nội dung: <strong>${result.orderCode}</strong></p>
                        </div>
                    </div>`;
            }

            btn.innerHTML = '<i class="fas fa-sync fa-spin me-2"></i>ĐANG ĐỢI XÁC NHẬN TIỀN...';
            btn.style.backgroundColor = '#64748b';

            // Bắt đầu vòng lặp kiểm tra
            startPaymentPolling(result.orderId, token);
        } else {
            Swal.fire('Thành công!', 'NawHobby đã nhận đơn hàng COD của bạn.', 'success').then(() => {
                localStorage.removeItem('cart');
                window.location.href = 'index.html';
            });
        }
    } else {
        // Bạn nên thêm xử lý lỗi response không ok ở đây nếu cần
        const errorData = await response.json();
        Swal.fire('Lỗi', errorData.message || 'Không thể tạo đơn hàng', 'error');
        btn.disabled = false;
        btn.innerHTML = originalText;
        btn.style.backgroundColor = originalColor;
    }
} catch (e) {
    Swal.fire('Lỗi', 'Không thể kết nối máy chủ', 'error');
    btn.disabled = false;
    btn.innerHTML = originalText;
    btn.style.backgroundColor = originalColor;
}
}

// HÀM KIỂM TRA TRẠNG THÁI (POLLING)
function startPaymentPolling(orderId, token) {
    const interval = setInterval(async () => {
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${CHECKOUT_API}/orders/check-status/${orderId}`, { headers });
            const data = await res.json();

            if (data.isPaid) {
                clearInterval(interval);
                Swal.fire({
                    title: 'Thanh toán thành công!',
                    text: 'Hệ thống đã nhận được tiền. Cảm ơn Builder!',
                    icon: 'success',
                    timer: 4000
                }).then(() => {
                    localStorage.removeItem('cart');
                    window.location.href = 'index.html';
                });
            }
        } catch (err) {
            console.error("Lỗi kiểm tra trạng thái thanh toán:", err);
        }
    }, 3000); 
}

// HÀM TẠO LINK QR SEPAY
function generateSepayQR(amount, orderCode) {
    const bankId = "MB"; 
    const accountNo = "0909178322"; 
    const accountName = "QUANG DUNG NAM";
    // Link VietQR tự hiểu 'amount' là đơn vị VNĐ
    return `https://img.vietqr.io/image/${bankId}-${accountNo}-compact.jpg?amount=${amount}&addInfo=${orderCode}&accountName=${accountName}`;
}

// --- CÁC HÀM ĐỊA CHỈ (GIỮ NGUYÊN CHI TIẾT) ---
function selectUserAddress(addr) {
    document.getElementById('fullName').value = addr.receiverName || addr.ReceiverName;
    document.getElementById('phoneNumber').value = addr.phoneNumber || addr.PhoneNumber;
    document.getElementById('province').value = addr.province || addr.Province || "";
    document.getElementById('district').value = addr.district || addr.District || "";
    document.getElementById('ward').value = addr.ward || addr.Ward || "";
    document.getElementById('detailedAddress').value = addr.detailedAddress || addr.DetailedAddress || "";
    
    document.querySelectorAll('.address-card').forEach(card => card.classList.remove('active'));
    if (event && event.currentTarget) event.currentTarget.classList.add('active');
}

function renderAddressBook() {
    const addressBook = JSON.parse(localStorage.getItem('naw_address_book') || '[]');
    const container = document.getElementById('address-book'); 
    if (!container) return;

    if (addressBook.length === 0) {
        container.innerHTML = '<p class="text-muted small">Chưa có địa chỉ nào được lưu.</p>';
        return;
    }

    container.innerHTML = addressBook.map((addr, index) => `
        <div class="address-box p-3 border rounded mb-2" style="cursor:pointer; font-size:14px;" onclick="selectAddress(${index})">
            <div class="fw-bold">${addr.CustomerName} - ${addr.Phone}</div>
            <div class="text-muted">${addr.ShippingAddress}</div>
        </div>
    `).join('');
}

function selectAddress(index) {
    const book = JSON.parse(localStorage.getItem('naw_address_book') || '[]');
    const addr = book[index];
    document.getElementById('fullName').value = addr.CustomerName;
    document.getElementById('phoneNumber').value = addr.Phone;
    document.getElementById('detailedAddress').value = addr.ShippingAddress;
}

async function loadUserAddresses() {
    const token = localStorage.getItem('jwtToken');
    if (!token) return;

    try {
        const response = await fetch(`${CHECKOUT_API}/Addresses`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) throw new Error('API error');
        const addresses = await response.json();
        
        let container = document.getElementById('api-address-container');
        if (addresses.length === 0) {
            if(container) container.innerHTML = '<div class="small text-muted mb-3">Sổ địa chỉ trống.</div>';
            return;
        }

        let html = `<h6 class="fw-bold text-dark mb-2 small text-primary"><i class="fas fa-map-marker-alt me-2"></i>Sổ địa chỉ đã lưu:</h6>`;
        addresses.forEach(addr => {
            const defaultBadge = addr.isDefault ? '<span class="badge bg-danger ms-2" style="font-size: 10px;">Mặc định</span>' : '';
            const fullStr = [addr.detailedAddress, addr.ward, addr.district, addr.province].filter(Boolean).join(', ');
            html += `
                <div class="address-card p-2 border rounded mb-2 cursor-pointer bg-white" 
                     onclick="selectUserAddress(${JSON.stringify(addr).replace(/"/g, '&quot;')})" 
                     style="transition: 0.2s; font-size: 13px;">
                    <div class="fw-bold">${addr.receiverName}${defaultBadge} - ${addr.phoneNumber}</div>
                    <div class="text-muted text-truncate">${fullStr}</div>
                </div>`;
        });

        if(container) container.innerHTML = html;

        if (!document.getElementById('custom-addr-styles')) {
            const style = document.createElement('style');
            style.id = 'custom-addr-styles';
            style.textContent = `
                .address-card:hover { border-color: #1e40af !important; background: #f8fafc !important; }
                .address-card.active { border-color: #16a34a !important; background: #f0fdf4 !important; border-width: 2px; }
            `;
            document.head.appendChild(style);
        }
    } catch (error) { console.error('Load addresses error:', error); }
}