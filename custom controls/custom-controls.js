// js/custom-controls.js
import { Utils } from './utils.js';

/**
 * Khởi tạo và quản lý các điều khiển video tùy chỉnh theo kiểu YouTube
 * @param {HTMLVideoElement} videoPlayer
 * @param {HTMLElement} videoWrapper Div bao quanh video và controls
 * @param {Object} state Trạng thái ứng dụng
 */
export function setupCustomControls(videoPlayer, videoWrapper, state) {
    // Lấy các phần tử DOM của controls tùy chỉnh
    const customControls = videoWrapper.querySelector('.custom-video-controls');
    const playPauseBtn = document.getElementById('customPlayPause');
    const playPauseIcon = playPauseBtn.querySelector('i');
    const timeInfo = document.getElementById('customTimeInfo');
    const progressContainer = document.getElementById('customProgressContainer');
    const progressBarPlayed = document.getElementById('customProgressPlayed');
    const progressThumb = document.getElementById('customProgressThumb');
    const progressBuffer = document.getElementById('customProgressBuffer');
    const volumeBtn = document.getElementById('customVolume');
    const volumeIcon = volumeBtn.querySelector('i');
    const volumeSlider = document.getElementById('customVolumeSlider');
    const fullscreenBtn = document.getElementById('customFullscreen');
    const fullscreenIcon = fullscreenBtn.querySelector('i');
    const settingsBtn = document.getElementById('customSettings');
    const speedMenu = document.getElementById('speedMenu'); // Lấy menu
    const speedOptions = speedMenu.querySelectorAll('.speed-option'); // Lấy các tùy chọn tốc độ

    let isDraggingProgressBar = false;
    let controlsTimeout;

    // --- Helper Functions ---

    function formatTime(seconds) {
        return Utils.formatTime(seconds || 0);
    }

    function updatePlayPauseIcon() {
        if (videoPlayer.paused || videoPlayer.ended) {
            playPauseIcon.classList.remove('fa-pause');
            playPauseIcon.classList.add('fa-play');
            playPauseBtn.setAttribute('title', 'Play');
        } else {
            playPauseIcon.classList.remove('fa-play');
            playPauseIcon.classList.add('fa-pause');
            playPauseBtn.setAttribute('title', 'Pause');
        }
    }

    function updateVolumeUI(volume, muted) {
        volumeSlider.value = muted ? 0 : volume;
        if (muted || volume === 0) {
            volumeIcon.classList.remove('fa-volume-up', 'fa-volume-down');
            volumeIcon.classList.add('fa-volume-mute');
            volumeBtn.setAttribute('title', 'Unmute');
        } else if (volume < 0.5) {
            volumeIcon.classList.remove('fa-volume-up', 'fa-volume-mute');
            volumeIcon.classList.add('fa-volume-down');
            volumeBtn.setAttribute('title', 'Mute');
        } else {
            volumeIcon.classList.remove('fa-volume-down', 'fa-volume-mute');
            volumeIcon.classList.add('fa-volume-up');
            volumeBtn.setAttribute('title', 'Mute');
        }
    }

    // Cập nhật UI thanh progress (width và thumb position)
    function updateProgressUI() {
        if (!videoPlayer.duration || isNaN(videoPlayer.duration)) return;
        
        const percentage = (videoPlayer.currentTime / videoPlayer.duration) * 100;
        
        // Chỉ cập nhật nếu không đang kéo (để tránh xung đột)
        if (!isDraggingProgressBar) {
            progressBarPlayed.style.width = `${percentage}%`;
            progressThumb.style.left = `${percentage}%`;
        }
        
        // Luôn cập nhật text thời gian theo định dạng YouTube
        const currentTimeFormatted = formatTime(videoPlayer.currentTime);
        const durationFormatted = formatTime(videoPlayer.duration);
        timeInfo.textContent = `${currentTimeFormatted} / ${durationFormatted}`;
    }

    function updateBufferUI() {
        if (!videoPlayer.duration || isNaN(videoPlayer.duration) || videoPlayer.buffered.length === 0) {
             progressBuffer.style.width = '0%';
             return;
        }
        try {
            let bufferedEnd = 0;
            for (let i = 0; i < videoPlayer.buffered.length; i++) {
                bufferedEnd = Math.max(bufferedEnd, videoPlayer.buffered.end(i));
            }
            const bufferPercentage = (bufferedEnd / videoPlayer.duration) * 100;
            progressBuffer.style.width = `${bufferPercentage}%`;
        } catch (error) {
            progressBuffer.style.width = '0%';
        }
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            if (videoWrapper.requestFullscreen) videoWrapper.requestFullscreen().catch(err => console.error(`FS Error: ${err.message}`));
            else if (videoWrapper.webkitRequestFullscreen) videoWrapper.webkitRequestFullscreen();
            else if (videoWrapper.msRequestFullscreen) videoWrapper.msRequestFullscreen();
        } else {
            if (document.exitFullscreen) document.exitFullscreen();
            else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
            else if (document.msExitFullscreen) document.msExitFullscreen();
        }
    }

    function updateFullscreenIcon() {
        const fullscreenEl = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
        if (fullscreenEl === videoWrapper) {
             fullscreenIcon.classList.remove('fa-expand');
             fullscreenIcon.classList.add('fa-compress');
             fullscreenBtn.setAttribute('title', 'Exit Fullscreen');
        } else {
            fullscreenIcon.classList.remove('fa-compress');
            fullscreenIcon.classList.add('fa-expand');
            fullscreenBtn.setAttribute('title', 'Fullscreen');
        }
    }

    // --- Seeking Logic with Frame Snapping ---
    function seek(event) {
        if (!videoPlayer.duration || isNaN(videoPlayer.duration)) return;

        const rect = progressContainer.getBoundingClientRect();
        const clientX = event.clientX ?? event.touches?.[0]?.clientX;
        if (clientX === undefined) return;

        const clickX = clientX - rect.left;
        let progress = clickX / rect.width;
        progress = Math.max(0, Math.min(1, progress));

        let targetTime = progress * videoPlayer.duration;

        // Chỉ sử dụng frame-snapping khi có FPS và đang cần độ chính xác
        if (state.fps > 0 && isDraggingProgressBar) {
            const frameDuration = 1 / state.fps;
            targetTime = Math.round(targetTime / frameDuration) * frameDuration;
        }

        targetTime = Math.max(0, Math.min(targetTime, videoPlayer.duration));

        if (Math.abs(videoPlayer.currentTime - targetTime) > 0.01) {
            videoPlayer.currentTime = targetTime;
        }

        const percentage = progress * 100;
        progressBarPlayed.style.width = `${percentage}%`;
        progressThumb.style.left = `${percentage}%`;
        
        // Cập nhật hiển thị thời gian với định dạng YouTube
        const currentTimeFormatted = formatTime(targetTime);
        const durationFormatted = formatTime(videoPlayer.duration);
        timeInfo.textContent = `${currentTimeFormatted} / ${durationFormatted}`;
    }

    // --- Event Listeners ---

    // Video Player Events
    videoPlayer.addEventListener('play', updatePlayPauseIcon);
    videoPlayer.addEventListener('pause', updatePlayPauseIcon);
    videoPlayer.addEventListener('loadedmetadata', () => {
        if (!isNaN(videoPlayer.duration)) {
            timeInfo.textContent = `${formatTime(videoPlayer.currentTime)} / ${formatTime(videoPlayer.duration)}`;
            updateProgressUI();
            updateBufferUI();
        }
    });
    videoPlayer.addEventListener('seeking', () => { console.log("Event: seeking"); });
    videoPlayer.addEventListener('seeked', () => {
        console.log("Event: seeked");
        if (!isDraggingProgressBar) updateProgressUI();
    });
    videoPlayer.addEventListener('timeupdate', () => {
        if (!isDraggingProgressBar) updateProgressUI();
        updateBufferUI();
    });
    videoPlayer.addEventListener('volumechange', () => updateVolumeUI(videoPlayer.volume, videoPlayer.muted));
    videoPlayer.addEventListener('progress', updateBufferUI);
    videoPlayer.addEventListener('ended', updatePlayPauseIcon);

    // Custom Controls Events
    playPauseBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (videoPlayer.paused || videoPlayer.ended) {
            const promise = videoPlayer.safePlay ? videoPlayer.safePlay() : videoPlayer.play();
            if (promise && typeof promise.catch === 'function') {
                 promise.catch(err => { 
                     console.error("Play Error:", err); 
                     updatePlayPauseIcon(); 
                 });
            } else { 
                updatePlayPauseIcon(); 
            }
        } else {
            videoPlayer.safePause ? videoPlayer.safePause() : videoPlayer.pause();
        }
    });

    volumeBtn.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        videoPlayer.muted = !videoPlayer.muted; 
    });
    
    volumeSlider.addEventListener('input', (e) => {
        e.stopPropagation();
        const v = parseFloat(e.target.value);
        videoPlayer.volume = v;
        videoPlayer.muted = v === 0;
    });
    
    volumeSlider.addEventListener('click', (e) => e.stopPropagation());

    fullscreenBtn.addEventListener('click', (e) => { 
        e.stopPropagation(); 
        toggleFullscreen(); 
    });

    // === SPEED MENU LOGIC ===
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speedMenu.classList.toggle('visible');
    });

    speedOptions.forEach(option => {
        option.addEventListener('click', (e) => {
            e.stopPropagation();

            // Bỏ active class khỏi tất cả các nút
            speedOptions.forEach(opt => opt.classList.remove('active'));
            // Thêm active class cho nút được click
            option.classList.add('active');

            // Lấy tốc độ từ data attribute và đổi thành số
            const newSpeed = parseFloat(option.dataset.speed);
            if (!isNaN(newSpeed)) {
                videoPlayer.playbackRate = newSpeed;
            }
            speedMenu.classList.remove('visible');
        });
    });

    // Đóng menu khi click ra ngoài
    document.addEventListener('click', (e) => {
        if (speedMenu.classList.contains('visible') && !speedMenu.contains(e.target) && !settingsBtn.contains(e.target)) {
            speedMenu.classList.remove('visible');
        }
    });
    // === END SPEED MENU LOGIC ===

    // Progress Bar Seeking Events
    function handleSeekStart(e) {
        isDraggingProgressBar = true;
        progressBarPlayed.classList.add('no-transition');
        progressThumb.classList.add('no-transition');
        videoWrapper.classList.add('seeking');
        seek(e.type.startsWith('touch') ? e.touches[0] : e);
    }
    
    function handleSeekMove(e) {
        if (isDraggingProgressBar) {
            e.preventDefault();
            seek(e.type.startsWith('touch') ? e.touches[0] : e);
        }
    }
    
    function handleSeekEnd() {
        if (isDraggingProgressBar) {
            isDraggingProgressBar = false;
            progressBarPlayed.classList.remove('no-transition');
            progressThumb.classList.remove('no-transition');
            videoWrapper.classList.remove('seeking');
        }
    }

    progressContainer.addEventListener('mousedown', handleSeekStart);
    document.addEventListener('mousemove', handleSeekMove);
    document.addEventListener('mouseup', handleSeekEnd);
    progressContainer.addEventListener('touchstart', handleSeekStart, { passive: false });
    document.addEventListener('touchmove', handleSeekMove, { passive: false });
    document.addEventListener('touchend', handleSeekEnd);
    document.addEventListener('touchcancel', handleSeekEnd);
    progressContainer.addEventListener('click', (e) => {
        if (!isDraggingProgressBar && !videoWrapper.classList.contains('seeking')) {
            if (e.target === progressContainer || e.target.id === 'customProgressBarBackground' || e.target === progressBuffer || e.target === progressBarPlayed ) {
                seek(e);
            }
        }
    });

    // Cải thiện xử lý hover trên thanh tiến trình
    progressContainer.addEventListener('mouseenter', function() {
        if (!isDraggingProgressBar) {
            progressThumb.style.opacity = '1';
            progressThumb.style.transform = 'translate(-50%, -50%) scale(1)';
            progressBarPlayed.classList.add('hover');
        }
    });

    progressContainer.addEventListener('mouseleave', function() {
        if (!isDraggingProgressBar && !videoWrapper.classList.contains('seeking')) {
            progressThumb.style.opacity = '0';
            progressThumb.style.transform = 'translate(-50%, -50%) scale(0)';
            progressBarPlayed.classList.remove('hover');
        }
    });

    // Show/Hide Controls
    let isMouseOverControls = false;
    
    function showControls() {
        clearTimeout(controlsTimeout);
        videoWrapper.classList.add('controls-visible');
        customControls.style.opacity = '1';
        
        // Hiển thị thumb khi hiện controls
        if (!isDraggingProgressBar && progressContainer.matches(':hover')) {
            progressThumb.style.opacity = '1';
            progressThumb.style.transform = 'translate(-50%, -50%) scale(1)';
        }
    }
    
    function hideControls() {
        // Chỉ ẩn nếu video đang chạy, không kéo, và chuột không trên controls
        if (!videoPlayer.paused && !isDraggingProgressBar && !isMouseOverControls) {
            controlsTimeout = setTimeout(() => {
                videoWrapper.classList.remove('controls-visible');
                customControls.style.opacity = '0';
                
                // Ẩn thumb khi ẩn controls
                progressThumb.style.opacity = '0';
                progressThumb.style.transform = 'translate(-50%, -50%) scale(0)';
            }, 2000); // Giảm xuống 2s theo kiểu YouTube
        }
    }

    customControls.addEventListener('mouseenter', () => { 
        isMouseOverControls = true; 
        showControls(); 
    });
    
    customControls.addEventListener('mouseleave', () => { 
        isMouseOverControls = false; 
        hideControls(); 
    });
    
    videoWrapper.addEventListener('mouseenter', showControls);
    videoWrapper.addEventListener('mousemove', showControls);
    videoWrapper.addEventListener('mouseleave', () => { 
        if (!isMouseOverControls) hideControls(); 
    });
    
    videoPlayer.addEventListener('pause', showControls);
    videoPlayer.addEventListener('ended', showControls);
    videoPlayer.addEventListener('play', () => {
        clearTimeout(controlsTimeout);
        setTimeout(() => { 
            if (!isMouseOverControls) hideControls(); 
        }, 500);
    });
    
    document.addEventListener('fullscreenchange', updateFullscreenIcon);
    document.addEventListener('webkitfullscreenchange', updateFullscreenIcon);
    document.addEventListener('msfullscreenchange', updateFullscreenIcon);

    // --- Initial Setup ---
    updatePlayPauseIcon();
    updateVolumeUI(videoPlayer.volume, videoPlayer.muted);
    updateFullscreenIcon();
    
    if (videoPlayer.readyState >= 1 && !isNaN(videoPlayer.duration)) {
        timeInfo.textContent = `${formatTime(videoPlayer.currentTime)} / ${formatTime(videoPlayer.duration)}`;
        updateProgressUI(); 
        updateBufferUI();
    } else {
         videoPlayer.addEventListener('loadedmetadata', () => {
             if (!isNaN(videoPlayer.duration)) {
                 timeInfo.textContent = `${formatTime(videoPlayer.currentTime)} / ${formatTime(videoPlayer.duration)}`;
                 updateProgressUI(); 
                 updateBufferUI();
             }
         }, { once: true });
    }
    
    if (videoPlayer.paused) { 
        showControls(); 
    } else { 
        customControls.style.opacity = '0'; 
        videoWrapper.classList.remove('controls-visible'); 
    }

    console.log("Custom video controls setup complete.");
}