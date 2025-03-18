<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Video Waveform - Stylish Bar Style</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1000px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        #videoPlayer {
            width: 100%;
            border-radius: 4px;
            margin-bottom: 20px;
            background-color: #000;
        }
        #waveform-container {
            position: relative;
            width: 100%;
            height: 150px;
            background-color: #f9f9f9;
            border: 1px solid #ddd;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 20px;
        }
        #waveform-canvas {
            width: 100%;
            height: 100%;
            background-color: #ffffff;
        }
        #progress-bar {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 0;
            background-color: rgba(255, 165, 0, 0.2);
            pointer-events: none;
        }
        #cursor {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 2px;
            background-color: rgba(255, 80, 0, 0.7);
            pointer-events: none;
        }
        .loading-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background-color: rgba(255, 255, 255, 0.9);
            z-index: 10;
        }
        .spinner {
            border: 4px solid rgba(0, 0, 0, 0.1);
            width: 36px;
            height: 36px;
            border-radius: 50%;
            border-left-color: #ff8c00;
            animation: spin 1s linear infinite;
            margin-bottom: 10px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .loading-text {
            font-size: 14px;
            color: #333;
        }
        .controls {
            margin: 20px 0;
        }
        button {
            padding: 10px 20px;
            background-color: #ff8c00;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            margin-right: 10px;
            transition: background-color 0.3s;
        }
        button:hover {
            background-color: #e67e00;
        }
        .settings {
            margin: 15px 0;
            padding: 15px;
            background-color: #f0f0f0;
            border-radius: 4px;
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            align-items: center;
        }
        .setting-group {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .setting-group label {
            font-weight: bold;
            font-size: 14px;
        }
        .setting-group select, .setting-group input {
            padding: 5px 10px;
            border-radius: 4px;
            border: 1px solid #ddd;
        }
        select:focus, input:focus {
            outline: none;
            border-color: #ff8c00;
        }
        .status-box {
            background-color: #f8d7da;
            color: #721c24;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
            border: 1px solid #f5c6cb;
            display: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Video Waveform - Stylish Bar Style</h1>
        
        <div id="status-box" class="status-box"></div>
        
        <video id="videoPlayer" controls crossorigin="anonymous">
            <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" type="video/mp4">
            Trình duyệt của bạn không hỗ trợ video HTML5.
        </video>
        
        <div class="controls">
            <button id="generate-waveform">Tạo Waveform</button>
        </div>
        
        <div class="settings">
            <div class="setting-group">
                <label for="bar-width">Độ rộng thanh:</label>
                <input type="number" id="bar-width" min="1" max="10" value="3">
            </div>
            <div class="setting-group">
                <label for="bar-gap">Khoảng cách:</label>
                <input type="number" id="bar-gap" min="0" max="5" value="1">
            </div>
            <div class="setting-group">
                <label for="bar-color">Màu sắc:</label>
                <select id="bar-color">
                    <option value="orange-blue">Cam-Xanh</option>
                    <option value="green-blue">Xanh lá-Xanh dương</option>
                    <option value="purple-pink">Tím-Hồng</option>
                    <option value="mono-orange">Cam đơn sắc</option>
                    <option value="mono-blue">Xanh đơn sắc</option>
                </select>
            </div>
            <div class="setting-group">
                <label for="visualization-type">Kiểu hiển thị:</label>
                <select id="visualization-type">
                    <option value="bars">Thanh</option>
                    <option value="wave">Sóng</option>
                </select>
            </div>
        </div>
        
        <div id="waveform-container">
            <div id="loading-overlay" class="loading-overlay">
                <div class="spinner"></div>
                <div id="loading-text" class="loading-text">Nhấn nút "Tạo Waveform" để bắt đầu</div>
            </div>
            <canvas id="waveform-canvas"></canvas>
            <div id="progress-bar"></div>
            <div id="cursor"></div>
        </div>
    </div>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            // Elements
            const videoElement = document.getElementById('videoPlayer');
            const waveformCanvas = document.getElementById('waveform-canvas');
            const progressBar = document.getElementById('progress-bar');
            const cursor = document.getElementById('cursor');
            const loadingOverlay = document.getElementById('loading-overlay');
            const loadingText = document.getElementById('loading-text');
            const generateButton = document.getElementById('generate-waveform');
            const statusBox = document.getElementById('status-box');
            
            // Settings elements
            const barWidthInput = document.getElementById('bar-width');
            const barGapInput = document.getElementById('bar-gap');
            const barColorSelect = document.getElementById('bar-color');
            const visualizationTypeSelect = document.getElementById('visualization-type');
            
            // Variables
            let audioContext = null;
            let audioBuffer = null;
            let isProcessing = false;
            let animationFrameId = null;
            
            // Thiết lập kích thước canvas
            function resizeCanvas() {
                const container = waveformCanvas.parentElement;
                waveformCanvas.width = container.clientWidth;
                waveformCanvas.height = container.clientHeight;
                
                // Vẽ lại waveform nếu đã có dữ liệu
                if (audioBuffer) {
                    drawWaveform();
                }
            }
            
            // Hiển thị lỗi
            function showError(message) {
                statusBox.textContent = message;
                statusBox.style.display = 'block';
                loadingText.textContent = `Lỗi: ${message}`;
                loadingOverlay.style.display = 'flex';
                console.error(message);
            }
            
            // Hiển thị thông báo loading
            function showLoading(message) {
                loadingText.textContent = message;
                loadingOverlay.style.display = 'flex';
                console.log(message);
            }
            
            // Ẩn loading
            function hideLoading() {
                loadingOverlay.style.display = 'none';
            }
            
            // Lấy màu sắc dựa vào setting
            function getColors() {
                const colorScheme = barColorSelect.value;
                switch (colorScheme) {
                    case 'orange-blue':
                        return {
                            positiveColor: '#ff8c00',
                            negativeColor: '#4285f4'
                        };
                    case 'green-blue':
                        return {
                            positiveColor: '#00c853',
                            negativeColor: '#2979ff'
                        };
                    case 'purple-pink':
                        return {
                            positiveColor: '#9c27b0',
                            negativeColor: '#e91e63'
                        };
                    case 'mono-orange':
                        return {
                            positiveColor: '#ff8c00',
                            negativeColor: '#ffab40'
                        };
                    case 'mono-blue':
                        return {
                            positiveColor: '#1976d2',
                            negativeColor: '#64b5f6'
                        };
                    default:
                        return {
                            positiveColor: '#ff8c00',
                            negativeColor: '#4285f4'
                        };
                }
            }
            
            // Vẽ waveform dạng thanh
            function drawBarWaveform() {
                if (!audioBuffer || !waveformCanvas) return;
                
                const ctx = waveformCanvas.getContext('2d');
                const width = waveformCanvas.width;
                const height = waveformCanvas.height;
                const barWidth = parseInt(barWidthInput.value) || 3;
                const barGap = parseInt(barGapInput.value) || 1;
                const colors = getColors();
                
                // Lấy dữ liệu kênh âm thanh
                const channelData = audioBuffer.getChannelData(0);
                
                // Xóa canvas
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                
                // Số lượng thanh có thể vẽ được trên canvas
                const totalWidth = barWidth + barGap;
                const numBars = Math.floor(width / totalWidth);
                const middle = height / 2;
                
                // Tính toán mỗi thanh sẽ đại diện cho bao nhiêu mẫu
                const samplesPerBar = Math.ceil(channelData.length / numBars);
                
                // Vẽ các thanh
                for (let i = 0; i < numBars; i++) {
                    const startSample = i * samplesPerBar;
                    
                    // Tìm giá trị peak dương và âm trong khoảng mẫu này
                    let maxPositive = 0;
                    let maxNegative = 0;
                    
                    for (let j = 0; j < samplesPerBar && (startSample + j) < channelData.length; j++) {
                        const value = channelData[startSample + j];
                        if (value > 0 && value > maxPositive) {
                            maxPositive = value;
                        } else if (value < 0 && value < maxNegative) {
                            maxNegative = value;
                        }
                    }
                    
                    // Tính chiều cao thanh dương (trên giữa)
                    const positiveHeight = Math.min(Math.pow(maxPositive, 0.8) * height, middle - 1);
                    
                    // Tính chiều cao thanh âm (dưới giữa)
                    const negativeHeight = Math.min(Math.pow(Math.abs(maxNegative), 0.8) * height, middle - 1);
                    
                    // Vẽ thanh dương (lên trên)
                    ctx.fillStyle = colors.positiveColor;
                    ctx.fillRect(
                        i * totalWidth, 
                        middle - positiveHeight, 
                        barWidth, 
                        positiveHeight
                    );
                    
                    // Vẽ thanh âm (xuống dưới)
                    ctx.fillStyle = colors.negativeColor;
                    ctx.fillRect(
                        i * totalWidth, 
                        middle, 
                        barWidth, 
                        negativeHeight
                    );
                }
            }
            
            // Vẽ waveform dạng sóng
            function drawWaveWaveform() {
                if (!audioBuffer || !waveformCanvas) return;
                
                const ctx = waveformCanvas.getContext('2d');
                const width = waveformCanvas.width;
                const height = waveformCanvas.height;
                const colors = getColors();
                
                // Lấy dữ liệu kênh âm thanh
                const channelData = audioBuffer.getChannelData(0);
                
                // Xóa canvas
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, width, height);
                
                // Số lượng mẫu
                const step = Math.ceil(channelData.length / width);
                const middle = height / 2;
                
                // Bắt đầu vẽ path cho dạng sóng
                ctx.beginPath();
                ctx.moveTo(0, middle);
                
                // Vẽ nửa trên (dương)
                for (let i = 0; i < width; i++) {
                    const startSample = i * step;
                    
                    let maxPositive = 0;
                    for (let j = 0; j < step && (startSample + j) < channelData.length; j++) {
                        const value = channelData[startSample + j];
                        if (value > 0 && value > maxPositive) {
                            maxPositive = value;
                        }
                    }
                    
                    const y = middle - (maxPositive * height * 0.8);
                    ctx.lineTo(i, y);
                }
                
                // Tiếp tục đến góc phải
                ctx.lineTo(width, middle);
                
                // Vẽ nửa dưới (âm)
                for (let i = width - 1; i >= 0; i--) {
                    const startSample = i * step;
                    
                    let maxNegative = 0;
                    for (let j = 0; j < step && (startSample + j) < channelData.length; j++) {
                        const value = channelData[startSample + j];
                        if (value < 0 && value < maxNegative) {
                            maxNegative = value;
                        }
                    }
                    
                    const y = middle - (maxNegative * height * 0.8);
                    ctx.lineTo(i, y);
                }
                
                // Đóng path
                ctx.closePath();
                
                // Vẽ với gradient
                const gradient = ctx.createLinearGradient(0, 0, 0, height);
                gradient.addColorStop(0, colors.positiveColor);
                gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
                gradient.addColorStop(1, colors.negativeColor);
                
                ctx.fillStyle = gradient;
                ctx.fill();
            }
            
            // Quyết định kiểu vẽ waveform
            function drawWaveform() {
                const visualizationType = visualizationTypeSelect.value;
                
                if (visualizationType === 'bars') {
                    drawBarWaveform();
                } else {
                    drawWaveWaveform();
                }
            }
            
            // Cập nhật thanh tiến trình theo thời gian hiện tại của video
            function updateProgress() {
                if (!audioBuffer) return;
                
                const currentTime = videoElement.currentTime;
                const duration = audioBuffer.duration;
                const progress = (currentTime / duration) * 100;
                
                progressBar.style.width = `${progress}%`;
                cursor.style.left = `${progress}%`;
                
                // Yêu cầu frame tiếp theo
                animationFrameId = requestAnimationFrame(updateProgress);
            }
            
            // Dừng cập nhật tiến trình
            function stopProgressUpdate() {
                if (animationFrameId) {
                    cancelAnimationFrame(animationFrameId);
                    animationFrameId = null;
                }
            }
            
            // Khởi tạo Web Audio API và phân tích video
            async function generateWaveform() {
                if (isProcessing) return;
                isProcessing = true;
                
                try {
                    showLoading('Đang khởi tạo Audio Context...');
                    
                    // Tạo audio context nếu chưa có
                    if (!audioContext) {
                        const AudioContext = window.AudioContext || window.webkitAudioContext;
                        audioContext = new AudioContext();
                        console.log(`Created Audio Context, state: ${audioContext.state}`);
                        
                        // Resuming audio context (cần tương tác người dùng)
                        if (audioContext.state === 'suspended') {
                            await audioContext.resume();
                            console.log(`Audio Context resumed, state: ${audioContext.state}`);
                        }
                    }
                    
                    // Lấy URL của video
                    const videoUrl = videoElement.currentSrc || videoElement.querySelector('source').src;
                    console.log(`Video URL: ${videoUrl}`);
                    
                    // Kiểm tra CORS
                    showLoading('Đang tải video...');
                    console.log('Fetching video data...');
                    
                    const response = await fetch(videoUrl);
                    console.log(`Fetch response status: ${response.status}`);
                    
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    // Lấy dữ liệu video dưới dạng ArrayBuffer
                    showLoading('Đang xử lý dữ liệu...');
                    const arrayBuffer = await response.arrayBuffer();
                    console.log(`Received ${arrayBuffer.byteLength} bytes of data`);
                    
                    // Giải mã âm thanh từ video
                    showLoading('Đang giải mã âm thanh...');
                    try {
                        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                        console.log(`Decoded audio: ${audioBuffer.duration}s, ${audioBuffer.numberOfChannels} channels, ${audioBuffer.sampleRate}Hz`);
                    } catch (decodeError) {
                        console.error(`Error decoding audio: ${decodeError.message}`);
                        throw new Error(`Không thể giải mã audio: ${decodeError.message}`);
                    }
                    
                    // Vẽ waveform
                    showLoading('Đang vẽ waveform...');
                    drawWaveform();
                    
                    // Bắt đầu cập nhật tiến trình
                    stopProgressUpdate(); // Dừng cập nhật cũ nếu có
                    updateProgress();
                    
                    // Thêm sự kiện click vào waveform
                    waveformCanvas.addEventListener('click', function(e) {
                        if (!audioBuffer) return;
                        
                        const rect = waveformCanvas.getBoundingClientRect();
                        const clickPosition = (e.clientX - rect.left) / rect.width;
                        
                        // Đặt vị trí hiện tại của video
                        videoElement.currentTime = audioBuffer.duration * clickPosition;
                    });
                    
                    // Thêm sự kiện thay đổi settings
                    const settingsChangeHandler = function() {
                        if (audioBuffer) {
                            drawWaveform();
                        }
                    };
                    
                    barWidthInput.addEventListener('change', settingsChangeHandler);
                    barGapInput.addEventListener('change', settingsChangeHandler);
                    barColorSelect.addEventListener('change', settingsChangeHandler);
                    visualizationTypeSelect.addEventListener('change', settingsChangeHandler);
                    
                    // Hoàn tất
                    hideLoading();
                    statusBox.style.display = 'none';
                    console.log('Waveform generation completed successfully');
                    
                } catch (error) {
                    showError(`Lỗi: ${error.message}`);
                    console.error(`Error in generateWaveform: ${error.message}`);
                } finally {
                    isProcessing = false;
                }
            }
            
            // Sự kiện nút tạo waveform
            generateButton.addEventListener('click', generateWaveform);
            
            // Sự kiện resize
            window.addEventListener('resize', resizeCanvas);
            
            // Các sự kiện video
            videoElement.addEventListener('play', function() {
                // Bắt đầu cập nhật tiến trình khi video phát
                if (audioBuffer && !animationFrameId) {
                    updateProgress();
                }
            });
            
            videoElement.addEventListener('pause', function() {
                // Cập nhật cuối cùng khi video tạm dừng
                updateProgress();
                // Dừng cập nhật liên tục
                stopProgressUpdate();
            });
            
            videoElement.addEventListener('ended', function() {
                // Cập nhật cuối cùng khi video kết thúc
                updateProgress();
                // Dừng cập nhật liên tục
                stopProgressUpdate();
            });
            
            // Khởi tạo
            resizeCanvas();
        });
    </script>
</body>
</html>
