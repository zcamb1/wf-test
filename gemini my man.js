Chắc chắn rồi, đây là phiên bản đầy đủ của code module setupFpsDetection đã được cập nhật để xử lý tốt hơn các điều kiện mạng yếu và dao động FPS, với giá trị fallback là 30 FPS khi kết quả đo không đáng tin cậy:

/**
 * Module phát hiện FPS của video
 */

/**
 * Thiết lập chức năng phát hiện FPS
 * @param {HTMLVideoElement} videoPlayer Video chính
 * @param {HTMLVideoElement} hiddenVideo Video ẩn để đo FPS
 * @param {HTMLElement} fpsBadge Badge hiển thị FPS
 * @param {Object} state Trạng thái chung của ứng dụng (cần có isMeasuring, measuringTimeout, cachedFPS, fps, useDirectMethod)
 * @returns {Object} Các phương thức phát hiện FPS
 */
export function setupFpsDetection(videoPlayer, hiddenVideo, fpsBadge, state) {
    // --- Cấu hình đo lường ---
    const MAX_RETRIES = 3;              // Số lần thử lại tối đa nếu đo lỗi
    const DEFAULT_FRAME_LIMIT = 40;     // Số frame mục tiêu cần đo
    const DEFAULT_TIME_LIMIT = 7000;    // Thời gian đo tối đa (ms) - Tăng lên 7 giây
    const WARMUP_FRAMES = 5;            // Số frame đầu tiên bỏ qua (khởi động)
    const MIN_RELIABLE_FRAMES = 15;     // Số frame tối thiểu để kết quả đáng tin cậy
    const FALLBACK_FPS = 30;            // FPS mặc định khi đo không thành công hoặc không đáng tin cậy
    const LARGE_DELTA_THRESHOLD = 1000; // Ngưỡng (ms) để phát hiện khoảng dừng lớn giữa các frame

    let fpsDetectionRetries = 0;
    let retryTimeoutId = null;

    // --- Hàm phụ trợ ---

    /**
     * Làm tròn/điều chỉnh FPS về các giá trị chuẩn
     * @param {number} fpsValue Giá trị FPS đo được
     * @returns {number} FPS đã điều chỉnh
     */
    function getAdjustedFPS(fpsValue) {
        // Làm tròn đến số nguyên gần nhất trước khi áp dụng quy tắc
        const roundedFps = Math.round(fpsValue);

        // Logic điều chỉnh cũ (có thể tùy chỉnh thêm nếu muốn)
        if (roundedFps >= 20 && roundedFps <= 23) return 24;
        if (roundedFps === 26) return 25;
        if (roundedFps === 29 || (roundedFps >= 31 && roundedFps <= 32)) return 30;
        // Thêm các quy tắc khác nếu cần (ví dụ: cho 50, 60 FPS)
        if (roundedFps >= 58 && roundedFps <= 62) return 60;
        if (roundedFps >= 48 && roundedFps <= 52) return 50;

        // Nếu không khớp quy tắc nào, trả về giá trị đã làm tròn
        return roundedFps;
    }

    /**
     * Hiển thị badge FPS, có thể kèm dấu hiệu không chắc chắn
     * @param {number} fpsValue Giá trị FPS để hiển thị
     * @param {boolean} isEstimate True nếu kết quả không đáng tin cậy/là fallback
     */
    function showFPSBadge(fpsValue, isEstimate = false) {
        const adjustedFPS = getAdjustedFPS(fpsValue); // Áp dụng logic làm tròn/điều chỉnh
        console.log(`Hiển thị badge: ${adjustedFPS} FPS ${isEstimate ? '(ước tính)' : ''}`);
        state.fps = adjustedFPS; // Cập nhật state toàn cục

        if (fpsBadge) {
            try {
                const span = fpsBadge.querySelector('span');
                const text = `${adjustedFPS} FPS${isEstimate ? '*' : ''}`;
                if (span) {
                    span.textContent = text;
                } else {
                    fpsBadge.textContent = text;
                }
                fpsBadge.style.display = 'flex';
                fpsBadge.style.opacity = '1'; // Đảm bảo hiển thị

                // Animation (tùy chọn)
                fpsBadge.style.animation = 'none';
                requestAnimationFrame(() => {
                    setTimeout(() => {
                         fpsBadge.style.animation = 'fadeInRight 0.3s ease-out';
                    }, 10);
                });

            } catch (e) {
                console.error("Lỗi khi cập nhật badge FPS:", e);
            }
        } else {
            console.warn("Không tìm thấy phần tử badge FPS.");
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
                // Quan trọng: Gỡ bỏ event listener để tránh memory leak
                hiddenVideo.onloadedmetadata = null;
                hiddenVideo.onerror = null;
                hiddenVideo.oncanplay = null; // Gỡ thêm listener nếu có
                hiddenVideo.removeAttribute('src'); // Xóa source
                hiddenVideo.load(); // Buộc trình duyệt giải phóng tài nguyên
            } catch (e) {
                console.error("Lỗi khi dọn dẹp video ẩn:", e);
            }
        }
    }

    // --- Hàm đo lường chính ---

    /**
     * Phát hiện FPS trực tiếp từ một video element
     * @param {HTMLVideoElement} videoElement Element video cần đo
     * @param {Object} options Tùy chọn đo
     * @returns {Promise<Object>} Promise chứa kết quả đo { fps, totalFrames, duration, reliable, reason, measurements, ... }
     */
    function detectFPSDirectly(videoElement, options = {}) {
        const defaultOptions = {
            frameLimit: DEFAULT_FRAME_LIMIT,
            timeLimit: DEFAULT_TIME_LIMIT,
            onComplete: () => {}
        };
        const settings = { ...defaultOptions, ...options };

        return new Promise((resolve) => { // Không cần reject, sẽ resolve với kết quả default/fallback
            if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) {
                console.warn("Trình duyệt không hỗ trợ requestVideoFrameCallback.");
                resolve({ fps: FALLBACK_FPS, reliable: false, reason: 'unsupported_api', default: true });
                return;
            }

            if (!videoElement || !videoElement.currentSrc) {
                console.warn("Video không có nguồn hoặc không hợp lệ.");
                resolve({ fps: FALLBACK_FPS, reliable: false, reason: 'no_source', default: true });
                return;
            }

            console.log(`Bắt đầu đo FPS trực tiếp trên ${state.useDirectMethod ? 'video chính' : 'video ẩn'}... (Limit: ${settings.frameLimit} frames / ${settings.timeLimit}ms)`);

            const prepareVideo = () => new Promise((resolvePrep, rejectPrep) => {
                if (videoElement.readyState >= 3) { // HAVE_FUTURE_DATA
                    console.log("Video đã sẵn sàng (readyState >= 3)");
                    resolvePrep();
                    return;
                }

                console.log("Đợi video sẵn sàng...");
                let readyHandler;
                let errorHandler;
                const timeoutId = setTimeout(() => {
                    videoElement.removeEventListener('canplay', readyHandler);
                    videoElement.removeEventListener('error', errorHandler);
                    if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
                        console.warn("Video chỉ sẵn sàng một phần (readyState >= 2) sau timeout, tiếp tục thử đo.");
                        resolvePrep();
                    } else {
                        console.error("Video không sẵn sàng sau thời gian chờ.");
                        rejectPrep(new Error("Video không sẵn sàng"));
                    }
                }, 5000); // Timeout chờ sẵn sàng: 5 giây

                readyHandler = () => {
                    clearTimeout(timeoutId);
                    videoElement.removeEventListener('canplay', readyHandler);
                    videoElement.removeEventListener('error', errorHandler);
                    console.log("Video sẵn sàng (canplay event)");
                    resolvePrep();
                };

                errorHandler = (err) => {
                     clearTimeout(timeoutId);
                     videoElement.removeEventListener('canplay', readyHandler);
                     videoElement.removeEventListener('error', errorHandler);
                     console.error("Lỗi khi tải video để đo:", err);
                     rejectPrep(new Error("Lỗi tải video"));
                };

                videoElement.addEventListener('canplay', readyHandler);
                videoElement.addEventListener('error', errorHandler);

                // Thử play nếu đang pause để kích hoạt tải (đặc biệt quan trọng với video ẩn)
                if (videoElement.paused && videoElement.readyState < 3) {
                    const originalMuted = videoElement.muted;
                    videoElement.muted = true; // Đảm bảo không có tiếng
                    videoElement.play()
                        .then(() => console.log("Đã gọi play() để kích hoạt tải video."))
                        .catch(err => console.warn("Gọi play() thất bại khi chuẩn bị đo:", err)) // Không reject, vẫn chờ canplay
                        .finally(() => {
                            // Khôi phục muted sau một khoảng ngắn nếu cần
                            // Tuy nhiên, với video ẩn hoặc đo trực tiếp (cũng sẽ set muted), việc này có thể không cần thiết
                            // setTimeout(() => { videoElement.muted = originalMuted; }, 100);
                        });
                }
            });

            prepareVideo()
                .then(() => {
                    const wasPlaying = !videoElement.paused;
                    const originalTime = videoElement.currentTime;
                    const originalMuted = videoElement.muted;
                    //const originalVolume = videoElement.volume; // Không cần volume nếu luôn set muted

                    // Luôn tắt tiếng khi đo để tránh lỗi autoplay và đảm bảo đo mượt hơn
                    videoElement.muted = true;

                    let frameCount = 0;             // Tổng số frame nhận được
                    let measurementFrameCount = 0;  // Số frame dùng để tính toán (sau warmup)
                    let startTime = 0;              // Thời điểm bắt đầu đo (sau warmup)
                    let lastTime = 0;               // Thời điểm của frame trước đó
                    let measurements = [];          // Lưu trữ thông tin từng frame
                    let localIsMeasuring = true;    // Cờ kiểm soát nội bộ
                    state.isMeasuring = true;       // Cờ trạng thái toàn cục

                    if (state.measuringTimeout) clearTimeout(state.measuringTimeout);
                    state.measuringTimeout = setTimeout(() => {
                        if (localIsMeasuring) { // Chỉ xử lý nếu đang thực sự đo
                            console.warn("Timeout khi đo FPS. Sử dụng dữ liệu hiện có.");
                            localIsMeasuring = false; // Dừng các callback tiếp theo
                            state.isMeasuring = false;
                            state.measuringTimeout = null;

                            // Xử lý kết quả dựa trên những gì đã đo được
                            processMeasurementResult(true); // true = bị timeout
                        }
                    }, settings.timeLimit + 1500); // Timeout = Giới hạn thời gian + 1.5s buffer

                    const cleanup = () => {
                        console.log("Dọn dẹp sau khi đo FPS.");
                        if(state.measuringTimeout) {
                            clearTimeout(state.measuringTimeout);
                            state.measuringTimeout = null;
                        }
                        state.isMeasuring = false; // Đặt lại cờ toàn cục

                        // Chỉ khôi phục trạng thái cho video chính khi đo trực tiếp
                        if (state.useDirectMethod && videoElement === videoPlayer) {
                            try {
                                // Cẩn thận khi tua lại, có thể gây giật hoặc tải lại
                                // videoElement.currentTime = originalTime;
                                videoElement.muted = originalMuted;
                                if (!wasPlaying && videoElement.readyState >= 3) { // Chỉ pause nếu nó thực sự có thể pause
                                    videoElement.pause();
                                }
                            } catch (e) {
                                console.error("Lỗi khi khôi phục trạng thái video chính:", e);
                            }
                        }
                        // Không cần khôi phục video ẩn, nó sẽ bị cleanup
                    };

                    // Hàm xử lý kết quả cuối cùng
                    const processMeasurementResult = (timedOut = false) => {
                        const timeElapsed = (startTime > 0 && lastTime > startTime) ? (lastTime - startTime) : 0;
                        let measuredFPS = 0;
                        let reliable = false;
                        let reason = '';

                        if (measurementFrameCount >= MIN_RELIABLE_FRAMES && timeElapsed > 0) {
                            measuredFPS = measurementFrameCount / (timeElapsed / 1000);
                            reliable = true;
                            reason = timedOut ? 'time_limit' : (measurementFrameCount >= settings.frameLimit ? 'frame_limit' : 'time_limit'); // Xác định lý do dừng
                            console.log(`Kết quả FPS (Đáng tin cậy: ${reliable}): ${measuredFPS.toFixed(2)} (${reason})`);
                        } else {
                            measuredFPS = FALLBACK_FPS; // Sử dụng fallback FPS
                            reliable = false;
                            if (timedOut) {
                                reason = measurementFrameCount < MIN_RELIABLE_FRAMES ? 'timeout_low_frames' : 'timeout_no_start';
                            } else {
                                reason = measurementFrameCount < WARMUP_FRAMES ? 'stopped_before_warmup' : 'stopped_low_frames';
                            }
                            console.warn(`Đo FPS không đáng tin cậy (${reason}). Sử dụng fallback: ${FALLBACK_FPS} FPS. Frames: ${measurementFrameCount}, Time: ${timeElapsed.toFixed(0)}ms`);
                        }

                        // Tạo đối tượng kết quả
                        const result = {
                            fps: measuredFPS, // Giá trị số (chưa làm tròn chuẩn)
                            totalFrames: measurementFrameCount,
                            duration: timeElapsed / 1000,
                            reliable: reliable,
                            reason: reason,
                            default: !reliable, // Đánh dấu là default nếu không đáng tin cậy
                            measurements: measurements,
                            partial: timedOut,
                            // Có thể tính thêm min/max/avg interval nếu reliable
                        };

                        settings.onComplete(result); // Gọi callback hoàn thành
                        cleanup();
                        resolve(result); // Resolve promise với kết quả
                    };


                    const frameCallback = (now, metadata) => {
                        if (!localIsMeasuring) return; // Đã dừng bởi timeout hoặc nơi khác

                        frameCount++;

                        // Bỏ qua các frame khởi động
                        if (frameCount <= WARMUP_FRAMES) {
                            lastTime = now; // Cập nhật lastTime để tính delta đầu tiên đúng
                             if (localIsMeasuring) videoElement.requestVideoFrameCallback(frameCallback);
                            return;
                        }

                        // Bắt đầu đo lường
                        if (startTime === 0) {
                            startTime = now;
                            lastTime = now; // Đặt lại lastTime khi bắt đầu đo thực sự
                             console.log("Warmup complete. Starting measurement.");
                        }

                        const deltaTime = now - lastTime;

                        // Chỉ xử lý và lưu trữ nếu delta time hợp lý
                        if (deltaTime >= 0 && deltaTime < LARGE_DELTA_THRESHOLD) {
                            measurements.push({
                                frame: measurementFrameCount,
                                time: now - startTime,
                                delta: deltaTime,
                                // metadata có thể chứa presentedTime, mediaTime, etc.
                            });
                            measurementFrameCount++;
                        } else if (deltaTime >= LARGE_DELTA_THRESHOLD) {
                            console.warn(`Phát hiện khoảng dừng lớn (${deltaTime.toFixed(0)}ms) giữa các frame. Bỏ qua delta này.`);
                            // Không tăng measurementFrameCount, nhưng vẫn tiếp tục đo
                        }
                        // Nếu deltaTime < 0 (hiếm khi xảy ra), cũng bỏ qua

                        lastTime = now; // Luôn cập nhật lastTime cho lần gọi kế tiếp
                        const timeElapsed = now - startTime;

                        // Kiểm tra điều kiện dừng
                        if (measurementFrameCount < settings.frameLimit && timeElapsed < settings.timeLimit && localIsMeasuring) {
                            videoElement.requestVideoFrameCallback(frameCallback);
                        } else {
                            // Đủ frame hoặc hết giờ hoặc bị dừng từ bên ngoài
                            localIsMeasuring = false; // Dừng vòng lặp
                            if (state.measuringTimeout) { // Dọn dẹp timeout nếu kết thúc bình thường
                                clearTimeout(state.measuringTimeout);
                                state.measuringTimeout = null;
                            }
                            state.isMeasuring = false; // Cập nhật trạng thái
                            processMeasurementResult(timeElapsed >= settings.timeLimit); // Xử lý kết quả cuối cùng
                        }
                    };

                    // Bắt đầu quá trình đo
                    console.log("Bắt đầu yêu cầu video frame callback...");
                    if (videoElement.paused) {
                        videoElement.play()
                            .then(() => {
                                console.log("Video đang phát, yêu cầu frame callback đầu tiên.");
                                videoElement.requestVideoFrameCallback(frameCallback);
                            })
                            .catch(err => {
                                console.error("Lỗi khi play video để bắt đầu đo:", err);
                                localIsMeasuring = false;
                                state.isMeasuring = false;
                                if (state.measuringTimeout) clearTimeout(state.measuringTimeout);
                                cleanup();
                                resolve({ fps: FALLBACK_FPS, reliable: false, reason: 'play_error', default: true });
                            });
                    } else {
                         console.log("Video đã phát, yêu cầu frame callback đầu tiên.");
                        videoElement.requestVideoFrameCallback(frameCallback);
                    }

                })
                .catch(err => {
                    console.error("Lỗi khi chuẩn bị video để đo FPS:", err);
                    state.isMeasuring = false;
                    if (state.measuringTimeout) clearTimeout(state.measuringTimeout);
                    resolve({ fps: FALLBACK_FPS, reliable: false, reason: 'prepare_error', default: true });
                });
        });
    }

    /**
     * Phát hiện FPS, ưu tiên video ẩn, fallback video chính
     * @param {HTMLVideoElement} mainVideo Video chính
     * @param {Object} options Tùy chọn đo
     * @returns {Promise<Object>} Promise kết quả đo
     */
    async function detectVideoFPS(mainVideo, options = {}) {
        console.log("Bắt đầu quy trình phát hiện FPS...");
        if (retryTimeoutId) {
            clearTimeout(retryTimeoutId);
            retryTimeoutId = null;
        }

        if (!mainVideo || !mainVideo.currentSrc) {
            console.error("Video chính không có nguồn.");
            return { fps: FALLBACK_FPS, reliable: false, reason: 'main_no_source', default: true };
        }

        // --- Thử với Video ẩn trước ---
        if (hiddenVideo) {
             state.useDirectMethod = false; // Đánh dấu là đang dùng video ẩn
            try {
                console.log("Chuẩn bị video ẩn...");
                 // Thiết lập thuộc tính quan trọng MỖI LẦN sử dụng
                hiddenVideo.muted = true;
                hiddenVideo.loop = false; // Không cần loop
                hiddenVideo.autoplay = true; // Cần autoplay để nó tự chạy khi có src
                hiddenVideo.playsInline = true; // Quan trọng cho mobile
                hiddenVideo.preload = 'auto'; // Cho phép tải trước
                hiddenVideo.crossOrigin = mainVideo.crossOrigin || 'anonymous'; // Đồng bộ crossOrigin

                // Chỉ đặt src nếu khác hoặc chưa có
                if (hiddenVideo.currentSrc !== mainVideo.currentSrc) {
                    console.log("Thiết lập nguồn cho video ẩn:", mainVideo.currentSrc);
                    hiddenVideo.src = mainVideo.currentSrc;
                    await hiddenVideo.load(); // Đảm bảo tải nguồn mới
                 } else {
                     // Nếu nguồn giống, đảm bảo nó ở đầu để đo từ đầu
                     hiddenVideo.currentTime = 0;
                 }


                console.log("Thử đo FPS với video ẩn.");
                const result = await detectFPSDirectly(hiddenVideo, options);

                // Nếu đo bằng video ẩn thành công (dù reliable hay không), trả về kết quả
                // và không cần thử video chính nữa
                console.log("Đo bằng video ẩn hoàn tất.");
                 cleanupHiddenVideo(); // Dọn dẹp ngay sau khi đo xong
                return result;

            } catch (err) {
                console.warn("Đo bằng video ẩn thất bại, fallback sang video chính. Lỗi:", err);
                cleanupHiddenVideo(); // Dọn dẹp video ẩn nếu có lỗi
                // Tiếp tục thử với video chính bên dưới
            }
        } else {
             console.log("Không có video ẩn, chỉ đo trên video chính.");
        }


        // --- Fallback: Đo trực tiếp trên Video chính ---
        state.useDirectMethod = true; // Đánh dấu là đang dùng video chính
        console.log("Thử đo FPS với video chính.");
        try {
             // Đảm bảo video chính tua về đầu nếu cần đo từ đầu (tùy chọn)
             // mainVideo.currentTime = 0; // Cân nhắc ảnh hưởng trải nghiệm người dùng
            const result = await detectFPSDirectly(mainVideo, options);
            console.log("Đo bằng video chính hoàn tất.");
            return result;
        } catch (err) {
             console.error("Đo bằng video chính cũng thất bại. Lỗi:", err);
             // Trả về fallback cuối cùng
             return { fps: FALLBACK_FPS, reliable: false, reason: 'main_measure_error', default: true };
        }
    }


    /**
     * Tự động phát hiện FPS khi được gọi (ví dụ: khi video tải xong)
     */
    async function autoDetectFPS() {
        if (state.isMeasuring) {
            console.log("Đang trong quá trình đo FPS, bỏ qua yêu cầu mới.");
            return;
        }

        // Ưu tiên cache nếu có kết quả đáng tin cậy trước đó
        if (state.cachedFPS && state.cachedFPS.reliable) {
            console.log("Sử dụng FPS đáng tin cậy từ cache:", state.cachedFPS.fps);
            showFPSBadge(state.cachedFPS.fps, false); // Hiển thị kết quả cache (không phải ước tính)
            return;
        }

        console.log("Bắt đầu tự động phát hiện FPS...");
        if (fpsBadge) {
             try {
                const span = fpsBadge.querySelector('span');
                if (span) span.textContent = "Đang đo FPS...";
                else fpsBadge.textContent = "Đang đo FPS...";
                 fpsBadge.style.display = 'flex';
                 fpsBadge.style.opacity = '0.7'; // Làm mờ một chút khi đang đo
             } catch(e) { console.error("Lỗi cập nhật badge:", e); }
        }

        fpsDetectionRetries = 0; // Reset số lần thử lại
        await tryDetectFPS(); // Bắt đầu chu trình thử đo
    }

    /**
     * Thử phát hiện FPS với cơ chế retry
     */
    async function tryDetectFPS() {
        console.log(`Thử phát hiện FPS (Lần ${fpsDetectionRetries + 1}/${MAX_RETRIES + 1})`);

        try {
            const result = await detectVideoFPS(videoPlayer, {
                frameLimit: DEFAULT_FRAME_LIMIT,
                timeLimit: DEFAULT_TIME_LIMIT,
                onComplete: (res) => {
                    // Callback này chỉ để log thêm nếu cần, xử lý chính nằm sau await
                    console.log("onComplete được gọi với kết quả:", res.reliable ? res.fps : `Fallback ${FALLBACK_FPS}`);
                }
            });

            // Xử lý kết quả cuối cùng từ detectVideoFPS
             if (result.reliable) {
                console.log(`Phát hiện FPS thành công và đáng tin cậy: ${result.fps.toFixed(2)}`);
                state.cachedFPS = result; // Chỉ cache kết quả đáng tin cậy
                showFPSBadge(result.fps, false); // Hiển thị kết quả đo được
            } else {
                console.warn(`Phát hiện FPS hoàn tất nhưng kết quả không đáng tin cậy (reason: ${result.reason}). Sử dụng fallback ${FALLBACK_FPS}.`);
                 // Không cập nhật cache nếu không đáng tin cậy
                 // state.cachedFPS = result; // Bỏ dòng này
                 showFPSBadge(FALLBACK_FPS, true); // Hiển thị fallback với dấu *
                 // Cập nhật state.fps đã được thực hiện trong showFPSBadge
            }
             // Dừng retry nếu đã có kết quả (dù reliable hay không)
             if (retryTimeoutId) {
                 clearTimeout(retryTimeoutId);
                 retryTimeoutId = null;
             }

        } catch (err) { // Lỗi xảy ra trong quá trình detectVideoFPS (ít khả năng vì đã bắt lỗi bên trong)
            console.error("Lỗi không mong muốn trong quá trình detectVideoFPS:", err);
            handleRetryOrFallback(err);
        }
    }

    /**
     * Xử lý logic retry hoặc fallback khi có lỗi
     * @param {Error} err Lỗi gặp phải
     */
    function handleRetryOrFallback(err) {
         console.error("Lỗi trong lần thử đo FPS:", err.message || err);
         if (fpsDetectionRetries < MAX_RETRIES) {
            fpsDetectionRetries++;
            console.log(`Thử lại sau 1 giây... (${fpsDetectionRetries}/${MAX_RETRIES})`);
            if (retryTimeoutId) clearTimeout(retryTimeoutId); // Xóa timeout cũ
            retryTimeoutId = setTimeout(() => {
                retryTimeoutId = null;
                if (!state.isMeasuring) { // Chỉ thử lại nếu không có tiến trình đo nào khác đang chạy
                     tryDetectFPS();
                 } else {
                     console.log("Đã có tiến trình đo khác, hủy bỏ lần thử lại này.");
                 }
            }, 1000); // Thử lại sau 1 giây
        } else {
            console.error(`Đã thử ${MAX_RETRIES + 1} lần không thành công. Sử dụng fallback FPS: ${FALLBACK_FPS}.`);
            const fallbackResult = { fps: FALLBACK_FPS, reliable: false, reason: 'max_retries', default: true };
            state.cachedFPS = fallbackResult; // Lưu fallback vào cache để không thử lại liên tục
            showFPSBadge(FALLBACK_FPS, true); // Hiển thị fallback cuối cùng
            state.isMeasuring = false; // Đảm bảo trạng thái đo được reset
            if (state.measuringTimeout) clearTimeout(state.measuringTimeout);
             cleanupHiddenVideo(); // Dọn dẹp nếu có lỗi xảy ra liên tục
        }
    }


    // Trả về các phương thức công khai
    return {
        detectFPSDirectly,  // Có thể dùng để đo thủ công nếu cần
        detectVideoFPS,     // Hàm chính để đo (ẩn/chính)
        autoDetectFPS,      // Hàm tự động phát hiện
        cleanupHiddenVideo  // Hàm dọn dẹp video ẩn (có thể gọi khi không cần nữa)
    };
}


