![image](https://github.com/user-attachments/assets/c2da3984-50b6-4f7b-8d30-0ca217b4ae77)

```
<div id="toast" class="toast">
    <i class="fas fa-check-circle"></i>
    <span>Đã sao chép!</span>
</div>
```

```
.toast {
    visibility: hidden;
    position: fixed;
    z-index: 1000;
    min-width: 180px;
    max-width: 80%;
    background-color: rgba(50, 50, 50, 0.9);
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    font-size: 14px;
    opacity: 0;
    transition: all 0.3s ease;
    box-shadow: 0 4px 10px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 8px;
    text-align: center;
}

.toast i {
    color: #2ecc71;
    font-size: 16px;
    flex-shrink: 0;
}

.toast.show {
    visibility: visible;
    opacity: 1;
}

/* Vị trí responsive cho toast */
@media (max-width: 480px) {
    .toast {
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
    }
    
    .toast.show {
        bottom: 30px;
    }
}

@media (min-width: 481px) {
    .toast {
        top: 30px;
        left: 50%;
        transform: translateX(-50%);
    }
    
    .toast.show {
        top: 40px;
    }
}
```

```
$(document).ready(function () {
    // Thêm đối tượng Utils
    const Utils = {
        // Sao chép văn bản vào clipboard
        copyToClipboard: async function(text) {
            try {
                if (navigator.clipboard) {
                    await navigator.clipboard.writeText(text);
                    return true;
                } else {
                    // Fallback cho trình duyệt cũ
                    const textarea = document.createElement('textarea');
                    textarea.value = text;
                    textarea.setAttribute('readonly', '');
                    textarea.style.position = 'absolute';
                    textarea.style.left = '-9999px';
                    document.body.appendChild(textarea);
                    textarea.select();
                    const success = document.execCommand('copy');
                    document.body.removeChild(textarea);
                    return success;
                }
            } catch (err) {
                console.error('Copy failed:', err);
                return false;
            }
        },
        
        // Hiển thị thông báo toast
        showToast: function(toastElement, message, duration = 2000) {
            if (!toastElement) return;
            
            // Hủy bất kỳ timeout hiện tại nào
            if (toastElement._toastTimeout) {
                clearTimeout(toastElement._toastTimeout);
            }
            
            // Cập nhật nội dung nếu có message mới
            if (message) {
                // Nếu có span thì cập nhật nội dung span, nếu không, cập nhật toàn bộ
                if (toastElement.querySelector('span')) {
                    toastElement.querySelector('span').textContent = message;
                } else {
                    toastElement.textContent = message;
                }
            }
            
            // Tính toán vị trí của toast dựa trên kích thước màn hình
            const updateToastPosition = () => {
                const viewportWidth = window.innerWidth;
                
                // Đặt vị trí toast dựa vào kích thước màn hình
                if (viewportWidth <= 480) {
                    // Trên màn hình nhỏ, đặt toast ở chính giữa phía dưới
                    toastElement.style.bottom = '20px';
                    toastElement.style.top = 'auto';
                    toastElement.style.left = '50%';
                    toastElement.style.transform = 'translateX(-50%)';
                } else {
                    // Trên màn hình lớn, đặt ở phía trên
                    toastElement.style.top = '40px';
                    toastElement.style.bottom = 'auto';
                    toastElement.style.left = '50%';
                    toastElement.style.transform = 'translateX(-50%)';
                }
            };
            
            // Cập nhật vị trí toast trước khi hiển thị
            updateToastPosition();
            
            // Hiển thị toast
            toastElement.classList.add('show');
            
            // Thiết lập timeout để ẩn toast
            toastElement._toastTimeout = setTimeout(() => {
                toastElement.classList.remove('show');
            }, duration);
        }
    };

    // Code khác giữ nguyên...

    // Cập nhật xử lý nút copy
    $('#copy-btn').on('click', function() {
        const timeInMilliseconds = ($video.currentTime * 1000).toFixed(0);
        
        Utils.copyToClipboard(timeInMilliseconds)
            .then(success => {
                if (success) {
                    Utils.showToast(document.getElementById('toast'), "Đã sao chép!");
                }
            });
    });




```

Toast nhỏ và nằm trên nút bấm
```
.toast {
    visibility: hidden;
    position: fixed;
    z-index: 1000;
    min-width: auto; /* Thu nhỏ theo nội dung */
    max-width: 150px;
    background-color: rgba(50, 50, 50, 0.85);
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 13px;
    opacity: 0;
    transition: all 0.2s ease;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    display: flex;
    align-items: center;
    gap: 6px;
    text-align: center;
    /* Đặt vị trí mặc định */
    bottom: auto;
    top: auto;
    left: auto;
    right: auto;
    transform: none;
}

.toast i {
    color: #2ecc71;
    font-size: 14px;
    flex-shrink: 0;
}

.toast.show {
    visibility: visible;
    opacity: 1;
}
```

```
const updateToastPosition = () => {
    const copyBtn = document.getElementById('copy-btn');
    if (!copyBtn) return;
    
    const rect = copyBtn.getBoundingClientRect();
    
    // Đặt ngay phía trên nút copy
    toastElement.style.bottom = 'auto';
    toastElement.style.top = (rect.top - 30) + 'px';
    toastElement.style.left = (rect.left + rect.width/2) + 'px';
    toastElement.style.transform = 'translateX(-50%)';
};

    // Còn lại của code giữ nguyên...
});
```

![image](https://github.com/user-attachments/assets/58d8e4b9-4379-40fa-8a3b-bba88c0a8138)

```
.progress-bar {
    width: 100%;
    height: 6px;
    background: #e0e0e0;
    border-radius: 3px;
    overflow: hidden;
    cursor: pointer;
    position: relative;
    transition: height 0.2s ease;
}

.progress-bar:hover {
    height: 10px;
}

.progress {
    height: 100%;
    width: 0%;
    background: linear-gradient(90deg, #1e90ff, #ff4500);
    border-radius: 3px;
    position: relative;
    transition: width 0.1s ease-out;
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
```

![image](https://github.com/user-attachments/assets/c88c5d57-e5fa-44a2-a495-66f05c2109e8)

```
.fps-badge {
    position: absolute;
    top: 10px;
    left: 10px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 500;
    z-index: 100;
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 6px;
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.fps-badge i {
    font-size: 12px;
}

/* Animation for FPS badge */
@keyframes fadeInLeft {
    from {
        opacity: 0;
        transform: translateX(-20px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.fps-badge {
    animation: fadeInLeft 0.3s ease-out;
}
```

![image](https://github.com/user-attachments/assets/245f17d8-b806-4031-a76f-b1f027c07b45)


![image](https://github.com/user-attachments/assets/882dc30d-5175-41fe-8002-df7be54c30cb)


```
$(document).ready(function () {
    // Trạng thái ứng dụng
    const state = {
        fps: 0, // Bắt đầu với 0 để phát hiện tự động
        cachedFPS: null,
        isMeasuring: false,
        useDirectMethod: false,
        measuringTimeout: null
    };
    
    // Lấy các DOM elements
    const elements = {
        videoPlayer: document.getElementById('my-player'),
        fpsBadge: document.getElementById('fpsBadge'),
        hiddenVideo: document.getElementById('hiddenVideo')
    };
    
    // Biến đếm số lần thử
    let fpsDetectionRetries = 0;
    const MAX_RETRIES = 3;
    
    // Timeout ID cho quá trình phát hiện
    let retryTimeoutId = null;
    
    // ... (code đã có)
```

![image](https://github.com/user-attachments/assets/9494958d-26af-4510-9dea-756f2999f0d9)

```
/**
 * Phát hiện FPS trực tiếp từ một video element
 */
function detectFPSDirectly(videoElement, options = {}) {
    const defaultOptions = {
        frameLimit: 40,
        timeLimit: 2000,
        onComplete: () => {}
    };
    
    const settings = { ...defaultOptions, ...options };
    
    return new Promise((resolve, reject) => {
        if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) {
            console.log("Trình duyệt không hỗ trợ requestVideoFrameCallback");
            reject(new Error("Trình duyệt không hỗ trợ"));
            return;
        }
        
        // Đảm bảo video có nguồn
        if (!videoElement.currentSrc) {
            reject(new Error("Video không có nguồn"));
            return;
        }
        
        console.log("Bắt đầu đo FPS trực tiếp...");
        
        // Chờ video sẵn sàng (có thể phát) trước khi tiếp tục
        const prepareVideo = () => {
            return new Promise((resolvePrep, rejectPrep) => {
                // Nếu video đã sẵn sàng, tiếp tục ngay
                if (videoElement.readyState >= 3) {
                    console.log("Video đã sẵn sàng để đo FPS");
                    resolvePrep();
                    return;
                }
                
                console.log("Đợi video sẵn sàng để đo FPS...");
                
                // Đặt timeout để tránh chờ quá lâu
                const timeoutId = setTimeout(() => {
                    videoElement.removeEventListener('canplay', readyHandler);
                    // Thử đo ngay cả khi video chưa hoàn toàn sẵn sàng
                    if (videoElement.readyState >= 2) {
                        console.log("Video đủ sẵn sàng để đo FPS (readyState >= 2)");
                        resolvePrep();
                    } else {
                        rejectPrep(new Error("Video không sẵn sàng sau thời gian chờ"));
                    }
                }, 5000);
                
                // Handler khi video sẵn sàng
                const readyHandler = () => {
                    clearTimeout(timeoutId);
                    videoElement.removeEventListener('canplay', readyHandler);
                    console.log("Video đã sẵn sàng (canplay event)");
                    resolvePrep();
                };
                
                // Lắng nghe sự kiện canplay
                videoElement.addEventListener('canplay', readyHandler);
                
                // Nếu video paused, thử phát nó để kích hoạt sự kiện canplay
                if (videoElement.paused && videoElement.readyState < 3) {
                    // Đặt muted để tránh vấn đề autoplay
                    const originalMuted = videoElement.muted;
                    videoElement.muted = true;
                    
                    videoElement.play()
                        .then(() => {
                            console.log("Đã phát video để kích hoạt loading");
                        })
                        .catch(err => {
                            console.error("Không thể phát video để kích hoạt loading:", err);
                            // Vẫn tiếp tục chờ canplay, không reject
                        });
                        
                    // Khôi phục muted sau khi đã kích hoạt loading
                    setTimeout(() => {
                        videoElement.muted = originalMuted;
                    }, 100);
                }
            });
        };
        
        // Thực hiện đo FPS sau khi video đã sẵn sàng
        prepareVideo()
            .then(() => {
                // Lưu trạng thái ban đầu của video
                const wasPlaying = !videoElement.paused;
                const originalTime = videoElement.currentTime;
                const originalMuted = videoElement.muted;
                const originalVolume = videoElement.volume;
                
                // Tắt tiếng trong quá trình đo
                if (state.useDirectMethod) {
                    videoElement.muted = true;
                }
                
                // Biến đo lường
                let frameCount = 0;
                let lastTime = 0;
                let startTime = 0;
                let measurements = [];
                let localIsMeasuring = true;
                state.isMeasuring = true;
                
                // Thiết lập timeout để tránh bị treo
                if (state.measuringTimeout) {
                    clearTimeout(state.measuringTimeout);
                }
                
                state.measuringTimeout = setTimeout(() => {
                    if (state.isMeasuring) {
                        console.log("Timeout khi đo FPS, sử dụng dữ liệu có sẵn");
                        state.isMeasuring = false;
                        localIsMeasuring = false;
                        
                        // Tính kết quả từ dữ liệu có sẵn
                        if (frameCount > 5) {
                            const timeElapsed = lastTime - startTime;
                            const measuredFPS = Math.round((frameCount / (timeElapsed / 1000)));
                            
                            // Tạo kết quả
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
                        
                        // Nếu không đủ frames, sử dụng giá trị FPS mặc định
                        const defaultFPS = 24;
                        console.log(`Không đủ frames để tính FPS, sử dụng giá trị mặc định: ${defaultFPS}`);
                        
                        const result = {
                            fps: defaultFPS,
                            totalFrames: frameCount,
                            duration: 0,
                            measurements: [],
                            default: true
                        };
                        
                        settings.onComplete(result);
                        resolve(result);
                    }
                }, settings.timeLimit + 3000); // Tăng thời gian timeout lên 3s
                
                const cleanup = () => {
                    console.log("Dọn dẹp sau khi đo FPS");
                    state.isMeasuring = false;
                    localIsMeasuring = false;
                    
                    if (state.measuringTimeout) {
                        clearTimeout(state.measuringTimeout);
                        state.measuringTimeout = null;
                    }
                    
                    // Chỉ khôi phục trạng thái cho phương pháp trực tiếp
                    if (state.useDirectMethod) {
                        try {
                            videoElement.currentTime = originalTime;
                            videoElement.muted = originalMuted;
                            videoElement.volume = originalVolume;
                            
                            if (!wasPlaying) {
                                videoElement.pause();
                            }
                        } catch (e) {
                            console.error("Lỗi khi khôi phục trạng thái video:", e);
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
                    
                    // Lưu đo lường
                    measurements.push({
                        frame: frameCount,
                        time: now - startTime,
                        delta: deltaTime
                    });
                    
                    lastTime = now;
                    frameCount++;
                    
                    // Kiểm tra điều kiện dừng
                    const timeElapsed = now - startTime;
                    if (frameCount < settings.frameLimit && timeElapsed < settings.timeLimit && localIsMeasuring) {
                        // Tiếp tục đo
                        videoElement.requestVideoFrameCallback(frameCallback);
                    } else {
                        // Đã đủ số frame hoặc thời gian hoặc bị hủy
                        console.log(`Hoàn thành đo FPS: ${frameCount} frames trong ${timeElapsed}ms`);
                        state.isMeasuring = false;
                        localIsMeasuring = false;
                        
                        if (state.measuringTimeout) {
                            clearTimeout(state.measuringTimeout);
                            state.measuringTimeout = null;
                        }
                        
                        // Tính kết quả cuối cùng
                        const measuredFPS = Math.round((frameCount / (timeElapsed / 1000)));
                        
                        // Tạo kết quả chi tiết
                        const result = {
                            fps: measuredFPS,
                            totalFrames: frameCount,
                            duration: timeElapsed / 1000,
                            measurements: measurements
                        };
                        
                        console.log(`Kết quả FPS: ${result.fps}`);
                        
                        // Thông báo hoàn thành
                        settings.onComplete(result);
                        cleanup();
                        resolve(result);
                    }
                };
                
                // Bắt đầu đo với requestVideoFrameCallback
                console.log("Bắt đầu đo FPS với requestVideoFrameCallback");
                
                // Đảm bảo video đang phát để có thể đo FPS
                if (videoElement.paused) {
                    videoElement.play()
                        .then(() => {
                            videoElement.requestVideoFrameCallback(frameCallback);
                        })
                        .catch(err => {
                            console.error("Lỗi khi phát video để đo FPS:", err);
                            
                            // Fallback: sử dụng giá trị FPS mặc định
                           // Fallback: sử dụng giá trị FPS mặc định
                            const defaultFPS = 24;
                            console.log(`Không thể phát video để đo FPS, sử dụng giá trị mặc định: ${defaultFPS}`);
                            
                            cleanup();
                            
                            const result = {
                                fps: defaultFPS,
                                totalFrames: 0,
                                duration: 0,
                                default: true
                            };
                            
                            settings.onComplete(result);
                            resolve(result);
                        });
                } else {
                    videoElement.requestVideoFrameCallback(frameCallback);
                }
            })
            .catch(err => {
                console.error("Lỗi khi chuẩn bị video để đo FPS:", err);
                
                // Fallback: sử dụng giá trị FPS mặc định
                const defaultFPS = 24;
                console.log(`Sử dụng giá trị FPS mặc định: ${defaultFPS}`);
                
                const result = {
                    fps: defaultFPS,
                    totalFrames: 0,
                    duration: 0,
                    default: true
                };
                
                settings.onComplete(result);
                resolve(result);
            });
    });
}

/**
 * Phát hiện FPS với video ẩn
 */
async function detectVideoFPS(mainVideo, options = {}) {
    try {
        console.log("Bắt đầu phát hiện FPS với video:", mainVideo.currentSrc);
        
        // Xóa timeout retry cũ nếu có
        if (retryTimeoutId) {
            clearTimeout(retryTimeoutId);
            retryTimeoutId = null;
        }
        
        // Đảm bảo video có source
        if (!mainVideo.currentSrc) {
            throw new Error("Video không có nguồn");
        }
        
        // Đảm bảo video ẩn có cùng nguồn với video hiển thị
        if (mainVideo.currentSrc && mainVideo.currentSrc !== elements.hiddenVideo.src) {
            console.log("Thiết lập video ẩn với nguồn:", mainVideo.currentSrc);
            
            // Thiết lập thêm thuộc tính quan trọng cho video ẩn
            elements.hiddenVideo.muted = true;
            elements.hiddenVideo.volume = 0;
            elements.hiddenVideo.crossOrigin = mainVideo.crossOrigin;
            elements.hiddenVideo.setAttribute('playsinline', '');
            elements.hiddenVideo.setAttribute('autoplay', '');
            elements.hiddenVideo.preload = 'auto';
            
            // Tải source cho video ẩn
            elements.hiddenVideo.src = mainVideo.currentSrc;
            
            // Đợi video ẩn tải xong
            await new Promise((resolve, reject) => {
                const timeoutId = setTimeout(() => {
                    elements.hiddenVideo.onloadedmetadata = null;
                    elements.hiddenVideo.onerror = null;
                    reject(new Error("Video ẩn không tải được trong thời gian cho phép"));
                }, 5000); // Tăng timeout lên 5s
                
                elements.hiddenVideo.onloadedmetadata = () => {
                    clearTimeout(timeoutId);
                    console.log("Video ẩn đã tải xong");
                    resolve();
                };
                
                elements.hiddenVideo.onerror = (err) => {
                    clearTimeout(timeoutId);
                    console.error("Lỗi khi tải video ẩn:", err);
                    reject(err);
                };
            });
        }
        
        // Thử đo với video ẩn trước (ít gây gián đoạn)
        state.useDirectMethod = false;
        try {
            console.log("Thử đo FPS với video ẩn");
            const result = await detectFPSDirectly(elements.hiddenVideo, options);
            return result;
        } catch (err) {
            console.log("Fallback to direct method:", err);
            // Fallback sang đo trực tiếp
            state.useDirectMethod = true;
            console.log("Thử đo FPS với video chính");
            return await detectFPSDirectly(mainVideo, options);
        }
    } catch (err) {
        console.error("Lỗi khi phát hiện FPS:", err);
        
        // Fallback: sử dụng giá trị FPS mặc định
        const defaultFPS = 24;
        console.log(`Sử dụng giá trị FPS mặc định: ${defaultFPS}`);
        
        return {
            fps: defaultFPS,
            totalFrames: 0,
            duration: 0,
            default: true
        };
    } finally {
        // Dọn dẹp video ẩn
        cleanupHiddenVideo();
    }
}
```

```
/**
 * Dọn dẹp video ẩn để giải phóng bộ nhớ
 */
function cleanupHiddenVideo() {
    console.log("Dọn dẹp video ẩn");
    if (elements.hiddenVideo) {
        try {
            elements.hiddenVideo.pause();
            elements.hiddenVideo.removeAttribute('src');
            elements.hiddenVideo.load();
            elements.hiddenVideo.onloadedmetadata = null;
            elements.hiddenVideo.onerror = null;
        } catch (e) {
            console.error("Lỗi khi dọn dẹp video ẩn:", e);
        }
    }
}

/**
 * Hiển thị badge FPS
 */
function showFPSBadge(fpsValue) {
    console.log("Hiển thị badge FPS:", fpsValue);
    
    // Điều chỉnh giá trị FPS theo tiêu chuẩn phổ biến
    let adjustedFPS = fpsValue;
    
    // Nếu FPS từ 20-23, trả về 24
    if (fpsValue >= 20 && fpsValue <= 23) {
        adjustedFPS = 24;
    }
    if (fpsValue == 26) {
        adjustedFPS = 25;
    }
    // Nếu FPS từ 31-32, trả về 30
    else if (fpsValue == 29 || (fpsValue >= 31 && fpsValue <= 32)) {
        adjustedFPS = 30;
    }
    
    state.fps = adjustedFPS; // Cập nhật biến FPS 
    
    // Đảm bảo badge đã được tạo
    if (elements.fpsBadge) {
        const span = elements.fpsBadge.querySelector('span');
        if (span) {
            span.textContent = `${adjustedFPS} FPS`;
        } else {
            elements.fpsBadge.textContent = `${adjustedFPS} FPS`;
        }
        elements.fpsBadge.style.display = 'flex';
        
        // Áp dụng animation để hiển thị rõ ràng
        elements.fpsBadge.style.animation = 'none';
        setTimeout(() => {
            elements.fpsBadge.style.animation = 'fadeInLeft 0.3s ease-out';
        }, 10);
    } else {
        console.error("Không tìm thấy badge FPS");
    }
}

/**
 * Tự động phát hiện FPS khi video được tải
 */
async function autoDetectFPS() {
    // Nếu đang đo hoặc đã có FPS, không làm gì cả
    if (state.isMeasuring) {
        console.log("Đang đo FPS, bỏ qua yêu cầu mới");
        return;
    }
    
    // Nếu đã có FPS trong cache, sử dụng luôn
    if (state.cachedFPS) {
        console.log("Sử dụng FPS từ cache:", state.cachedFPS.fps);
        showFPSBadge(state.cachedFPS.fps);
        return;
    }
    
    // Hiển thị badge "đang phát hiện"
    if (elements.fpsBadge) {
        elements.fpsBadge.querySelector('span').textContent = "Đang phát hiện...";
        elements.fpsBadge.style.display = 'flex';
    }
    
    fpsDetectionRetries = 0;
    tryDetectFPS();
}

/**
 * Thử phát hiện FPS với cơ chế retry
 */
async function tryDetectFPS() {
    console.log(`Thử phát hiện FPS (lần ${fpsDetectionRetries + 1}/${MAX_RETRIES + 1})`);
    
    try {
        // Đảm bảo video có source
        if (!elements.videoPlayer.currentSrc) {
            console.error("Video không có nguồn, không thể phát hiện FPS");
            throw new Error("Video không có nguồn");
        }
        
        // Sử dụng hàm phát hiện FPS
        const result = await detectVideoFPS(elements.videoPlayer, {
            frameLimit: 40,
            timeLimit: 2000,
            onComplete: (result) => {
                // Lưu kết quả vào cache
                state.cachedFPS = result;
                
                // Hiển thị badge FPS
                showFPSBadge(result.fps);
            }
        });
        
        console.log("Phát hiện FPS thành công:", result.fps);
    } catch (err) {
        console.error("Lỗi phát hiện FPS:", err);
        
        // Thử lại nếu chưa đạt số lần thử tối đa
        if (fpsDetectionRetries < MAX_RETRIES) {
            fpsDetectionRetries++;
            console.log(`Đang thử lại lần ${fpsDetectionRetries}...`);
            
            // Xóa timeout cũ nếu có
            if (retryTimeoutId) {
                clearTimeout(retryTimeoutId);
            }
            
            // Thử lại sau 1 giây
            retryTimeoutId = setTimeout(() => {
                retryTimeoutId = null;
                tryDetectFPS();
            }, 1000);
        } else {
            // Nếu đã thử quá số lần, sử dụng giá trị mặc định
            console.log("Đã thử tối đa số lần, sử dụng FPS mặc định (24)");
            if (elements.fpsBadge && elements.fpsBadge.querySelector('span')) {
                elements.fpsBadge.querySelector('span').textContent = "24 FPS";
                elements.fpsBadge.style.display = 'flex';
            }
            state.fps = 24; // Sử dụng FPS mặc định nếu không đo được
            state.cachedFPS = { fps: 24 }; // Lưu vào cache để không phải đo lại
        }
    }
}
```

![image](https://github.com/user-attachments/assets/8688162c-5389-4644-bf0e-5b030e5050bf)

```
// Kích hoạt phát hiện FPS khi video đã tải
$(elements.videoPlayer).on('loadedmetadata', function() {
    console.log('Video đã tải metadata, phát hiện FPS...');
    autoDetectFPS();
});

// Đảm bảo phát hiện FPS khi video đã sẵn sàng phát
$(elements.videoPlayer).on('canplay', function() {
    // Chỉ kích hoạt nếu chưa có FPS trong cache
    if (!state.cachedFPS && !state.isMeasuring) {
        console.log('Video có thể phát, phát hiện FPS nếu chưa có...');
        autoDetectFPS();
    }
});

// Xử lý lỗi video
$(elements.videoPlayer).on('error', function(e) {
    console.error('Lỗi video:', e);
    if (elements.fpsBadge && elements.fpsBadge.querySelector('span')) {
        elements.fpsBadge.querySelector('span').textContent = "Lỗi video";
        elements.fpsBadge.style.display = 'flex';
    }
    
    // Dọn dẹp tài nguyên
    state.cachedFPS = null;
    cleanupHiddenVideo();
});
```

![image](https://github.com/user-attachments/assets/f639922d-accf-4192-9b40-2afb12296760)


```
function seekToFrame(frameOffset) {
    // Sử dụng FPS đã phát hiện, hoặc giá trị mặc định nếu chưa phát hiện
    const currentFPS = state.fps || fps || 24;
    
    if (currentFPS <= 0) return;
    
    // Tạm dừng video nếu đang phát
    if (!$video.paused) {
        $video.pause();
    }
    
    // Đánh dấu đang cập nhật UI để tránh vòng lặp
    updatingUI = true;
    
    // Tính toán khung hình hiện tại chính xác hơn
    const currentTime = $video.currentTime;
    const frameDuration = 1 / currentFPS;
    const currentFrame = Math.round(currentTime / frameDuration);
    const targetFrame = currentFrame + frameOffset;
    const newTime = targetFrame * frameDuration;
    
    // Đảm bảo thời gian nằm trong phạm vi video
    const boundedTime = Math.max(0, Math.min(newTime, $video.duration));
    
    console.log(`Tua đến khung hình: ${targetFrame} (${boundedTime}s) với FPS = ${currentFPS}`);
    
    // Áp dụng thời gian mới
    $video.currentTime = boundedTime;
    
    // Cập nhật hiển thị
    const timeInMilliseconds = (boundedTime * 1000).toFixed(0);
    $('#timecode').val(timeInMilliseconds);
    
    // Cập nhật thanh tiến trình
    Utils.updateProgressBar($video, document.getElementById('progressbar'));
    
    // Cập nhật wavesurfer
     if (wavesurfer) {
        setTimeout(() => {
            try {
                const progress = boundedTime / $video.duration;
                wavesurfer.seekTo(progress);
                
                setTimeout(() => { 
                    updatingUI = false;
                }, UPDATE_DELAY);
            } catch (e) {
                console.error("Lỗi khi cập nhật wavesurfer:", e);
                updatingUI = false;
            }
        }, 10);
    } else {
        // Kết thúc cập nhật UI sau một thời gian ngắn
        setTimeout(() => { updatingUI = false; }, UPDATE_DELAY);
    }
}
```

![image](https://github.com/user-attachments/assets/67aa6d10-e219-4e44-b3aa-992f6dfe740b)

```
$(window).on('beforeunload', function() {
    if (wavesurfer) {
        wavesurfer.destroy();
    }
    
    cleanupHiddenVideo();
    
    if (state.measuringTimeout) {
        clearTimeout(state.measuringTimeout);
    }
});
```

![image](https://github.com/user-attachments/assets/a824f590-90b0-4ea0-b4cd-7f611bf704bf)

```
// Khởi tạo phát hiện FPS khi trang đã tải
if (elements.videoPlayer.readyState >= 2) {
    console.log('Video đã được tải, phát hiện FPS...');
    autoDetectFPS();
} else {
    console.log('Đợi video tải xong trước khi phát hiện FPS...');
    
    // Thêm một timeout để đảm bảo phát hiện FPS sau khi trang đã tải hoàn tất
    setTimeout(function() {
        if (!state.cachedFPS && !state.isMeasuring) {
            console.log('Timeout đã hết, kiểm tra lại việc phát hiện FPS...');
            autoDetectFPS();
        }
    }, 3000);
}

// Hỗ trợ thiết bị di động
$(document).on('touchstart', function() {
    if (elements.fpsBadge && elements.fpsBadge.style.display === 'none') {
        // Thử phát hiện FPS nếu chưa hiển thị
        if (!state.cachedFPS && !state.isMeasuring) {
            autoDetectFPS();
        }
    }
}, {once: true});
```

![image](https://github.com/user-attachments/assets/74f9cc93-81af-48c1-8a21-1c6128b93dc2)


## Tách file riêng để tính fps

```
/**
 * Module phát hiện FPS của video
 */

/**
 * Thiết lập chức năng phát hiện FPS
 * @param {HTMLVideoElement} videoPlayer Video chính
 * @param {HTMLVideoElement} hiddenVideo Video ẩn để đo FPS
 * @param {HTMLElement} fpsBadge Badge hiển thị FPS
 * @param {Object} state Trạng thái chung của ứng dụng
 * @returns {Object} Các phương thức phát hiện FPS
 */
function setupFpsDetection(videoPlayer, hiddenVideo, fpsBadge, state) {
    // Biến đếm số lần thử
    let fpsDetectionRetries = 0;
    const MAX_RETRIES = 3;
    
    // Timeout ID cho quá trình phát hiện
    let retryTimeoutId = null;
    
    /**
     * Phát hiện FPS trực tiếp từ một video element
     * @param {HTMLVideoElement} videoElement Element video cần đo
     * @param {Object} options Tùy chọn đo
     * @returns {Promise} Promise kết quả đo
     */
    function detectFPSDirectly(videoElement, options = {}) {
        const defaultOptions = {
            frameLimit: 40,
            timeLimit: 2000,
            onComplete: () => {}
        };
        
        const settings = { ...defaultOptions, ...options };
        
        return new Promise((resolve, reject) => {
            if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) {
                reject(new Error("Trình duyệt không hỗ trợ"));
                return;
            }
            
            // Đảm bảo video có nguồn
            if (!videoElement.currentSrc) {
                reject(new Error("Video không có nguồn"));
                return;
            }
            
            console.log("Bắt đầu đo FPS trực tiếp...");
            
            // Chờ video sẵn sàng (có thể phát) trước khi tiếp tục
            const prepareVideo = () => {
                return new Promise((resolvePrep, rejectPrep) => {
                    // Nếu video đã sẵn sàng, tiếp tục ngay
                    if (videoElement.readyState >= 3) {
                        console.log("Video đã sẵn sàng để đo FPS");
                        resolvePrep();
                        return;
                    }
                    
                    console.log("Đợi video sẵn sàng để đo FPS...");
                    
                    // Đặt timeout để tránh chờ quá lâu
                    const timeoutId = setTimeout(() => {
                        videoElement.removeEventListener('canplay', readyHandler);
                        // Thử đo ngay cả khi video chưa hoàn toàn sẵn sàng
                        if (videoElement.readyState >= 2) {
                            console.log("Video đủ sẵn sàng để đo FPS (readyState >= 2)");
                            resolvePrep();
                        } else {
                            rejectPrep(new Error("Video không sẵn sàng sau thời gian chờ"));
                        }
                    }, 5000);
                    
                    // Handler khi video sẵn sàng
                    const readyHandler = () => {
                        clearTimeout(timeoutId);
                        videoElement.removeEventListener('canplay', readyHandler);
                        console.log("Video đã sẵn sàng (canplay event)");
                        resolvePrep();
                    };
                    
                    // Lắng nghe sự kiện canplay
                    videoElement.addEventListener('canplay', readyHandler);
                    
                    // Nếu video paused, thử phát nó để kích hoạt sự kiện canplay
                    if (videoElement.paused && videoElement.readyState < 3) {
                        // Đặt muted để tránh vấn đề autoplay
                        const originalMuted = videoElement.muted;
                        videoElement.muted = true;
                        
                        videoElement.play()
                            .then(() => {
                                console.log("Đã phát video để kích hoạt loading");
                            })
                            .catch(err => {
                                console.error("Không thể phát video để kích hoạt loading:", err);
                                // Vẫn tiếp tục chờ canplay, không reject
                            });
                            
                        // Khôi phục muted sau khi đã kích hoạt loading
                        setTimeout(() => {
                            videoElement.muted = originalMuted;
                        }, 100);
                    }
                });
            };
            
            // Thực hiện đo FPS sau khi video đã sẵn sàng
            prepareVideo()
                .then(() => {
                    // Lưu trạng thái ban đầu của video
                    const wasPlaying = !videoElement.paused;
                    const originalTime = videoElement.currentTime;
                    const originalMuted = videoElement.muted;
                    const originalVolume = videoElement.volume;
                    
                    // Tắt tiếng trong quá trình đo
                    if (state.useDirectMethod) {
                        videoElement.muted = true;
                    }
                    
                    // Biến đo lường
                    let frameCount = 0;
                    let lastTime = 0;
                    let startTime = 0;
                    let measurements = [];
                    let localIsMeasuring = true;
                    state.isMeasuring = true;
                    
                    // Thiết lập timeout để tránh bị treo
                    if (state.measuringTimeout) {
                        clearTimeout(state.measuringTimeout);
                    }
                    
                    state.measuringTimeout = setTimeout(() => {
                        if (state.isMeasuring) {
                            console.log("Timeout khi đo FPS, sử dụng dữ liệu có sẵn");
                            state.isMeasuring = false;
                            localIsMeasuring = false;
                            
                            // Tính kết quả từ dữ liệu có sẵn
                            if (frameCount > 5) {
                                const timeElapsed = lastTime - startTime;
                                const measuredFPS = Math.round((frameCount / (timeElapsed / 1000)));
                                
                                // Tạo kết quả
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
                            
                            // Nếu không đủ frames, sử dụng giá trị FPS mặc định
                            const defaultFPS = 24;
                            console.log(`Không đủ frames để tính FPS, sử dụng giá trị mặc định: ${defaultFPS}`);
                            
                            const result = {
                                fps: defaultFPS,
                                totalFrames: frameCount,
                                duration: 0,
                                measurements: [],
                                default: true
                            };
                            
                            settings.onComplete(result);
                            resolve(result);
                        }
                    }, settings.timeLimit + 3000); // Tăng thời gian timeout lên 3s
                    
                    const cleanup = () => {
                        console.log("Dọn dẹp sau khi đo FPS");
                        state.isMeasuring = false;
                        localIsMeasuring = false;
                        
                        if (state.measuringTimeout) {
                            clearTimeout(state.measuringTimeout);
                            state.measuringTimeout = null;
                        }
                        
                        // Chỉ khôi phục trạng thái cho phương pháp trực tiếp
                        if (state.useDirectMethod) {
                            try {
                                videoElement.currentTime = originalTime;
                                videoElement.muted = originalMuted;
                                videoElement.volume = originalVolume;
                                
                                if (!wasPlaying) {
                                    videoElement.pause();
                                }
                            } catch (e) {
                                console.error("Lỗi khi khôi phục trạng thái video:", e);
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
                        
                        // Lưu đo lường
                        measurements.push({
                            frame: frameCount,
                            time: now - startTime,
                            delta: deltaTime
                        });
                        
                        lastTime = now;
                        frameCount++;
                        
                        // Kiểm tra điều kiện dừng
                        const timeElapsed = now - startTime;
                        if (frameCount < settings.frameLimit && timeElapsed < settings.timeLimit && localIsMeasuring) {
                            // Tiếp tục đo
                            videoElement.requestVideoFrameCallback(frameCallback);
                        } else {
                            // Đã đủ số frame hoặc thời gian hoặc bị hủy
                            console.log(`Hoàn thành đo FPS: ${frameCount} frames trong ${timeElapsed}ms`);
                            state.isMeasuring = false;
                            localIsMeasuring = false;
                            
                            if (state.measuringTimeout) {
                                clearTimeout(state.measuringTimeout);
                                state.measuringTimeout = null;
                            }
                            
                            // Tính kết quả cuối cùng
                            const measuredFPS = Math.round((frameCount / (timeElapsed / 1000)));
                            
                            // Tạo kết quả chi tiết
                            const result = {
                                fps: measuredFPS,
                                totalFrames: frameCount,
                                duration: timeElapsed / 1000,
                                measurements: measurements
                            };
                            
                            console.log(`Kết quả FPS: ${result.fps}`);
                            
                            // Thông báo hoàn thành
                            settings.onComplete(result);
                            cleanup();
                            resolve(result);
                        }
                    };
                    
                    // Bắt đầu đo với requestVideoFrameCallback
                    console.log("Bắt đầu đo FPS với requestVideoFrameCallback");
                    
                    // Đảm bảo video đang phát để có thể đo FPS
                    if (videoElement.paused) {
                        videoElement.play()
                            .then(() => {
                                videoElement.requestVideoFrameCallback(frameCallback);
                            })
                            .catch(err => {
                                console.error("Lỗi khi phát video để đo FPS:", err);
                                
                                // Fallback: sử dụng giá trị FPS mặc định
                                const defaultFPS = 24;
                                console.log(`Không thể phát video để đo FPS, sử dụng giá trị mặc định: ${defaultFPS}`);
                                
                                cleanup();
                                
                                const result = {
                                    fps: defaultFPS,
                                    totalFrames: 0,
                                    duration: 0,
                                    default: true
                                };
                                
                                settings.onComplete(result);
                                resolve(result);
                            });
                    } else {
                        videoElement.requestVideoFrameCallback(frameCallback);
                    }
                })
                .catch(err => {
                    console.error("Lỗi khi chuẩn bị video để đo FPS:", err);
                    
                    // Fallback: sử dụng giá trị FPS mặc định
                    const defaultFPS = 24;
                    console.log(`Sử dụng giá trị FPS mặc định: ${defaultFPS}`);
                    
                    const result = {
                        fps: defaultFPS,
                        totalFrames: 0,
                        duration: 0,
                        default: true
                    };
                    
                    settings.onComplete(result);
                    resolve(result);
                });
        });
    }
    
    /**
     * Phát hiện FPS với video ẩn
     * @param {HTMLVideoElement} mainVideo Video chính
     * @param {Object} options Tùy chọn đo
     * @returns {Promise} Promise kết quả đo
     */
    async function detectVideoFPS(mainVideo, options = {}) {
        try {
            console.log("Bắt đầu phát hiện FPS với video:", mainVideo.currentSrc);
            
            // Xóa timeout retry cũ nếu có
            if (retryTimeoutId) {
                clearTimeout(retryTimeoutId);
                retryTimeoutId = null;
            }
            
            // Đảm bảo video có source
            if (!mainVideo.currentSrc) {
                throw new Error("Video không có nguồn");
            }
            
            // Đảm bảo video ẩn có cùng nguồn với video hiển thị
            if (mainVideo.currentSrc && mainVideo.currentSrc !== hiddenVideo.src) {
                console.log("Thiết lập video ẩn với nguồn:", mainVideo.currentSrc);
                
                // Thiết lập thêm thuộc tính quan trọng cho video ẩn
                hiddenVideo.muted = true;
                hiddenVideo.volume = 0;
                hiddenVideo.crossOrigin = mainVideo.crossOrigin;
                hiddenVideo.setAttribute('playsinline', '');
                hiddenVideo.setAttribute('autoplay', '');
                hiddenVideo.preload = 'auto';
                
                // Tải source cho video ẩn
                hiddenVideo.src = mainVideo.currentSrc;
                
                // Đợi video ẩn tải xong
                await new Promise((resolve, reject) => {
                    const timeoutId = setTimeout(() => {
                        hiddenVideo.onloadedmetadata = null;
                        hiddenVideo.onerror = null;
                        reject(new Error("Video ẩn không tải được trong thời gian cho phép"));
                    }, 5000); // Tăng timeout lên 5s
                    
                    hiddenVideo.onloadedmetadata = () => {
                        clearTimeout(timeoutId);
                        console.log("Video ẩn đã tải xong");
                        resolve();
                    };
                    
                    hiddenVideo.onerror = (err) => {
                        clearTimeout(timeoutId);
                        console.error("Lỗi khi tải video ẩn:", err);
                        reject(err);
                    };
                });
            }
            
            // Thử đo với video ẩn trước (ít gây gián đoạn)
            state.useDirectMethod = false;
            try {
                console.log("Thử đo FPS với video ẩn");
                const result = await detectFPSDirectly(hiddenVideo, options);
                return result;
            } catch (err) {
                console.log("Fallback to direct method:", err);
                // Fallback sang đo trực tiếp
                state.useDirectMethod = true;
                console.log("Thử đo FPS với video chính");
                return await detectFPSDirectly(mainVideo, options);
            }
        } catch (err) {
            console.error("Lỗi khi phát hiện FPS:", err);
            
            // Fallback: sử dụng giá trị FPS mặc định
            const defaultFPS = 24;
            console.log(`Sử dụng giá trị FPS mặc định: ${defaultFPS}`);
            
            return {
                fps: defaultFPS,
                totalFrames: 0,
                duration: 0,
                default: true
            };
        } finally {
            // Dọn dẹp video ẩn
            cleanupHiddenVideo();
        }
    }
    
    /**
     * Dọn dẹp video ẩn để giải phóng bộ nhớ
     */
    function cleanupHiddenVideo() {
        console.log("Dọn dẹp video ẩn");
        if (hiddenVideo) {
            try {
                hiddenVideo.pause();
                hiddenVideo.removeAttribute('src');
                hiddenVideo.load();
                hiddenVideo.onloadedmetadata = null;
                hiddenVideo.onerror = null;
            } catch (e) {
                console.error("Lỗi khi dọn dẹp video ẩn:", e);
            }
        }
    }
    
    /**
     * Hiển thị badge FPS
     * @param {number} fpsValue Giá trị FPS
     */
    function showFPSBadge(fpsValue) {
        console.log("Hiển thị badge FPS:", fpsValue);
        
        // Điều chỉnh giá trị FPS theo tiêu chuẩn phổ biến
        let adjustedFPS = fpsValue;
        
        // Nếu FPS từ 20-23, trả về 24
        if (fpsValue >= 20 && fpsValue <= 23) {
            adjustedFPS = 24;
        }
        if (fpsValue == 26) {
            adjustedFPS = 25;
        }
        // Nếu FPS từ 31-32, trả về 30
        else if (fpsValue == 29 || (fpsValue >= 31 && fpsValue <= 32)) {
            adjustedFPS = 30;
        }
        
        state.fps = adjustedFPS; // Cập nhật biến FPS toàn cục
        
        // Đảm bảo badge đã được tạo
        if (fpsBadge) {
            const span = fpsBadge.querySelector('span');
            if (span) {
                span.textContent = `${adjustedFPS} FPS`;
            } else {
                fpsBadge.textContent = `${adjustedFPS} FPS`;
            }
            fpsBadge.style.display = 'flex';
            
            // Áp dụng animation để hiển thị rõ ràng
            fpsBadge.style.animation = 'none';
            setTimeout(() => {
                fpsBadge.style.animation = 'fadeInLeft 0.3s ease-out';
            }, 10);
        } else {
            console.error("Không tìm thấy badge FPS");
        }
    }

    /**
     * Tự động phát hiện FPS khi video được tải
     */
    async function autoDetectFPS() {
        // Nếu đang đo hoặc đã có FPS, không làm gì cả
        if (state.isMeasuring) {
            console.log("Đang đo FPS, bỏ qua yêu cầu mới");
            return;
        }
        
        // Nếu đã có FPS trong cache, sử dụng luôn
        if (state.cachedFPS) {
            console.log("Sử dụng FPS từ cache:", state.cachedFPS.fps);
            showFPSBadge(state.cachedFPS.fps);
            return;
        }
        
        // Hiển thị badge "đang phát hiện"
        if (fpsBadge) {
            fpsBadge.querySelector('span').textContent = "Đang phát hiện...";
            fpsBadge.style.display = 'flex';
        }
        
        fpsDetectionRetries = 0;
        tryDetectFPS();
    }
    
    /**
     * Thử phát hiện FPS với cơ chế retry
     */
    async function tryDetectFPS() {
        console.log(`Thử phát hiện FPS (lần ${fpsDetectionRetries + 1}/${MAX_RETRIES + 1})`);
        
        try {
            // Đảm bảo video có source
            if (!videoPlayer.currentSrc) {
                console.error("Video không có nguồn, không thể phát hiện FPS");
                throw new Error("Video không có nguồn");
            }
            
            // Sử dụng hàm phát hiện FPS
            const result = await detectVideoFPS(videoPlayer, {
                frameLimit: 40,
                timeLimit: 2000,
                onComplete: (result) => {
                    // Lưu kết quả vào cache
                    state.cachedFPS = result;
                    
                    // Hiển thị badge FPS
                    showFPSBadge(result.fps);
                }
            });
            
            console.log("Phát hiện FPS thành công:", result.fps);
        } catch (err) {
            console.error("Lỗi phát hiện FPS:", err);
            
            // Thử lại nếu chưa đạt số lần thử tối đa
            if (fpsDetectionRetries < MAX_RETRIES) {
                fpsDetectionRetries++;
                console.log(`Đang thử lại lần ${fpsDetectionRetries}...`);
                
                // Xóa timeout cũ nếu có
                if (retryTimeoutId) {
                    clearTimeout(retryTimeoutId);
                }
                
                // Thử lại sau 1 giây
                retryTimeoutId = setTimeout(() => {
                    retryTimeoutId = null;
                    tryDetectFPS();
                }, 1000);
            } else {
                // Nếu đã thử quá số lần, sử dụng giá trị mặc định
                console.log("Đã thử tối đa số lần, sử dụng FPS mặc định (24)");
                if (fpsBadge && fpsBadge.querySelector('span')) {
                    fpsBadge.querySelector('span').textContent = "24 FPS";
                    fpsBadge.style.display = 'flex';
                }
                state.fps = 24; // Sử dụng FPS mặc định nếu không đo được
                state.cachedFPS = { fps: 24 }; // Lưu vào cache để không phải đo lại
            }
        }
    }
    
    // Trả về các phương thức công khai
    return {
        detectFPSDirectly,
        detectVideoFPS,
        cleanupHiddenVideo,
        showFPSBadge,
        autoDetectFPS
    };
}

// Xuất module
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setupFpsDetection };
} else {
    // Trong trình duyệt, thêm vào global scope
    window.setupFpsDetection = setupFpsDetection;
}
```

![image](https://github.com/user-attachments/assets/c5036712-f661-444e-a1f1-dd801dc39102)


```
<!-- Thư viện -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.6.0/jquery.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/wavesurfer.js/2.2.1/wavesurfer.min.js"></script>
<script src="https://unpkg.com/mediainfo.js"></script>

<!-- Module phát hiện FPS -->
<script src="fps-detector.js"></script>

<!-- Script chính -->
<script>
    $(document).ready(function () {
        // Code chính ở đây
    });
</script>
```


![image](https://github.com/user-attachments/assets/fa8fdb71-d4d2-4113-bd61-7c65af1aeb91)


```
$(document).ready(function () {
    // Trạng thái ứng dụng
    const state = {
        fps: 0, // Bắt đầu với 0 để phát hiện tự động
        cachedFPS: null,
        isMeasuring: false,
        useDirectMethod: false,
        measuringTimeout: null
    };
    
    // Lấy các DOM elements
    const elements = {
        videoPlayer: document.getElementById('my-player'),
        fpsBadge: document.getElementById('fpsBadge'),
        hiddenVideo: document.getElementById('hiddenVideo')
    };
    
    // Tạo đối tượng Utils nếu chưa có
    const Utils = {
        // ... các hàm Utils khác ...
        
        // Cập nhật thanh tiến trình
        updateProgressBar: function(videoPlayer, progressBar) {
            if (videoPlayer.duration) {
                const progressPercent = (videoPlayer.currentTime / videoPlayer.duration) * 100;
                progressBar.style.width = progressPercent + '%';
            }
        }
    };
    
    // Khởi tạo module phát hiện FPS
    const fpsDetector = setupFpsDetection(
        elements.videoPlayer,
        elements.hiddenVideo,
        elements.fpsBadge,
        state
    );
    
    // Kích hoạt phát hiện FPS khi video đã tải
    $(elements.videoPlayer).on('loadedmetadata', function() {
        console.log('Video đã tải metadata, phát hiện FPS...');
        fpsDetector.autoDetectFPS();
    });

    // Đảm bảo phát hiện FPS khi video đã sẵn sàng phát
    $(elements.videoPlayer).on('canplay', function() {
        // Chỉ kích hoạt nếu chưa có FPS trong cache
        if (!state.cachedFPS && !state.isMeasuring) {
            console.log('Video có thể phát, phát hiện FPS nếu chưa có...');
            fpsDetector.autoDetectFPS();
        }
    });

    // Xử lý lỗi video
    $(elements.videoPlayer).on('error', function(e) {
        console.error('Lỗi video:', e);
        if (elements.fpsBadge && elements.fpsBadge.querySelector('span')) {
            elements.fpsBadge.querySelector('span').textContent = "Lỗi video";
            elements.fpsBadge.style.display = 'flex';
        }
        
        // Dọn dẹp tài nguyên
        state.cachedFPS = null;
        fpsDetector.cleanupHiddenVideo();
    });
    
    // Sửa đổi hàm seekToFrame để sử dụng FPS đã phát hiện
    function seekToFrame(frameOffset) {
        // Sử dụng FPS đã phát hiện, hoặc giá trị mặc định nếu chưa phát hiện
        const currentFPS = state.fps || fps || 24;
        
        if (currentFPS <= 0) return;
        
        // ... phần còn lại của hàm seekToFrame giữ nguyên ...
    }
    
    // Dọn dẹp tài nguyên khi trang được đóng
    $(window).on('beforeunload', function() {
        if (wavesurfer) {
            wavesurfer.destroy();
        }
        
        fpsDetector.cleanupHiddenVideo();
        
        if (state.measuringTimeout) {
            clearTimeout(state.measuringTimeout);
        }
    });
    
    // Khởi tạo phát hiện FPS khi trang đã tải
    if (elements.videoPlayer.readyState >= 2) {
        console.log('Video đã được tải, phát hiện FPS...');
        fpsDetector.autoDetectFPS();
    } else {
        // Thêm một timeout để đảm bảo phát hiện FPS sau khi trang đã tải hoàn tất
        setTimeout(function() {
            if (!state.cachedFPS && !state.isMeasuring) {
                console.log('Timeout đã hết, kiểm tra lại việc phát hiện FPS...');
                fpsDetector.autoDetectFPS();
            }
        }, 3000);
    }
    
    // ... còn lại của code ...
});
```








