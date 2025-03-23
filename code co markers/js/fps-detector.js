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
export function setupFpsDetection(videoPlayer, hiddenVideo, fpsBadge, state) {
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
        else if (fpsValue ==29 || fpsValue >= 31 && fpsValue <= 32) {
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
                fpsBadge.style.animation = 'fadeInRight 0.3s ease-out';
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