/**
 * File khởi tạo cho trình phát video nâng cao
 * Kết nối tất cả các module khác
 */

// Import các module
import { setupFpsDetection } from './fps-detector.js';
import { initWaveSurfer } from './waveform.js';
import { setupPlayerControls } from './player-controls.js'; // Vẫn dùng cho nút frame, input, phím tắt
import { Utils } from './utils.js';
import { setupMarkers } from './markers.js';
import { setupCustomControls } from './custom-controls.js'; // Import module controls mới

// Khởi tạo ứng dụng khi tài liệu đã sẵn sàng
$(document).ready(function() {
    console.log('App initializing...');

    // DOM Elements
    const elements = {
        videoPlayer: document.getElementById('videoPlayer'),
        videoWrapper: document.querySelector('.video-wrapper'), // Wrapper cho video và controls mới
        timeCode: document.getElementById('timeCode'), // Input timecode vẫn dùng
        // progressBar: document.getElementById('progressBar'), // Thanh progress cũ (dưới controls chính) - Xem xét có cần giữ lại ko
        fpsBadge: document.getElementById('fpsBadge'),
        hiddenVideo: document.getElementById('hiddenVideo'),
        loadingOverlay: document.getElementById('loadingOverlay'),
        waveformContainer: document.querySelector('.waveform-container'),
        toast: document.getElementById('toast')
    };

    // Trạng thái ứng dụng
    const state = {
        fps: 0,
        cachedFPS: null,
        isMeasuring: false,
        useDirectMethod: false,
        measuringTimeout: null,
        isDragging: false, // Cờ này có thể dùng cho thanh progress cũ nếu còn giữ
        isDraggingCustomBar: false, // Cờ cho thanh progress mới (quản lý trong custom-controls.js)
        isUserChanging: false, // Cờ khi người dùng nhập timecode
        updateTimeTask: null,
        wavesurfer: null,
        wavesurferInitialized: false,
        updatingFromVideo: false,
        updatingFromWaveform: false,
        isInitialized: false,
        initializing: false,
        isVideoPlaying: false // Cờ này có thể không cần nữa nếu dựa vào video.paused
    };

    // --- Safe Play/Pause Functions ---
    // Định nghĩa ở đây để dễ dàng truy cập và gán vào video element
    let videoPlayPromise = null;

    function safePlay() {
        const video = elements.videoPlayer;
        if (video.paused) {
            try {
                videoPlayPromise = video.play(); // Sử dụng play() gốc
                if (videoPlayPromise !== undefined) {
                    videoPlayPromise.catch(err => {
                        console.warn("Không thể phát video (promise rejected):", err.name, err.message);
                        videoPlayPromise = null;
                        state.isVideoPlaying = false; // Cập nhật state nếu cần
                    });
                } else {
                     // Nếu play() không trả về promise (trường hợp hiếm)
                     console.log("Video play() không trả về promise.");
                }
                state.isVideoPlaying = true;
                return videoPlayPromise;
            } catch (e) {
                console.error("Lỗi khi gọi video.play():", e);
                videoPlayPromise = null;
                state.isVideoPlaying = false;
                return Promise.reject(e);
            }
        }
        return Promise.resolve(); // Trả về resolved promise nếu đã phát
    }

    function safePause() {
        const video = elements.videoPlayer;
        if (!video.paused) {
            const pauseAction = () => {
                try {
                    video.pause(); // Sử dụng pause() gốc
                    state.isVideoPlaying = false;
                    videoPlayPromise = null;
                } catch (e) {
                     console.error("Lỗi khi gọi video.pause():", e);
                }
            };

            if (videoPlayPromise) {
                // Đợi promise phát hoàn thành (nếu có)
                videoPlayPromise.then(pauseAction).catch(pauseAction); // Vẫn pause kể cả khi play bị lỗi
            } else {
                pauseAction();
            }
        }
    }

    // Gán hàm safePlay/safePause vào video element để custom-controls.js có thể dùng
    elements.videoPlayer.safePlay = safePlay;
    elements.videoPlayer.safePause = safePause;


    // Xử lý sự kiện khi DOM đã sẵn sàng
    function initializeApp() {
        if (state.initializing || state.isInitialized) return;

        state.initializing = true;
        console.log('DOM fully loaded, initializing app components');

        // Khởi tạo các module
        const fpsDetector = setupFpsDetection(elements.videoPlayer, elements.hiddenVideo, elements.fpsBadge, state);

        // Khởi tạo Player Controls (cho nút frame, input, phím tắt)
        // Chú ý: Truyền progressBar cũ nếu muốn nó cập nhật visual, nếu không thì truyền null
        // const playerControls = setupPlayerControls(elements.videoPlayer, elements.timeCode, elements.progressBar, state);
        const playerControls = setupPlayerControls(elements.videoPlayer, elements.timeCode, null, state); // Giả sử không cần cập nhật thanh progress cũ nữa
        playerControls.setupPlayerAndEvents(); // Gọi hàm setup

        // Khởi tạo Markers
        const markersModule = setupMarkers(
            elements.videoPlayer,
            document.getElementById('progressBarContainer'), // Markers vẫn đặt trên container cũ
            elements.waveformContainer,
            state
        );
        markersModule.init();

        // === KHỞI TẠO CUSTOM CONTROLS MỚI ===
        setupCustomControls(elements.videoPlayer, elements.videoWrapper, state);
        // =====================================

        // Đảm bảo Utils có thể truy cập từ global scope nếu cần
        window.Utils = Utils;

        // Biến đếm số lần thử khởi tạo wavesurfer
        let wavesurferRetries = 0;
        const MAX_WAVESURFER_RETRIES = 5;

        // Hàm khởi tạo WaveSurfer với retry logic
        function initializeWaveSurfer() {
            // ... (logic initializeWaveSurfer giữ nguyên như trước) ...
            if (wavesurferRetries >= MAX_WAVESURFER_RETRIES) {
                console.error('Đã thử khởi tạo WaveSurfer quá nhiều lần, bỏ qua.');
                elements.loadingOverlay.style.display = 'none';
                return;
            }
            console.log(`Khởi tạo WaveSurfer (lần thử ${wavesurferRetries + 1})`);
            try {
                if (elements.videoPlayer.readyState >= 3 || elements.videoPlayer.currentSrc) { // Sửa điều kiện check
                    state.wavesurfer = initWaveSurfer(elements.videoPlayer, elements.waveformContainer, elements.loadingOverlay, state);
                    if (state.wavesurfer) { // Kiểm tra nếu init thành công
                         state.wavesurferInitialized = true;
                         wavesurferRetries = 0; // Reset counter khi thành công
                    } else {
                         // Handle trường hợp initWaveSurfer trả về null
                         wavesurferRetries++;
                         setTimeout(initializeWaveSurfer, 1000);
                    }
                } else {
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
            // ... (logic triggerFPSDetection giữ nguyên như trước) ...
             state.cachedFPS = null;
            state.isMeasuring = false;
            if (elements.fpsBadge) {
                elements.fpsBadge.style.display = 'none';
                const span = elements.fpsBadge.querySelector('span');
                if (span) span.textContent = "Đang phát hiện...";
                elements.fpsBadge.style.display = 'flex';
            }
            console.log("Kích hoạt phát hiện FPS...");
            setTimeout(() => {
                if (!state.cachedFPS && !state.isMeasuring) {
                    console.log("Bắt đầu phát hiện FPS tự động");
                    fpsDetector.autoDetectFPS();
                }
            }, 500);
        }

        // Khởi tạo wavesurfer khi video sẵn sàng
        function setupWaveSurfer() {
            // ... (logic setupWaveSurfer giữ nguyên như trước) ...
             wavesurferRetries = 0;
            setTimeout(() => {
                if (!state.wavesurferInitialized) {
                    initializeWaveSurfer();
                } else if (state.wavesurfer) {
                    try {
                        state.wavesurfer.empty();
                        // Đảm bảo có currentSrc trước khi load
                        if(elements.videoPlayer.currentSrc) {
                            state.wavesurfer.load(elements.videoPlayer.currentSrc);
                        } else {
                            console.warn("Không có video source để tải vào wavesurfer.");
                        }
                    } catch(e) {
                        console.error('Error reloading wavesurfer:', e);
                        initializeWaveSurfer(); // Khởi tạo lại nếu lỗi
                    }
                }
            }, 500);
        }

        // Đảm bảo chỉ chạy một lần khi tải trang
        function ensureInitialization() {
             // Logic này có thể không cần thiết nữa nếu initializeApp chỉ gọi 1 lần
            if (!state.isInitialized) {
                console.log("Khởi tạo các thành phần...");
                // playerControls.setupPlayerAndEvents(); // Đã gọi ở trên
                state.isInitialized = true;
                state.initializing = false;
            }
        }

        // Xử lý sự kiện tải video
        elements.videoPlayer.addEventListener('loadedmetadata', function() {
            console.log('Video loadedmetadata, duration:', elements.videoPlayer.duration);
            triggerFPSDetection();
            setupWaveSurfer();
            ensureInitialization(); // Gọi để đánh dấu isInitialized
        });

        // Trường hợp video đã được tải trước khi đăng ký sự kiện
        if (elements.videoPlayer.readyState >= 2) {
            console.log('Video đã được tải trước, kích hoạt manually');
            triggerFPSDetection();
            setupWaveSurfer();
            ensureInitialization();
        }

        // Đảm bảo wavesurfer được khởi tạo khi video đã tải hoàn tất
        elements.videoPlayer.addEventListener('canplaythrough', function() {
            if (!state.wavesurferInitialized && elements.videoPlayer.readyState >= 3) {
                console.log('Video can play through, initializing wavesurfer');
                initializeWaveSurfer();
            }
            if (!state.cachedFPS && !state.isMeasuring) {
                console.log("Kích hoạt phát hiện FPS từ canplaythrough");
                fpsDetector.autoDetectFPS();
            }
            ensureInitialization();
        });

        // Xử lý lỗi video
        elements.videoPlayer.addEventListener('error', function(e) {
            console.error('Video error:', e);
            if(elements.fpsBadge) elements.fpsBadge.querySelector('span').textContent = "Lỗi video";
            if(elements.fpsBadge) elements.fpsBadge.style.display = 'flex';
            if(elements.loadingOverlay) elements.loadingOverlay.querySelector('.loading-text').textContent = 'Không thể tải video';
            if(elements.loadingOverlay) elements.loadingOverlay.querySelector('.loading-spinner').style.display = 'none';
            state.cachedFPS = null;
            fpsDetector.cleanupHiddenVideo();
        });

        // Đồng bộ wavesurfer với video
        elements.videoPlayer.addEventListener('timeupdate', function() {
            // Đồng bộ WaveSurfer
            if (state.wavesurfer && !state.isDraggingCustomBar && state.wavesurferInitialized && !state.updatingFromWaveform) {
                try {
                    state.updatingFromVideo = true;
                    const progress = elements.videoPlayer.currentTime / elements.videoPlayer.duration;
                    if (!state.wavesurfer.isSeeking) { // Kiểm tra cờ nội bộ của wavesurfer nếu có, hoặc dùng state.updatingFromWaveform
                        state.wavesurfer.seekTo(progress);
                    }
                    setTimeout(() => { state.updatingFromVideo = false; }, 50); // Giảm thời gian chờ
                } catch(e) {
                    // console.error('Error updating wavesurfer position:', e); // Có thể gây spam log
                    state.updatingFromVideo = false;
                }
            }
             // Cập nhật Markers (nếu cần liên tục)
            if (markersModule && !state.updatingFromVideo && !state.updatingFromWaveform) {
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

        // Hỗ trợ thiết bị di động (AudioContext)
        document.addEventListener('touchstart', function() {
            if (state.wavesurfer && state.wavesurfer.backend &&
                state.wavesurfer.backend.ac &&
                state.wavesurfer.backend.ac.state === 'suspended') {
                state.wavesurfer.backend.ac.resume();
            }
        }, {once: true});

        // Đánh dấu đã khởi tạo cuối cùng
        state.isInitialized = true;
        state.initializing = false;
        console.log("initializeApp finished.");
    }

    // Đảm bảo kích thước đúng cho full screen
    function adjustFullHeight() {
        const vh = window.innerHeight;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
        // Vẽ lại wavesurfer nếu cần
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

    // Cải thiện cấu trúc toast (giữ nguyên)
    // ... (code toast structure check) ...
    const toastElement = document.getElementById('toast');
    if (toastElement && !toastElement.querySelector('span')) {
        const iconElement = toastElement.querySelector('i');
        const content = toastElement.textContent.trim().replace(iconElement?.textContent || '', '').trim(); // Lấy text không bao gồm icon
        toastElement.textContent = '';
        if (iconElement) {
            toastElement.appendChild(iconElement);
        } else {
            const newIcon = document.createElement('i');
            newIcon.className = 'fas fa-check-circle';
            toastElement.appendChild(newIcon);
        }
        const contentSpan = document.createElement('span');
        contentSpan.textContent = content || "Đã sao chép!"; // Default message
        toastElement.appendChild(contentSpan);
    }

    // Chạy khởi tạo ngay lập tức
    initializeApp();

    // Đảm bảo khởi tạo đầy đủ sau khi trang đã tải xong hoàn toàn
    window.addEventListener('load', function() {
        console.log('Window fully loaded, ensuring complete initialization');
        setTimeout(function() {
            if (!state.isInitialized) {
                console.warn('Forcing initialization after window load');
                initializeApp(); // Gọi lại nếu chưa init
            }
            // Kiểm tra lại FPS và Wavesurfer nếu chưa có
            if (!state.cachedFPS && !state.isMeasuring && elements.videoPlayer.readyState >= 2) {
                 console.log("Forcing FPS detection after window load");
                 const fpsDetector = setupFpsDetection(elements.videoPlayer, elements.hiddenVideo, elements.fpsBadge, state);
                 fpsDetector.autoDetectFPS();
            }
            if (!state.wavesurferInitialized && elements.videoPlayer.readyState >= 2) {
                console.log('Forcing Wavesurfer initialization after window load');
                // Gọi lại hàm khởi tạo wavesurfer
                 if (state.wavesurfer) { // Nếu đã có object nhưng chưa init xong
                     try {
                          if(elements.videoPlayer.currentSrc) state.wavesurfer.load(elements.videoPlayer.currentSrc);
                     } catch(e) { console.error(e); }
                 } else { // Nếu chưa có object
                      state.wavesurfer = initWaveSurfer(elements.videoPlayer, elements.waveformContainer, elements.loadingOverlay, state);
                      state.wavesurferInitialized = !!state.wavesurfer;
                 }
            }
        }, 1000); // Chờ 1 giây
    });
});