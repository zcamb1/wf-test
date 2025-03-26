// js/player-controls.js
/**
 * Module điều khiển trình phát video (cho các nút tua frame, input, phím tắt)
 */
import { Utils } from './utils.js';

/**
 * Thiết lập các điều khiển trình phát
 * @param {HTMLVideoElement} videoPlayer Video chính
 * @param {HTMLElement} timeCode Input hiển thị thời gian
 * @param {HTMLElement | null} progressBar Thanh tiến trình cũ (có thể là null)
 * @param {Object} state Trạng thái chung của ứng dụng
 * @returns {Object} Các phương thức điều khiển trình phát
 */
export function setupPlayerControls(videoPlayer, timeCode, progressBar, state) { // progressBar có thể là null
    let updatingUI = false;
    const UPDATE_DELAY = 100;
    let videoPlayPromise = null; // Giữ lại nếu cần gọi safePlay/Pause từ đây

    // --- Các hàm safePlay, safePause ---
    // Lấy từ index.js hoặc giữ lại định nghĩa ở đây nếu cần độc lập
     function safePlay() {
         // Nên dùng hàm đã gán vào videoPlayer từ index.js nếu có
        if (videoPlayer.safePlay) return videoPlayer.safePlay();

        // Fallback nếu không có hàm safePlay được gán
        if (videoPlayer.paused) {
            try {
                const promise = videoPlayer.play();
                if (promise !== undefined) {
                    promise.catch(err => console.warn("Fallback play error:", err));
                }
                return promise;
            } catch (e) {
                 console.error("Fallback play error:", e);
                 return Promise.reject(e);
            }
        }
        return Promise.resolve();
    }

    function safePause() {
        if (videoPlayer.safePause) return videoPlayer.safePause();

        // Fallback
        if (!videoPlayer.paused) {
             try {
                 videoPlayer.pause();
             } catch(e) {
                  console.error("Fallback pause error:", e);
             }
        }
    }


    /**
     * Tua theo khung hình với độ chính xác cao
     * @param {number} frameOffset Số khung hình cần tua (dương hoặc âm)
     */
    function seekToFrame(frameOffset) {
        // ... (logic tính toán boundedTime giữ nguyên) ...
        if (state.fps <= 0) {
             console.warn("Cannot seek frame: FPS not available.");
             return;
        }
        if (!videoPlayer.duration) return;

        const wasPlaying = !videoPlayer.paused;
        if (wasPlaying) safePause();

        updatingUI = true;
        const currentTime = videoPlayer.currentTime;
        const frameDuration = 1 / state.fps;
        const currentFrame = Math.round(currentTime / frameDuration);
        const targetFrame = currentFrame + frameOffset;
        const newTime = targetFrame * frameDuration;
        const boundedTime = Math.max(0, Math.min(newTime, videoPlayer.duration));

        console.log(`Seeking to frame: ${targetFrame} (${boundedTime.toFixed(3)}s)`);
        videoPlayer.currentTime = boundedTime;

        const timeInMilliseconds = (boundedTime * 1000).toFixed(0);
        if (timeCode) $(timeCode).val(timeInMilliseconds); // Cập nhật timeCode input

        // === THÊM KIỂM TRA NULL ===
        if (progressBar) {
            Utils.updateProgressBar(videoPlayer, progressBar); // Chỉ cập nhật thanh cũ nếu nó tồn tại
        }

        // Cập nhật wavesurfer nếu có
        if (state.wavesurfer && state.wavesurferInitialized) {
            setTimeout(() => {
                try {
                    state.updatingFromVideo = true;
                    const progress = boundedTime / videoPlayer.duration;
                    state.wavesurfer.seekTo(progress);
                    setTimeout(() => { state.updatingFromVideo = false; updatingUI = false; }, UPDATE_DELAY);
                } catch (e) {
                     console.error("Lỗi khi cập nhật wavesurfer sau khi tua frame:", e);
                    state.updatingFromVideo = false; updatingUI = false;
                }
            }, 10);
        } else {
            setTimeout(() => { updatingUI = false; }, UPDATE_DELAY);
        }

         // Không tự động phát lại nếu đang kéo thanh khác hoặc có ý định khác
         // if (wasPlaying && !state.isDragging && !state.isDraggingCustomBar) {
         //     safePlay();
         // }
    }

    /**
     * Cập nhật thanh tiến trình cũ từ vị trí chuột (NẾU CÒN SỬ DỤNG THANH NÀY)
     * Bạn có thể xóa hoặc comment out hàm này và các listener của nó nếu không dùng thanh cũ nữa.
     * @param {Event} e Sự kiện chuột
     */
    function updateProgressFromMouse(e) {
        // === THÊM KIỂM TRA NULL ===
        if (!progressBar) return; // Không làm gì nếu không có thanh progress cũ

        if (updatingUI) return;
        updatingUI = true;

        const progressBarEl = $(progressBar).parent(); // Giả sử progressBar là .progress bên trong .progress-bar
        if (!progressBarEl || progressBarEl.length === 0 || !progressBarEl.offset()) {
             console.error("Không tìm thấy container cho thanh progress cũ.");
             updatingUI = false;
             return;
        }
        const position = (e.pageX - progressBarEl.offset().left) / progressBarEl.width();
        const boundedPosition = Math.max(0, Math.min(1, position));

        if (videoPlayer.duration) {
            // ... (logic tính targetTime, boundedTime với frame snapping giữ nguyên) ...
            let targetTime;
            const calculatedTime = boundedPosition * videoPlayer.duration;
            if (state.fps > 0) {
                const frameDuration = 1 / state.fps;
                targetTime = Math.round(calculatedTime / frameDuration) * frameDuration;
            } else {
                targetTime = calculatedTime;
            }
            const boundedTime = Math.max(0, Math.min(targetTime, videoPlayer.duration));

            videoPlayer.currentTime = boundedTime;

            // Cập nhật hiển thị
            if (timeCode) $(timeCode).val((boundedTime * 1000).toFixed(0));
            Utils.updateProgressBar(videoPlayer, progressBar); // Cập nhật thanh cũ

            // Cập nhật wavesurfer
             if (state.wavesurfer && state.wavesurferInitialized) {
                setTimeout(() => {
                    try {
                        state.updatingFromVideo = true;
                        const progress = boundedTime / videoPlayer.duration;
                        state.wavesurfer.seekTo(progress);
                        setTimeout(() => { state.updatingFromVideo = false; updatingUI = false; }, UPDATE_DELAY);
                    } catch (err) {
                        console.error("Lỗi khi cập nhật wavesurfer từ thanh progress cũ:", err);
                        state.updatingFromVideo = false; updatingUI = false;
                    }
                }, 10);
            } else {
                setTimeout(() => { updatingUI = false; }, UPDATE_DELAY);
            }
        } else {
            updatingUI = false;
        }
    }

    /**
     * Cập nhật liên tục hiển thị thời gian (ô input)
     */
    function updateTimeDisplay() {
        if (!state.isUserChanging && videoPlayer.duration && !updatingUI && timeCode) {
            $(timeCode).val((videoPlayer.currentTime * 1000).toFixed(0));

            // === THÊM KIỂM TRA NULL ===
            // Chỉ cập nhật thanh progress cũ nếu nó tồn tại và không đang kéo nó
            // if (!state.isDragging && progressBar) {
            //     Utils.updateProgressBar(videoPlayer, progressBar);
            // }
            // Bỏ cập nhật thanh cũ ở đây vì có thể gây lỗi nếu thanh cũ không còn listener isDragging
        }
        state.updateTimeTask = setTimeout(() => requestAnimationFrame(updateTimeDisplay), 100); // Giảm tần suất nếu cần
    }

    /**
     * Thiết lập tất cả bộ xử lý sự kiện và khởi tạo các thành phần
     */
    function setupPlayerAndEvents() {
        // Nút tua frame
        $('#seekBack10').on('click', () => seekToFrame(-10));
        $('#seekBack1').on('click', () => seekToFrame(-1));
        $('#seekForward1').on('click', () => seekToFrame(1));
        $('#seekForward10').on('click', () => seekToFrame(10));

        // Xử lý nhập thời gian
        if (timeCode) {
            $(timeCode).on('focus', () => { state.isUserChanging = true; });
            $(timeCode).on('blur', function() {
                if ($(this).val() === '') $(this).val('0');
                state.isUserChanging = false;
            });
            $(timeCode).on('keydown', function(e) {
                if (e.key === 'Enter') {
                    const timeMs = parseInt($(this).val(), 10);
                    if (!isNaN(timeMs) && videoPlayer.duration) {
                        updatingUI = true;
                        const boundedTime = Math.min(Math.max(0, timeMs / 1000), videoPlayer.duration);
                        videoPlayer.currentTime = boundedTime;

                        // === THÊM KIỂM TRA NULL ===
                        if (progressBar) Utils.updateProgressBar(videoPlayer, progressBar);

                        // Cập nhật wavesurfer
                         if (state.wavesurfer && state.wavesurferInitialized) {
                             setTimeout(() => {
                                try {
                                    state.updatingFromVideo = true;
                                    const progress = boundedTime / videoPlayer.duration;
                                    state.wavesurfer.seekTo(progress);
                                    setTimeout(() => { state.updatingFromVideo = false; updatingUI = false; }, UPDATE_DELAY);
                                } catch (err) {
                                     console.error("Lỗi khi cập nhật wavesurfer từ timecode:", err);
                                    state.updatingFromVideo = false; updatingUI = false;
                                }
                            }, 10);
                        } else {
                            setTimeout(() => { updatingUI = false; }, UPDATE_DELAY);
                        }
                    }
                    state.isUserChanging = false;
                    $(this).blur();
                     e.preventDefault(); // Ngăn submit form nếu có
                }
            });
        }

        // Nút sao chép
        $('#copyBtn').on('click', function() {
            const timeMs = (videoPlayer.currentTime * 1000).toFixed(0);
            Utils.copyToClipboard(timeMs).then(success => {
                if (success) Utils.showToast(document.getElementById('toast'), "Đã sao chép!");
            });
        });

        // Tương tác thanh tiến trình CŨ (chỉ thêm nếu progressBar tồn tại)
        // **QUAN TRỌNG**: Nếu bạn đã xóa HTML của thanh progress cũ hoặc không muốn dùng nó nữa,
        // hãy xóa hoặc comment out toàn bộ khối 'mousedown', 'mousemove', 'mouseup' này.
        /*
        if (progressBar) {
            const progressBarContainerEl = $(progressBar).parent(); // Thường là .progress-bar
            if (progressBarContainerEl.length) {
                progressBarContainerEl.on('mousedown', function(e) {
                    state.isDragging = true; // Cờ cho thanh cũ
                    if (!videoPlayer.paused) safePause();
                    updateProgressFromMouse(e);
                    e.preventDefault();
                });

                $(document).on('mousemove.oldProgress', Utils.throttle((e) => { // Thêm namespace .oldProgress
                    if (state.isDragging) updateProgressFromMouse(e);
                }, 50)); // Tăng throttle lên 50ms

                $(document).on('mouseup.oldProgress', () => { // Thêm namespace .oldProgress
                    if (state.isDragging) {
                        state.isDragging = false;
                        setTimeout(() => { updatingUI = false; }, UPDATE_DELAY);
                    }
                });
            }
        }
        */
       // === HẾT PHẦN TÙY CHỌN CHO THANH CŨ ===


        // Phím tắt (Giữ nguyên và đảm bảo stopPropagation hoạt động)
        $(document).on('keydown.playerControls', function(e) { // Thêm namespace .playerControls
            if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;

             // Chỉ xử lý nếu focus không nằm trên input/textarea hoặc các control đặc biệt khác
             let shouldHandle = true;
             if ($(document.activeElement).closest('.custom-video-controls').length > 0 && e.key !== ' ') {
                 // Nếu focus trong custom controls và không phải phím space, để custom controls xử lý
                 // shouldHandle = false; // Tạm thời vẫn xử lý ở đây
             }

            if (shouldHandle) {
                switch (e.key) {
                    case 'ArrowLeft':
                        if (state.fps > 0) {
                            seekToFrame(e.shiftKey ? -10 : -1);
                            e.preventDefault(); e.stopPropagation();
                        } else { e.preventDefault(); e.stopPropagation(); } // Vẫn chặn mặc định
                        break;
                    case 'ArrowRight':
                         if (state.fps > 0) {
                            seekToFrame(e.shiftKey ? 10 : 1);
                            e.preventDefault(); e.stopPropagation();
                        } else { e.preventDefault(); e.stopPropagation(); } // Vẫn chặn mặc định
                        break;
                    case ' ': case 'Space':
                         // Chỉ xử lý nếu focus không nằm trên input/textarea và không phải trong controls đặc biệt khác
                         if (!$(document.activeElement).is('input, textarea')) {
                             if (videoPlayer.paused || videoPlayer.ended) {
                                 safePlay().catch(err => console.error("Play error on space:", err));
                             } else {
                                 safePause();
                             }
                             e.preventDefault(); // Ngăn cuộn trang
                             // Không cần stopPropagation ở đây trừ khi có xung đột khác
                         }
                        break;
                    // Các phím tắt khác nếu có (vd: 'm' for mute)
                }
            }
        });

        // Sự kiện click trên video để play/pause (NẾU CẦN)
        // Lưu ý: Thanh controls mới đã che phủ video, nên click này có thể không hoạt động
        // Trừ khi bạn thêm listener vào videoWrapper và kiểm tra target
        /*
        $(videoPlayer).on('click', function() {
            if (this.paused || this.ended) {
                safePlay().catch(err => console.error("Play error on video click:", err));
            } else {
                safePause();
            }
        });
        */

        // Bắt đầu cập nhật liên tục hiển thị thời gian (ô input)
        if (timeCode) { // Chỉ bắt đầu nếu có ô timeCode
             if (state.updateTimeTask) cancelAnimationFrame(state.updateTimeTask); // Hủy task cũ nếu có
             updateTimeDisplay();
        }
    }

    // Hủy các listener khi module không còn dùng (nếu cần)
    function destroy() {
         $(document).off('.playerControls'); // Hủy listener có namespace
         // Hủy các listener khác nếu cần
         // $(document).off('.oldProgress');
          if (state.updateTimeTask) cancelAnimationFrame(state.updateTimeTask);
    }


    // Trả về các phương thức công khai
    return {
        seekToFrame,
        // updateProgressFromMouse, // Chỉ trả về nếu còn dùng thanh cũ
        updateTimeDisplay,
        setupPlayerAndEvents,
        safePlay, // Trả về để có thể gọi từ bên ngoài nếu cần
        safePause,
        destroy // Thêm hàm destroy
    };
}