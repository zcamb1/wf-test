/**
 * Module quản lý dạng sóng âm thanh sử dụng WaveSurfer.js
 */
import { Utils } from './utils.js';

/**
 * Khởi tạo WaveSurfer để hiển thị dạng sóng âm thanh
 * @param {HTMLVideoElement} videoPlayer Video chính
 * @param {HTMLElement} waveformContainer Container chứa dạng sóng
 * @param {HTMLElement} loadingOverlay Lớp phủ hiển thị khi đang tải
 * @param {Object} state Trạng thái chung của ứng dụng
 * @returns {Object} Đối tượng WaveSurfer đã được khởi tạo
 */
export function initWaveSurfer(videoPlayer, waveformContainer, loadingOverlay, state) {
    console.log("Khởi tạo WaveSurfer...");
    
    // Hiển thị loading overlay
    loadingOverlay.style.display = 'flex';
    
    // Hủy instance cũ nếu tồn tại
    if (state.wavesurfer) {
        console.log("Hủy instance WaveSurfer cũ");
        try {
            state.wavesurfer.destroy();
            state.wavesurfer = null;
        } catch (e) {
            console.error("Lỗi khi hủy WaveSurfer cũ:", e);
        }
    }
    
    // Đặt màu sắc dựa trên chủ đề
    const isDarkMode = document.body.classList.contains('dark-mode');
    const waveColor = isDarkMode ? 'rgba(52, 152, 219, 0.6)' : 'rgba(52, 152, 219, 0.4)';
    const progressColor = isDarkMode ? 'rgba(231, 76, 60, 0.9)' : 'rgba(231, 76, 60, 0.7)';
    
    // Đảm bảo container đã sẵn sàng và có kích thước
    const containerHeight = waveformContainer.clientHeight || 120;
    
    // Tạo instance WaveSurfer với cài đặt tối ưu
    let wavesurfer = null;
    
    try {
        wavesurfer = WaveSurfer.create({
            container: '#waveform',
            waveColor: waveColor,
            progressColor: progressColor,
            cursorColor: '#FF5500',
            cursorWidth: 2,
            height: containerHeight,
            responsive: true,
            normalize: true,
            // Thử MediaElement trước, đây là backend ưu tiên để đồng bộ với video
            backend: 'MediaElement',
            media: videoPlayer,
            barWidth: 2,
            barGap: 1,
            minPxPerSec: 100, // Tăng độ chi tiết của waveform
            pixelRatio: window.devicePixelRatio || 1,
            scrollParent: false,
            hideScrollbar: true,
            partialRender: false, // Tắt rendering từng phần để hiển thị đầy đủ waveform
            interact: true, // Cho phép tương tác
        });
    } catch (e) {
        console.error("Lỗi khi tạo WaveSurfer:", e);
        loadingOverlay.style.display = 'none';
        loadingOverlay.querySelector('.loading-text').textContent = 'Không thể tạo dạng sóng âm thanh.';
        return null;
    }
    
    // Biến theo dõi thời gian cập nhật cuối cùng
    let lastUpdateTime = 0;
    let isSeeking = false;
    
    // Xử lý sự kiện WaveSurfer với cải thiện xử lý lỗi
    wavesurfer.on('ready', function() {
        console.log("WaveSurfer đã sẵn sàng");
        loadingOverlay.style.display = 'none';
        
        // Buộc vẽ lại để khắc phục vấn đề render ban đầu
        setTimeout(() => {
            try {
                wavesurfer.drawBuffer();
            } catch(e) {
                console.error('Error redrawing buffer:', e);
            }
        }, 100);
    });
    
    wavesurfer.on('error', function(err) {
        console.error('WaveSurfer error:', err);
        loadingOverlay.querySelector('.loading-text').textContent = 'Không thể tải dạng sóng âm thanh.';
        
        // Giữ overlay hiển thị nhưng thay đổi thông báo
        setTimeout(() => {
            // Sử dụng một phương pháp thay thế
            tryAlternativeLoad(wavesurfer, videoPlayer);
        }, 1000);
    });
    
    // Cho phép tìm kiếm khi nhấp vào dạng sóng với đồng bộ hai chiều
    wavesurfer.on('seek', function(progress) {
        if (isSeeking) return; // Tránh vòng lặp updates
        if (!videoPlayer.duration || state.updatingFromVideo) return;
        
        // Tính thời gian hiện tại để hạn chế cập nhật quá thường xuyên
        const now = Date.now();
        // Nếu thời gian từ lần cập nhật trước đó quá ngắn, bỏ qua
        if (now - lastUpdateTime < 50) return;
        lastUpdateTime = now;
        
        try {
            // Đánh dấu đang tìm kiếm để tránh cập nhật chồng chéo
            isSeeking = true;
            state.updatingFromWaveform = true;
            
            console.log(`WaveSurfer seek: ${progress}`);
            
            // Tính toán khung hình chính xác nếu có FPS
            let targetTime = progress * videoPlayer.duration;
            if (state.fps > 0) {
                const frameDuration = 1 / state.fps;
                const targetFrame = Math.round(targetTime / frameDuration);
                targetTime = targetFrame * frameDuration;
            }
            
            // Đặt thời gian video
            videoPlayer.currentTime = targetTime;
            
            // Cập nhật thanh tiến trình
            Utils.updateProgressBar(videoPlayer, document.getElementById('progressBar'));
            
            // Cập nhật timeCode
            $('#timeCode').val((videoPlayer.currentTime * 1000).toFixed(0));
            
            // Kết thúc cập nhật từ waveform sau một thời gian
            setTimeout(() => {
                state.updatingFromWaveform = false;
                isSeeking = false;
            }, 100);
        } catch (e) {
            console.error("Lỗi khi tìm kiếm:", e);
            state.updatingFromWaveform = false;
            isSeeking = false;
        }
    });
    
    // Sự kiện trước khi tìm kiếm
    wavesurfer.on('interaction', function() {
        // Tạm dừng video nếu đang phát để cải thiện trải nghiệm tìm kiếm
        if (!videoPlayer.paused) {
            videoPlayer.pause();
        }
    });
    
    // Tối ưu hóa cập nhật khi resize
    window.addEventListener('resize', Utils.debounce(function() {
        if (wavesurfer) {
            const newHeight = waveformContainer.clientHeight || containerHeight;
            wavesurfer.params.height = newHeight;
            try {
                wavesurfer.drawBuffer();
            } catch(e) {
                console.error('Error redrawing after resize:', e);
            }
        }
    }, 250));
    
    // Tải media với retry logic
    let retryCount = 0;
    const maxRetries = 3;
    
    function loadWaveform() {
        try {
            if (videoPlayer.currentSrc) {
                console.log("Tải dạng sóng từ nguồn:", videoPlayer.currentSrc);
                wavesurfer.load(videoPlayer.currentSrc);
            } else {
                console.error("Video không có nguồn");
                loadingOverlay.style.display = 'none';
                loadingOverlay.querySelector('.loading-text').textContent = 'Không có nguồn video.';
            }
        } catch (err) {
            console.error('Error loading wavesurfer:', err);
            
            // Thử lại nếu chưa đạt số lần thử tối đa
            if (retryCount < maxRetries) {
                retryCount++;
                console.log(`Đang thử lại tải dạng sóng lần ${retryCount}...`);
                setTimeout(loadWaveform, 1000);
            } else {
                loadingOverlay.querySelector('.loading-text').textContent = 'Không thể tải dạng sóng. Thử lại sau.';
                setTimeout(() => {
                    loadingOverlay.style.display = 'none';
                }, 2000);
            }
        }
    }
    
    // Đảm bảo video đã sẵn sàng trước khi tải
    if (videoPlayer.readyState >= 2) {
        // Bắt đầu tải ngay
        loadWaveform();
    } else {
        // Đợi video sẵn sàng
        console.log("Đợi video sẵn sàng trước khi tải dạng sóng...");
        const canPlayHandler = () => {
            videoPlayer.removeEventListener('canplay', canPlayHandler);
            loadWaveform();
        };
        videoPlayer.addEventListener('canplay', canPlayHandler);
        
        // Backup timeout để tránh treo
        setTimeout(() => {
            videoPlayer.removeEventListener('canplay', canPlayHandler);
            if (videoPlayer.readyState >= 2) {
                loadWaveform();
            } else {
                loadingOverlay.querySelector('.loading-text').textContent = 'Video chưa sẵn sàng để tải dạng sóng.';
            }
        }, 5000);
    }
    
    // Thêm một phương thức khởi động lại
    wavesurfer.restart = function() {
        retryCount = 0;
        try {
            this.empty();
            loadWaveform();
        } catch(e) {
            console.error('Error restarting wavesurfer:', e);
        }
    };
    
    // Thêm phương thức cập nhật từ video một cách thủ công
    wavesurfer.updateFromVideo = function() {
        if (!videoPlayer.duration) return;
        
        const progress = videoPlayer.currentTime / videoPlayer.duration;
        try {
            state.updatingFromVideo = true;
            this.seekTo(progress);
            setTimeout(() => {
                state.updatingFromVideo = false;
            }, 100);
        } catch (e) {
            console.error("Lỗi khi cập nhật waveform từ video:", e);
            state.updatingFromVideo = false;
        }
    };
    
    return wavesurfer;
}

/**
 * Thử tải dạng sóng bằng phương pháp thay thế
 * @param {Object} wavesurfer Đối tượng WaveSurfer 
 * @param {HTMLVideoElement} videoPlayer Video chính
 */
function tryAlternativeLoad(wavesurfer, videoPlayer) {
    console.log("Thử phương pháp thay thế để tải dạng sóng");
    try {
        // Thử thiết lập lại với WebAudio
        wavesurfer.params.backend = 'WebAudio';
        wavesurfer.empty();
        
        // Thêm sự kiện tải video để đồng bộ
        const loadHandler = function() {
            try {
                console.log("Tải lại dạng sóng với WebAudio");
                wavesurfer.load(videoPlayer.currentSrc);
                videoPlayer.removeEventListener('canplay', loadHandler);
            } catch(e) {
                console.error('Alternative load failed:', e);
            }
        };
        
        // Đăng ký sự kiện và kích hoạt lại video
        videoPlayer.addEventListener('canplay', loadHandler);
        if (videoPlayer.readyState >= 2) {
            loadHandler();
        } else {
            videoPlayer.load();
        }
    } catch(e) {
        console.error('Alternative method failed:', e);
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}