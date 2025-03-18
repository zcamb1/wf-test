<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>RealtimeWaveform Demo</title>
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
            margin-top: 20px;
            margin-bottom: 20px;
            border-radius: 4px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .info-text {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-left: 4px solid #3498db;
            border-radius: 4px;
            font-size: 14px;
            line-height: 1.5;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>RealtimeWaveform Demo</h1>
        
        <video id="videoPlayer" controls crossorigin="anonymous">
            <source src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4" type="video/mp4">
            Trình duyệt của bạn không hỗ trợ video HTML5.
        </video>
        
        <div id="waveform-container"></div>
        
        <div class="info-text">
            <p><strong>Lưu ý:</strong> Waveform tạo tự động và hiển thị theo kiểu thanh (bar) với màu xanh nước biển. Phần đã phát sẽ chuyển sang màu cam.</p>
            <p>Waveform được tạo dần dần theo tiến độ phát video, không cần tải toàn bộ video trước.</p>
            <p>Click vào waveform để di chuyển đến vị trí tương ứng trong video.</p>
        </div>
    </div>

    <!-- Thêm RealtimeWaveform script -->
    <script>
        /**
         * RealtimeWaveform - Thư viện hiển thị waveform realtime cho video/audio
         * Không cần tải toàn bộ file, tạo waveform theo tiến độ phát video
         */
        class RealtimeWaveform {
          /**
           * Khởi tạo waveform
           * @param {Object} options - Các tùy chọn
           * @param {HTMLElement|String} options.container - Element hoặc ID của container
           * @param {HTMLElement|String} options.mediaElement - Element hoặc ID của video/audio
           * @param {Number} options.height - Chiều cao của waveform (mặc định: 100)
           * @param {String} options.waveColor - Màu của waveform (mặc định: '#3498db' - xanh nước biển)
           * @param {String} options.progressColor - Màu phần đã phát (mặc định: '#f39c12' - cam)
           * @param {String} options.backgroundColor - Màu nền (mặc định: '#f8f9fa')
           * @param {Number} options.barWidth - Độ rộng thanh (mặc định: 3)
           * @param {Number} options.barGap - Khoảng cách giữa các thanh (mặc định: 1)
           * @param {Number} options.fftSize - Kích thước FFT cho phân tích (mặc định: 1024)
           */
          constructor(options) {
            // Xử lý options mặc định
            this.options = Object.assign({
              height: 100,
              waveColor: '#3498db',      // Xanh nước biển
              progressColor: '#f39c12',  // Cam
              backgroundColor: '#f8f9fa',
              barWidth: 3,
              barGap: 1,
              fftSize: 1024
            }, options);

            // Validate và lấy container
            if (!options.container) {
              throw new Error('RealtimeWaveform: Thiếu container');
            }
            this.container = typeof options.container === 'string' 
              ? document.getElementById(options.container) 
              : options.container;
            
            if (!this.container) {
              throw new Error('RealtimeWaveform: Không tìm thấy container');
            }

            // Validate và lấy media element
            if (!options.mediaElement) {
              throw new Error('RealtimeWaveform: Thiếu mediaElement');
            }
            this.mediaElement = typeof options.mediaElement === 'string' 
              ? document.getElementById(options.mediaElement) 
              : options.mediaElement;
            
            if (!this.mediaElement) {
              throw new Error('RealtimeWaveform: Không tìm thấy mediaElement');
            }

            // Biến trạng thái
            this.isInitialized = false;
            this.isAnalyzing = false;
            this.audioContext = null;
            this.analyser = null;
            this.mediaSource = null;
            this.dataArray = null;
            this.animationId = null;
            this.currentTime = 0;
            this.duration = 0;

            // Mảng lưu lịch sử dữ liệu
            this.barData = [];

            // Khởi tạo giao diện
            this._createUI();
            
            // Thiết lập sự kiện
            this._setupEvents();
            
            // Tự động khởi tạo
            this._autoInit();
          }

          /**
           * Tạo các phần tử UI
           * @private
           */
          _createUI() {
            // Tạo phần tử chứa waveform
            this.wrapperEl = document.createElement('div');
            this.wrapperEl.style.position = 'relative';
            this.wrapperEl.style.width = '100%';
            this.wrapperEl.style.height = `${this.options.height}px`;
            this.wrapperEl.style.backgroundColor = this.options.backgroundColor;
            this.wrapperEl.style.overflow = 'hidden';
            this.wrapperEl.style.borderRadius = '4px';
            this.wrapperEl.style.cursor = 'pointer';
            
            // Tạo canvas để vẽ waveform
            this.canvas = document.createElement('canvas');
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';

            // Tạo canvas để vẽ phần đã phát
            this.progressCanvas = document.createElement('canvas');
            this.progressCanvas.style.width = '100%';
            this.progressCanvas.style.height = '100%';
            this.progressCanvas.style.position = 'absolute';
            this.progressCanvas.style.top = '0';
            this.progressCanvas.style.left = '0';
            this.progressCanvas.style.clipPath = 'inset(0 100% 0 0)';

            // Tạo phần tử loading
            this.loadingEl = document.createElement('div');
            this.loadingEl.style.position = 'absolute';
            this.loadingEl.style.top = '0';
            this.loadingEl.style.left = '0';
            this.loadingEl.style.width = '100%';
            this.loadingEl.style.height = '100%';
            this.loadingEl.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
            this.loadingEl.style.display = 'flex';
            this.loadingEl.style.alignItems = 'center';
            this.loadingEl.style.justifyContent = 'center';
            this.loadingEl.style.color = '#333';
            this.loadingEl.style.fontSize = '14px';
            this.loadingEl.style.zIndex = '10';
            this.loadingEl.textContent = 'Đang khởi tạo waveform...';

            // Thêm các phần tử vào wrapper
            this.wrapperEl.appendChild(this.canvas);
            this.wrapperEl.appendChild(this.progressCanvas);
            this.wrapperEl.appendChild(this.loadingEl);

            // Thêm wrapper vào container
            this.container.appendChild(this.wrapperEl);

            // Set size cho canvas
            this._resizeCanvas();
          }

          /**
           * Điều chỉnh kích thước canvas
           * @private
           */
          _resizeCanvas() {
            const rect = this.wrapperEl.getBoundingClientRect();
            const width = rect.width;
            const height = rect.height;
            const dpr = window.devicePixelRatio || 1;
            
            // Đặt kích thước cho canvas chính
            this.canvas.width = width * dpr;
            this.canvas.height = height * dpr;
            const ctx = this.canvas.getContext('2d');
            ctx.scale(dpr, dpr);
            
            // Đặt kích thước cho canvas progress
            this.progressCanvas.width = width * dpr;
            this.progressCanvas.height = height * dpr;
            const progressCtx = this.progressCanvas.getContext('2d');
            progressCtx.scale(dpr, dpr);
            
            // Tính toán số lượng thanh có thể hiển thị
            const barWidth = this.options.barWidth;
            const barGap = this.options.barGap;
            this.totalBars = Math.floor(width / (barWidth + barGap));
            
            // Khởi tạo mảng dữ liệu
            if (!this.barData.length) {
              this.barData = new Array(this.totalBars).fill(0);
            } else if (this.barData.length < this.totalBars) {
              // Thêm thanh mới nếu cần
              const diff = this.totalBars - this.barData.length;
              this.barData = [...this.barData, ...new Array(diff).fill(0)];
            } else if (this.barData.length > this.totalBars) {
              // Cắt bớt thanh nếu cần
              this.barData = this.barData.slice(0, this.totalBars);
            }
            
            // Vẽ lại waveform
            this._drawWaveform();
          }

          /**
           * Thiết lập các sự kiện
           * @private
           */
          _setupEvents() {
            // Sự kiện resize
            window.addEventListener('resize', this._resizeCanvas.bind(this));
            
            // Sự kiện click vào waveform
            this.wrapperEl.addEventListener('click', this._handleClick.bind(this));
            
            // Sự kiện timeupdate
            this.mediaElement.addEventListener('timeupdate', this._handleTimeUpdate.bind(this));
            
            // Sự kiện canplay
            this.mediaElement.addEventListener('canplay', () => {
              this.duration = this.mediaElement.duration;
              if (!this.isInitialized) {
                this._initialize();
              }
            });
            
            // Sự kiện play
            this.mediaElement.addEventListener('play', () => {
              if (this.isInitialized && !this.isAnalyzing) {
                this._startAnalyzing();
              }
            });
            
            // Sự kiện pause và ended
            this.mediaElement.addEventListener('pause', this._stopAnalyzing.bind(this));
            this.mediaElement.addEventListener('ended', this._stopAnalyzing.bind(this));
          }

          /**
           * Xử lý khi click vào waveform
           * @param {MouseEvent} e - Sự kiện click
           * @private
           */
          _handleClick(e) {
            if (!this.duration) return;
            
            const rect = this.wrapperEl.getBoundingClientRect();
            const clickPosition = (e.clientX - rect.left) / rect.width;
            
            // Đặt thời gian của media
            this.mediaElement.currentTime = this.duration * clickPosition;
          }

          /**
           * Xử lý khi thời gian video thay đổi
           * @private
           */
          _handleTimeUpdate() {
            this.currentTime = this.mediaElement.currentTime;
            
            // Cập nhật clipPath
            const progress = (this.currentTime / this.duration) * 100;
            this.progressCanvas.style.clipPath = `inset(0 ${100 - progress}% 0 0)`;
          }

          /**
           * Tự động khởi tạo khi media sẵn sàng
           * @private
           */
          _autoInit() {
            // Nếu video đã có metadata
            if (this.mediaElement.readyState >= 1) {
              this.duration = this.mediaElement.duration;
              this._initialize();
            }
            
            // Nếu đã tải đủ để phát
            if (this.mediaElement.readyState >= 3) {
              this.loadingEl.style.display = 'none';
            }
          }

          /**
           * Khởi tạo audio context và analyser
           * @private
           */
          async _initialize() {
            if (this.isInitialized) return;
            
            try {
              // Tạo audio context
              const AudioContext = window.AudioContext || window.webkitAudioContext;
              this.audioContext = new AudioContext();
              
              // Đảm bảo context được kích hoạt (cần tương tác người dùng)
              if (this.audioContext.state === 'suspended') {
                // Thêm sự kiện tạm thời để kích hoạt context
                const resumeContext = async () => {
                  await this.audioContext.resume();
                  document.body.removeEventListener('click', resumeContext);
                  document.body.removeEventListener('touchstart', resumeContext);
                };
                document.body.addEventListener('click', resumeContext);
                document.body.addEventListener('touchstart', resumeContext);
              }
              
              // Tạo analyser
              this.analyser = this.audioContext.createAnalyser();
              this.analyser.fftSize = this.options.fftSize;
              
              // Kết nối media với analyser
              this.mediaSource = this.audioContext.createMediaElementSource(this.mediaElement);
              this.mediaSource.connect(this.analyser);
              this.analyser.connect(this.audioContext.destination);
              
              // Khởi tạo mảng dữ liệu
              this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
              
              // Vẽ waveform ban đầu
              this._drawWaveform();
              
              // Đánh dấu đã khởi tạo
              this.isInitialized = true;
              
              // Ẩn loading
              this.loadingEl.style.display = 'none';
              
              // Bắt đầu phân tích nếu video đang phát
              if (!this.mediaElement.paused) {
                this._startAnalyzing();
              }
            } catch (error) {
              console.error('RealtimeWaveform: Lỗi khởi tạo', error);
              this.loadingEl.textContent = `Lỗi khởi tạo: ${error.message}`;
            }
          }

          /**
           * Bắt đầu phân tích âm thanh và cập nhật waveform
           * @private
           */
          _startAnalyzing() {
            if (!this.isInitialized || this.isAnalyzing) return;
            
            this.isAnalyzing = true;
            
            const analyzeFrame = () => {
              if (!this.isAnalyzing) return;
              
              // Lấy dữ liệu tần số
              this.analyser.getByteFrequencyData(this.dataArray);
              
              // Cập nhật waveform
              this._updateWaveform();
              
              // Tiếp tục phân tích trong frame tiếp theo
              this.animationId = requestAnimationFrame(analyzeFrame);
            };
            
            // Bắt đầu phân tích
            analyzeFrame();
          }

          /**
           * Dừng phân tích âm thanh
           * @private
           */
          _stopAnalyzing() {
            this.isAnalyzing = false;
            
            if (this.animationId) {
              cancelAnimationFrame(this.animationId);
              this.animationId = null;
            }
          }

          /**
           * Cập nhật dữ liệu waveform từ dữ liệu âm thanh hiện tại
           * @private
           */
          _updateWaveform() {
            if (!this.dataArray || !this.analyser) return;
            
            // Tính vị trí hiện tại dựa trên thời gian
            const currentPosition = Math.floor((this.currentTime / this.duration) * this.totalBars);
            
            // Tính giá trị trung bình của dữ liệu tần số
            let sum = 0;
            for (let i = 0; i < this.dataArray.length; i++) {
              sum += this.dataArray[i];
            }
            const average = sum / this.dataArray.length / 255;
            
            // Cập nhật thanh hiện tại
            if (currentPosition >= 0 && currentPosition < this.barData.length) {
              this.barData[currentPosition] = Math.max(this.barData[currentPosition], average);
            }
            
            // Vẽ lại waveform
            this._drawWaveform();
          }

          /**
           * Vẽ waveform
           * @private
           */
          _drawWaveform() {
            if (!this.canvas || !this.barData) return;
            
            const ctx = this.canvas.getContext('2d');
            const progressCtx = this.progressCanvas.getContext('2d');
            const width = this.canvas.width / (window.devicePixelRatio || 1);
            const height = this.canvas.height / (window.devicePixelRatio || 1);
            const middle = height / 2;
            
            // Xóa canvas
            ctx.clearRect(0, 0, width, height);
            progressCtx.clearRect(0, 0, width, height);
            
            // Đặt màu nền
            ctx.fillStyle = this.options.backgroundColor;
            ctx.fillRect(0, 0, width, height);
            
            // Vẽ đường trung tâm
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.beginPath();
            ctx.moveTo(0, middle);
            ctx.lineTo(width, middle);
            ctx.stroke();
            
            // Vẽ các thanh
            const barWidth = this.options.barWidth;
            const barGap = this.options.barGap;
            const totalBarWidth = barWidth + barGap;
            
            // Đặt màu
            ctx.fillStyle = this.options.waveColor;
            progressCtx.fillStyle = this.options.progressColor;
            
            for (let i = 0; i < this.barData.length; i++) {
              const value = this.barData[i];
              const x = i * totalBarWidth;
              
              // Tính chiều cao thanh
              const barHeight = Math.max(2, value * height * 0.8);
              
              // Vẽ thanh trên canvas chính
              ctx.fillRect(x, middle - barHeight / 2, barWidth, barHeight);
              
              // Vẽ thanh trên canvas progress
              progressCtx.fillRect(x, middle - barHeight / 2, barWidth, barHeight);
            }
          }

          /**
           * Hủy waveform và giải phóng tài nguyên
           * @public
           */
          destroy() {
            // Dừng phân tích
            this._stopAnalyzing();
            
            // Hủy các sự kiện
            window.removeEventListener('resize', this._resizeCanvas.bind(this));
            this.wrapperEl.removeEventListener('click', this._handleClick.bind(this));
            this.mediaElement.removeEventListener('timeupdate', this._handleTimeUpdate.bind(this));
            
            // Ngắt kết nối audio
            if (this.mediaSource && this.audioContext) {
              this.mediaSource.disconnect();
              this.analyser.disconnect();
            }
            
            // Đóng audio context
            if (this.audioContext && this.audioContext.state !== 'closed') {
              this.audioContext.close();
            }
            
            // Xóa các phần tử DOM
            if (this.container.contains(this.wrapperEl)) {
              this.container.removeChild(this.wrapperEl);
            }
          }
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            const videoElement = document.getElementById('videoPlayer');
            const container = document.getElementById('waveform-container');
            
            // Khởi tạo RealtimeWaveform
            const waveform = new RealtimeWaveform({
                container: container,
                mediaElement: videoElement,
                height: 100,
                waveColor: '#3498db',       // Màu xanh nước biển
                progressColor: '#f39c12',   // Màu cam
                backgroundColor: '#f8f9fa', // Màu nền nhẹ
                barWidth: 3,
                barGap: 1
            });
            
            // Xử lý khi trang bị unload
            window.addEventListener('beforeunload', function() {
                waveform.destroy();
            });
        });
    </script>
</body>
</html>
