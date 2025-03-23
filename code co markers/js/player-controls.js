/**
 * Module điều khiển trình phát video
 */
import { Utils } from './utils.js';

/**
 * Thiết lập các điều khiển trình phát
 * @param {HTMLVideoElement} videoPlayer Video chính
 * @param {HTMLElement} timeCode Input hiển thị thời gian
 * @param {HTMLElement} progressBar Thanh tiến trình
 * @param {Object} state Trạng thái chung của ứng dụng
 * @returns {Object} Các phương thức điều khiển trình phát
 */
export function setupPlayerControls(videoPlayer, timeCode, progressBar, state) {
    // Flag để theo dõi cập nhật đang diễn ra
    let updatingUI = false;
    
    // Thời gian chờ giữa các lần cập nhật (ms)
    const UPDATE_DELAY = 100;
    
    // Theo dõi promise phát video
    let videoPlayPromise = null;
    
    /**
     * Phát video một cách an toàn để tránh lỗi AbortError
     * @returns {Promise} Promise kết quả phát video
     */
    function safePlay() {
        if (videoPlayer.paused) {
            try {
                // Kiểm tra nếu đã lưu phương thức gốc
                if (videoPlayer.originalPlay) {
                    // Lưu promise phát
                    videoPlayPromise = videoPlayer.originalPlay();
                } else {
                    // Sử dụng phương thức gốc qua prototype nếu không có lưu
                    videoPlayPromise = HTMLVideoElement.prototype.play.call(videoPlayer);
                }
                
                // Xử lý lỗi nếu có
                videoPlayPromise.catch(err => {
                    console.warn("Không thể phát video:", err);
                    videoPlayPromise = null;
                });
                
                return videoPlayPromise;
            } catch (e) {
                console.error("Lỗi khi phát video:", e);
                videoPlayPromise = null;
                return Promise.reject(e);
            }
        }
        
        return Promise.resolve();
    }
    
    /**
     * Tạm dừng video một cách an toàn
     */
    function safePause() {
        if (!videoPlayer.paused) {
            if (videoPlayPromise) {
                // Đợi promise phát hoàn thành
                videoPlayPromise.then(() => {
                    if (videoPlayer.originalPause) {
                        videoPlayer.originalPause();
                    } else {
                        HTMLVideoElement.prototype.pause.call(videoPlayer);
                    }
                    videoPlayPromise = null;
                }).catch(() => {
                    // Vẫn pause khi có lỗi
                    if (videoPlayer.originalPause) {
                        videoPlayer.originalPause();
                    } else {
                        HTMLVideoElement.prototype.pause.call(videoPlayer);
                    }
                    videoPlayPromise = null;
                });
            } else {
                // Nếu không có promise phát đang chạy
                if (videoPlayer.originalPause) {
                    videoPlayer.originalPause();
                } else {
                    HTMLVideoElement.prototype.pause.call(videoPlayer);
                }
            }
        }
    }
    
    /**
     * Tua theo khung hình với độ chính xác cao
     * @param {number} frameOffset Số khung hình cần tua (dương hoặc âm)
     */
    function seekToFrame(frameOffset) {
        if (state.fps <= 0) return;
        
        // Tạm dừng video nếu đang phát
        if (!videoPlayer.paused) {
            safePause();
        }
        
        // Đánh dấu đang cập nhật UI để tránh vòng lặp
        updatingUI = true;
        
        // Tính toán khung hình hiện tại chính xác hơn
        const currentTime = videoPlayer.currentTime;
        const frameDuration = 1 / state.fps;
        const currentFrame = Math.round(currentTime / frameDuration);
        const targetFrame = currentFrame + frameOffset;
        const newTime = targetFrame * frameDuration;
        
        // Đảm bảo thời gian nằm trong phạm vi video
        const boundedTime = Math.max(0, Math.min(newTime, videoPlayer.duration));
        
        console.log(`Tua đến khung hình: ${targetFrame} (${boundedTime}s)`);
        
        // Áp dụng thời gian mới
        videoPlayer.currentTime = boundedTime;
        
        // Cập nhật hiển thị
        const timeInMilliseconds = (boundedTime * 1000).toFixed(0);
        $('#timeCode').val(timeInMilliseconds);
        
        // Cập nhật thanh tiến trình
        Utils.updateProgressBar(videoPlayer, progressBar);
        
        // Cập nhật wavesurfer một cách thủ công để đảm bảo đồng bộ
        if (state.wavesurfer && state.wavesurferInitialized) {
            setTimeout(() => {
                try {
                    state.updatingFromVideo = true;
                    const progress = boundedTime / videoPlayer.duration;
                    state.wavesurfer.seekTo(progress);
                    
                    setTimeout(() => { 
                        state.updatingFromVideo = false;
                        updatingUI = false;
                    }, UPDATE_DELAY);
                } catch (e) {
                    console.error("Lỗi khi cập nhật wavesurfer:", e);
                    state.updatingFromVideo = false;
                    updatingUI = false;
                }
            }, 10); // Thời gian ngắn để đảm bảo video đã cập nhật
        } else {
            // Kết thúc cập nhật UI sau một thời gian ngắn
            setTimeout(() => { updatingUI = false; }, UPDATE_DELAY);
        }
    }
    
    /**
     * Cập nhật thanh tiến trình từ vị trí chuột
     * @param {Event} e Sự kiện chuột
     */
    function updateProgressFromMouse(e) {
        // Nếu đang cập nhật UI, bỏ qua để tránh xung đột
        if (updatingUI) return;
        
        updatingUI = true;
        
        const progressBarEl = $('.progress-bar');
        const position = (e.pageX - progressBarEl.offset().left) / progressBarEl.width();
        const boundedPosition = Math.max(0, Math.min(1, position));
        
        if (videoPlayer.duration) {
            // Tính toán khung hình chính xác nếu có FPS
            let targetTime;
            if (state.fps > 0) {
                const frameDuration = 1 / state.fps;
                const targetFrame = Math.round(boundedPosition * videoPlayer.duration / frameDuration);
                targetTime = targetFrame * frameDuration;
            } else {
                targetTime = boundedPosition * videoPlayer.duration;
            }
            
            // Đảm bảo thời gian nằm trong phạm vi video
            const boundedTime = Math.max(0, Math.min(targetTime, videoPlayer.duration));
            
            console.log(`Cập nhật vị trí từ thanh tiến trình: ${boundedTime}s`);
            
            // Áp dụng thời gian
            videoPlayer.currentTime = boundedTime;
            
            // Cập nhật hiển thị
            const timeInMilliseconds = (boundedTime * 1000).toFixed(0);
            $('#timeCode').val(timeInMilliseconds);
            
            // Cập nhật thanh tiến trình
            Utils.updateProgressBar(videoPlayer, progressBar);
            
            // Cập nhật wavesurfer một cách thủ công để đảm bảo đồng bộ
            if (state.wavesurfer && state.wavesurferInitialized) {
                setTimeout(() => {
                    try {
                        state.updatingFromVideo = true;
                        const progress = boundedTime / videoPlayer.duration;
                        state.wavesurfer.seekTo(progress);
                        
                        setTimeout(() => { 
                            state.updatingFromVideo = false;
                            updatingUI = false;
                        }, UPDATE_DELAY);
                    } catch (e) {
                        console.error("Lỗi khi cập nhật wavesurfer:", e);
                        state.updatingFromVideo = false;
                        updatingUI = false;
                    }
                }, 10);
            } else {
                setTimeout(() => { updatingUI = false; }, UPDATE_DELAY);
            }
        } else {
            updatingUI = false;
        }
    }
    
    /**
     * Cập nhật liên tục hiển thị thời gian với requestAnimationFrame
     */
    function updateTimeDisplay() {
        if (!state.isUserChanging && videoPlayer.duration && !updatingUI) {
            $('#timeCode').val((videoPlayer.currentTime * 1000).toFixed(0));
            if (!state.isDragging) Utils.updateProgressBar(videoPlayer, progressBar);
        }
        
        // Sử dụng requestAnimationFrame với giới hạn tốc độ để tối ưu hiệu suất
        state.updateTimeTask = setTimeout(() => requestAnimationFrame(updateTimeDisplay), 100);
    }
    
    /**
     * Thiết lập tất cả bộ xử lý sự kiện và khởi tạo các thành phần
     */
    function setupPlayerAndEvents() {
        // Khởi tạo xử lý sự kiện
        $('#seekBack10').on('click', () => seekToFrame(-10));
        $('#seekBack1').on('click', () => seekToFrame(-1));
        $('#seekForward1').on('click', () => seekToFrame(1));
        $('#seekForward10').on('click', () => seekToFrame(10));
        
        // Xử lý nhập thời gian
        $('#timeCode').on('focus', () => { state.isUserChanging = true; });
        
        $('#timeCode').on('blur', function() {
            if ($(this).val() === '') $(this).val('0');
            state.isUserChanging = false;
        });
        
        $('#timeCode').on('keydown', function(e) {
            if (e.key === 'Enter') {
                const timeMs = parseInt($(this).val(), 10);
                if (!isNaN(timeMs)) {
                    // Đánh dấu đang cập nhật để tránh xung đột
                    updatingUI = true;
                    
                    // Đặt thời gian video
                    const boundedTime = Math.min(Math.max(0, timeMs / 1000), videoPlayer.duration || 0);
                    
                    console.log(`Cập nhật thời gian từ nhập liệu: ${boundedTime}s`);
                    
                    videoPlayer.currentTime = boundedTime;
                    Utils.updateProgressBar(videoPlayer, progressBar);
                    
                    // Cập nhật wavesurfer một cách thủ công để đảm bảo đồng bộ
                    if (state.wavesurfer && state.wavesurferInitialized) {
                        setTimeout(() => {
                            try {
                                state.updatingFromVideo = true;
                                const progress = boundedTime / videoPlayer.duration;
                                state.wavesurfer.seekTo(progress);
                                
                                setTimeout(() => { 
                                    state.updatingFromVideo = false;
                                    updatingUI = false;
                                }, UPDATE_DELAY);
                            } catch (e) {
                                console.error("Lỗi khi cập nhật wavesurfer:", e);
                                state.updatingFromVideo = false;
                                updatingUI = false;
                            }
                        }, 10);
                    } else {
                        setTimeout(() => { updatingUI = false; }, UPDATE_DELAY);
                    }
                }
                state.isUserChanging = false;
                $(this).blur();
            }
        });
        
        // Nút sao chép
        $('#copyBtn').on('click', function() {
            const timeMs = (videoPlayer.currentTime * 1000).toFixed(0);
            
            Utils.copyToClipboard(timeMs)
                .then(success => {
                    if (success) {
                        // Sử dụng hàm showToast từ Utils
                        Utils.showToast(document.getElementById('toast'), "Đã sao chép!");
                    }
                });
        });
        
        // Tương tác thanh tiến trình với xử lý mượt mà hơn
        $('.progress-bar').on('mousedown', function(e) {
            state.isDragging = true;
            
            // Tạm dừng video nếu đang phát để cải thiện trải nghiệm kéo thả
            if (!videoPlayer.paused) {
                safePause();
            }
            
            updateProgressFromMouse(e);
            e.preventDefault();
        });
        
        $(document).on('mousemove', Utils.throttle((e) => { 
            if (state.isDragging) updateProgressFromMouse(e);
        }, 30)); // Giới hạn cập nhật tối đa 30ms một lần (mượt mà hơn)
        
        $(document).on('mouseup', () => { 
            state.isDragging = false;
            
            // Đảm bảo rằng tất cả các bộ đếm thời gian đã được reset
            setTimeout(() => { updatingUI = false; }, UPDATE_DELAY);
        });
        
        // Phím tắt
        $(document).on('keydown', function(e) {
            if (document.activeElement.tagName === 'INPUT') return;
            
            switch (e.key) {
                case 'ArrowLeft':
                    seekToFrame(e.shiftKey ? -10 : -1);
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                    seekToFrame(e.shiftKey ? 10 : 1);
                    e.preventDefault();
                    break;
                case ' ':
                case 'Space':
                    if (videoPlayer.paused) {
                        safePlay().catch(err => {
                            console.error("Không thể phát video:", err);
                        });
                    } else {
                        safePause();
                    }
                    e.preventDefault();
                    break;
            }
        });
        
        // Sự kiện phát video
        $(videoPlayer).on('click', function() {
            if (this.paused) {
                safePlay().catch(err => {
                    console.error("Không thể phát video khi click:", err);
                });
            } else {
                safePause();
            }
        });
        
        // Bắt đầu cập nhật liên tục hiển thị thời gian
        updateTimeDisplay();
    }
    
    // Trả về các phương thức công khai
    return {
        seekToFrame,
        updateProgressFromMouse,
        updateTimeDisplay,
        setupPlayerAndEvents,
        safePlay,
        safePause
    };
}