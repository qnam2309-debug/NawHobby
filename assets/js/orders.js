// ======================================================
// ORDER MANAGEMENT - NawHobby
// ======================================================

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute:'2-digit' });
}

function getStatusBadge(status) {
    switch (status) {
        case 'Pending Payment':
            return '<span class="badge" style="background:#f59e0b;color:white;padding:4px 8px;border-radius:4px;">Chờ thanh toán</span>';
        case 'Processing':
            return '<span class="badge" style="background:#3b82f6;color:white;padding:4px 8px;border-radius:4px;">Đang xử lý</span>';
        case 'Shipped':
            return '<span class="badge" style="background:#8b5cf6;color:white;padding:4px 8px;border-radius:4px;">Đang giao hàng</span>';
        case 'Delivered':
            return '<span class="badge" style="background:#10b981;color:white;padding:4px 8px;border-radius:4px;">Đã giao thành công</span>';
        case 'Cancelled':
            return '<span class="badge" style="background:#ef4444;color:white;padding:4px 8px;border-radius:4px;">Đã hủy</span>';
        default:
            return `<span class="badge" style="background:#64748b;color:white;padding:4px 8px;border-radius:4px;">${status}</span>`;
    }
}

async function loadOrders() {
    const ordersBody = document.getElementById('ordersBody');
    if (!ordersBody) return;
    
    ordersBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin"></i> Đang tải dữ liệu đơn hàng...</td></tr>';
    
    try {
        const token = localStorage.getItem('jwtToken'); 
        if (!token) {
            ordersBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">Vui lòng đăng nhập quyền Admin.</td></tr>';
            return;
        }

        const apiBase = (window.API_BASE || 'http://localhost:5134/api').replace(/\/$/, "");

        // Gọi API lấy toàn bộ đơn hàng (Dành cho Admin)
        const response = await fetch(`${apiBase}/orders/admin`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const orders = await response.json();
        
        if (orders.length === 0) {
            ordersBody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px;">Chưa có đơn hàng nào trong hệ thống.</td></tr>';
            return;
        }

        ordersBody.innerHTML = orders.map(o => `
            <tr>
                <td style="font-weight: bold;">#${o.id || o.Id}</td>
                <td>
                    <div style="font-weight: 600; color: #1e40af;">${o.customerName || o.CustomerName}</div>
                    <div style="font-size: 12px; color: #64748b;"><i class="fas fa-phone"></i> ${o.phone || o.Phone}</div>
                </td>
                <td style="font-weight: bold; color: #dc2626;">${formatPrice(o.totalAmount || o.TotalAmount)}</td>
                <td><span class="badge" style="background:#475569;color:white;padding:2px 6px;border-radius:4px;font-size:11px;">${o.paymentMethod || o.PaymentMethod || 'COD'}</span></td>
                <td style="font-size: 13px;">${formatDate(o.orderDate || o.OrderDate)}</td>
                <td>${getStatusBadge(o.status || o.Status)}</td>
                <td style="text-align: center;">
                    <button onclick="changeOrderStatus(${o.id || o.Id}, '${o.status || o.Status}')" 
                            style="background:#1e40af; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer; font-size: 12px;" 
                            title="Cập nhật trạng thái">
                        <i class="fas fa-edit"></i> Duyệt/Đổi
                    </button>
                </td>
            </tr>
        `).join('');

    } catch (e) {
        console.error("Load Orders Error:", e);
        ordersBody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:red;">❌ Lỗi tải dữ liệu. Hãy kiểm tra kết nối Backend.</td></tr>';
    }
}

async function changeOrderStatus(orderId, currentStatus) {
    const { value: newStatus } = await Swal.fire({
        title: `Cập nhật Đơn #${orderId}`,
        input: 'select',
        inputOptions: {
            'Pending Payment': 'Chờ thanh toán (Cho Bank/Momo)',
            'Processing': 'Đang xử lý (Đã xác nhận tiền/COD)',
            'Shipped': 'Đang giao hàng',
            'Delivered': 'Đã giao thành công',
            'Cancelled': 'Hủy đơn hàng'
        },
        inputValue: currentStatus,
        showCancelButton: true,
        confirmButtonText: 'Lưu thay đổi',
        cancelButtonText: 'Hủy'
    });

    if (newStatus && newStatus !== currentStatus) {
        try {
            const token = localStorage.getItem('jwtToken');
            const apiBase = (window.API_BASE || 'http://localhost:5134/api').replace(/\/$/, "");

            Swal.fire({ title: 'Đang xử lý...', didOpen: () => Swal.showLoading() });

            // Gửi request cập nhật lên Backend
            const response = await fetch(`${apiBase}/orders/${orderId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ Status: newStatus })
            });

            if (response.ok) {
                Swal.fire({
                    title: 'Thành công',
                    text: 'Trạng thái đơn hàng đã được cập nhật.',
                    icon: 'success',
                    confirmButtonText: 'Xác nhận',
                    confirmButtonColor: '#1e40af'
                }).then((result) => {
                    if (result.isConfirmed) {
                        loadOrders(); // Tải lại bảng ngay lập tức
                    }
                });
            } else {
                throw new Error('Lỗi từ Server');
            }
        } catch (e) {
            Swal.fire({
                title: 'Lỗi',
                text: 'Không thể cập nhật trạng thái.',
                icon: 'error',
                confirmButtonText: 'Xác nhận',
                confirmButtonColor: '#1e40af'
            });
        }
    }
}