Cách sử dụng:

Khởi tạo:

import { setupFpsDetection } from './fpsDetectionModule.js'; // Đường dẫn tới file

const videoPlayer = document.getElementById('main-video');
const hiddenVideo = document.getElementById('hidden-video'); // Có thể là null nếu không dùng
const fpsBadge = document.getElementById('fps-badge');
const appState = {
    isMeasuring: false,
    measuringTimeout: null,
    cachedFPS: null, // Lưu kết quả đo đáng tin cậy gần nhất
    fps: 0,          // FPS hiện tại đang hiển thị
    useDirectMethod: false // Cờ nội bộ, module tự quản lý
};

const fpsDetector = setupFpsDetection(videoPlayer, hiddenVideo, fpsBadge, appState);
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
JavaScript
IGNORE_WHEN_COPYING_END

Gọi tự động phát hiện: Thường gọi sau khi video chính đã sẵn sàng (canplay hoặc loadedmetadata).

videoPlayer.addEventListener('canplay', () => {
    // Chỉ gọi autoDetect nếu chưa có FPS đáng tin cậy
    if (!appState.cachedFPS || !appState.cachedFPS.reliable) {
         fpsDetector.autoDetectFPS();
    } else {
         // Nếu đã có cache đáng tin cậy, hiển thị lại ngay
         showFPSBadge(appState.cachedFPS.fps, false);
    }
});

