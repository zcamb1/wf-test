<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trình Phát Video Nâng Cao</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        :root {
            --primary-color: #3498db;
            --primary-dark: #2980b9;
            --accent-color: #e74c3c;
            --accent-dark: #c0392b;
            --bg-color: #f8f9fa;
            --card-bg: #ffffff;
            --text-color: #333333;
            --border-radius: 10px;
            --shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
            --transition: all 0.25s ease;
        }

        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Oxygen, Ubuntu, sans-serif;
            background-color: var(--bg-color);
            color: var(--text-color);
            line-height: 1.6;
            padding: 20px;
            transition: var(--transition);
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            width: 100%;
        }
        
        .app-header {
            text-align: center;
            margin-bottom: 20px;
        }
        
        .app-title {
            font-size: 24px;
            font-weight: 600;
            color: var(--primary-color);
            margin-bottom: 8px;
        }
        
        .app-description {
            font-size: 14px;
            color: #666;
            max-width: 600px;
            margin: 0 auto;
        }
        
        .player-card {
            background: var(--card-bg);
            border-radius: var(--border-radius);
            overflow: hidden;
            box-shadow: var(--shadow);
            margin-bottom: 20px;
            transition: var(--transition);
        }
        
        .video-wrapper {
            position: relative;
            background: #000;
            overflow: hidden;
            width: 100%;
            aspect-ratio: 16/9;
        }
        
        video {
            width: 100%;
            height: 100%;
            object-fit: contain;
        }
        
        .fps-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            z-index: 100;
            backdrop-filter: blur(4px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .fps-badge i {
            font-size: 12px;
        }
        
        .controls-panel {
            padding: 15px;
        }
        
        .progress-container {
            width: 100%;
            position: relative;
            height: 16px;
            margin-bottom: 15px;
        }
        
        .progress-bar {
            width: 100%;
            height: 6px;
            background: #e0e0e0;
            border-radius: 3px;
            overflow: hidden;
            cursor: pointer;
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            transition: height 0.2s ease;
        }
        
        .progress-bar:hover {
            height: 10px;
        }
        
        .progress {
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, var(--primary-color), var(--accent-color));
            border-radius: 3px;
            position: relative;
        }
        
        .progress-handle {
            position: absolute;
            right: -6px;
            top: 50%;
            transform: translateY(-50%);
            width: 12px;
            height: 12px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 0 5px rgba(0,0,0,0.2);
            opacity: 0;
            transition: opacity 0.2s;
        }
        
        .progress-bar:hover .progress-handle {
            opacity: 1;
        }
        
        .control-panels {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .control-buttons {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            flex-wrap: wrap;
        }
        
        .control-group {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 0 8px;
        }
        
        .time-input {
            display: flex;
            align-items: center;
            position: relative;
            background: #f5f5f5;
            border-radius: 6px;
            padding: 2px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            transition: var(--transition);
            overflow: hidden;
        }
        
        .time-input:focus-within {
            box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
        }
        
        input[type="number"] {
            width: 90px;
            padding: 8px 12px;
            border: none;
            background: transparent;
            text-align: center;
            font-size: 14px;
            transition: var(--transition);
            font-family: 'Segoe UI', -apple-system, sans-serif;
        }
        
        input[type="number"]:focus {
            outline: none;
        }
        
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
            -webkit-appearance: none;
            margin: 0;
        }
        
        button {
            padding: 8px 12px;
            background-color: var(--primary-color);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            min-width: 40px;
            height: 36px;
            transition: var(--transition);
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        }
        
        button:hover {
            background-color: var(--primary-dark);
            transform: translateY(-1px);
            box-shadow: 0 3px 6px rgba(0,0,0,0.15);
        }
        
        button:active {
            transform: translateY(1px);
            box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        }
        
        button.btn-control {
            background-color: #f5f5f5;
            color: var(--text-color);
        }
        
        button.btn-control:hover {
            background-color: #e9e9e9;
        }
        
        button.btn-accent {
            background-color: var(--accent-color);
        }
        
        button.btn-accent:hover {
            background-color: var(--accent-dark);
        }
        
        .waveform-card {
            background: var(--card-bg);
            border-radius: var(--border-radius);
            overflow: hidden;
            box-shadow: var(--shadow);
            transition: var(--transition);
        }
        
        .card-header {
            padding: 12px 15px;
            background: #f7f7f7;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .card-title {
            font-size: 16px;
            font-weight: 500;
            color: #555;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .card-title i {
            color: var(--primary-color);
        }
        
        .waveform-container {
            width: 100%;
            height: 100px;
            position: relative;
            overflow: hidden;
        }
        
        .waveform {
            width: 100%;
            height: 100%;
            position: relative;
            z-index: 1;
        }
        
        .waveform-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, rgba(52,152,219,0.05), rgba(231,76,60,0.05));
            z-index: -1;
        }
        
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255,255,255,0.9);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10;
            gap: 15px;
        }
        
        .loading-spinner {
            width: 36px;
            height: 36px;
            border: 3px solid rgba(52,152,219,0.2);
            border-radius: 50%;
            border-top-color: var(--primary-color);
            animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .loading-text {
            text-align: center;
            color: var(--primary-color);
            font-size: 14px;
            font-weight: 500;
        }
        
        .toast {
            visibility: hidden;
            position: fixed;
            bottom: 30px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(50, 50, 50, 0.9);
            color: white;
            padding: 10px 20px;
            border-radius: 6px;
            font-size: 14px;
            opacity: 0;
            transition: all 0.3s;
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .toast.show {
            visibility: visible;
            opacity: 1;
            bottom: 40px;
        }
        
        @keyframes frameNext {
            0% { transform: translateX(0); background-color: transparent; }
            30% { transform: translateX(2px); background-color: rgba(46, 204, 113, 0.1); }
            100% { transform: translateX(0); background-color: transparent; }
        }
        
        @keyframes framePrev {
            0% { transform: translateX(0); background-color: transparent; }
            30% { transform: translateX(-2px); background-color: rgba(52, 152, 219, 0.1); }
            100% { transform: translateX(0); background-color: transparent; }
        }
        
        .time-input.frame-next {
            animation: frameNext 0.3s ease;
        }
        
        .time-input.frame-prev {
            animation: framePrev 0.3s ease;
        }
        
        .time-input.highlight {
            background-color: rgba(231, 76, 60, 0.1);
            transition: all 0.3s;
        }
        
        #hiddenVideoContainer {
            position: fixed;
            bottom: 0;
            right: 0;
            width: 1px;
            height: 1px;
            opacity: 0.01;
            pointer-events: none;
            z-index: -1;
            overflow: hidden;
        }
        
        .shortcut-hint {
            display: flex;
            justify-content: center;
            margin-top: 15px;
            font-size: 13px;
            color: #777;
        }
        
        .shortcuts {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .shortcut-item {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .key {
            display: inline-block;
            padding: 2px 6px;
            background: #eee;
            border-radius: 4px;
            font-size: 12px;
            font-family: monospace;
            color: #555;
            border: 1px solid #ddd;
        }
        
        .key-combo {
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .key-combo .plus {
            font-size: 10px;
            color: #999;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .container {
                padding: 0;
            }
            
            .app-title {
                font-size: 20px;
            }
            
            .controls-panel {
                padding: 10px;
            }
            
            .control-buttons {
                gap: 8px;
            }
            
            button {
                padding: 6px 10px;
                font-size: 13px;
            }
            
            .waveform-container {
                height: 80px;
            }
            
            .shortcut-hint {
                flex-direction: column;
                align-items: center;
            }
        }
        
        @media (max-width: 480px) {
            body {
                padding: 10px;
            }
            
            .control-panels {
                gap: 10px;
            }
            
            .control-buttons {
                flex-direction: column;
                align-items: stretch;
            }
            
            .control-group {
                width: 100%;
                justify-content: center;
            }
            
            .time-input {
                flex: 1;
            }
            
            input[type="number"] {
                width: 100%;
            }
        }
        
        /* Dark mode toggle */
        .theme-toggle {
            position: absolute;
            top: 10px;
            right: 10px;
            z-index: 100;
            background: none;
            border: none;
            color: #555;
            cursor: pointer;
            padding: 5px;
            transition: var(--transition);
        }
        
        .theme-toggle:hover {
            color: var(--primary-color);
        }
        
        /* Dark Mode */
        body.dark-mode {
            --bg-color: #121212;
            --card-bg: #1e1e1e;
            --text-color: #e0e0e0;
            --shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        body.dark-mode .progress-bar {
            background: #333;
        }
        
        body.dark-mode .time-input, 
        body.dark-mode .btn-control {
            background: #2a2a2a;
            color: #e0e0e0;
        }
        
        body.dark-mode .card-header {
            background: #252525;
            border-color: #333;
        }
        
        body.dark-mode .card-title {
            color: #ccc;
        }
        
        body.dark-mode .shortcut-hint {
            color: #aaa;
        }
        
        body.dark-mode .key {
            background: #333;
            color: #ddd;
            border-color: #444;
        }
        
        body.dark-mode .theme-toggle {
            color: #ccc;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="app-header">
            <h1 class="app-title">Trình Phát Video Nâng Cao</h1>
            <p class="app-description">Phân tích khung hình, điều khiển chính xác và xem dạng sóng âm thanh</p>
        </div>
        
        <div class="player-card">
            <div class="video-wrapper">
                <video id="videoPlayer" controls>
                    <source src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" type="video/mp4">
                    Trình duyệt của bạn không hỗ trợ video HTML5.
                </video>
                <div id="fpsBadge" class="fps-badge" style="display: none;"><i class="fas fa-film"></i> <span>-- FPS</span></div>
            </div>
            
            <div class="controls-panel">
                <div class="progress-container">
                    <div class="progress-bar" id="progressBarContainer">
                        <div id="progressBar" class="progress">
                            <div class="progress-handle"></div>
                        </div>
                    </div>
                </div>
                
                <div class="control-panels">
                    <div class="control-buttons">
                        <div class="control-group">
                            <button id="seekBack10" class="btn-control" title="Lùi 10 khung hình"><i class="fas fa-backward"></i></button>
                            <button id="seekBack1" class="btn-control" title="Lùi 1 khung hình"><i class="fas fa-step-backward"></i></button>
                        </div>
                        
                        <div class="time-input">
                            <input type="number" id="timeCode" value="0" title="Thời gian hiện tại (milliseconds)">
                            <button id="copyBtn" title="Sao chép mã thời gian"><i class="fas fa-copy"></i></button>
                        </div>
                        
                        <div class="control-group">
                            <button id="seekForward1" class="btn-control" title="Tiến 1 khung hình"><i class="fas fa-step-forward"></i></button>
                            <button id="seekForward10" class="btn-control" title="Tiến 10 khung hình"><i class="fas fa-forward"></i></button>
                        </div>
                    </div>
                </div>
                
                <div class="shortcut-hint">
                    <div class="shortcuts">
                        <div class="shortcut-item">
                            <div class="key-combo">
                                <span class="key"><i class="fas fa-arrow-left"></i></span>
                            </div>
                            <span>Lùi 1 frame</span>
                        </div>
                        <div class="shortcut-item">
                            <div class="key-combo">
                                <span class="key"><i class="fas fa-arrow-right"></i></span>
                            </div>
                            <span>Tiến 1 frame</span>
                        </div>
                        <div class="shortcut-item">
                            <div class="key-combo">
                                <span class="key">Shift</span>
                                <span class="plus">+</span>
                                <span class="key"><i class="fas fa-arrow-left"></i></span>
                            </div>
                            <span>Lùi 10 frame</span>
                        </div>
                        <div class="shortcut-item">
                            <div class="key-combo">
                                <span class="key">Shift</span>
                                <span class="plus">+</span>
                                <span class="key"><i class="fas fa-arrow-right"></i></span>
                            </div>
                            <span>Tiến 10 frame</span>
                        </div>
                        <div class="shortcut-item">
                            <div class="key-combo">
                                <span class="key">Space</span>
                            </div>
                            <span>Phát/Tạm dừng</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="waveform-card">
            <div class="card-header">
                <div class="card-title"><i class="fas fa-wave-square"></i> Dạng sóng âm thanh</div>
            </div>
            
            <div class="waveform-container">
                <div id="waveform" class="waveform"></div>
                <div class="waveform-overlay"></div>
                <div id="loadingOverlay" class="loading-overlay">
                    <div class="loading-spinner"></div>
                    <div class="loading-text">Đang tải dạng sóng âm thanh...</div>
                </div>
            </div>
        </div>
    </div>
    
    <button id="themeToggle" class="theme-toggle" title="Chuyển đổi chế độ tối/sáng">
        <i class="fas fa-moon"></i>
    </button>
    
    <div id="toast" class="toast"><i class="fas fa-check-circle"></i> Đã sao chép!</div>
    
    <!-- Video ẩn để đo FPS -->
    <div id="hiddenVideoContainer">
        <video id="hiddenVideo" muted preload="auto" playsinline disablePictureInPicture>
            <!-- Source sẽ được đặt bằng JavaScript -->
        </video>
    </div>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/wavesurfer.js/2.2.1/wavesurfer.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
    <script>
        $(document).ready(function() {
            // DOM Elements
            const videoPlayer = document.getElementById('videoPlayer');
            const timeCode = document.getElementById('timeCode');
            const progressBar = document.getElementById('progressBar');
            const fpsBadge = document.getElementById('fpsBadge');
            const hiddenVideo = document.getElementById('hiddenVideo');
            const loadingOverlay = document.getElementById('loadingOverlay');
            const themeToggle = document.getElementById('themeToggle');
            
            // Initialize variables
            let fps = 24; // Default FPS
            let cachedFPS = null;
            let isMeasuring = false;
            let useDirectMethod = false;
            let measuringTimeout = null;
            let isDragging = false;
            let isUserChanging = false;
            let wavesurfer = null;
            let updateTimeTask = null;
            let waveformInitialized = false;
            
            // Theme toggle functionality
            themeToggle.addEventListener('click', function() {
                document.body.classList.toggle('dark-mode');
                const isDarkMode = document.body.classList.contains('dark-mode');
                themeToggle.innerHTML = isDarkMode ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
                
                // Save preference to localStorage
                localStorage.setItem('darkMode', isDarkMode ? 'true' : 'false');
            });
            
            // Load user preference for dark mode
            if (localStorage.getItem('darkMode') === 'true') {
                document.body.classList.add('dark-mode');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            }
            
            // Improved FPS detection with debounce
            const debounce = (func, wait) => {
                let timeout;
                return function executedFunction(...args) {
                    const later = () => {
                        clearTimeout(timeout);
                        func(...args);
                    };
                    clearTimeout(timeout);
                    timeout = setTimeout(later, wait);
                };
            };
            
            // Optimized direct FPS detection
            function detectFPSDirectly(videoElement, options = {}) {
                const defaultOptions = {
                    frameLimit: 30,    // Reduced from 40 to 30
                    timeLimit: 1500,   // Reduced from 2000 to 1500ms
                    onComplete: () => {}
                };
                
                const settings = { ...defaultOptions, ...options };
                
                return new Promise((resolve, reject) => {
                    if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) {
                        reject(new Error("Trình duyệt không hỗ trợ"));
                        return;
                    }
                    
                    // Save initial video state
                    const wasPlaying = !videoElement.paused;
                    const originalTime = videoElement.currentTime;
                    const originalMuted = videoElement.muted;
                    
                    // Mute during measurement
                    if (useDirectMethod) {
                        videoElement.muted = true;
                    }
                    
                    // Measurement variables
                    let frameCount = 0;
                    let lastTime = 0;
                    let startTime = 0;
                    let measurements = [];
                    let localIsMeasuring = true;
                    isMeasuring = true;
                    
                    // Set timeout to prevent hanging
                    measuringTimeout = setTimeout(() => {
                        if (isMeasuring) {
                            isMeasuring = false;
                            localIsMeasuring = false;
                            
                            // Calculate FPS from available data
                            if (frameCount > 5) {
                                const timeElapsed = lastTime - startTime;
                                const measuredFPS = Math.round((frameCount / (timeElapsed / 1000)));
                                
                                const result = {
                                    fps: measuredFPS,
                                    totalFrames: frameCount,
                                    duration: timeElapsed / 1000,
                                    measurements: measurements
                                };
                                
                                settings.onComplete(result);
                                resolve(result);
                                return;
                            }
                            
                            reject(new Error("Đo FPS bị timeout"));
                        }
                    }, settings.timeLimit + 1000); // Reduced extra time from 2000 to 1000ms
                    
                    const cleanup = () => {
                        isMeasuring = false;
                        localIsMeasuring = false;
                        clearTimeout(measuringTimeout);
                        
                        // Only restore state for direct method
                        if (useDirectMethod) {
                            videoElement.currentTime = originalTime;
                            videoElement.muted = originalMuted;
                            
                            if (!wasPlaying) {
                                videoElement.pause();
                            }
                        }
                    };
                    
                    const frameCallback = (now, metadata) => {
                        if (!localIsMeasuring) {
                            cleanup();
                            return;
                        }
                        
                        if (startTime === 0) {
                            startTime = now;
                            lastTime = now;
                        }
                        
                        const deltaTime = now - lastTime;
                        
                        // Save measurement
                        if (frameCount % 3 === 0) { // Only save every 3rd frame to reduce memory usage
                            measurements.push({
                                frame: frameCount,
                                time: now - startTime,
                                delta: deltaTime
                            });
                        }
                        
                        lastTime = now;
                        frameCount++;
                        
                        // Check stop conditions
                        const timeElapsed = now - startTime;
                        if (frameCount < settings.frameLimit && timeElapsed < settings.timeLimit && localIsMeasuring) {
                            // Continue measuring
                            videoElement.requestVideoFrameCallback(frameCallback);
                        } else {
                            // Enough frames or time elapsed or cancelled
                            isMeasuring = false;
                            localIsMeasuring = false;
                            clearTimeout(measuringTimeout);
                            
                            // Calculate final result
                            const measuredFPS = Math.round((frameCount / (timeElapsed / 1000)));
                            
                            // Create detailed result
                            const result = {
                                fps: measuredFPS,
                                totalFrames: frameCount,
                                duration: timeElapsed / 1000,
                                measurements: measurements
                            };
                            
                            // Notify completion
                            settings.onComplete(result);
                            cleanup();
                            resolve(result);
                        }
                    };
                    
                    // If playing, measure now, otherwise play first
                    if (!videoElement.paused) {
                        videoElement.requestVideoFrameCallback(frameCallback);
                    } else {
                        videoElement.play().then(() => {
                            videoElement.requestVideoFrameCallback(frameCallback);
                        }).catch(err => {
                            cleanup();
                            reject(err);
                        });
                    }
                });
            }

            // Optimized FPS detection with hidden video
            async function detectVideoFPS(mainVideo, options = {}) {
                try {
                    // Ensure the hidden video has the same source
                    if (mainVideo.currentSrc && mainVideo.currentSrc !== hiddenVideo.src) {
                        hiddenVideo.src = mainVideo.currentSrc;
                        hiddenVideo.crossOrigin = mainVideo.crossOrigin;
                        
                        // Wait for hidden video to load
                        await new Promise((resolve, reject) => {
                            const timeoutId = setTimeout(() => {
                                hiddenVideo.onloadedmetadata = null;
                                hiddenVideo.oner
                                ror = null;
                                reject(new Error
