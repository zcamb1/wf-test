![image](https://github.com/user-attachments/assets/cd736ce7-75ba-45d0-9b8a-30e776b5acaa)

```
<!-- CUSTOM VIDEO CONTROLS - YOUTUBE STYLE -->
<div class="custom-video-controls">
    <!-- Progress Bar - Thanh tiến trình ở trên cùng -->
    <div class="custom-progress-container" id="customProgressContainer">
        <div class="custom-progress-bar" id="customProgressBarBackground">
            <div class="custom-progress-buffer" id="customProgressBuffer"></div>
            <div class="custom-progress-played" id="customProgressPlayed"></div>
            <div class="custom-progress-thumb" id="customProgressThumb"></div>
        </div>
    </div>
    
    <!-- Main Controls Row - Nút điều khiển và hiển thị thời gian -->
    <div class="main-controls-area">
        <!-- Play/Pause Button -->
        <button id="customPlayPause" class="control-button" title="Play/Pause">
            <i class="fas fa-play"></i>
        </button>
        
        <!-- Time Display - Hiển thị thời gian hiện tại / tổng thời gian -->
        <span id="customTimeInfo" class="time-info">0:00 / 0:00</span>
        
        <!-- Right Controls Group -->
        <div class="controls-right">
            <!-- Volume Control -->
            <div class="volume-control">
                <button id="customVolume" class="control-button" title="Mute/Unmute">
                    <i class="fas fa-volume-up"></i>
                </button>
                <input type="range" id="customVolumeSlider" class="volume-slider" min="0" max="1" step="0.05" value="1">
            </div>
            
            <!-- Fullscreen Button -->
            <button id="customFullscreen" class="control-button" title="Fullscreen">
                <i class="fas fa-expand"></i>
            </button>
            
            <!-- Settings Menu -->
            <div class="settings-control">
                <button id="customSettings" class="control-button" title="Settings">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="speed-menu" id="speedMenu">
                    <div class="speed-menu-header">Playback Speed</div>
                    <button class="speed-option" data-speed="0.5">0.5x</button>
                    <button class="speed-option" data-speed="0.75">0.75x</button>
                    <button class="speed-option active" data-speed="1">Normal</button>
                    <button class="speed-option" data-speed="1.25">1.25x</button>
                    <button class="speed-option" data-speed="1.5">1.5x</button>
                    <button class="speed-option" data-speed="2">2x</button>
                </div>
            </div>
        </div>
    </div>
</div>
<!-- END CUSTOM VIDEO CONTROLS -->
```


```
/* Font Awesome - Sử dụng cho các icon controls */
@import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

/* ========================================================== */
/* === CUSTOM VIDEO CONTROLS - YouTube Style === */
/* ========================================================== */

.video-wrapper {
    position: relative;
}

.custom-video-controls {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to top, rgba(0, 0, 0, 0.8) 0%, rgba(0, 0, 0, 0.4) 60%, transparent 100%);
    padding: 0;
    opacity: 1;
    transition: opacity 0.3s ease;
    z-index: 21;
    box-sizing: border-box;
    width: 100%;
    user-select: none;
    -webkit-user-select: none;
    display: flex;
    flex-direction: column;
}

.video-wrapper:not(:hover):not(.controls-visible) .custom-video-controls {
    opacity: 0;
}

/* Main Controls Area */
.main-controls-area {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 16px 10px 16px;
    height: 36px;
}

/* Time Display */
.time-info {
    color: white;
    font-size: 13px;
    font-weight: 400;
    margin-right: 14px;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
}

/* Controls on the right side */
.controls-right {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
}

/* Control Buttons */
.control-button {
    color: white;
    background: transparent;
    border: none;
    outline: none;
    padding: 8px;
    font-size: 18px;
    opacity: 0.9;
    cursor: pointer;
    transition: opacity 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: none;
    height: auto;
    min-width: auto;
    border-radius: 50%;
}

.control-button:hover {
    opacity: 1;
    background-color: rgba(255, 255, 255, 0.1);
    transform: none;
}

/* Volume control */
.volume-control {
    display: flex;
    align-items: center;
    position: relative;
}

.volume-slider {
    width: 0;
    height: 3px;
    margin-left: 2px;
    cursor: pointer;
    opacity: 0;
    transition: width 0.2s ease, opacity 0.2s ease;
    vertical-align: middle;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
    appearance: none;
    -webkit-appearance: none;
}

.volume-control:hover .volume-slider {
    width: 50px;
    opacity: 1;
}

.volume-slider::-webkit-slider-runnable-track {
    height: 3px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
}

.volume-slider::-webkit-slider-thumb {
    appearance: none;
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    margin-top: -4.5px;
    cursor: pointer;
}

.volume-slider::-moz-range-track {
    height: 3px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
}

.volume-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    background: white;
    border-radius: 50%;
    border: none;
    cursor: pointer;
}

/* Progress Bar - YouTube Style */
.custom-progress-container {
    width: 100%;
    height: 5px;
    cursor: pointer;
    padding: 0;
    margin: 0 0 4px 0;
    position: relative;
}

.custom-progress-bar {
    position: relative;
    width: 100%;
    height: 3px;
    background-color: rgba(255, 255, 255, 0.2);
    transition: height 0.2s ease;
}

.custom-progress-container:hover .custom-progress-bar {
    height: 5px;
}

.custom-progress-buffer {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 0;
    background-color: rgba(255, 255, 255, 0.4);
    transition: width 0.1s ease;
    z-index: 1;
}

.custom-progress-played {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 0;
    background-color: #ff0000;
    transition: width 0.05s linear;
    z-index: 2;
}

.custom-progress-played.no-transition {
    transition: none !important;
}

.custom-progress-thumb {
    position: absolute;
    top: 50%;
    left: 0;
    width: 13px;
    height: 13px;
    background-color: #ff0000;
    border-radius: 50%;
    transform: translate(-50%, -50%) scale(0);
    z-index: 3;
    opacity: 0;
    transition: opacity 0.15s ease, transform 0.15s ease;
    pointer-events: none;
    border: 2px solid white;
    box-sizing: border-box;
}

.custom-progress-thumb.no-transition {
    transition: none !important;
}

.custom-progress-container:hover .custom-progress-thumb {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
}

.seeking .custom-progress-thumb {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 1;
}

/* Speed Menu */
.settings-control {
    position: relative;
}

.speed-menu {
    display: none;
    position: absolute;
    bottom: 100%;
    right: 0;
    background-color: rgba(28, 28, 28, 0.9);
    border-radius: 4px;
    padding: 8px 0;
    min-width: 180px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    z-index: 100;
    margin-bottom: 8px;
}

.speed-menu.visible {
    display: block;
}

.speed-menu-header {
    color: #aaa;
    font-size: 12px;
    padding: 8px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.15);
    margin-bottom: 5px;
    text-transform: none;
    font-weight: 500;
}

.speed-option {
    display: block;
    width: 100%;
    background: none;
    border: none;
    color: #eee;
    text-align: left;
    padding: 8px 16px;
    font-size: 13px;
    cursor: pointer;
    position: relative;
}

.speed-option:hover {
    background-color: rgba(255, 255, 255, 0.1);
}

.speed-option.active {
    font-weight: 500;
    padding-left: 32px;
}

.speed-option.active::before {
    content: '\f00c';
    font-family: 'Font Awesome 6 Free';
    font-weight: 900;
    position: absolute;
    left: 12px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 11px;
}

/* Ẩn controls gốc */
video::-webkit-media-controls,
video::-moz-media-controls,
video::media-controls,
video::-webkit-media-controls-enclosure,
video::-webkit-media-controls-panel,
video::-webkit-media-controls-timeline {
    display: none !important;
}
```

![image](https://github.com/user-attachments/assets/cf9cf721-b178-4708-8b07-82990e727a14)

```
/**
 * custom-controls.js - Tạo và quản lý thanh điều khiển video kiểu YouTube 
 * 
 * File này tạo ra thanh điều khiển tùy chỉnh giống YouTube, thay thế controls mặc định của HTML5 video.
 * Bao gồm: thanh tiến trình, nút play/pause, âm lượng, fullscreen, menu tốc độ phát,
 * hỗ trợ điều khiển bằng bàn phím, cảm ứng và đồng bộ hóa với wavesurfer và UI hiện có.
 */

/**
 * Khởi tạo và quản lý các điều khiển video tùy chỉnh theo kiểu YouTube
 * Hàm chính xử lý toàn bộ logic điều khiển video
 */
function setupCustomControls() {
    // ----------------------------------------------------------------------------------
    // PHẦN 1: TRUY CẬP CÁC PHẦN TỬ DOM VÀ KHỞI TẠO BIẾN
    // ----------------------------------------------------------------------------------
    
    /**
     * Truy cập các phần tử DOM quan trọng
     * Sử dụng jQuery để lấy phần tử DOM, sau đó lấy phần tử DOM thực sự [0] để tối ưu hiệu năng
     */
    const videoPlayer = $('#my-player')[0]; // Phần tử video
    const videoWrapper = $('.video-wrapper')[0]; // Container bao quanh video
    const customControls = $('.custom-video-controls')[0]; // Container của thanh điều khiển
    
    // Các nút và thanh điều khiển
    const playPauseBtn = $('#customPlayPause')[0]; // Nút Play/Pause
    const playPauseIcon = $(playPauseBtn).find('i')[0]; // Icon của nút Play/Pause (thay đổi giữa fa-play và fa-pause)
    const timeInfo = $('#customTimeInfo')[0]; // Hiển thị thời gian (VD: 0:49 / 6:10)
    
    // Các phần tử của thanh tiến trình
    const progressContainer = $('#customProgressContainer')[0]; // Container của thanh tiến trình (xử lý sự kiện click/touch)
    const progressBarPlayed = $('#customProgressPlayed')[0]; // Phần đã phát của thanh tiến trình (màu đỏ)
    const progressThumb = $('#customProgressThumb')[0]; // Nút tròn di chuyển trên thanh tiến trình
    const progressBuffer = $('#customProgressBuffer')[0]; // Phần đã buffer của thanh tiến trình (màu xám)
    
    // Các phần tử điều khiển âm lượng
    const volumeBtn = $('#customVolume')[0]; // Nút âm lượng
    const volumeIcon = $(volumeBtn).find('i')[0]; // Icon của nút âm lượng (thay đổi theo mức âm lượng)
    const volumeSlider = $('#customVolumeSlider')[0]; // Thanh trượt âm lượng
    
    // Các phần tử điều khiển khác
    const fullscreenBtn = $('#customFullscreen')[0]; // Nút toàn màn hình
    const fullscreenIcon = $(fullscreenBtn).find('i')[0]; // Icon của nút toàn màn hình
    const settingsBtn = $('#customSettings')[0]; // Nút cài đặt
    const speedMenu = $('#speedMenu')[0]; // Menu tốc độ phát
    const speedOptions = $(speedMenu).find('.speed-option'); // Các tùy chọn tốc độ phát trong menu

    /**
     * Các biến trạng thái nội bộ
     * Quản lý trạng thái của các điều khiển và tương tác người dùng
     */
    let isDraggingProgressBar = false; // Đang kéo thanh tiến trình hay không
    let controlsTimeout; // Timeout để ẩn thanh điều khiển khi không sử dụng
    let isMouseOverControls = false; // Chuột có đang hover trên thanh điều khiển không

    /**
     * Truy cập các biến từ code gốc
     * Đảm bảo tích hợp tốt với code hiện có
     */
    const $timeCode = $('#timecode'); // Input hiển thị thời gian hiện tại bằng milliseconds
    const isUserChanging = window.isUserChanging || false; // Người dùng đang thay đổi giá trị input không
    const EPSILON = 0.001; // Hằng số sai số nhỏ để tránh lỗi làm tròn
    const fps = window.fps || 24; // Khung hình trên giây của video, mặc định là 24 nếu không có
    const wavesurfer = window.wavesurfer; // Đối tượng wavesurfer để hiển thị dạng sóng âm thanh
    
    // ----------------------------------------------------------------------------------
    // PHẦN 2: CÁC HÀM TIỆN ÍCH (HELPER FUNCTIONS)
    // ----------------------------------------------------------------------------------

    /**
     * Định dạng thời gian từ giây sang định dạng MM:SS
     * VD: 125.6 giây -> "2:05"
     * 
     * @param {number} seconds - Thời gian tính bằng giây
     * @returns {string} Thời gian định dạng "phút:giây"
     */
    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        
        // Format: đặt số 0 ở đầu nếu cần
        const fsecs = secs < 10 ? "0" + secs : secs;
        
        return `${mins}:${fsecs}`;
    }

    /**
     * Cập nhật biểu tượng nút play/pause dựa trên trạng thái video
     * Chuyển đổi giữa biểu tượng play và pause
     */
    function updatePlayPauseIcon() {
        if (videoPlayer.paused || videoPlayer.ended) {
            // Video đang tạm dừng hoặc đã kết thúc -> hiển thị nút play
            $(playPauseIcon).removeClass('fa-pause').addClass('fa-play');
            $(playPauseBtn).attr('title', 'Play');
        } else {
            // Video đang phát -> hiển thị nút pause
            $(playPauseIcon).removeClass('fa-play').addClass('fa-pause');
            $(playPauseBtn).attr('title', 'Pause');
        }
    }

    /**
     * Cập nhật giao diện điều khiển âm lượng
     * Thay đổi biểu tượng và giá trị thanh trượt dựa trên mức âm lượng và trạng thái tắt tiếng
     * 
     * @param {number} volume - Mức âm lượng (0-1)
     * @param {boolean} muted - Trạng thái tắt tiếng
     */
    function updateVolumeUI(volume, muted) {
        // Cập nhật giá trị thanh trượt
        volumeSlider.value = muted ? 0 : volume;
        
        if (muted || volume === 0) {
            // Tắt tiếng hoặc âm lượng = 0 -> hiển thị biểu tượng tắt tiếng
            $(volumeIcon).removeClass('fa-volume-up fa-volume-down').addClass('fa-volume-mute');
            $(volumeBtn).attr('title', 'Unmute');
        } else if (volume < 0.5) {
            // Âm lượng thấp -> hiển thị biểu tượng âm lượng thấp
            $(volumeIcon).removeClass('fa-volume-up fa-volume-mute').addClass('fa-volume-down');
            $(volumeBtn).attr('title', 'Mute');
        } else {
            // Âm lượng cao -> hiển thị biểu tượng âm lượng cao
            $(volumeIcon).removeClass('fa-volume-down fa-volume-mute').addClass('fa-volume-up');
            $(volumeBtn).attr('title', 'Mute');
        }
    }

    /**
     * Cập nhật UI thanh tiến trình và hiển thị thời gian
     * Điều chỉnh chiều rộng thanh tiến trình, vị trí thumb và hiển thị thời gian hiện tại
     */
    function updateProgressUI() {
        // Kiểm tra video đã tải dữ liệu thời lượng chưa
        if (!videoPlayer.duration || isNaN(videoPlayer.duration)) return;
        
        // Tính phần trăm đã phát
        const percentage = (videoPlayer.currentTime / videoPlayer.duration) * 100;
        
        // Chỉ cập nhật nếu không đang kéo (để tránh xung đột với tương tác người dùng)
        if (!isDraggingProgressBar) {
            // Cập nhật chiều rộng phần đã phát và vị trí thumb
            progressBarPlayed.style.width = `${percentage}%`;
            progressThumb.style.left = `${percentage}%`;
        }
        
        // Luôn cập nhật text thời gian hiển thị
        const currentTimeFormatted = formatTime(videoPlayer.currentTime);
        const durationFormatted = formatTime(videoPlayer.duration);
        timeInfo.textContent = `${currentTimeFormatted} / ${durationFormatted}`;
        
        // Đồng bộ với timecode input (nếu người dùng không đang thay đổi)
        if (!window.isUserChanging) {
            $timeCode.val((videoPlayer.currentTime * 1000).toFixed(0));
        }
        
        // Đồng bộ với progressbar hiện có trong code gốc
        $('#progressbar').css('width', `${percentage}%`);
    }

    /**
     * Cập nhật UI phần buffer của thanh tiến trình
     * Hiển thị phần video đã được tải (buffer) trên thanh tiến trình
     */
    function updateBufferUI() {
        // Kiểm tra video đã tải và có dữ liệu buffer chưa
        if (!videoPlayer.duration || isNaN(videoPlayer.duration) || videoPlayer.buffered.length === 0) {
            progressBuffer.style.width = '0%';
            return;
        }
        
        try {
            // Lấy thời điểm buffer cuối cùng (đã tải đến đâu)
            let bufferedEnd = 0;
            for (let i = 0; i < videoPlayer.buffered.length; i++) {
                bufferedEnd = Math.max(bufferedEnd, videoPlayer.buffered.end(i));
            }
            
            // Tính phần trăm đã buffer và cập nhật UI
            const bufferPercentage = (bufferedEnd / videoPlayer.duration) * 100;
            progressBuffer.style.width = `${bufferPercentage}%`;
        } catch (error) {
            // Xử lý lỗi nếu có
            progressBuffer.style.width = '0%';
        }
    }

    /**
     * Chuyển đổi chế độ toàn màn hình
     * Hỗ trợ nhiều trình duyệt với các API fullscreen khác nhau
     */
    function toggleFullscreen() {
        // Kiểm tra xem đã ở chế độ toàn màn hình chưa
        if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement) {
            // Chưa toàn màn hình -> bật chế độ toàn màn hình
            if (videoWrapper.requestFullscreen) {
                videoWrapper.requestFullscreen().catch(err => console.error(`FS Error: ${err.message}`));
            } else if (videoWrapper.webkitRequestFullscreen) {
                // Safari/Chrome cũ
                videoWrapper.webkitRequestFullscreen();
            } else if (videoWrapper.msRequestFullscreen) {
                // IE/Edge cũ
                videoWrapper.msRequestFullscreen();
            }
        } else {
            // Đã toàn màn hình -> thoát chế độ toàn màn hình
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }

    /**
     * Cập nhật biểu tượng nút fullscreen dựa trên trạng thái hiện tại
     * Chuyển đổi giữa biểu tượng mở rộng và thu nhỏ
     */
    function updateFullscreenIcon() {
        // Kiểm tra trạng thái toàn màn hình hiện tại
        const fullscreenEl = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
        
        if (fullscreenEl === videoWrapper) {
            // Đang ở chế độ toàn màn hình
            $(fullscreenIcon).removeClass('fa-expand').addClass('fa-compress');
            $(fullscreenBtn).attr('title', 'Exit Fullscreen');
        } else {
            // Không ở chế độ toàn màn hình
            $(fullscreenIcon).removeClass('fa-compress').addClass('fa-expand');
            $(fullscreenBtn).attr('title', 'Fullscreen');
        }
    }

    /**
     * Tua video theo số khung hình (frame-accurate seeking)
     * Dùng để di chuyển chính xác theo từng frame khi sử dụng phím tắt
     * 
     * @param {number} frameOffset - Số frame cần tua (dương: tiến, âm: lùi)
     */
    function seekToFrame(frameOffset) {
        // Kiểm tra FPS hợp lệ và video đã tải
        if (fps <= 0) return;
        if (!videoPlayer.duration) return;

        // Lưu trạng thái phát hiện tại
        const wasPlaying = !videoPlayer.paused;
        if (wasPlaying) videoPlayer.pause();

        // Tính toán frame hiện tại và frame đích
        const currentTime = videoPlayer.currentTime;
        const frameDuration = 1 / fps; // Thời gian của 1 frame
        const currentFrame = Math.round((currentTime + EPSILON) * fps); // Frame hiện tại (thêm EPSILON để tránh lỗi làm tròn)
        const targetFrame = Math.max(0, currentFrame + frameOffset); // Frame đích (đảm bảo không âm)
        const newTime = targetFrame * frameDuration; // Thời gian mới
        const boundedTime = Math.max(0, Math.min(newTime, videoPlayer.duration)); // Đảm bảo thời gian nằm trong phạm vi video

        console.log(`Seeking to frame: ${targetFrame} (${boundedTime.toFixed(3)}s)`);
        
        // Cập nhật thời gian video
        videoPlayer.currentTime = boundedTime;

        // Cập nhật timecode input
        $timeCode.val((boundedTime * 1000).toFixed(0));
        
        // Cập nhật thanh progress
        updateProgressUI();
        
        // Đồng bộ với wavesurfer nếu có
        if (wavesurfer) {
            wavesurfer.seekTo(boundedTime / videoPlayer.duration);
        }
    }

    /**
     * Xử lý việc tìm kiếm (seek) đến một vị trí cụ thể trên thanh tiến trình
     * Được gọi khi người dùng click hoặc kéo trên thanh tiến trình
     * 
     * @param {Event} event - Sự kiện mouse hoặc touch
     */
    function seek(event) {
        // Kiểm tra video đã tải chưa
        if (!videoPlayer.duration || isNaN(videoPlayer.duration)) return;

        // Lấy vị trí click/touch
        const rect = progressContainer.getBoundingClientRect();
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        if (clientX === undefined) return;

        // Tính tỷ lệ vị trí click/touch so với chiều rộng thanh tiến trình
        const clickX = clientX - rect.left;
        let progress = clickX / rect.width;
        progress = Math.max(0, Math.min(1, progress)); // Giới hạn trong khoảng 0-1

        // Tính thời gian tương ứng
        let targetTime = progress * videoPlayer.duration;

        // Frame snapping nếu có FPS - đảm bảo thời gian trùng với frame cụ thể
        if (fps > 0) {
            const frameDuration = 1 / fps;
            targetTime = Math.round(targetTime / frameDuration) * frameDuration;
        }

        // Đảm bảo thời gian nằm trong phạm vi video
        targetTime = Math.max(0, Math.min(targetTime, videoPlayer.duration));

        // Cập nhật thời gian video
        videoPlayer.currentTime = targetTime;
            
        // Đồng bộ với wavesurfer
        if (wavesurfer) {
            wavesurfer.seekTo(progress);
        }

        // Cập nhật UI thanh tiến trình
        const percentage = progress * 100;
        progressBarPlayed.style.width = `${percentage}%`;
        progressThumb.style.left = `${percentage}%`;
        
        // Cập nhật timecode input
        $timeCode.val((targetTime * 1000).toFixed(0));
        
        // Cập nhật hiển thị thời gian
        timeInfo.textContent = `${formatTime(targetTime)} / ${formatTime(videoPlayer.duration)}`;
        
        // Cập nhật thanh progress hiện có
        $('#progressbar').css('width', `${percentage}%`);
    }

    // ----------------------------------------------------------------------------------
    // PHẦN 3: XỬ LÝ HIỂN THỊ/ẨN CONTROLS
    // ----------------------------------------------------------------------------------

    /**
     * Hiển thị thanh điều khiển
     * Gọi khi di chuột vào video hoặc khi tạm dừng video
     */
    function showControls() {
        // Hủy bỏ timeout ẩn controls nếu có
        clearTimeout(controlsTimeout);
        
        // Hiển thị controls
        $(videoWrapper).addClass('controls-visible');
        $(customControls).css('opacity', '1');
    }
    
    /**
     * Ẩn thanh điều khiển sau một khoảng thời gian
     * Gọi khi di chuột ra khỏi video hoặc khi video đang phát
     */
    function hideControls() {
        // Chỉ ẩn nếu thỏa mãn các điều kiện:
        // 1. Video đang phát (không tạm dừng)
        // 2. Không đang kéo thanh tiến trình
        // 3. Chuột không đang hover trên thanh điều khiển
        if (!videoPlayer.paused && !isDraggingProgressBar && !isMouseOverControls) {
            controlsTimeout = setTimeout(function() {
                $(videoWrapper).removeClass('controls-visible');
                $(customControls).css('opacity', '0');
            }, 2000); // Ẩn sau 2 giây không tương tác
        }
    }

    // ----------------------------------------------------------------------------------
    // PHẦN 4: XỬ LÝ TƯƠNG TÁC VỚI THANH TIẾN TRÌNH
    // ----------------------------------------------------------------------------------

    /**
     * Xử lý sự kiện bắt đầu kéo thanh tiến trình
     * Được gọi khi mousedown/touchstart trên thanh tiến trình
     * 
     * @param {Event} e - Sự kiện mousedown hoặc touchstart
     */
    function handleSeekStart(e) {
        isDraggingProgressBar = true; // Đánh dấu đang kéo
        
        // Tắt hiệu ứng transition để di chuyển mượt mà
        $(progressBarPlayed).addClass('no-transition');
        $(progressThumb).addClass('no-transition');
        
        // Thêm class seeking để thay đổi style khi đang kéo
        $(videoWrapper).addClass('seeking');
        
        // Xử lý tìm kiếm đến vị trí mới
        seek(e);
    }
    
    /**
     * Xử lý sự kiện di chuyển khi đang kéo thanh tiến trình
     * Được gọi khi mousemove/touchmove trong khi đang kéo
     * 
     * @param {Event} e - Sự kiện mousemove hoặc touchmove
     */
    function handleSeekMove(e) {
        if (isDraggingProgressBar) {
            e.preventDefault(); // Ngăn chặn hành vi mặc định (như cuộn trang)
            seek(e); // Cập nhật vị trí
        }
    }
    
    /**
     * Xử lý sự kiện kết thúc kéo thanh tiến trình
     * Được gọi khi mouseup/touchend sau khi đã kéo
     */
    function handleSeekEnd() {
        if (isDraggingProgressBar) {
            isDraggingProgressBar = false; // Đánh dấu không còn kéo
            
            // Bật lại hiệu ứng transition
            $(progressBarPlayed).removeClass('no-transition');
            $(progressThumb).removeClass('no-transition');
            
            // Bỏ class seeking
            $(videoWrapper).removeClass('seeking');
        }
    }

    // ----------------------------------------------------------------------------------
    // PHẦN 5: THIẾT LẬP CÁC SỰ KIỆN (EVENT LISTENERS)
    // ----------------------------------------------------------------------------------
    
    /**
     * THIẾT LẬP SỰ KIỆN VIDEO
     * Đăng ký các sự kiện của phần tử video để cập nhật UI
     */
    
    // Cập nhật icon khi video play/pause
    $(videoPlayer).on('play', updatePlayPauseIcon);
    $(videoPlayer).on('pause', updatePlayPauseIcon);
    
    // Cập nhật UI khi metadata video được tải
    $(videoPlayer).on('loadedmetadata', function() {
        if (!isNaN(videoPlayer.duration)) {
            timeInfo.textContent = `${formatTime(videoPlayer.currentTime)} / ${formatTime(videoPlayer.duration)}`;
            updateProgressUI();
            updateBufferUI();
        }
    });
    
    // Cập nhật UI khi video phát
    $(videoPlayer).on('timeupdate', function() {
        if (!isDraggingProgressBar) {
            updateProgressUI();
        }
        updateBufferUI();
    });
    
    // Cập nhật UI khi thay đổi âm lượng
    $(videoPlayer).on('volumechange', function() {
        updateVolumeUI(videoPlayer.volume, videoPlayer.muted);
    });
    
    // Cập nhật buffer khi video tải thêm dữ liệu
    $(videoPlayer).on('progress', updateBufferUI);
    
    // Cập nhật icon khi video kết thúc
    $(videoPlayer).on('ended', updatePlayPauseIcon);

    /**
     * THIẾT LẬP SỰ KIỆN CHO CÁC NÚT ĐIỀU KHIỂN
     * Đăng ký sự kiện click cho các nút trong thanh điều khiển
     */
    
    // Sự kiện nút Play/Pause
    $(playPauseBtn).on('click', function(e) {
        e.stopPropagation(); // Ngăn sự kiện lan ra container cha
        
        if (videoPlayer.paused || videoPlayer.ended) {
            // Phát video nếu đang tạm dừng
            videoPlayer.play().catch(err => {
                console.error("Play Error:", err);
                updatePlayPauseIcon();
            });
        } else {
            // Tạm dừng video nếu đang phát
            videoPlayer.pause();
        }
    });

    // Sự kiện nút âm lượng (Mute/Unmute)
    $(volumeBtn).on('click', function(e) {
        e.stopPropagation();
        videoPlayer.muted = !videoPlayer.muted; // Đảo trạng thái tắt tiếng
    });
    
    // Sự kiện thanh trượt âm lượng
    $(volumeSlider).on('input', function(e) {
        e.stopPropagation();
        const v = parseFloat(e.target.value);
        videoPlayer.volume = v; // Đặt mức âm lượng
        videoPlayer.muted = v === 0; // Tắt tiếng nếu âm lượng = 0
    });
    
    // Ngăn sự kiện click lan ra khi click vào thanh âm lượng
    $(volumeSlider).on('click', function(e) {
        e.stopPropagation();
    });

    // Sự kiện nút toàn màn hình
    $(fullscreenBtn).on('click', function(e) {
        e.stopPropagation();
        toggleFullscreen(); // Chuyển đổi chế độ toàn màn hình
    });

    /**
     * THIẾT LẬP SỰ KIỆN CHO MENU TỐC ĐỘ PHÁT
     * Xử lý hiển thị/ẩn menu và thay đổi tốc độ phát
     */
    
    // Sự kiện hiển thị/ẩn menu khi click vào nút cài đặt
    $(settingsBtn).on('click', function(e) {
        e.stopPropagation();
        $(speedMenu).toggleClass('visible'); // Đảo trạng thái hiển thị menu
    });

    // Sự kiện cho các tùy chọn tốc độ phát
    speedOptions.each(function() {
        $(this).on('click', function(e) {
            e.stopPropagation();
            
            // Xóa class active khỏi tất cả các tùy chọn
            speedOptions.removeClass('active');
            
            // Thêm class active cho tùy chọn được chọn
            $(this).addClass('active');
            
            // Đặt tốc độ phát mới
            const newSpeed = parseFloat($(this).data('speed'));
            if (!isNaN(newSpeed)) {
                videoPlayer.playbackRate = newSpeed;
            }
            
            // Ẩn menu sau khi chọn
            $(speedMenu).removeClass('visible');
        });
    });

    // Đóng menu khi click ra ngoài
    $(document).on('click', function(e) {
        if ($(speedMenu).hasClass('visible') && 
            !$(speedMenu).is(e.target) && 
            !$(settingsBtn).is(e.target) && 
            $(speedMenu).has(e.target).length === 0) {
            $(speedMenu).removeClass('visible');
        }
    });

    /**
     * THIẾT LẬP SỰ KIỆN CHO THANH TIẾN TRÌNH
     * Xử lý tương tác kéo/thả/click trên thanh tiến trình
     */
    
    // Sự kiện bắt đầu kéo thanh tiến trình (mouse)
    $(progressContainer).on('mousedown', function(e) {
        handleSeekStart(e);
    });
    
    // Sự kiện di chuyển khi đang kéo (mouse)
    $(document).on('mousemove', function(e) {
        handleSeekMove(e);
    });
    
    // Sự kiện kết thúc kéo (mouse)
    $(document).on('mouseup', function() {
        handleSeekEnd();
    });
    
    // Sự kiện bắt đầu kéo thanh tiến trình (touch)
    $(progressContainer).on('touchstart', function(e) {
        handleSeekStart(e.originalEvent);
    });
    
    // Sự kiện di chuyển khi đang kéo (touch)
    $(document).on('touchmove', function(e) {
        if (isDraggingProgressBar) {
            handleSeekMove(e.originalEvent);
        }
    });
    
    // Sự kiện kết thúc kéo (touch)
    $(document).on('touchend touchcancel', handleSeekEnd);
    
    // Sự kiện click trên thanh tiến trình (không phải kéo)
    $(progressContainer).on('click', function(e) {
        if (!isDraggingProgressBar && !$(videoWrapper).hasClass('seeking')) {
            seek(e); // Di chuyển đến vị trí được click
        }
    });

    /**
     * THIẾT LẬP SỰ KIỆN HIỂN THỊ/ẨN THANH ĐIỀU KHIỂN
     * Xử lý hiển thị thanh điều khiển khi di chuột và ẩn khi không tương tác
     */
    
    // Chuột vào thanh điều khiển
    $(customControls).on('mouseenter', function() { 
        isMouseOverControls = true; 
        showControls(); 
    });
    
    // Chuột ra khỏi thanh điều khiển
    $(customControls).on('mouseleave', function() { 
        isMouseOverControls = false; 
        hideControls(); 
    });
    
    // Chuột vào khu vực video
    $(videoWrapper).on('mouseenter', showControls);
    
    // Di chuyển chuột trong khu vực video
    $(videoWrapper).on('mousemove', showControls);
    
    // Chuột ra khỏi khu vực video
    $(videoWrapper).on('mouseleave', function() { 
        if (!isMouseOverControls) hideControls(); 
    });
    
    // Hiện controls khi video tạm dừng hoặc kết thúc
    $(videoPlayer).on('pause', showControls);
    $(videoPlayer).on('ended', showControls);
    
    // Ẩn controls sau khi video bắt đầu phát
    $(videoPlayer).on('play', function() {
        clearTimeout(controlsTimeout);
        setTimeout(function() { 
            if (!isMouseOverControls) hideControls(); 
        }, 500); // Chờ 0.5s sau khi phát rồi mới ẩn
    });
    
    // Cập nhật icon fullscreen khi thay đổi trạng thái toàn màn hình
    $(document).on('fullscreenchange webkitfullscreenchange msfullscreenchange', updateFullscreenIcon);

    /**
     * THIẾT LẬP SỰ KIỆN PHÍM TẮT
     * Xử lý điều khiển video bằng bàn phím
     */
    $(document).on('keydown', function(e) {
        // Bỏ qua nếu đang focus vào input
        if ($(document.activeElement).is('input')) return;
        
        // Xử lý các phím tắt
        if (e.key === ' ' || e.key === 'Space') {
            // Space: play/pause
            e.preventDefault();
            if (videoPlayer.paused) {
                videoPlayer.play();
            } else {
                videoPlayer.pause();
            }
        } 
        else if (e.key === 'ArrowLeft') {
            // Mũi tên trái: lùi 1 frame (Shift + Mũi tên trái: lùi 10 frames)
            if (e.shiftKey) {
                seekToFrame(-10);
            } else {
                seekToFrame(-1);
            }
            e.preventDefault();
        }
        else if (e.key === 'ArrowRight') {
            // Mũi tên phải: tiến 1 frame (Shift + Mũi tên phải: tiến 10 frames)
            if (e.shiftKey) {
                seekToFrame(10);
            } else {
                seekToFrame(1);
            }
            e.preventDefault();
        }
    });

    // ----------------------------------------------------------------------------------
    // PHẦN 6: THIẾT LẬP BAN ĐẦU
    // ----------------------------------------------------------------------------------
    
    // Cập nhật UI ban đầu
    updatePlayPauseIcon(); // Cập nhật icon play/pause
    updateVolumeUI(videoPlayer.volume, videoPlayer.muted); // Cập nhật UI âm lượng
    updateFullscreenIcon(); // Cập nhật icon fullscreen
    
    // Cập nhật thời gian và thanh tiến trình nếu video đã tải
    if (videoPlayer.readyState >= 1 && !isNaN(videoPlayer.duration)) {
        timeInfo.textContent = `${formatTime(videoPlayer.currentTime)} / ${formatTime(videoPlayer.duration)}`;
        updateProgressUI(); 
        updateBufferUI();
    } else {
         // Đăng ký sự kiện để cập nhật khi video tải xong metadata
         $(videoPlayer).one('loadedmetadata', function() {
             if (!isNaN(videoPlayer.duration)) {
                 timeInfo.textContent = `${formatTime(videoPlayer.currentTime)} / ${formatTime(videoPlayer.duration)}`;
                 updateProgressUI(); 
                 updateBufferUI();
             }
         });
    }
    
    // Hiển thị controls nếu video đang tạm dừng, ẩn nếu đang phát
    if (videoPlayer.paused) { 
        showControls(); 
    } else { 
        $(customControls).css('opacity', '0'); 
        $(videoWrapper).removeClass('controls-visible'); 
    }

    console.log("Custom video controls setup complete.");
}

/**
 * Thêm HTML cho controls và khởi tạo khi document đã sẵn sàng
 * Đây là điểm khởi đầu của toàn bộ quá trình thiết lập custom controls
 */
$(document).ready(function() {
    // Tạo và thêm HTML cho controls
    const controlsHTML = `
    <!-- CUSTOM VIDEO CONTROLS - YOUTUBE STYLE -->
    <div class="custom-video-controls">
        <!-- Progress Bar - Thanh tiến trình ở trên cùng -->
        <div class="custom-progress-container" id="customProgressContainer">
            <div class="custom-progress-bar" id="customProgressBarBackground">
                <div class="custom-progress-buffer" id="customProgressBuffer"></div>
                <div class="custom-progress-played" id="customProgressPlayed"></div>
                <div class="custom-progress-thumb" id="customProgressThumb"></div>
            </div>
        </div>
        
        <!-- Main Controls Row - Nút điều khiển và hiển thị thời gian -->
        <div class="main-controls-area">
            <!-- Play/Pause Button -->
            <button id="customPlayPause" class="control-button" title="Play/Pause">
                <i class="fas fa-play"></i>
            </button>
            
            <!-- Time Display - Hiển thị thời gian hiện tại / tổng thời gian -->
            <span id="customTimeInfo" class="time-info">0:00 / 0:00</span>
            
            <!-- Right Controls Group -->
            <div class="controls-right">
                <!-- Volume Control -->
                <div class="volume-control">
                    <button id="customVolume" class="control-button" title="Mute/Unmute">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <input type="range" id="customVolumeSlider" class="volume-slider" min="0" max="1" step="0.05" value="1">
                </div>
                
                <!-- Fullscreen Button -->
                <button id="customFullscreen" class="control-button" title="Fullscreen">
                    <i class="fas fa-expand"></i>
                </button>
                
                <!-- Settings Menu -->
                <div class="settings-control">
                    <button id="customSettings" class="control-button" title="Settings">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="speed-menu" id="speedMenu">
                        <div class="speed-menu-header">Playback Speed</div>
                        <button class="speed-option" data-speed="0.5">0.5x</button>
                        <button class="speed-option" data-speed="0.75">0.75x</button>
                        <button class="speed-option active" data-speed="1">Normal</button>
                        <button class="speed-option" data-speed="1.25">1.25x</button>
                        <button class="speed-option" data-speed="1.5">1.5x</button>
                        <button class="speed-option" data-speed="2">2x</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <!-- END CUSTOM VIDEO CONTROLS -->
    `;
    
    // Thêm HTML vào video wrapper
    $('.video-wrapper').append(controlsHTML);
    
    // Xóa thuộc tính controls mặc định của video
    $('#my-player').removeAttr('controls');
    
    // Khởi tạo controls
    setupCustomControls();
});
```


![image](https://github.com/user-attachments/assets/a6cee736-9ae4-4d8e-b67a-6d83937aa873)




```
// Thứ tự đã thay đổi - thanh tiến trình nằm dưới các nút điều khiển
const controlsHTML = `
<!-- CUSTOM VIDEO CONTROLS - YOUTUBE STYLE -->
<div class="custom-video-controls">
    <!-- Main Controls Row - Nút điều khiển và hiển thị thời gian -->
    <div class="main-controls-area">
        <!-- Play/Pause Button -->
        <button id="customPlayPause" class="control-button" title="Play/Pause">
            <i class="fas fa-play"></i>
        </button>
        
        <!-- Time Display - Hiển thị thời gian hiện tại / tổng thời gian -->
        <span id="customTimeInfo" class="time-info">0:00 / 0:00</span>
        
        <!-- Right Controls Group -->
        <div class="controls-right">
            <!-- Volume Control -->
            <div class="volume-control">
                <button id="customVolume" class="control-button" title="Mute/Unmute">
                    <i class="fas fa-volume-up"></i>
                </button>
                <input type="range" id="customVolumeSlider" class="volume-slider" min="0" max="1" step="0.05" value="1">
            </div>
            
            <!-- Fullscreen Button -->
            <button id="customFullscreen" class="control-button" title="Fullscreen">
                <i class="fas fa-expand"></i>
            </button>
            
            <!-- Settings Menu -->
            <div class="settings-control">
                <button id="customSettings" class="control-button" title="Settings">
                    <i class="fas fa-ellipsis-v"></i>
                </button>
                <div class="speed-menu" id="speedMenu">
                    <div class="speed-menu-header">Playback Speed</div>
                    <button class="speed-option" data-speed="0.5">0.5x</button>
                    <button class="speed-option" data-speed="0.75">0.75x</button>
                    <button class="speed-option active" data-speed="1">Normal</button>
                    <button class="speed-option" data-speed="1.25">1.25x</button>
                    <button class="speed-option" data-speed="1.5">1.5x</button>
                    <button class="speed-option" data-speed="2">2x</button>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Progress Bar - Thanh tiến trình đã chuyển xuống dưới -->
    <div class="custom-progress-container" id="customProgressContainer">
        <div class="custom-progress-bar" id="customProgressBarBackground">
            <div class="custom-progress-buffer" id="customProgressBuffer"></div>
            <div class="custom-progress-played" id="customProgressPlayed"></div>
            <div class="custom-progress-thumb" id="customProgressThumb"></div>
        </div>
    </div>
</div>
<!-- END CUSTOM VIDEO CONTROLS -->
`;
```

```
/* Điều chỉnh thanh điều khiển chính */
.main-controls-area {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 10px 16px 5px 16px; /* Tăng padding-top, giảm padding-bottom */
    height: 36px;
}

/* Điều chỉnh container thanh tiến trình */
.custom-progress-container {
    width: 100%;
    height: 5px;
    cursor: pointer;
    padding: 0;
    margin: 5px 0 10px 0; /* Thêm margin-top và margin-bottom */
    position: relative;
}

/* Đổi vị trí hiển thị preview khi hover */
.custom-progress-container::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: -5px; /* Thay đổi từ bottom sang top */
    height: 5px;
}

.custom-progress-container:hover::before {
    height: 10px;
}

/* Điều chỉnh padding tổng thể */
.custom-video-controls {
    padding: 5px 0; /* Thêm padding-top cho toàn bộ controls */
}


![image](https://github.com/user-attachments/assets/0c32fe2c-00d5-4c1d-81cc-be8f738cf528)


![image](https://github.com/user-attachments/assets/5c8f07b8-03a5-4ac8-a909-b0d0f3be3aad)

```
