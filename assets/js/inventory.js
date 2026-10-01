// ======================================================
// INVENTORY MANAGEMENT - NawHobby (Updated March 2026)
// ======================================================

async function loadInventory() {
    const inventoryBody = document.getElementById('inventoryBody');
    const outOfStockStats = document.getElementById('outOfStockStats');
    const outOfStockCountEl = document.getElementById('outOfStockCount');
    
    if (!inventoryBody) return;
    inventoryBody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px;"><i class="fas fa-spinner fa-spin"></i> Đang tải kho hàng...</td></tr>';
    
    try {
        // FIX: Lấy đúng key 'jwtToken' từ Local Storage theo hình ảnh bạn gửi
        const token = localStorage.getItem('jwtToken'); 
        
        // Chuẩn hóa URL
        const apiBase = (window.API_BASE || 'http://localhost:5134/api').replace(/\/$/, "");
        const rootBase = apiBase.replace(/\/api$/, "");

        const response = await fetch(`${apiBase}/products`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const products = await response.json();
        
        // Thống kê hàng hết
        const zeroStock = products.filter(p => (p.stock || 0) === 0).length;
        if (outOfStockStats) outOfStockStats.style.display = zeroStock > 0 ? 'flex' : 'none';
        if (outOfStockCountEl) outOfStockCountEl.textContent = zeroStock;
        
        inventoryBody.innerHTML = products.map(p => {
            // FIX LỖI ẢNH 404: Nối Root URL của Backend vào đường dẫn ảnh
            let imgSrc = p.imageUrl || 'assets/images/no-image.jpg';
            if (imgSrc.startsWith('/images')) {
                imgSrc = `${rootBase}${imgSrc}`;
            }

            return `
                <tr>
                    <td>
                        <img src="${imgSrc}" 
                             style="width:48px;height:48px;object-fit:cover;border-radius:4px;" 
                             onerror="this.src='assets/images/no-image.jpg'">
                    </td>
                    <td>${p.name}</td>
                    <td><span class="badge" style="background:#1e40af;color:white;padding:2px 6px;border-radius:4px;font-size:11px;">${p.category || 'Gunpla'}</span></td>
                    <td>
                        <input type="number" class="inventory-stock-input" value="${p.stock || 0}" 
                               onblur="updateQuickStock(${p.id}, this.value)" 
                               style="width:70px; padding:4px; border:1px solid #ddd; border-radius:4px;">
                    </td>
                    <td style="text-align: center;">
                        <div style="display: flex; gap: 8px; justify-content: center;">
                            <button onclick="setOutOfStock(${p.id})" 
                                    ${p.stock === 0 ? 'disabled' : ''} 
                                    style="cursor:${p.stock === 0 ? 'not-allowed' : 'pointer'}; padding:4px 8px; border-radius:4px; border:none; background:${p.stock === 0 ? '#ccc' : '#ef4444'}; color:white;">
                                ${p.stock === 0 ? 'HẾT' : 'Báo hết'}
                            </button>
                            <button onclick="deleteProduct(${p.id})" class="btn-danger" style="background:#ef4444; color:white; border:none; padding:6px 10px; border-radius:4px; cursor:pointer;" title="Xóa vĩnh viễn"><i class="fa-solid fa-trash-can"></i></button>
                        </div>
                    </td>
                </tr>`;
        }).join('');

    } catch (e) {
        console.error("Load Inventory Error:", e);
        inventoryBody.innerHTML = '<tr><td colspan="5" style="text-align:center;color:red;">❌ Lỗi tải dữ liệu kho. Vui lòng đăng nhập lại.</td></tr>';
    }
}

// HÀM CẬP NHẬT KHO (Đã sửa lỗi 401 Unauthorized)
async function updateQuickStock(id, newStock) {
    newStock = parseInt(newStock);
    if (isNaN(newStock) || newStock < 0) {
        Swal.fire({
            title: 'Cảnh báo',
            text: 'Số lượng không hợp lệ',
            icon: 'warning',
            confirmButtonText: 'Xác nhận',
            confirmButtonColor: '#1e40af'
        }).then((result) => {
            if (result.isConfirmed) {
                // Return to input focus or reload
            }
        });
        return;
    }
    
    try {
        // FIX: Đổi từ 'token' sang 'jwtToken' để khớp với Application tab
        const token = localStorage.getItem('jwtToken'); 

        if (!token) {
            Swal.fire({
                title: 'Lỗi',
                text: 'Phiên làm việc hết hạn. Vui lòng đăng nhập lại!',
                icon: 'error',
                confirmButtonText: 'Xác nhận',
                confirmButtonColor: '#1e40af'
            });
            return;
        }

        const apiBase = (window.API_BASE || 'http://localhost:5134/api').replace(/\/$/, "");
        
        // URL mới: /api/products/stock/{id}
        const response = await fetch(`${apiBase}/products/stock/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ Stock: newStock })
        });
        
        if (response.ok) {
            Swal.fire({
                title: 'Thành công',
                text: 'Cập nhật kho thành công',
                icon: 'success',
                confirmButtonText: 'Xác nhận',
                confirmButtonColor: '#1e40af'
            }).then((result) => {
                if (result.isConfirmed) {
                    loadInventory();
                }
            });
        } else if (response.status === 401) {
            Swal.fire({
                title: 'Lỗi',
                text: 'Lỗi 401: Bạn không có quyền Admin hoặc Token không hợp lệ.',
                icon: 'error',
                confirmButtonText: 'Xác nhận',
                confirmButtonColor: '#1e40af'
            });
        } else if (response.status === 404) {
            Swal.fire({
                title: 'Lỗi',
                text: 'Lỗi 404: Không tìm thấy đường dẫn API. Hãy Rebuild Backend!',
                icon: 'error',
                confirmButtonText: 'Xác nhận',
                confirmButtonColor: '#1e40af'
            });
        } else {
            const errorData = await response.json().catch(() => ({}));
            Swal.fire({
                title: 'Lỗi',
                text: `Lỗi ${response.status}: ${errorData.message || 'Cập nhật thất bại'}`,
                icon: 'error',
                confirmButtonText: 'Xác nhận',
                confirmButtonColor: '#1e40af'
            });
        }
    } catch (e) {
        console.error("Update Stock Error:", e);
        Swal.fire({
            title: 'Lỗi',
            text: 'Lỗi kết nối đến server',
            icon: 'error',
            confirmButtonText: 'Xác nhận',
            confirmButtonColor: '#1e40af'
        });
    }
}

function setOutOfStock(id) {
    Swal.fire({
        title: 'Xác nhận',
        text: 'Bạn có chắc chắn muốn báo hết hàng?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Có, báo hết hàng',
        cancelButtonText: 'Hủy'
    }).then((result) => {
        if (result.isConfirmed) {
            updateQuickStock(id, 0);
        }
    });
}

async function deleteProduct(id) {
    const result = await Swal.fire({
        title: 'Xác nhận xóa',
        text: 'Xóa vĩnh viễn sản phẩm này khỏi hệ thống?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Xóa vĩnh viễn',
        cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
        try {
            const token = localStorage.getItem('jwtToken');
            const apiBase = (window.API_BASE || 'http://localhost:5134/api').replace(/\/$/, "");

            const response = await fetch(`${apiBase}/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                Swal.fire({
                    title: 'Thành công',
                    text: 'Sản phẩm đã được xóa vĩnh viễn.',
                    icon: 'success',
                    confirmButtonText: 'Xác nhận',
                    confirmButtonColor: '#1e40af'
                }).then((result) => {
                    if (result.isConfirmed) {
                        loadInventory();
                    }
                });
            } else {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}`);
            }
        } catch (e) {
            Swal.fire({
                title: 'Lỗi',
                text: e.message || 'Không thể xóa sản phẩm.',
                icon: 'error',
                confirmButtonText: 'Xác nhận',
                confirmButtonColor: '#1e40af'
            });
        }
    }
}

// Khởi tạo
document.addEventListener('DOMContentLoaded', loadInventory);