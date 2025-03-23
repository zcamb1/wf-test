/**
 * Quản lý chủ đề (theme) của ứng dụng
 */

/**
 * Khởi tạo chức năng chuyển đổi chủ đề
 * @param {HTMLElement} themeToggle Nút chuyển đổi chủ đề
 * @param {Object} state Trạng thái chung của ứng dụng
 */
export function initTheme(themeToggle, state) {
    // Xử lý sự kiện khi nhấp vào nút chuyển đổi chủ đề
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        const isDarkMode = document.body.classList.contains('dark-mode');
        themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        
        // Lưu tùy chọn vào localStorage
        localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
        
        // Nếu wavesurfer tồn tại, cập nhật màu sắc
        if (state.wavesurfer) {
            updateWavesurferColors(state.wavesurfer, isDarkMode);
        }
        
        // Cập nhật các màu sắc phù hợp cho toast
        updateToastTheme(isDarkMode);
    });
    
    // Tải tùy chọn người dùng cho chế độ tối
    const prefersDarkMode = localStorage.getItem('darkMode') === 'true' || 
                           (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    if (prefersDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        updateToastTheme(true);
    }
}

/**
 * Cập nhật màu sắc của wavesurfer dựa trên chủ đề
 * @param {Object} wavesurfer Đối tượng WaveSurfer
 * @param {boolean} isDarkMode Trạng thái chế độ tối
 */
function updateWavesurferColors(wavesurfer, isDarkMode) {
    const waveColor = isDarkMode ? 'rgba(52, 152, 219, 0.6)' : 'rgba(52, 152, 219, 0.4)';
    const progressColor = isDarkMode ? 'rgba(231, 76, 60, 0.9)' : 'rgba(231, 76, 60, 0.7)';
    
    wavesurfer.params.waveColor = waveColor;
    wavesurfer.params.progressColor = progressColor;
    
    try {
        wavesurfer.drawBuffer();
    } catch (e) {
        console.error('Lỗi khi vẽ lại wavesurfer:', e);
    }
}

/**
 * Cập nhật màu sắc của toast dựa trên chủ đề
 * @param {boolean} isDarkMode Trạng thái chế độ tối
 */
function updateToastTheme(isDarkMode) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    if (isDarkMode) {
        toast.style.backgroundColor = 'rgba(30, 30, 30, 0.95)';
        toast.style.color = '#e0e0e0';
    } else {
        toast.style.backgroundColor = 'rgba(50, 50, 50, 0.9)';
        toast.style.color = 'white';
    }
}