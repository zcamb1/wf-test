![image](https://github.com/user-attachments/assets/c2da3984-50b6-4f7b-8d30-0ca217b4ae77)
```
<div id="toast" class="toast">
    <i class="fas fa-check-circle"></i>
    <span>Đã sao chép!</span>
</div>
```

```
.toast {
    visibility: hidden;
    position: fixed;
    z-index: 1000;
    min-width: 180px;
    max-width: 80%;
    background-color: rgba(50, 50, 50, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 14px;
    opacity: 0;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 8px;
    text-align: center;
}

.toast i {
    color: #2ecc71;
    font-size: 16px;
    flex-shrink: 0;
}

.toast.show {
    visibility: visible;
    opacity: 1;
}

/* Vị trí responsive cho toast */
@media (max-width: 480px) {
    .toast {
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
    }
    
    .toast.show {
        bottom: 30px;
    }
}

@media (min-width: 481px) {
    .toast {
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
    }
    
    .toast.show {
        top: 40px;
    }
}
```

```
$(document).ready(function () {
    // Thêm đối tượng Utils
    const Utils = {
        // Sao chép văn bản vào clipboard
        copyToClipboard: async function(text) {
            try {
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(text);
                    return true;
                } else {
                    // Fallback cho trình duyệt cũ
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    textarea.setAttribute('readonly', '');
                    textarea.style.position = 'absolute';
                    textarea.style.left = '-9999px';
                    document.body.appendChild(textarea);
                    textarea.select();
                    const success = document.execCommand('copy');
                    document.body.removeChild(textarea);
                    return success;
                }
            } catch (err) {
                console.error('Copy failed:', err);
                return false;
            }
        },
        
        // Hiển thị thông báo toast
        showToast: function(toastElement, message, duration = 2000) {
            if (!toastElement) return;
            
            // Hủy bất kỳ timeout hiện tại nào
            if (toastElement._toastTimeout) {
                clearTimeout(toastElement._toastTimeout);
            }
            
            // Cập nhật nội dung nếu có message mới
            if (message) {
                // Nếu có span thì cập nhật nội dung span, nếu không, cập nhật toàn bộ
                if (toastElement.querySelector('span')) {
                    toastElement.querySelector('span').textContent = message;
                } else {
                    toastElement.textContent = message;
                }
            }
            
            // Tính toán vị trí của toast dựa trên kích thước màn hình
            const updateToastPosition = () => {
                const viewportWidth = window.innerWidth;
                
                // Đặt vị trí toast dựa vào kích thước màn hình
                if (viewportWidth <= 480) {
                    // Trên màn hình nhỏ, đặt toast ở chính giữa phía dưới
                    toastElement.style.bottom = '20px';
                    toastElement.style.top = 'auto';
                    toastElement.style.left = '50%';
                    toastElement.style.transform = 'translateX(-50%)';
                } else {
                    // Trên màn hình lớn, đặt ở phía trên
                    toastElement.style.top = '40px';
                    toastElement.style.bottom = 'auto';
                    toastElement.style.left = '50%';
                    toastElement.style.transform = 'translateX(-50%)';
                }
            };
            
            // Cập nhật vị trí toast trước khi hiển thị
            updateToastPosition();
            
            // Hiển thị toast
            toastElement.classList.add('show');
            
            // Thiết lập timeout để ẩn toast
            toastElement._toastTimeout = setTimeout(() => {
                toastElement.classList.remove('show');
            }, duration);
        }
    };

    // Code khác giữ nguyên...

    // Cập nhật xử lý nút copy
    $('#copy-btn').on('click', function() {
        const timeInMilliseconds = ($video.currentTime * 1000).toFixed(0);
        
        Utils.copyToClipboard(timeInMilliseconds)
            .then(success => {
                if (success) {
                    Utils.showToast(document.getElementById('toast'), "Đã sao chép!");
                }
            });
    });


Toast nhỏ và nằm trên nút bấm

```
.toast {
    visibility: hidden;
    position: fixed;
    z-index: 1000;
    min-width: auto; /* Thu nhỏ theo nội dung */
    max-width: 150px;
    background-color: rgba(50, 50, 50, 0.85);
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 13px;
    opacity: 0;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 6px;
    text-align: center;
    /* Đặt vị trí mặc định */
    bottom: auto;
    top: auto;
    left: auto;
    right: auto;
    transform: none;
}

.toast i {
    color: #2ecc71;
    font-size: 14px;
    flex-shrink: 0;
}

.toast.show {
    visibility: visible;
    opacity: 1;
}
```

```
const updateToastPosition = () => {
    const copyBtn = document.getElementById('copy-btn');
    if (!copyBtn) return;
    
    const rect = copyBtn.getBoundingClientRect();
    
    // Đặt ngay phía trên nút copy
    toastElement.style.bottom = 'auto';
    toastElement.style.top = (rect.top - 30) + 'px';
    toastElement.style.left = (rect.left + rect.width/2) + 'px';
    toastElement.style.transform = 'translateX(-50%)';
};

    // Còn lại của code giữ nguyên...
});
```
