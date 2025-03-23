/**
 * File khởi tạo cho trình phát video nâng cao
 * Kết nối tất cả các module khác
 */

// Import các module
import { setupFpsDetection } from './fps-detector.js';
import { initWaveSurfer } from './waveform.js';
import { setupPlayerControls } from './player-controls.js';
import { Utils } from './utils.js';
import { setupMarkers } from './markers.js';

// Khởi tạo ứng dụng khi tài liệu đã sẵn sàng
$(document).ready(function() {
    console.log('App initializing...');
    
    // DOM Elements
    const elements = {
        videoPlayer: document.getElementById('videoPlayer'),
        timeCode: document.getElementById('timeCode'),
        progressBar: document.getElementById('progressBar'),
        fpsBadge: document.getElementById('fpsBadge'),
        hiddenVideo: document.getElementById('hiddenVideo'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        waveformContainer: document.querySelector('.waveform-container'),
        toast: document.getElementById('toast')
    };
    
    // Trạng thái ứng dụng
    const state = {
        fps: 0, // Bắt đầu với 0 để cho phép phát hiện FPS tự động
        cachedFPS: null,
        isMeasuring: false,
        useDirectMethod: false,
        measuringTimeout: null,
        isDragging: false,
        isUserChanging: false,
        updateTimeTask: null,
        wavesurfer: null,
        wavesurferInitialized: false,
        updatingFromVideo: false,
        updatingFromWaveform: false,
        isInitialized: false, // Cờ theo dõi trạng thái khởi tạo
        initializing: false,  // Cờ ngăn khởi tạo nhiều lần
        isVideoPlaying: false // Cờ theo dõi trạng thái phát/dừng
    };
    
    // Biến theo dõi promise phát video
    let videoPlayPromise = null;
    
    /**
     * Phát video an toàn, tránh AbortError
     */
    function safePlay() {
        if (elements.videoPlayer.paused) {
            try {
                // Lưu promise phát
                state.isVideoPlaying = true;
                videoPlayPromise = elements.videoPlayer.originalPlay();
                
                // Xử lý lỗi nếu có
                videoPlayPromise.catch(err => {
                    console.warn("Không thể phát video:", err);
                    state.isVideoPlaying = false;
                    videoPlayPromise = null;
                });
                
                return videoPlayPromise;
            } catch (e) {
                console.error("Lỗi khi phát video:", e);
                state.isVideoPlaying = false;
                videoPlayPromise = null;
                return Promise.reject(e);
            }
        }
        
        return Promise.resolve();
    }
    
    /**
     * Tạm dừng video an toàn, đợi promise phát hoàn thành
     */
    function safePause() {
        if (!elements.videoPlayer.paused) {
            if (videoPlayPromise) {
                // Đợi promise phát hoàn thành
                videoPlayPromise.then(() => {
                    elements.videoPlayer.originalPause();
                    state.isVideoPlaying = false;
                    videoPlayPromise = null;
                }).catch(() => {
                    // Vẫn pause khi có lỗi
                    elements.videoPlayer.originalPause();
                    state.isVideoPlaying = false;
                    videoPlayPromise = null;
                });
            } else {
                // Nếu không có promise phát đang chạy
                elements.videoPlayer.originalPause();
                state.isVideoPlaying = false;
            }
        }
    }
    
    // Xử lý sự kiện khi DOM đã sẵn sàng
    function initializeApp() {
        if (state.initializing || state.isInitialized) return;
        
        state.initializing = true;
        console.log('DOM fully loaded, initializing app components');
        
        // Lưu phương thức gốc của video player
        elements.videoPlayer.originalPlay = elements.videoPlayer.play;
        elements.videoPlayer.originalPause = elements.videoPlayer.pause;
        
        // Ghi đè phương thức play/pause để sử dụng phiên bản an toàn
        elements.videoPlayer.play = function() {
            return safePlay();
        };
        
        elements.videoPlayer.pause = function() {
            safePause();
        };
        
        // Khởi tạo các module
        const fpsDetector = setupFpsDetection(elements.videoPlayer, elements.hiddenVideo, elements.fpsBadge, state);
        const playerControls = setupPlayerControls(elements.videoPlayer, elements.timeCode, elements.progressBar, state);
        const markersModule = setupMarkers(
            elements.videoPlayer, 
            document.getElementById('progressBarContainer'), 
            elements.waveformContainer, 
            state
        );
        markersModule.init();
        
        // Đảm bảo Utils có thể truy cập từ global scope để sử dụng trong markers.js
        window.Utils = Utils;
        // Biến đếm số lần thử khởi tạo wavesurfer
        let wavesurferRetries = 0;
        const MAX_WAVESURFER_RETRIES = 5;
        
        // Xử lý sự kiện play/pause
        elements.videoPlayer.addEventListener('play', function() {
            console.log('Video play event');
            
            // Đặt cờ phát
            state.isVideoPlaying = true;
            
            // Đảm bảo wavesurfer cũng được phát nếu đã khởi tạo
            if (state.wavesurfer && state.wavesurferInitialized) {
                try {
                    state.wavesurfer.play();
                } catch (e) {
                    console.error("Lỗi khi phát wavesurfer:", e);
                }
            }
        });
        
        elements.videoPlayer.addEventListener('pause', function() {
            console.log('Video pause event');
            
            // Đặt cờ tạm dừng
            state.isVideoPlaying = false;
            
            // Đảm bảo wavesurfer cũng được tạm dừng nếu đã khởi tạo
            if (state.wavesurfer && state.wavesurferInitialized) {
                try {
                    state.wavesurfer.pause();
                } catch (e) {
                    console.error("Lỗi khi tạm dừng wavesurfer:", e);
                }
            }
        });
        
        // Hàm khởi tạo WaveSurfer với retry logic
        function initializeWaveSurfer() {
            if (wavesurferRetries >= MAX_WAVESURFER_RETRIES) {
                console.error('Đã thử khởi tạo WaveSurfer quá nhiều lần, bỏ qua.');
                elements.loadingOverlay.style.display = 'none';
                return;
            }
            
            console.log(`Khởi tạo WaveSurfer (lần thử ${wavesurferRetries + 1})`);
            
            try {
                // Đảm bảo video đã sẵn sàng
                if (elements.videoPlayer.readyState >= 3) {
                    state.wavesurfer = initWaveSurfer(elements.videoPlayer, elements.waveformContainer, elements.loadingOverlay, state);
                    state.wavesurferInitialized = true;
                    wavesurferRetries = 0; // Reset counter khi thành công
                } else {
                    // Nếu video chưa sẵn sàng, thử lại sau 500ms
                    wavesurferRetries++;
                    setTimeout(initializeWaveSurfer, 500);
                }
            } catch (err) {
                console.error('Lỗi khởi tạo WaveSurfer:', err);
                wavesurferRetries++;
                setTimeout(initializeWaveSurfer, 1000);
            }
        }
        
        // Kích hoạt phát hiện FPS
        function triggerFPSDetection() {
            // Reset cached FPS
            state.cachedFPS = null;
            state.isMeasuring = false;
            elements.fpsBadge.style.display = 'none';
            
            console.log("Kích hoạt phát hiện FPS...");
            
            // Đặt FPS Badge để hiển thị đang phát hiện
            elements.fpsBadge.querySelector('span').textContent = "Đang phát hiện...";
            elements.fpsBadge.style.display = 'flex';
            
            // Phát hiện FPS sau khoảng thời gian ngắn
            setTimeout(() => {
                if (!state.cachedFPS && !state.isMeasuring) {
                    console.log("Bắt đầu phát hiện FPS tự động");
                    fpsDetector.autoDetectFPS();
                }
            }, 500);
        }
        
        // Khởi tạo wavesurfer khi video sẵn sàng
        function setupWaveSurfer() {
            // Reset biến thử lại wavesurfer
            wavesurferRetries = 0;
            
            // Đảm bảo container waveform đã được render
            setTimeout(() => {
                // Khởi tạo wavesurfer
                if (!state.wavesurferInitialized) {
                    initializeWaveSurfer();
                } else if (state.wavesurfer) {
                    // Nếu đã khởi tạo thì chỉ cần tải lại
                    try {
                        state.wavesurfer.empty();
                        state.wavesurfer.load(elements.videoPlayer.currentSrc);
                    } catch(e) {
                        console.error('Error reloading wavesurfer:', e);
                        // Khởi tạo lại nếu tải lại không thành công
                        initializeWaveSurfer();
                    }
                }
            }, 500);
        }
        
        // Đảm bảo chỉ chạy một lần khi tải trang
        function ensureInitialization() {
            if (!state.isInitialized) {
                console.log("Khởi tạo các thành phần...");
                
                // Khởi tạo trình phát
                playerControls.setupPlayerAndEvents();
                
                // Đánh dấu đã khởi tạo
                state.isInitialized = true;
                state.initializing = false;
            }
        }
        
        // Xử lý sự kiện tải video
        elements.videoPlayer.addEventListener('loadedmetadata', function() {
            console.log('Video loaded, duration:', elements.videoPlayer.duration);
            
            // Kích hoạt phát hiện FPS
            triggerFPSDetection();
            
            // Khởi tạo Wavesurfer
            setupWaveSurfer();
            
            // Đảm bảo các thành phần được khởi tạo
            ensureInitialization();
        });
        
        // Trường hợp video đã được tải trước khi đăng ký sự kiện
        if (elements.videoPlayer.readyState >= 2) {
            console.log('Video đã được tải trước khi đăng ký sự kiện, kích hoạt manually');
            
            // Kích hoạt phát hiện FPS
            triggerFPSDetection();
            
            // Khởi tạo Wavesurfer
            setupWaveSurfer();
        }
        
        // Đảm bảo wavesurfer được khởi tạo khi video đã tải hoàn tất
        elements.videoPlayer.addEventListener('canplaythrough', function() {
            if (!state.wavesurferInitialized && elements.videoPlayer.readyState >= 3) {
                console.log('Video can play through, initializing wavesurfer');
                initializeWaveSurfer();
            }
            
            // Kích hoạt phát hiện FPS nếu chưa có
            if (!state.cachedFPS && !state.isMeasuring) {
                console.log("Kích hoạt phát hiện FPS từ canplaythrough");
                fpsDetector.autoDetectFPS();
            }
            
            // Đảm bảo các thành phần được khởi tạo
            ensureInitialization();
        });
        
        // Xử lý lỗi video
        elements.videoPlayer.addEventListener('error', function(e) {
            console.error('Video error:', e);
            elements.fpsBadge.querySelector('span').textContent = "Lỗi video";
            elements.fpsBadge.style.display = 'flex';
            
            elements.loadingOverlay.querySelector('.loading-text').textContent = 'Không thể tải video';
            elements.loadingOverlay.querySelector('.loading-spinner').style.display = 'none';
            
            // Dọn dẹp tài nguyên
            state.cachedFPS = null;
            fpsDetector.cleanupHiddenVideo();
        });
        
        // Đồng bộ wavesurfer với video - chỉ cập nhật khi không đang cập nhật từ waveform
        elements.videoPlayer.addEventListener('timeupdate', function() {
            if (state.wavesurfer && !state.isDragging && state.wavesurferInitialized && !state.updatingFromWaveform) {
                try {
                    // Đánh dấu đang cập nhật từ video để tránh vòng lặp
                    state.updatingFromVideo = true;
                    
                    const progress = elements.videoPlayer.currentTime / elements.videoPlayer.duration;
                    if (state.wavesurfer.params && !state.wavesurfer.params.skipUpdate) {
                        state.wavesurfer.seekTo(progress);
                    }
                    
                    // Kết thúc cập nhật từ video
                    setTimeout(() => {
                        state.updatingFromVideo = false;
                    }, 100); // Tăng thời gian timeout để giảm xung đột
                } catch(e) {
                    console.error('Error updating wavesurfer position:', e);
                    state.updatingFromVideo = false;
                }
            }
            if (markersModule && !state.updatingFromVideo && !state.updatingFromWaveform) {
                // Đảm bảo markers được hiển thị đúng vị trí
                markersModule.renderMarkers();
            }
        });
        
        // Dọn dẹp tài nguyên khi trang được đóng
        window.addEventListener('beforeunload', function() {
            if (state.wavesurfer) {
                state.wavesurfer.destroy();
                state.wavesurfer = null;
            }
            
            fpsDetector.cleanupHiddenVideo();
            
            if (state.updateTimeTask) {
                clearTimeout(state.updateTimeTask);
            }
        });
        
        // Hỗ trợ thiết bị di động
        document.addEventListener('touchstart', function() {
            // Cố gắng khôi phục AudioContext trên thiết bị di động
            if (state.wavesurfer && state.wavesurfer.backend && 
                state.wavesurfer.backend.ac && 
                state.wavesurfer.backend.ac.state === 'suspended') {
                state.wavesurfer.backend.ac.resume();
            }
        }, {once: true});
        
        // Khởi tạo trình phát
        playerControls.setupPlayerAndEvents();
        
        // Đánh dấu đã khởi tạo
        state.isInitialized = true;
        state.initializing = false;
    }
    
    // Đảm bảo kích thước đúng cho full screen
    function adjustFullHeight() {
        const vh = window.innerHeight;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        if (state.wavesurfer && state.wavesurferInitialized) {
            try {
                state.wavesurfer.drawBuffer();
            } catch(e) {
                console.error('Error redrawing wavesurfer after resize:', e);
            }
        }
    }
    
    // Thiết lập kích thước ban đầu và khi resize
    adjustFullHeight();
    window.addEventListener('resize', Utils.debounce(adjustFullHeight, 250));
    
    // Cải thiện cấu trúc toast
    const toastElement = document.getElementById('toast');
    if (toastElement && !toastElement.querySelector('span')) {
        // Cấu trúc toast: Biểu tượng ✓ + span nội dung
        const iconElement = toastElement.querySelector('i');
        const content = toastElement.textContent.trim();
        
        // Xóa nội dung hiện tại
        toastElement.textContent = '';
        
        // Thêm lại icon nếu có
        if (iconElement) {
            toastElement.appendChild(iconElement);
        } else {
            // Tạo icon mới nếu không có
            const newIcon = document.createElement('i');
            newIcon.className = 'fas fa-check-circle';
            toastElement.appendChild(newIcon);
        }
        
        // Thêm span nội dung
        const contentSpan = document.createElement('span');
        contentSpan.textContent = content;
        toastElement.appendChild(contentSpan);
    }
    
    // Chạy khởi tạo ngay lập tức
    initializeApp();
    
    // Đảm bảo khởi tạo đầy đủ sau khi trang đã tải xong hoàn toàn
    window.addEventListener('load', function() {
        console.log('Window fully loaded, ensuring complete initialization');
        
        // Chờ một chút để đảm bảo tất cả các tài nguyên đã tải xong
        setTimeout(function() {
            if (!state.isInitialized) {
                console.log('Cưỡng chế khởi tạo sau khi trang đã tải hoàn toàn');
                initializeApp();
            }
            
            // Kiểm tra nếu FPS chưa được phát hiện, cố gắng phát hiện lại
            if (!state.cachedFPS && !state.isMeasuring) {
                console.log("Cưỡng chế phát hiện FPS sau khi trang đã tải hoàn toàn");
                const fpsDetector = setupFpsDetection(elements.videoPlayer, elements.hiddenVideo, elements.fpsBadge, state);
                fpsDetector.autoDetectFPS();
            }
            
            // Kiểm tra nếu wavesurfer chưa được khởi tạo
            if (!state.wavesurferInitialized && elements.videoPlayer.readyState >= 2) {
                console.log('Cưỡng chế khởi tạo wavesurfer sau khi trang đã tải hoàn toàn');
                state.wavesurfer = initWaveSurfer(elements.videoPlayer, elements.waveformContainer, elements.loadingOverlay, state);
                state.wavesurferInitialized = true;
            }
        }, 1000);
    });
});