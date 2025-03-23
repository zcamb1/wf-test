/**
 * Module quản lý markers (đánh dấu các thời điểm quan trọng trong video)
 */
export function setupMarkers(videoPlayer, progressBarContainer, waveformContainer, state) {
    // Lưu trữ các markers
    const markers = {
        start: null, // Thời điểm logo xuất hiện
        end: null,   // Thời điểm kết quả hiển thị
        elements: {
            start: null,
            end: null,
            startWave: null,
            endWave: null
        }
    };
    
    // Log để debug
    console.log("Module markers được tải");
    
    // Lấy key cho localStorage dựa trên URL hiện tại của trang thay vì URL video
    function getStorageKey() {
        try {
            // Lấy URL hiện tại của trang (không bao gồm parameters)
            const pageUrl = window.location.origin + window.location.pathname;
            // Tạo key dựa trên URL hiện tại
            return `video_markers_${pageUrl}`;
        } catch (e) {
            console.error("Lỗi khi tạo storage key:", e);
            return 'video_markers_default';
        }
    }
    
    // Lưu markers vào localStorage
    function saveMarkersToStorage() {
        try {
            const key = getStorageKey();
            if (!key) return;
            
            const dataToSave = {
                start: markers.start,
                end: markers.end,
                timestamp: Date.now()
            };
            
            localStorage.setItem(key, JSON.stringify(dataToSave));
            console.log("Đã lưu markers vào localStorage:", dataToSave);
        } catch (e) {
            console.error("Lỗi khi lưu markers vào localStorage:", e);
        }
    }
    
    // Tải markers từ localStorage
    function loadMarkersFromStorage() {
        try {
            const key = getStorageKey();
            if (!key) return false;
            
            const savedData = localStorage.getItem(key);
            if (!savedData) return false;
            
            const parsedData = JSON.parse(savedData);
            console.log("Đã tải markers từ localStorage:", parsedData);
            
            // Chỉ cập nhật nếu có dữ liệu
            if (parsedData.start !== undefined) markers.start = parsedData.start;
            if (parsedData.end !== undefined) markers.end = parsedData.end;
            
            return true;
        } catch (e) {
            console.error("Lỗi khi tải markers từ localStorage:", e);
            return false;
        }
    }

    // Tạo marker element và thêm vào DOM
    function createMarkerElement(container, time, type) {
        if (!videoPlayer.duration) return null;
        
        try {
            // Tính toán vị trí dựa trên thời gian và thời lượng video
            const position = (time / videoPlayer.duration) * 100;
            
            // Tạo marker
            const markerEl = document.createElement('div');
            markerEl.className = `video-marker marker-${type}`;
            markerEl.style.left = `${position}%`;
            
            // Thêm vào container
            container.appendChild(markerEl);
            
            // Thêm sự kiện click để nhảy đến thời điểm
            markerEl.addEventListener('click', function() {
                videoPlayer.currentTime = time;
                document.getElementById('timeCode').value = Math.round(time * 1000);
            });
            
            console.log(`Đã tạo ${type} marker tại vị trí ${position}%`);
            return markerEl;
        } catch (e) {
            console.error("Lỗi khi tạo marker:", e);
            return null;
        }
    }

    // Tạo marker trên waveform
    function createWaveMarker(time, type) {
        try {
            // Kiểm tra xem waveform container đã tồn tại chưa
            const waveElement = waveformContainer.querySelector('wave');
            if (!waveElement) return null;
            
            // Tính toán vị trí
            const position = (time / videoPlayer.duration) * 100;
            
            // Tạo marker
            const markerEl = document.createElement('div');
            markerEl.className = `wave-marker wave-marker-${type}`;
            markerEl.style.left = `${position}%`;
            
            // Thêm vào container
            waveElement.appendChild(markerEl);
            
            // Thêm sự kiện click để nhảy đến thời điểm
            markerEl.addEventListener('click', function() {
                videoPlayer.currentTime = time;
                document.getElementById('timeCode').value = Math.round(time * 1000);
            });
            
            return markerEl;
        } catch (e) {
            console.error("Lỗi khi tạo wave marker:", e);
            return null;
        }
    }

    // Render markers trên thanh tiến trình
    function renderProgressBarMarkers() {
        console.log("Đang render markers trên thanh tiến trình...");
        try {
            // Nếu video chưa tải xong, không render ngay
            if (!videoPlayer.duration) {
                console.log("Video chưa có duration, không thể render");
                return;
            }
            
            console.log("Marker hiện tại: start =", markers.start, "end =", markers.end);
            
            // Xóa markers cũ trên thanh tiến trình
            if (markers.elements.start) {
                markers.elements.start.remove();
                markers.elements.start = null;
            }
            
            if (markers.elements.end) {
                markers.elements.end.remove();
                markers.elements.end = null;
            }
            
            // Tạo markers mới nếu có dữ liệu
            if (markers.start !== null) {
                markers.elements.start = createMarkerElement(progressBarContainer, markers.start, 'start');
            }
            
            if (markers.end !== null) {
                markers.elements.end = createMarkerElement(progressBarContainer, markers.end, 'end');
            }
        } catch (e) {
            console.error("Lỗi khi render progress bar markers:", e);
        }
    }
    
    // Render markers trên waveform
    function renderWaveMarkers() {
        try {
            // Xóa wave markers cũ
            if (markers.elements.startWave) {
                markers.elements.startWave.remove();
                markers.elements.startWave = null;
            }
            
            if (markers.elements.endWave) {
                markers.elements.endWave.remove();
                markers.elements.endWave = null;
            }
            
            // Tạo wave markers mới nếu có dữ liệu
            if (markers.start !== null) {
                markers.elements.startWave = createWaveMarker(markers.start, 'start');
            }
            
            if (markers.end !== null) {
                markers.elements.endWave = createWaveMarker(markers.end, 'end');
            }
        } catch (e) {
            console.error("Lỗi khi render wave markers:", e);
        }
    }
    
    // Xóa tất cả markers
    function clearMarkers() {
        try {
            // Xóa giá trị markers
            markers.start = null;
            markers.end = null;
            
            // Xóa marker elements
            if (markers.elements.start) {
                markers.elements.start.remove();
                markers.elements.start = null;
            }
            
            if (markers.elements.end) {
                markers.elements.end.remove();
                markers.elements.end = null;
            }
            
            // Xóa wave markers
            if (markers.elements.startWave) {
                markers.elements.startWave.remove();
                markers.elements.startWave = null;
            }
            
            if (markers.elements.endWave) {
                markers.elements.endWave.remove();
                markers.elements.endWave = null;
            }
            
            // Xóa dữ liệu từ localStorage
            const key = getStorageKey();
            if (key) {
                localStorage.removeItem(key);
            }
            
            // Hiển thị thông báo toast
            if (window.Utils) {
                window.Utils.showToast(document.getElementById('toast'), "Đã xóa tất cả markers");
            }
        } catch (e) {
            console.error("Lỗi khi xóa markers:", e);
        }
    }

    // Cập nhật marker theo loại (start/end)
    function updateMarker(type, time) {
        try {
            // Cập nhật giá trị thời gian
            markers[type] = time;
            
            // Render lại markers
            renderProgressBarMarkers();
            renderWaveMarkers();
            
            // Lưu markers vào localStorage
            saveMarkersToStorage();
            
            // Hiển thị thông báo toast
            const message = type === 'start' ? 
                "Đã đánh dấu thời điểm logo" : 
                "Đã đánh dấu thời điểm kết quả";
            if (window.Utils) {
                window.Utils.showToast(document.getElementById('toast'), message);
            }
        } catch (e) {
            console.error("Lỗi khi cập nhật marker:", e);
        }
    }
    
    // Khởi tạo markers
    function initMarkers() {
        try {
            console.log("Khởi tạo markers...");
            
            // Thử tải từ URL params trước (ưu tiên cao hơn)
            let initFromURL = false;
            const urlParams = new URLSearchParams(window.location.search);
            const startTime = urlParams.get('start');
            const endTime = urlParams.get('end');

            if (startTime) {
                markers.start = parseFloat(startTime);
                initFromURL = true;
            }
            if (endTime) {
                markers.end = parseFloat(endTime);
                initFromURL = true;
            }
            
            // Nếu không có params trong URL, thử tải từ localStorage
            if (!initFromURL) {
                loadMarkersFromStorage();
            }
            
            console.log("Sau khi khởi tạo: start =", markers.start, "end =", markers.end);
            
            // Render markers ngay lập tức trên thanh tiến trình
            renderProgressBarMarkers();
            
            // Đăng ký MutationObserver để theo dõi khi waveform được tạo
            setupWaveformObserver();
        } catch (e) {
            console.error("Lỗi khi khởi tạo markers:", e);
        }
    }
    
    // Theo dõi khi waveform được tạo
    function setupWaveformObserver() {
        try {
            // Nếu đã thiết lập observer trước đó, bỏ qua
            if (waveformContainer.hasAttribute('data-observer-setup')) {
                console.log("Observer đã được thiết lập trước đó, bỏ qua");
                return;
            }
            
            // Đánh dấu đã thiết lập
            waveformContainer.setAttribute('data-observer-setup', 'true');
            
            // Kiểm tra ngay nếu waveform đã tồn tại
            const checkWave = () => {
                if (waveformContainer.querySelector('wave')) {
                    renderWaveMarkers();
                    setupRightClickOnWaveform();
                    return true;
                }
                return false;
            };
            
            // Kiểm tra ngay lần đầu
            if (checkWave()) return;
            
            // Tạo một observer để theo dõi thay đổi trong DOM
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'childList') {
                        // Nếu có 'wave' element mới, render markers
                        if (checkWave()) {
                            observer.disconnect();
                        }
                    }
                });
            });
            
            // Bắt đầu theo dõi
            observer.observe(waveformContainer, {
                childList: true,
                subtree: true
            });
        } catch (e) {
            console.error("Lỗi khi thiết lập observer:", e);
        }
    }
    
    // Thiết lập xử lý chuột phải để xóa markers
    function setupRightClickOnWaveform() {
        try {
            console.log("Thiết lập sự kiện chuột phải cho waveform");
            
            // Xác định phần tử wave
            const waveElement = waveformContainer.querySelector('wave');
            if (!waveElement) {
                console.error("Không tìm thấy phần tử wave");
                return;
            }
    
            // Kiểm tra nếu đã thiết lập sự kiện rồi thì bỏ qua
            if (waveElement.hasAttribute('data-right-click-setup')) {
                console.log("Sự kiện chuột phải đã được thiết lập trước đó, bỏ qua");
                return;
            }
            
            // Đánh dấu đã thiết lập để tránh thiết lập nhiều lần
            waveElement.setAttribute('data-right-click-setup', 'true');
    
            // Thêm sự kiện chuột phải
            waveElement.addEventListener('contextmenu', function handleRightClick(e) {
                console.log("Đã bắt sự kiện chuột phải trên waveform");
                e.preventDefault(); // Ngăn chặn menu ngữ cảnh mặc định
                e.stopPropagation(); // Ngăn chặn sự kiện lan truyền
                
                // Xóa tất cả markers
                if (markers.start !== null || markers.end !== null) {
                    clearMarkers();
                }
                
                return false; // Thêm return false để đảm bảo không hiển thị menu mặc định
            });
            
            // Cũng thêm sự kiện chuột phải cho container nếu chưa thiết lập
            if (!waveformContainer.hasAttribute('data-right-click-setup')) {
                waveformContainer.setAttribute('data-right-click-setup', 'true');
                
                waveformContainer.addEventListener('contextmenu', function handleContainerRightClick(e) {
                    console.log("Đã bắt sự kiện chuột phải trên waveform container");
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Xóa tất cả markers
                    if (markers.start !== null || markers.end !== null) {
                        clearMarkers();
                    }
                    
                    return false;
                });
            }
        } catch (e) {
            console.error("Lỗi khi thiết lập sự kiện chuột phải:", e);
        }
    }
    
    // Khởi chạy module marker
    function init() {
        try {
            console.log("Bắt đầu khởi tạo module marker...");
            
            // Thiết lập CSS cho markers
            addMarkerStyles();
            
            // Tải markers từ localStorage ngay lập tức
            loadMarkersFromStorage();
            
            // Khi video đã tải xong
            const renderMarkersWhenReady = () => {
                if (videoPlayer.readyState >= 2 && videoPlayer.duration) {
                    console.log("Video sẵn sàng, render markers");
                    renderProgressBarMarkers();
                    
                    // Kiểm tra wavesurfer
                    if (state.wavesurfer && state.wavesurferInitialized) {
                        renderWaveMarkers();
                        setupRightClickOnWaveform();
                    } else {
                        // Thiết lập theo dõi khi wavesurfer sẵn sàng
                        setupWaveformObserver();
                    }
                    
                    return true;
                }
                return false;
            };
            
            // Thử render ngay nếu video đã tải xong
            if (!renderMarkersWhenReady()) {
                console.log("Video chưa sẵn sàng, đăng ký sự kiện loadedmetadata");
                
                // Đợi video tải xong
                videoPlayer.addEventListener('loadedmetadata', function onMetadataLoaded() {
                    videoPlayer.removeEventListener('loadedmetadata', onMetadataLoaded);
                    console.log("Video đã tải metadata");
                    
                    // Thêm một khoảng thời gian để đảm bảo duration đã được thiết lập
                    setTimeout(() => {
                        renderMarkersWhenReady();
                    }, 100);
                });
                
                // Thêm sự kiện canplay để đảm bảo
                videoPlayer.addEventListener('canplay', function onCanPlay() {
                    videoPlayer.removeEventListener('canplay', onCanPlay);
                    console.log("Video có thể phát");
                    renderMarkersWhenReady();
                });
                
                // Thêm tiếp sự kiện duration change
                videoPlayer.addEventListener('durationchange', function onDurationChange() {
                    videoPlayer.removeEventListener('durationchange', onDurationChange);
                    console.log("Video duration đã thay đổi:", videoPlayer.duration);
                    renderMarkersWhenReady();
                });
            }
            
            // Thiết lập phím tắt
            setupKeyboardShortcuts();
            
            // Cập nhật markers khi resize
            window.addEventListener('resize', function() {
                renderProgressBarMarkers();
                renderWaveMarkers();
            });
            
            // Cập nhật khi video thay đổi
            videoPlayer.addEventListener('durationchange', function() {
                console.log("durationchange event fired");
                renderProgressBarMarkers();
            });
            
            // Thêm xử lý trước khi trang reload
            window.addEventListener('beforeunload', function() {
                // Đảm bảo lưu markers hiện tại trước khi trang reload
                saveMarkersToStorage();
            });
            
            // Đăng ký sự kiện wavesurfer ready
            if (state.wavesurfer) {
                state.wavesurfer.on('ready', function() {
                    console.log("Wavesurfer ready event fired");
                    renderWaveMarkers();
                    setupRightClickOnWaveform();
                });
            }
            
            // Thêm sự kiện timeupdate để đảm bảo render markers khi video đã tải hoàn tất
            let hasRendered = false;
            videoPlayer.addEventListener('timeupdate', function onTimeUpdate() {
                if (!hasRendered && videoPlayer.duration > 0) {
                    console.log("Render markers từ timeupdate event");
                    renderProgressBarMarkers();
                    videoPlayer.removeEventListener('timeupdate', onTimeUpdate);
                    hasRendered = true;
                }
            });
            
            console.log("Khởi tạo module marker hoàn tất");
        } catch (e) {
            console.error("Lỗi khi khởi tạo module markers:", e);
        }
    }
    
    // Đăng ký phím tắt
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Bỏ qua nếu đang nhập liệu vào ô input
            if (document.activeElement.tagName === 'INPUT') return;
            
            try {
                switch (e.key.toLowerCase()) {
                    case 'l': // Phím L: Đánh dấu thời điểm logo (start)
                        if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
                            updateMarker('start', videoPlayer.currentTime);
                            e.preventDefault();
                        }
                        break;
                        
                    case 'r': // Phím R: Đánh dấu thời điểm kết quả (end)
                        if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
                            updateMarker('end', videoPlayer.currentTime);
                            e.preventDefault();
                        }
                        break;
                        
                    case 'b': // Phím B: Sao chép cả hai thời điểm
                        if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
                            if (markers.start !== null && markers.end !== null) {
                                const startMs = Math.round(markers.start * 1000);
                                const endMs = Math.round(markers.end * 1000);
                                const bothTimes = `${startMs},${endMs}`;
                                
                                window.Utils.copyToClipboard(bothTimes)
                                    .then(success => {
                                        if (success) {
                                            window.Utils.showToast(document.getElementById('toast'), "Đã sao chép cả hai thời điểm");
                                        }
                                    });
                                e.preventDefault();
                            }
                        }
                        break;
                        
                    case 'c': // Phím C: Xóa tất cả markers
                        if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
                            clearMarkers();
                            e.preventDefault();
                        }
                        break;
                        
                    case '1': // Phím 1: Nhảy đến điểm start
                        if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
                            if (markers.start !== null) {
                                videoPlayer.currentTime = markers.start;
                                window.Utils.updateProgressBar(videoPlayer, document.getElementById('progressBar'));
                                document.getElementById('timeCode').value = Math.round(markers.start * 1000);
                                e.preventDefault();
                            }
                        }
                        break;
                        
                    case '2': // Phím 2: Nhảy đến điểm end
                        if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
                            if (markers.end !== null) {
                                videoPlayer.currentTime = markers.end;
                                window.Utils.updateProgressBar(videoPlayer, document.getElementById('progressBar'));
                                document.getElementById('timeCode').value = Math.round(markers.end * 1000);
                                e.preventDefault();
                            }
                        }
                        break;
                }
            } catch (e) {
                console.error("Lỗi khi xử lý phím tắt:", e);
            }
        });
    }
    
    // Thêm CSS cho markers
    function addMarkerStyles() {
        if (document.getElementById('marker-styles')) return;
        
        try {
            const styleSheet = document.createElement('style');
            styleSheet.id = 'marker-styles';
            styleSheet.textContent = `
                /* Markers trên thanh tiến trình */
                .video-marker {
                    position: absolute;
                    width: 6px;
                    height: 24px;
                    top: -9px;
                    transform: translateX(-50%);
                    z-index: 20;
                    cursor: pointer;
                    box-shadow: 0 0 4px rgba(0,0,0,0.5);
                    border-radius: 2px;
                    border: 2px solid rgba(255,255,255,0.9);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                
                .video-marker:hover {
                    transform: translateX(-50%) scale(1.2);
                    box-shadow: 0 0 8px rgba(0,0,0,0.7);
                }
                
                .marker-start {
                    background-color: #33cc33; /* Màu xanh lá đậm */
                }
                
                .marker-end {
                    background-color: #9933ff; /* Màu tím */
                }
                
                /* Markers trên wavesurfer */
                .wave-marker {
                    position: absolute;
                    width: 4px;
                    height: 100%;
                    top: 0;
                    transform: translateX(-50%);
                    z-index: 100;
                    cursor: pointer;
                    transition: width 0.2s ease, box-shadow 0.2s ease;
                }
                
                .wave-marker:hover {
                    width: 6px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.6);
                }
                
                .wave-marker-start {
                    background-color: #33cc33; /* Màu xanh lá đậm */
                    border-left: 1px solid rgba(255,255,255,0.8);
                    border-right: 1px solid rgba(255,255,255,0.8);
                    box-shadow: 0 0 10px rgba(51, 204, 51, 0.6);
                }
                
                .wave-marker-end {
                    background-color: #9933ff; /* Màu tím */
                    border-left: 1px solid rgba(255,255,255,0.8);
                    border-right: 1px solid rgba(255,255,255,0.8);
                    box-shadow: 0 0 10px rgba(153, 51, 255, 0.6);
                }
            `;
            
            document.head.appendChild(styleSheet);
        } catch (e) {
            console.error("Lỗi khi thêm CSS:", e);
        }
    }
    
    function renderMarkers() {
        renderProgressBarMarkers();
        renderWaveMarkers();
    }
    
    // Trả về các phương thức công khai của module
    return {
        init,
        updateMarker,
        renderProgressBarMarkers,
        renderWaveMarkers,
        renderMarkers,
        clearMarkers,
        getMarkers: () => ({ ...markers })
    };
}