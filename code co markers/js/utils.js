/**
 * Các tiện ích chung cho ứng dụng
 */
export const Utils = {
    /**
     * Debounce function để giới hạn tần suất gọi hàm
     * @param {Function} func Hàm cần debounce
     * @param {number} wait Thời gian chờ giữa các lần gọi (ms)
     * @returns {Function} Hàm đã được debounce
     */
    debounce: function(func, wait) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), wait);
        };
    },
    
    /**
     * Throttle function để đảm bảo chỉ gọi hàm một lần trong khoảng thời gian
     * @param {Function} func Hàm cần throttle
     * @param {number} limit Thời gian giữa các lần gọi (ms)
     * @returns {Function} Hàm đã được throttle
     */
    throttle: function(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    /**
     * Cập nhật thanh tiến trình dựa trên thời gian hiện tại
     * @param {HTMLElement} videoPlayer HTML video element
     * @param {HTMLElement} progressBar Thanh tiến trình
     */
    updateProgressBar: function(videoPlayer, progressBar) {
        if (videoPlayer.duration) {
            const progressPercent = (videoPlayer.currentTime / videoPlayer.duration) * 100;
            progressBar.style.width = progressPercent + '%';
        }
    },
    
    /**
     * Hiển thị thông báo toast
     * @param {HTMLElement} toastElement Element toast
     * @param {string} message Nội dung thông báo
     * @param {number} duration Thời gian hiển thị (ms)
     */
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
                // Tìm chỉ mục của biểu tượng (nếu có)
                const iconElement = toastElement.querySelector('i');
                if (iconElement) {
                    // Xóa tất cả trừ biểu tượng
                    Array.from(toastElement.childNodes).forEach(node => {
                        if (node !== iconElement) {
                            toastElement.removeChild(node);
                        }
                    });
                    
                    // Thêm span mới sau biểu tượng
                    const span = document.createElement('span');
                    span.textContent = message;
                    toastElement.appendChild(span);
                } else {
                    toastElement.textContent = message;
                }
            }
        }
        
        // Tính toán vị trí của toast dựa trên kích thước màn hình
        const updateToastPosition = () => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Đặt vị trí toast dựa vào kích thước màn hình
            if (viewportWidth <= 480) {
                // Trên màn hình nhỏ, đặt toast ở chính giữa phía dưới
                toastElement.style.top = 'auto';
                toastElement.style.bottom = '20px';
                toastElement.style.left = '50%';
                toastElement.style.transform = 'translateX(-50%)';
            } else if (viewportWidth <= 768) {
                // Trên màn hình trung bình, đặt ở phía trên
                toastElement.style.top = '40px';
                toastElement.style.bottom = 'auto';
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
        
        // Cập nhật vị trí khi thay đổi kích thước màn hình
        window.addEventListener('resize', this.debounce(updateToastPosition, 100));
    },
    
    /**
     * Sao chép văn bản vào clipboard
     * @param {string} text Văn bản cần sao chép
     * @returns {Promise} Promise hoàn thành khi sao chép xong
     */
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
    
    /**
     * Chuyển đổi thời gian từ giây sang định dạng MM:SS hoặc HH:MM:SS
     * @param {number} seconds Thời gian tính bằng giây
     * @returns {string} Chuỗi thời gian định dạng
     */
    formatTime: function(seconds) {
        if (isNaN(seconds)) return "00:00";
        
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        
        // Format: đặt số 0 ở đầu nếu cần
        const fmins = mins < 10 ? "0" + mins : mins;
        const fsecs = secs < 10 ? "0" + secs : secs;
        
        if (hrs > 0) {
            // Nếu có giờ, hiển thị HH:MM:SS
            const fhrs = hrs < 10 ? "0" + hrs : hrs;
            return `${fhrs}:${fmins}:${fsecs}`;
        } else {
            // Nếu không, chỉ hiện MM:SS
            return `${fmins}:${fsecs}`;
        }
    },
    
    /**
     * Làm tròn số đến n chữ số thập phân
     * @param {number} value Giá trị cần làm tròn
     * @param {number} decimals Số chữ số thập phân
     * @returns {number} Giá trị đã làm tròn
     */
    round: function(value, decimals = 2) {
        return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
    }
};