// Hoặc bạn có thể gọi thủ công khi cần
// document.getElementById('detect-fps-button').onclick = fpsDetector.autoDetectFPS;
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
JavaScript
IGNORE_WHEN_COPYING_END

Lưu ý:

HTML: Đảm bảo bạn có các phần tử videoPlayer, hiddenVideo (nếu dùng), và fpsBadge trong HTML với ID tương ứng. Video ẩn nên được ẩn bằng CSS (display: none hoặc vị trí tuyệt đối ngoài màn hình).

Trạng thái state: Module này dựa vào đối tượng state được truyền vào để quản lý trạng thái giữa các lần gọi và các thành phần khác của ứng dụng có thể đọc giá trị state.fps.

Fallback 30 FPS: Code này giờ sẽ mặc định về 30 FPS nếu đo không thành công hoặc kết quả không đủ tin cậy (ít hơn MIN_RELIABLE_FRAMES).

Hiển thị *: Badge sẽ hiển thị thêm dấu * sau số FPS nếu giá trị đó là fallback hoặc ước tính (không đáng tin cậy).

Cache: Chỉ kết quả đo đáng tin cậy mới được lưu vào state.cachedFPS để tránh việc sử dụng lại giá trị không chính xác.

Cleanup: Hàm cleanupHiddenVideo được gọi sau mỗi lần đo hoặc khi có lỗi để giải phóng tài nguyên.
