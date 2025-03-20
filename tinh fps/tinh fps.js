<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Phát Hiện FPS Video</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #333;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
        }
        .video-container {
            margin: 20px 0;
            position: relative;
        }
        video {
            max-width: 100%;
            border: 1px solid #ddd;
        }
        /* Container cho video ẩn */
        #hiddenVideoContainer {
            position: fixed;
            bottom: 0;
            right: 0;
            width: 10px;
            height: 10px;
            opacity: 0.01;
            pointer-events: none;
            z-index: -1;
            overflow: hidden;
        }
        /* Badge FPS */
        .fps-badge {
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            z-index: 100;
        }
    </style>
</head>
<body>
    <h1>Phát Hiện FPS Video</h1>
    
    <div class="video-container">
        <video id="videoPlayer" controls crossorigin="anonymous" preload="metadata">
            <source src="http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4" type="video/mp4">
            Trình duyệt của bạn không hỗ trợ video HTML5.
        </video>
        <div id="fpsBadge" class="fps-badge" style="display: none;">-- FPS</div>
    </div>
    
    <!-- Video ẩn để đo FPS -->
    <div id="hiddenVideoContainer">
        <video id="hiddenVideo" muted preload="auto" playsinline disablePictureInPicture style="width:10px;height:10px">
            <!-- Source sẽ được đặt bằng JavaScript -->
        </video>
    </div>
    
    <script>
        // Các biến toàn cục
        let isMeasuring = false;
        let cachedFPS = null;
        let useDirectMethod = false;
        let measuringTimeout = null;
        
        // Phương pháp đo fps trực tiếp từ video
        function detectFPSDirectly(videoElement, options = {}) {
            const defaultOptions = {
                frameLimit: 40,    // Cố định 40 frame
                timeLimit: 2000,   // Cố định 2 giây
                onComplete: () => {}
            };
            
            const settings = { ...defaultOptions, ...options };
            
            return new Promise((resolve, reject) => {
                if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) {
                    reject(new Error("Trình duyệt không hỗ trợ"));
                    return;
                }
                
                // Lưu trạng thái ban đầu của video
                const wasPlaying = !videoElement.paused;
                const originalTime = videoElement.currentTime;
                const originalMuted = videoElement.muted;
                const originalVolume = videoElement.volume;
                
                // Tắt tiếng trong quá trình đo để tránh tiếng ồn
                if (useDirectMethod) {
                    videoElement.muted = true;
                }
                
                // Các biến đo lường
                let frameCount = 0;
                let lastTime = 0;
                let startTime = 0;
                let measurements = [];
                isMeasuring = true;
                
                // Thiết lập timeout cho trường hợp bị treo
                measuringTimeout = setTimeout(() => {
                    if (isMeasuring) {
                        isMeasuring = false;
                        
                        // Nếu có đủ dữ liệu, tính kết quả
                        if (frameCount > 5) {
                            const timeElapsed = lastTime - startTime;
                            const measuredFPS = Math.round((frameCount / (timeElapsed / 1000)));
                            
                            const result = {
                                fps: measuredFPS,
                                totalFrames: frameCount,
                                duration: timeElapsed / 1000,
                                measurements: measurements,
                                partial: true
                            };
                            
                            settings.onComplete(result);
                            resolve(result);
                            return;
                        }
                        
                        reject(new Error("Đo FPS bị timeout"));
                    }
                }, settings.timeLimit + 2000); // Thêm 2 giây để đảm bảo
                
                const cleanup = () => {
                    isMeasuring = false;
                    clearTimeout(measuringTimeout);
                    
                    // Chỉ khôi phục trạng thái nếu là phương pháp trực tiếp
                    if (useDirectMethod) {
                        videoElement.currentTime = originalTime;
                        videoElement.muted = originalMuted;
                        videoElement.volume = originalVolume;
                        
                        if (!wasPlaying) {
                            videoElement.pause();
                        }
                    }
                };
                
                const frameCallback = (now, metadata) => {
                    if (!isMeasuring) {
                        cleanup();
                        return;
                    }
                    
                    if (startTime === 0) {
                        startTime = now;
                        lastTime = now;
                    }
                    
                    const deltaTime = now - lastTime;
                    
                    // Lưu đo lường
                    measurements.push({
                        frame: frameCount,
                        time: now - startTime,
                        delta: deltaTime
                    });
                    
                    lastTime = now;
                    frameCount++;
                    
                    // Kiểm tra các điều kiện dừng
                    const timeElapsed = now - startTime;
                    if (frameCount < settings.frameLimit && timeElapsed < settings.timeLimit && isMeasuring) {
                        // Tiếp tục đo
                        videoElement.requestVideoFrameCallback(frameCallback);
                    } else {
                        // Đã đủ số frame hoặc thời gian hoặc bị hủy
                        isMeasuring = false;
                        clearTimeout(measuringTimeout);
                        
                        // Tính kết quả cuối cùng
                        const measuredFPS = Math.round((frameCount / (timeElapsed / 1000)));
                        
                        // Tính các thống kê nếu đủ dữ liệu
                        let minInterval = 0, maxInterval = 0, avgInterval = 0, jitter = 0;
                        if (measurements.length > 1) {
                            const intervalArray = measurements.map(m => m.delta);
                            minInterval = Math.min(...intervalArray);
                            maxInterval = Math.max(...intervalArray);
                            avgInterval = intervalArray.reduce((sum, val) => sum + val, 0) / intervalArray.length;
                            
                            // Tính độ lệch chuẩn (jitter)
                            const variance = intervalArray.reduce((sum, delta) => sum + Math.pow(delta - avgInterval, 2), 0) / intervalArray.length;
                            jitter = Math.sqrt(variance);
                        }
                        
                        // Tạo kết quả chi tiết
                        const result = {
                            fps: measuredFPS,
                            totalFrames: frameCount,
                            duration: timeElapsed / 1000,
                            minInterval: minInterval,
                            maxInterval: maxInterval,
                            avgInterval: avgInterval,
                            jitter: jitter,
                            measurements: measurements
                        };
                        
                        // Thông báo hoàn thành
                        settings.onComplete(result);
                        cleanup();
                        resolve(result);
                    }
                };
                
                // Nếu đang phát thì đo luôn, nếu chưa thì phát
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

        // Phát hiện FPS sử dụng video chính hoặc video ẩn
        async function detectVideoFPS(mainVideo, options = {}) {
            const hiddenVideo = document.getElementById('hiddenVideo');
            
            try {
                // Đảm bảo video ẩn có cùng source với video hiển thị
                if (mainVideo.currentSrc !== hiddenVideo.src) {
                    hiddenVideo.src = mainVideo.currentSrc;
                    
                    // Đợi video ẩn tải xong
                    await new Promise((resolve, reject) => {
                        hiddenVideo.onloadedmetadata = resolve;
                        hiddenVideo.onerror = reject;
                        
                        // Set timeout để tránh bị treo
                        setTimeout(() => {
                            if (!hiddenVideo.videoWidth) {
                                reject(new Error("Video ẩn không tải được"));
                            }
                        }, 5000);
                    });
                }
                
                // Thử đo với video ẩn trước
                useDirectMethod = false;
                
                try {
                    const result = await detectFPSDirectly(hiddenVideo, options);
                    return result;
                } catch (err) {
                    // Fallback sang đo trực tiếp
                    useDirectMethod = true;
                    return await detectFPSDirectly(mainVideo, options);
                }
            } catch (err) {
                throw err;
            }
        }

        // Hàm hiển thị badge FPS
        function showFPSBadge(fps) {
            // Điều chỉnh giá trị FPS theo yêu cầu
            let adjustedFPS = fps;
            
            // Nếu FPS từ 20-23, trả về 24
            if (fps >= 20 && fps <= 23) {
                adjustedFPS = 24;
            }
            // Nếu FPS là 31-32, trả về 30
            else if (fps >= 31 && fps <= 32) {
                adjustedFPS = 30;
            }
            
            const fpsBadge = document.getElementById('fpsBadge');
            fpsBadge.textContent = `FPS: ${adjustedFPS}`;
            fpsBadge.style.display = 'block';
        }

        // Sự kiện khi tải trang
        document.addEventListener('DOMContentLoaded', () => {
            const videoPlayer = document.getElementById('videoPlayer');
            const hiddenVideo = document.getElementById('hiddenVideo');
            const fpsBadge = document.getElementById('fpsBadge');
            
            // Đảm bảo hiddenVideo luôn được thiết lập đúng
            hiddenVideo.muted = true;
            hiddenVideo.volume = 0;
            hiddenVideo.setAttribute('playsinline', '');
            hiddenVideo.setAttribute('autoplay', '');
            
            // Xử lý sự kiện khi video đã sẵn sàng
            videoPlayer.addEventListener('loadedmetadata', () => {
                cachedFPS = null;
                fpsBadge.style.display = 'none';
                
                // Tự động phát hiện FPS sau khi video tải xong
                setTimeout(() => {
                    autoDetectFPS();
                }, 500); // Đợi thêm 500ms để đảm bảo video đã tải hoàn toàn
            });
            
            // Hàm tự động phát hiện FPS
            async function autoDetectFPS() {
                if (isMeasuring || cachedFPS) {
                    return;
                }
                
                try {
                    const result = await detectVideoFPS(videoPlayer, {
                        frameLimit: 40,  // Cố định 40 frame
                        timeLimit: 2000, // Cố định 2 giây
                        onComplete: (result) => {
                            // Lưu cache
                            cachedFPS = result;
                            
                            // Hiển thị badge FPS
                            showFPSBadge(result.fps);
                        }
                    });
                } catch (err) {
                    fpsBadge.textContent = "FPS: --";
                    fpsBadge.style.display = 'block';
                }
            }
        });
    </script>
</body>
</html>
