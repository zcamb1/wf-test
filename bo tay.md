```
const elements = {
    videoPlayer: $('#my-player'),
    fpsBadge: $('#fpsBadge'),
    hiddenVideo: $('#hiddenVideo')
};
```

// Thay vì sử dụng giá trị cố định trong code
const defaultFPS = 24;
const timeoutId = setTimeout(() => { ... }, 5000);
settings.timeLimit + 3000

// Nên định nghĩa các hằng số ở đầu file/module
const DEFAULT_FPS = 24;
const VIDEO_LOAD_TIMEOUT = 5000; // ms
const TIMEOUT_BUFFER = 3000; // ms

```
/**
 * custom-controls.js - Modern video controls with YouTube-style UI
 * 
 * This module creates custom video controls that replace the default HTML5 video controls.
 * Features: progress bar, play/pause, volume, fullscreen, playback speed, keyboard controls,
 * touch support, and wavesurfer integration for audio visualization.
 * 
 * @version 2.0.0
 * @author YourName
 * @license MIT
 */

/**
 * Initialize and manage custom video controls with YouTube-style UI
 * Main function handling all video control logic
 */
function setupCustomControls() {
    // ----------------------------------------------------------------------------------
    // SECTION 1: CONSTANTS AND DOM ELEMENT REFERENCES
    // ----------------------------------------------------------------------------------
    
    // Control display timing constants
    const CONTROLS_HIDE_DELAY = 2000;   // ms - time before controls auto-hide
    const CONTROLS_FADE_TIME = 500;     // ms - time after play before hiding controls
    const VOLUME_ADJUST_STEP = 0.05;    // Volume adjustment step for keyboard controls
    
    // Frame navigation constants
    const FRAME_STEP_SMALL = 1;         // Single frame step
    const FRAME_STEP_LARGE = 10;        // Large frame step (with Shift key)
    const TIME_PRECISION = 0.001;       // Epsilon value for time precision
    const DEFAULT_FPS = 24;             // Default FPS if not detected
    
    // Media element references - converted to use jQuery consistently
    const $videoPlayer = $('#my-player');
    const $videoWrapper = $('.video-wrapper');
    const $customControls = $('.custom-video-controls');
    
    // Control buttons and elements
    const $playPauseBtn = $('#customPlayPause');
    const $playPauseIcon = $playPauseBtn.find('i');
    const $timeInfo = $('#customTimeInfo');
    
    // Progress bar elements
    const $progressContainer = $('#customProgressContainer');
    const $progressBarPlayed = $('#customProgressPlayed');
    const $progressThumb = $('#customProgressThumb');
    const $progressBuffer = $('#customProgressBuffer');
    
    // Volume controls
    const $volumeBtn = $('#customVolume');
    const $volumeIcon = $volumeBtn.find('i');
    const $volumeSlider = $('#customVolumeSlider');
    
    // Additional controls
    const $fullscreenBtn = $('#customFullscreen');
    const $fullscreenIcon = $fullscreenBtn.find('i');
    const $settingsBtn = $('#customSettings');
    const $speedMenu = $('#speedMenu');
    const $speedOptions = $speedMenu.find('.speed-option');
    
    // Timecode display
    const $timeCode = $('#timecode');

    /**
     * State management variables
     * Track UI state and user interactions
     */
    const state = {
        isDraggingProgressBar: false,    // Is user currently dragging progress bar
        isMouseOverControls: false,      // Is mouse hovering over controls
        lastVolume: 1,                   // Remember volume before muting
        buffering: false,                // Is video currently buffering
        controlsTimeout: null,           // Timeout ID for hiding controls
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
    
    /**
     * External references
     * Access external variables and objects from parent scope
     */
    const fps = window.fps || DEFAULT_FPS;  // Frames per second, default to 24
    const wavesurfer = window.wavesurfer;   // Wavesurfer instance if available
    
    // ----------------------------------------------------------------------------------
    // SECTION 2: UTILITY FUNCTIONS
    // ----------------------------------------------------------------------------------

    /**
     * Format time in seconds to MM:SS display format
     * 
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string (MM:SS)
     */
    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        
        // Format with leading zero for seconds if needed
        const fsecs = secs < 10 ? "0" + secs : secs;
        
        return `${mins}:${fsecs}`;
    }

    /**
     * Log debug messages if debug mode is enabled
     * 
     * @param {string} message - Debug message
     * @param {*} [data] - Optional data to log
     */
    function logDebug(message, data) {
        if (window.DEBUG_VIDEO_CONTROLS) {
            if (data !== undefined) {
                console.log(`[VideoControls] ${message}`, data);
            } else {
                console.log(`[VideoControls] ${message}`);
            }
        }
    }
    
    /**
     * Safely access properties that might be undefined
     * 
     * @param {Function} fn - Function that accesses potentially undefined properties
     * @param {*} defaultVal - Default value if access fails
     * @returns {*} Result of function or default value
     */
    function safe(fn, defaultVal) {
        try {
            const result = fn();
            return (result === undefined || result === null) ? defaultVal : result;
        } catch (e) {
            return defaultVal;
        }
    }

    // ----------------------------------------------------------------------------------
    // SECTION 3: UI UPDATE FUNCTIONS
    // ----------------------------------------------------------------------------------

    /**
     * Update play/pause button icon based on video state
     */
    function updatePlayPauseIcon() {
        if ($videoPlayer[0].paused || $videoPlayer[0].ended) {
            $playPauseIcon.removeClass('fa-pause').addClass('fa-play');
            $playPauseBtn.attr('title', 'Play');
        } else {
            $playPauseIcon.removeClass('fa-play').addClass('fa-pause');
            $playPauseBtn.attr('title', 'Pause');
        }
    }

    /**
     * Update volume UI (icon and slider) based on volume and mute state
     * 
     * @param {number} volume - Current volume level (0-1)
     * @param {boolean} muted - Whether audio is muted
     */
    function updateVolumeUI(volume, muted) {
        $volumeSlider.val(muted ? 0 : volume);
        
        // Remove all volume icons first
        $volumeIcon.removeClass('fa-volume-up fa-volume-down fa-volume-mute');
        
        if (muted || volume === 0) {
            $volumeIcon.addClass('fa-volume-mute');
            $volumeBtn.attr('title', 'Unmute');
        } else if (volume < 0.5) {
            $volumeIcon.addClass('fa-volume-down');
            $volumeBtn.attr('title', 'Mute');
        } else {
            $volumeIcon.addClass('fa-volume-up');
            $volumeBtn.attr('title', 'Mute');
        }
    }

    /**
     * Update progress bar, thumb position, and time display
     */
    function updateProgressUI() {
        const videoEl = $videoPlayer[0];
        
        // Skip if video metadata not loaded
        if (!videoEl.duration || isNaN(videoEl.duration)) return;
        
        // Calculate percentage of video played
        const percentage = (videoEl.currentTime / videoEl.duration) * 100;
        
        // Only update UI if not currently dragging
        if (!state.isDraggingProgressBar) {
            $progressBarPlayed.css('width', `${percentage}%`);
            $progressThumb.css('left', `${percentage}%`);
        }
        
        // Always update time display
        const currentTimeFormatted = formatTime(videoEl.currentTime);
        const durationFormatted = formatTime(videoEl.duration);
        $timeInfo.text(`${currentTimeFormatted} / ${durationFormatted}`);
        
        // Synchronize with time code input
        if (!window.isUserChanging) {
            $timeCode.val((videoEl.currentTime * 1000).toFixed(0));
        }
        
        // Synchronize with original progress bar
        $('#progressbar').css('width', `${percentage}%`);
    }

    /**
     * Update buffered progress indicator
     */
    function updateBufferUI() {
        const videoEl = $videoPlayer[0];
        
        // Skip if video not loaded or no buffering info
        if (!videoEl.duration || isNaN(videoEl.duration) || videoEl.buffered.length === 0) {
            $progressBuffer.css('width', '0%');
            return;
        }
        
        try {
            // Find furthest buffered position
            let bufferedEnd = 0;
            for (let i = 0; i < videoEl.buffered.length; i++) {
                bufferedEnd = Math.max(bufferedEnd, videoEl.buffered.end(i));
            }
            
            // Calculate percentage and update UI
            const bufferPercentage = (bufferedEnd / videoEl.duration) * 100;
            $progressBuffer.css('width', `${bufferPercentage}%`);
        } catch (error) {
            // Handle any errors by resetting buffer display
            $progressBuffer.css('width', '0%');
            logDebug('Buffer update error', error);
        }
    }

    /**
     * Update fullscreen button icon based on current state
     */
    function updateFullscreenIcon() {
        const fullscreenEl = document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.msFullscreenElement;
        
        if (fullscreenEl === $videoWrapper[0]) {
            $fullscreenIcon.removeClass('fa-expand').addClass('fa-compress');
            $fullscreenBtn.attr('title', 'Exit Fullscreen');
        } else {
            $fullscreenIcon.removeClass('fa-compress').addClass('fa-expand');
            $fullscreenBtn.attr('title', 'Fullscreen');
        }
    }
    
    /**
     * Update active speed option in menu
     * 
     * @param {number} speed - Current playback speed
     */
    function updateSpeedMenu(speed) {
        $speedOptions.removeClass('active');
        $speedOptions.filter(`[data-speed="${speed}"]`).addClass('active');
    }

    // ----------------------------------------------------------------------------------
    // SECTION 4: VIDEO CONTROL FUNCTIONS
    // ----------------------------------------------------------------------------------

    /**
     * Toggle fullscreen mode
     * Support multiple browser implementations
     */
    function toggleFullscreen() {
        // Check if already in fullscreen
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.msFullscreenElement) {
            
            // Enter fullscreen
            const wrapper = $videoWrapper[0];
            
            if (wrapper.requestFullscreen) {
                wrapper.requestFullscreen().catch(err => {
                    logDebug(`Fullscreen error: ${err.message}`);
                });
            } else if (wrapper.webkitRequestFullscreen) {
                wrapper.webkitRequestFullscreen();
            } else if (wrapper.msRequestFullscreen) {
                wrapper.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
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
     * Seek to a specific frame with frame accuracy
     * 
     * @param {number} frameOffset - Number of frames to seek (positive or negative)
     */
    function seekToFrame(frameOffset) {
        const videoEl = $videoPlayer[0];
        
        // Validate parameters
        if (fps <= 0 || !videoEl.duration) return;

        // Save playback state
        const wasPlaying = !videoEl.paused;
        if (wasPlaying) videoEl.pause();

        // Calculate frame-accurate position
        const currentTime = videoEl.currentTime;
        const frameDuration = 1 / fps;
        const currentFrame = Math.round((currentTime + TIME_PRECISION) * fps);
        const targetFrame = Math.max(0, currentFrame + frameOffset);
        const newTime = targetFrame * frameDuration;
        const boundedTime = Math.max(0, Math.min(newTime, videoEl.duration));

        logDebug(`Seeking from frame ${currentFrame} to ${targetFrame} (${boundedTime.toFixed(3)}s)`);
        
        // Update video position
        videoEl.currentTime = boundedTime;

        // Update UI elements
        $timeCode.val((boundedTime * 1000).toFixed(0));
        updateProgressUI();
        
        // Synchronize with wavesurfer if available
        if (wavesurfer) {
            wavesurfer.seekTo(boundedTime / videoEl.duration);
        }
    }

    /**
     * Seek to position based on user interaction with progress bar
     * 
     * @param {Event} event - Mouse or touch event
     */
    function seek(event) {
        const videoEl = $videoPlayer[0];
        
        // Skip if video not loaded
        if (!videoEl.duration || isNaN(videoEl.duration)) return;

        // Get pointer position
        const rect = $progressContainer[0].getBoundingClientRect();
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        if (clientX === undefined) return;

        // Calculate relative position and progress
        const clickX = clientX - rect.left;
        let progress = clickX / rect.width;
        progress = Math.max(0, Math.min(1, progress));

        // Calculate target time
        let targetTime = progress * videoEl.duration;

        // Snap to frame boundaries if FPS available
        if (fps > 0) {
            const frameDuration = 1 / fps;
            targetTime = Math.round(targetTime / frameDuration) * frameDuration;
        }

        // Ensure time is within video range
        targetTime = Math.max(0, Math.min(targetTime, videoEl.duration));

        // Update video position
        videoEl.currentTime = targetTime;
            
        // Sync with wavesurfer
        if (wavesurfer) {
            wavesurfer.seekTo(progress);
        }

        // Update UI
        const percentage = progress * 100;
        $progressBarPlayed.css('width', `${percentage}%`);
        $progressThumb.css('left', `${percentage}%`);
        $timeCode.val((targetTime * 1000).toFixed(0));
        $timeInfo.text(`${formatTime(targetTime)} / ${formatTime(videoEl.duration)}`);
        $('#progressbar').css('width', `${percentage}%`);
    }
    
    /**
     * Toggle video playback
     */
    function togglePlayback() {
        const videoEl = $videoPlayer[0];
        
        if (videoEl.paused || videoEl.ended) {
            videoEl.play().catch(err => {
                logDebug("Play error", err);
                updatePlayPauseIcon();
            });
        } else {
            videoEl.pause();
        }
    }
    
    /**
     * Toggle mute state
     */
    function toggleMute() {
        const videoEl = $videoPlayer[0];
        
        if (videoEl.muted) {
            videoEl.muted = false;
            videoEl.volume = state.lastVolume || 0.5;
        } else {
            state.lastVolume = videoEl.volume;
            videoEl.muted = true;
        }
    }
    
    /**
     * Adjust volume by a specific amount
     * 
     * @param {number} amount - Amount to change volume (-1 to 1)
     */
    function adjustVolume(amount) {
        const videoEl = $videoPlayer[0];
        
        // Unmute if currently muted
        if (videoEl.muted && amount > 0) {
            videoEl.muted = false;
        }
        
        // Calculate new volume
        let newVolume = videoEl.muted ? 0 : videoEl.volume + amount;
        newVolume = Math.max(0, Math.min(1, newVolume));
        
        // Update video volume
        videoEl.volume = newVolume;
        
        // Update mute state based on volume
        if (newVolume === 0) {
            videoEl.muted = true;
        }
    }

    // ----------------------------------------------------------------------------------
    // SECTION 5: CONTROLS VISIBILITY MANAGEMENT
    // ----------------------------------------------------------------------------------

    /**
     * Show video controls
     */
    function showControls() {
        clearTimeout(state.controlsTimeout);
        
        $videoWrapper.addClass('controls-visible');
        $customControls.css('opacity', '1');
    }
    
    /**
     * Hide video controls after delay
     */
    function hideControls() {
        // Only hide if all conditions met:
        // - Video is playing
        // - Not dragging progress bar
        // - Mouse not over controls
        // - Not buffering
        if (!$videoPlayer[0].paused && 
            !state.isDraggingProgressBar && 
            !state.isMouseOverControls &&
            !state.buffering) {
            
            state.controlsTimeout = setTimeout(function() {
                $videoWrapper.removeClass('controls-visible');
                $customControls.css('opacity', '0');
            }, CONTROLS_HIDE_DELAY);
        }
    }

    // ----------------------------------------------------------------------------------
    // SECTION 6: PROGRESS BAR INTERACTION HANDLERS
    // ----------------------------------------------------------------------------------

    /**
     * Handle start of progress bar drag
     * 
     * @param {Event} e - Mouse or touch event
     */
    function handleSeekStart(e) {
        state.isDraggingProgressBar = true;
        
        // Disable transitions for smooth dragging
        $progressBarPlayed.addClass('no-transition');
        $progressThumb.addClass('no-transition');
        
        // Add seeking class for visual feedback
        $videoWrapper.addClass('seeking');
        
        // Update position
        seek(e);
    }
    
    /**
     * Handle progress bar dragging movement
     * 
     * @param {Event} e - Mouse or touch event
     */
    function handleSeekMove(e) {
        if (state.isDraggingProgressBar) {
            e.preventDefault();
            seek(e);
        }
    }
    
    /**
     * Handle end of progress bar drag
     */
    function handleSeekEnd() {
        if (state.isDraggingProgressBar) {
            state.isDraggingProgressBar = false;
            
            // Re-enable transitions
            $progressBarPlayed.removeClass('no-transition');
            $progressThumb.removeClass('no-transition');
            
            // Remove seeking class
            $videoWrapper.removeClass('seeking');
        }
    }

    // ----------------------------------------------------------------------------------
    // SECTION 7: EVENT LISTENERS - VIDEO EVENTS
    // ----------------------------------------------------------------------------------
    
    // Video playback state changes
    $videoPlayer.on('play', function() {
        updatePlayPauseIcon();
        
        // Schedule hiding controls
        clearTimeout(state.controlsTimeout);
        setTimeout(function() { 
            if (!state.isMouseOverControls) hideControls(); 
        }, CONTROLS_FADE_TIME);
    });
    
    $videoPlayer.on('pause ended', function() {
        updatePlayPauseIcon();
        showControls();
    });
    
    // Video loading and buffering events
    $videoPlayer.on('loadedmetadata', function() {
        const videoEl = $videoPlayer[0];
        if (!isNaN(videoEl.duration)) {
            $timeInfo.text(`${formatTime(videoEl.currentTime)} / ${formatTime(videoEl.duration)}`);
            updateProgressUI();
            updateBufferUI();
        }
    });
    
    $videoPlayer.on('waiting', function() {
        state.buffering = true;
        showControls(); // Show controls during buffering
    });
    
    $videoPlayer.on('canplay playing', function() {
        state.buffering = false;
        if (!$videoPlayer[0].paused) {
            hideControls();
        }
    });
    
    // Playback updates
    $videoPlayer.on('timeupdate', function() {
        if (!state.isDraggingProgressBar) {
            updateProgressUI();
        }
    });
    
    $videoPlayer.on('progress', updateBufferUI);
    
    // Volume changes
    $videoPlayer.on('volumechange', function() {
        const videoEl = $videoPlayer[0];
        updateVolumeUI(videoEl.volume, videoEl.muted);
    });
    
    // Video ended
    $videoPlayer.on('ended', function() {
        updatePlayPauseIcon();
        showControls();
    });

    // ----------------------------------------------------------------------------------
    // SECTION 8: EVENT LISTENERS - UI INTERACTIONS
    // ----------------------------------------------------------------------------------
    
    // Play/Pause button
    $playPauseBtn.on('click', function(e) {
        e.stopPropagation();
        togglePlayback();
    });

    // Volume button
    $volumeBtn.on('click', function(e) {
        e.stopPropagation();
        toggleMute();
    });
    
    // Volume slider
    $volumeSlider.on('input', function(e) {
        e.stopPropagation();
        const videoEl = $videoPlayer[0];
        const value = parseFloat(e.target.value);
        
        videoEl.volume = value;
        videoEl.muted = value === 0;
    });
    
    $volumeSlider.on('click', function(e) {
        e.stopPropagation();
    });

    // Fullscreen button
    $fullscreenBtn.on('click', function(e) {
        e.stopPropagation();
        toggleFullscreen();
    });

    // Settings button and speed menu
    $settingsBtn.on('click', function(e) {
        e.stopPropagation();
        $speedMenu.toggleClass('visible');
    });

    // Speed selection options
    $speedOptions.each(function() {
        $(this).on('click', function(e) {
            e.stopPropagation();
            
            $speedOptions.removeClass('active');
            $(this).addClass('active');
            
            const newSpeed = parseFloat($(this).data('speed'));
            if (!isNaN(newSpeed)) {
                $videoPlayer[0].playbackRate = newSpeed;
                
                // Add visual feedback - flash the indicator briefly
                $(this).addClass('speed-changed');
                setTimeout(() => {
                    $(this).removeClass('speed-changed');
                }, 300);
            }
            
            $speedMenu.removeClass('visible');
        });
    });

    // Close speed menu when clicking elsewhere
    $(document).on('click', function(e) {
        if ($speedMenu.hasClass('visible') && 
            !$speedMenu.is(e.target) && 
            !$settingsBtn.is(e.target) && 
            $speedMenu.has(e.target).length === 0) {
            $speedMenu.removeClass('visible');
        }
    });

    // Progress bar interactions
    $progressContainer.on('mousedown', handleSeekStart);
    $(document).on('mousemove', handleSeekMove);
    $(document).on('mouseup', handleSeekEnd);
    
    // Touch support for progress bar
    $progressContainer.on('touchstart', function(e) {
        handleSeekStart(e.originalEvent);
    });
    
    $(document).on('touchmove', function(e) {
        if (state.isDraggingProgressBar) {
            handleSeekMove(e.originalEvent);
        }
    });
    
    $(document).on('touchend touchcancel', handleSeekEnd);
    
    // Simple click on progress bar (not dragging)
    $progressContainer.on('click', function(e) {
        if (!state.isDraggingProgressBar && !$videoWrapper.hasClass('seeking')) {
            seek(e);
        }
    });

    // Controls visibility management
    $customControls.on('mouseenter', function() { 
        state.isMouseOverControls = true; 
        showControls(); 
    });
    
    $customControls.on('mouseleave', function() { 
        state.isMouseOverControls = false; 
        hideControls(); 
    });
    
    $videoWrapper.on('mouseenter mousemove', showControls);
    
    $videoWrapper.on('mouseleave', function() { 
        if (!state.isMouseOverControls) hideControls(); 
    });
    
    // Double-click to toggle fullscreen
    $videoWrapper.on('dblclick', function(e) {
        // Skip if clicking on controls
        if (!$(e.target).closest('.custom-video-controls').length) {
            toggleFullscreen();
        }
    });
    
    // Fullscreen change events
    $(document).on('fullscreenchange webkitfullscreenchange msfullscreenchange', updateFullscreenIcon);

    // ----------------------------------------------------------------------------------
    // SECTION 9: KEYBOARD SHORTCUTS
    // ----------------------------------------------------------------------------------
    
    $(document).on('keydown', function(e) {
        // Skip if focus is on an input
        if ($(document.activeElement).is('input, textarea, select')) return;
        
        // Process keyboard shortcuts
        switch (e.key) {
            case ' ':
            case 'Space':
                // Space - toggle play/pause
                e.preventDefault();
                togglePlayback();
                break;
                
            case 'ArrowLeft':
                // Left arrow - seek backward
                e.preventDefault();
                seekToFrame(e.shiftKey ? -FRAME_STEP_LARGE : -FRAME_STEP_SMALL);
                break;
                
            case 'ArrowRight':
                // Right arrow - seek forward
                e.preventDefault();
                seekToFrame(e.shiftKey ? FRAME_STEP_LARGE : FRAME_STEP_SMALL);
                break;
                
            case 'ArrowUp':
                // Up arrow - increase volume
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    adjustVolume(VOLUME_ADJUST_STEP);
                }
                break;
                
            case 'ArrowDown':
                // Down arrow - decrease volume
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    adjustVolume(-VOLUME_ADJUST_STEP);
                }
                break;
                
            case 'm':
            case 'M':
                // M - toggle mute
                e.preventDefault();
                toggleMute();
                break;
                
            case 'f':
            case 'F':
                // F - toggle fullscreen
                e.preventDefault();
                toggleFullscreen();
                break;
        }
    });

    // ----------------------------------------------------------------------------------
    // SECTION 10: INITIALIZATION
    // ----------------------------------------------------------------------------------
    
    /**
     * Initialize all controls and UI state
     */
    function initializeControls() {
        const videoEl = $videoPlayer[0];
        
        // Update UI elements
        updatePlayPauseIcon();
        updateVolumeUI(videoEl.volume, videoEl.muted);
        updateFullscreenIcon();
        updateSpeedMenu(videoEl.playbackRate);
        
        // Initialize time display and progress if metadata loaded
        if (videoEl.readyState >= 1 && !isNaN(videoEl.duration)) {
            $timeInfo.text(`${formatTime(videoEl.currentTime)} / ${formatTime(videoEl.duration)}`);
            updateProgressUI();
            updateBufferUI();
        } else {
            // Or wait for metadata to load
            $videoPlayer.one('loadedmetadata', function() {
                if (!isNaN(videoEl.duration)) {
                    $timeInfo.text(`${formatTime(videoEl.currentTime)} / ${formatTime(videoEl.duration)}`);
                    updateProgressUI();
                    updateBufferUI();
                }
            });
        }
        
        // Set initial controls visibility
        if (videoEl.paused) {
            showControls();
        } else {
            $customControls.css('opacity', '0');
            $videoWrapper.removeClass('controls-visible');
        }
        
        // Apply mobile-specific adjustments
        if (state.isMobile) {
            $videoWrapper.addClass('mobile-device');
            
            // Always show controls on mobile when video is paused
            $videoPlayer.on('pause', function() {
                $customControls.css('opacity', '1');
            });
        }
        
        logDebug("Custom video controls initialized");
    }
    
    // Run initialization
    initializeControls();
}

/**
 * Add HTML for controls and initialize when document is ready
 */
$(document).ready(function() {
    // Create HTML for controls using template
    const CONTROLS_HTML = `
    <!-- Custom video controls - YouTube style UI -->
    <div class="custom-video-controls">
        <!-- Progress bar container -->
        <div class="custom-progress-container" id="customProgressContainer">
            <div class="custom-progress-bar" id="customProgressBarBackground">
                <div class="custom-progress-buffer" id="customProgressBuffer"></div>
                <div class="custom-progress-played" id="customProgressPlayed"></div>
                <div class="custom-progress-thumb" id="customProgressThumb"></div>
            </div>
        </div>
        
        <!-- Main controls area -->
        <div class="main-controls-area">
            <!-- Play/Pause button -->
            <button id="customPlayPause" class="control-button" title="Play/Pause">
                <i class="fas fa-play"></i>
            </button>
            
            <!-- Time display -->
            <span id="customTimeInfo" class="time-info">0:00 / 0:00</span>
            
            <!-- Right-aligned controls -->
            <div class="controls-right">
                <!-- Volume controls -->
                <div class="volume-control">
                    <button id="customVolume" class="control-button" title="Mute/Unmute">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <input type="range" id="customVolumeSlider" class="volume-slider" min="0" max="1" step="0.05" value="1">
                </div>
                
                <!-- Fullscreen button -->
                <button id="customFullscreen" class="control-button" title="Fullscreen">
                    <i class="fas fa-expand"></i>
                </button>
                
                <!-- Settings menu -->
                <div class="settings-control">
                    <button id="customSettings" class="control-button" title="Settings">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div class="speed-menu" id="speedMenu">
                        <div class="speed-menu-header">Playback Speed</div>

```

Trên đây là phiên bản cải tiến của code điều khiển video. Tôi đã thực hiện các thay đổi sau:

Cấu trúc rõ ràng hơn: Chia code thành 10 phần chức năng rõ ràng với comment đánh dấu
Sử dụng jQuery nhất quán: Chuyển từ trộn lẫn DOM thuần và jQuery sang sử dụng jQuery nhất quán với tiền tố $
Thêm hằng số: Thay thế các giá trị cứng bằng hằng số có tên có ý nghĩa (CONTROLS_HIDE_DELAY, FRAME_STEP_SMALL, v.v.)
Cải thiện xử lý sự kiện: Thêm xử lý cho nhiều sự kiện bàn phím như mute (phím M), phím tăng/giảm âm lượng
Quản lý trạng thái tốt hơn: Sử dụng đối tượng state để quản lý các trạng thái liên quan giúp code rõ ràng hơn
Tối ưu hiệu suất: Giảm gọi hàm không cần thiết và cải thiện xử lý sự kiện
Thêm chức năng mới:

Double-click để chuyển đổi fullscreen
Phát hiện thiết bị di động và điều chỉnh UI phù hợp
Phản hồi trực quan khi thay đổi tốc độ phát

```
/**
 * custom-controls.js - Modern video controls with YouTube-style UI
 * 
 * This module creates custom video controls that replace the default HTML5 video controls.
 * Features: progress bar, play/pause, volume, fullscreen, playback speed, keyboard controls,
 * touch support, and wavesurfer integration for audio visualization.
 * 
 * @version 2.0.0
 * @author YourName
 * @license MIT
 */

/**
 * Initialize and manage custom video controls with YouTube-style UI
 * Main function handling all video control logic
 */
function setupCustomControls() {
    // ----------------------------------------------------------------------------------
    // SECTION 1: CONSTANTS AND DOM ELEMENT REFERENCES
    // ----------------------------------------------------------------------------------
    
    // Control display timing constants
    const CONTROLS_HIDE_DELAY = 2000;   // ms - time before controls auto-hide
    const CONTROLS_FADE_TIME = 500;     // ms - time after play before hiding controls
    const VOLUME_ADJUST_STEP = 0.05;    // Volume adjustment step for keyboard controls
    
    // Frame navigation constants
    const FRAME_STEP_SMALL = 1;         // Single frame step
    const FRAME_STEP_LARGE = 10;        // Large frame step (with Shift key)
    const TIME_PRECISION = 0.001;       // Epsilon value for time precision
    const DEFAULT_FPS = 24;             // Default FPS if not detected
    
    // Media element references - converted to use jQuery consistently
    const $videoPlayer = $('#my-player');
    const $videoWrapper = $('.video-wrapper');
    const $customControls = $('.custom-video-controls');
    
    // Control buttons and elements
    const $playPauseBtn = $('#customPlayPause');
    const $playPauseIcon = $playPauseBtn.find('i');
    const $timeInfo = $('#customTimeInfo');
    
    // Progress bar elements
    const $progressContainer = $('#customProgressContainer');
    const $progressBarPlayed = $('#customProgressPlayed');
    const $progressThumb = $('#customProgressThumb');
    const $progressBuffer = $('#customProgressBuffer');
    
    // Volume controls
    const $volumeBtn = $('#customVolume');
    const $volumeIcon = $volumeBtn.find('i');
    const $volumeSlider = $('#customVolumeSlider');
    
    // Additional controls
    const $fullscreenBtn = $('#customFullscreen');
    const $fullscreenIcon = $fullscreenBtn.find('i');
    const $settingsBtn = $('#customSettings');
    const $speedMenu = $('#speedMenu');
    const $speedOptions = $speedMenu.find('.speed-option');
    
    // Timecode display
    const $timeCode = $('#timecode');

    /**
     * State management variables
     * Track UI state and user interactions
     */
    const state = {
        isDraggingProgressBar: false,    // Is user currently dragging progress bar
        isMouseOverControls: false,      // Is mouse hovering over controls
        lastVolume: 1,                   // Remember volume before muting
        buffering: false,                // Is video currently buffering
        controlsTimeout: null,           // Timeout ID for hiding controls
        lastClickTime: 0,                // Track click time for preventing double actions
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    };
    
    /**
     * External references
     * Access external variables and objects from parent scope
     */
    const fps = window.fps || DEFAULT_FPS;  // Frames per second, default to 24
    const wavesurfer = window.wavesurfer;   // Wavesurfer instance if available
    
    // ----------------------------------------------------------------------------------
    // SECTION 2: UTILITY FUNCTIONS
    // ----------------------------------------------------------------------------------

    /**
     * Format time in seconds to MM:SS display format
     * 
     * @param {number} seconds - Time in seconds
     * @returns {string} Formatted time string (MM:SS)
     */
    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        
        // Format with leading zero for seconds if needed
        const fsecs = secs < 10 ? "0" + secs : secs;
        
        return `${mins}:${fsecs}`;
    }

    /**
     * Log debug messages if debug mode is enabled
     * 
     * @param {string} message - Debug message
     * @param {*} [data] - Optional data to log
     */
    function logDebug(message, data) {
        if (window.DEBUG_VIDEO_CONTROLS) {
            if (data !== undefined) {
                console.log(`[VideoControls] ${message}`, data);
            } else {
                console.log(`[VideoControls] ${message}`);
            }
        }
    }
    
    /**
     * Safely access properties that might be undefined
     * 
     * @param {Function} fn - Function that accesses potentially undefined properties
     * @param {*} defaultVal - Default value if access fails
     * @returns {*} Result of function or default value
     */
    function safe(fn, defaultVal) {
        try {
            const result = fn();
            return (result === undefined || result === null) ? defaultVal : result;
        } catch (e) {
            return defaultVal;
        }
    }
    
    /**
     * Detect if click is on a control element
     * Used to prevent toggle playback when clicking on controls
     * 
     * @param {Event} e - Click event
     * @returns {boolean} True if click is on a control
     */
    function isClickOnControls(e) {
        return $(e.target).closest('.custom-video-controls').length > 0 ||
               $(e.target).closest('.speed-menu').length > 0;
    }

    // ----------------------------------------------------------------------------------
    // SECTION 3: UI UPDATE FUNCTIONS
    // ----------------------------------------------------------------------------------

    /**
     * Update play/pause button icon based on video state
     */
    function updatePlayPauseIcon() {
        if ($videoPlayer[0].paused || $videoPlayer[0].ended) {
            $playPauseIcon.removeClass('fa-pause').addClass('fa-play');
            $playPauseBtn.attr('title', 'Play');
        } else {
            $playPauseIcon.removeClass('fa-play').addClass('fa-pause');
            $playPauseBtn.attr('title', 'Pause');
        }
    }

    /**
     * Update volume UI (icon and slider) based on volume and mute state
     * 
     * @param {number} volume - Current volume level (0-1)
     * @param {boolean} muted - Whether audio is muted
     */
    function updateVolumeUI(volume, muted) {
        $volumeSlider.val(muted ? 0 : volume);
        
        // Remove all volume icons first
        $volumeIcon.removeClass('fa-volume-up fa-volume-down fa-volume-mute');
        
        if (muted || volume === 0) {
            $volumeIcon.addClass('fa-volume-mute');
            $volumeBtn.attr('title', 'Unmute');
        } else if (volume < 0.5) {
            $volumeIcon.addClass('fa-volume-down');
            $volumeBtn.attr('title', 'Mute');
        } else {
            $volumeIcon.addClass('fa-volume-up');
            $volumeBtn.attr('title', 'Mute');
        }
    }

    /**
     * Update progress bar, thumb position, and time display
     */
    function updateProgressUI() {
        const videoEl = $videoPlayer[0];
        
        // Skip if video metadata not loaded
        if (!videoEl.duration || isNaN(videoEl.duration)) return;
        
        // Calculate percentage of video played
        const percentage = (videoEl.currentTime / videoEl.duration) * 100;
        
        // Only update UI if not currently dragging
        if (!state.isDraggingProgressBar) {
            $progressBarPlayed.css('width', `${percentage}%`);
            $progressThumb.css('left', `${percentage}%`);
        }
        
        // Always update time display
        const currentTimeFormatted = formatTime(videoEl.currentTime);
        const durationFormatted = formatTime(videoEl.duration);
        $timeInfo.text(`${currentTimeFormatted} / ${durationFormatted}`);
        
        // Synchronize with time code input
        if (!window.isUserChanging) {
            $timeCode.val((videoEl.currentTime * 1000).toFixed(0));
        }
        
        // Synchronize with original progress bar
        $('#progressbar').css('width', `${percentage}%`);
    }

    /**
     * Update buffered progress indicator
     */
    function updateBufferUI() {
        const videoEl = $videoPlayer[0];
        
        // Skip if video not loaded or no buffering info
        if (!videoEl.duration || isNaN(videoEl.duration) || videoEl.buffered.length === 0) {
            $progressBuffer.css('width', '0%');
            return;
        }
        
        try {
            // Find furthest buffered position
            let bufferedEnd = 0;
            for (let i = 0; i < videoEl.buffered.length; i++) {
                bufferedEnd = Math.max(bufferedEnd, videoEl.buffered.end(i));
            }
            
            // Calculate percentage and update UI
            const bufferPercentage = (bufferedEnd / videoEl.duration) * 100;
            $progressBuffer.css('width', `${bufferPercentage}%`);
        } catch (error) {
            // Handle any errors by resetting buffer display
            $progressBuffer.css('width', '0%');
            logDebug('Buffer update error', error);
        }
    }

    /**
     * Update fullscreen button icon based on current state
     */
    function updateFullscreenIcon() {
        const fullscreenEl = document.fullscreenElement || 
                           document.webkitFullscreenElement || 
                           document.msFullscreenElement;
        
        if (fullscreenEl === $videoWrapper[0]) {
            $fullscreenIcon.removeClass('fa-expand').addClass('fa-compress');
            $fullscreenBtn.attr('title', 'Exit Fullscreen');
        } else {
            $fullscreenIcon.removeClass('fa-compress').addClass('fa-expand');
            $fullscreenBtn.attr('title', 'Fullscreen');
        }
    }
    
    /**
     * Update active speed option in menu
     * 
     * @param {number} speed - Current playback speed
     */
    function updateSpeedMenu(speed) {
        $speedOptions.removeClass('active');
        $speedOptions.filter(`[data-speed="${speed}"]`).addClass('active');
    }

    // ----------------------------------------------------------------------------------
    // SECTION 4: VIDEO CONTROL FUNCTIONS
    // ----------------------------------------------------------------------------------

    /**
     * Toggle fullscreen mode
     * Support multiple browser implementations
     */
    function toggleFullscreen() {
        // Check if already in fullscreen
        if (!document.fullscreenElement && 
            !document.webkitFullscreenElement && 
            !document.msFullscreenElement) {
            
            // Enter fullscreen
            const wrapper = $videoWrapper[0];
            
            if (wrapper.requestFullscreen) {
                wrapper.requestFullscreen().catch(err => {
                    logDebug(`Fullscreen error: ${err.message}`);
                });
            } else if (wrapper.webkitRequestFullscreen) {
                wrapper.webkitRequestFullscreen();
            } else if (wrapper.msRequestFullscreen) {
                wrapper.msRequestFullscreen();
            }
        } else {
            // Exit fullscreen
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
     * Seek to a specific frame with frame accuracy
     * 
     * @param {number} frameOffset - Number of frames to seek (positive or negative)
     */
    function seekToFrame(frameOffset) {
        const videoEl = $videoPlayer[0];
        
        // Validate parameters
        if (fps <= 0 || !videoEl.duration) return;

        // Save playback state
        const wasPlaying = !videoEl.paused;
        if (wasPlaying) videoEl.pause();

        // Calculate frame-accurate position
        const currentTime = videoEl.currentTime;
        const frameDuration = 1 / fps;
        const currentFrame = Math.round((currentTime + TIME_PRECISION) * fps);
        const targetFrame = Math.max(0, currentFrame + frameOffset);
        const newTime = targetFrame * frameDuration;
        const boundedTime = Math.max(0, Math.min(newTime, videoEl.duration));

        logDebug(`Seeking from frame ${currentFrame} to ${targetFrame} (${boundedTime.toFixed(3)}s)`);
        
        // Update video position
        videoEl.currentTime = boundedTime;

        // Update UI elements
        $timeCode.val((boundedTime * 1000).toFixed(0));
        updateProgressUI();
        
        // Synchronize with wavesurfer if available
        if (wavesurfer) {
            wavesurfer.seekTo(boundedTime / videoEl.duration);
        }
    }

    /**
     * Seek to position based on user interaction with progress bar
     * 
     * @param {Event} event - Mouse or touch event
     */
    function seek(event) {
        const videoEl = $videoPlayer[0];
        
        // Skip if video not loaded
        if (!videoEl.duration || isNaN(videoEl.duration)) return;

        // Get pointer position
        const rect = $progressContainer[0].getBoundingClientRect();
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        if (clientX === undefined) return;

        // Calculate relative position and progress
        const clickX = clientX - rect.left;
        let progress = clickX / rect.width;
        progress = Math.max(0, Math.min(1, progress));

        // Calculate target time
        let targetTime = progress * videoEl.duration;

        // Snap to frame boundaries if FPS available
        if (fps > 0) {
            const frameDuration = 1 / fps;
            targetTime = Math.round(targetTime / frameDuration) * frameDuration;
        }

        // Ensure time is within video range
        targetTime = Math.max(0, Math.min(targetTime, videoEl.duration));

        // Update video position
        videoEl.currentTime = targetTime;
            
        // Sync with wavesurfer
        if (wavesurfer) {
            wavesurfer.seekTo(progress);
        }

        // Update UI
        const percentage = progress * 100;
        $progressBarPlayed.css('width', `${percentage}%`);
        $progressThumb.css('left', `${percentage}%`);
        $timeCode.val((targetTime * 1000).toFixed(0));
        $timeInfo.text(`${formatTime(targetTime)} / ${formatTime(videoEl.duration)}`);
        $('#progressbar').css('width', `${percentage}%`);
    }
    
    /**
     * Toggle video playback
     */
    function togglePlayback() {
        const videoEl = $videoPlayer[0];
        
        if (videoEl.paused || videoEl.ended) {
            videoEl.play().catch(err => {
                logDebug("Play error", err);
                updatePlayPauseIcon();
            });
        } else {
            videoEl.pause();
        }
    }
    
    /**
     * Toggle mute state
     */
    function toggleMute() {
        const videoEl = $videoPlayer[0];
        
        if (videoEl.muted) {
            videoEl.muted = false;
            videoEl.volume = state.lastVolume || 0.5;
        } else {
            state.lastVolume = videoEl.volume;
            videoEl.muted = true;
        }
    }
    
    /**
     * Adjust volume by a specific amount
     * 
     * @param {number} amount - Amount to change volume (-1 to 1)
     */
    function adjustVolume(amount) {
        const videoEl = $videoPlayer[0];
        
        // Unmute if currently muted
        if (videoEl.muted && amount > 0) {
            videoEl.muted = false;
        }
        
        // Calculate new volume
        let newVolume = videoEl.muted ? 0 : videoEl.volume + amount;
        newVolume = Math.max(0, Math.min(1, newVolume));
        
        // Update video volume
        videoEl.volume = newVolume;
        
        // Update mute state based on volume
        if (newVolume === 0) {
            videoEl.muted = true;
        }
    }

    // ----------------------------------------------------------------------------------
    // SECTION 5: CONTROLS VISIBILITY MANAGEMENT
    // ----------------------------------------------------------------------------------

    /**
     * Show video controls
     */
    function showControls() {
        clearTimeout(state.controlsTimeout);
        
        $videoWrapper.addClass('controls-visible');
        $customControls.css('opacity', '1');
    }
    
    /**
     * Hide video controls after delay
     */
    function hideControls() {
        // Only hide if all conditions met:
        // - Video is playing
        // - Not dragging progress bar
        // - Mouse not over controls
        // - Not buffering
        if (!$videoPlayer[0].paused && 
            !state.isDraggingProgressBar && 
            !state.isMouseOverControls &&
            !state.buffering) {
            
            state.controlsTimeout = setTimeout(function() {
                $videoWrapper.removeClass('controls-visible');
                $customControls.css('opacity', '0');
            }, CONTROLS_HIDE_DELAY);
        }
    }

    // ----------------------------------------------------------------------------------
    // SECTION 6: PROGRESS BAR INTERACTION HANDLERS
    // ----------------------------------------------------------------------------------

    /**
     * Handle start of progress bar drag
     * 
     * @param {Event} e - Mouse or touch event
     */
    function handleSeekStart(e) {
        state.isDraggingProgressBar = true;
        
        // Disable transitions for smooth dragging
        $progressBarPlayed.addClass('no-transition');
        $progressThumb.addClass('no-transition');
        
        // Add seeking class for visual feedback
        $videoWrapper.addClass('seeking');
        
        // Update position
        seek(e);
    }
    
    /**
     * Handle progress bar dragging movement
     * 
     * @param {Event} e - Mouse or touch event
     */
    function handleSeekMove(e) {
        if (state.isDraggingProgressBar) {
            e.preventDefault();
            seek(e);
        }
    }
    
    /**
     * Handle end of progress bar drag
     */
    function handleSeekEnd() {
        if (state.isDraggingProgressBar) {
            state.isDraggingProgressBar = false;
            
            // Re-enable transitions
            $progressBarPlayed.removeClass('no-transition');
            $progressThumb.removeClass('no-transition');
            
            // Remove seeking class
            $videoWrapper.removeClass('seeking');
        }
    }

    // ----------------------------------------------------------------------------------
    // SECTION 7: EVENT LISTENERS - VIDEO EVENTS
    // ----------------------------------------------------------------------------------
    
    // Video playback state changes
    $videoPlayer.on('play', function() {
        updatePlayPauseIcon();
        
        // Schedule hiding controls
        clearTimeout(state.controlsTimeout);
        setTimeout(function() { 
            if (!state.isMouseOverControls) hideControls(); 
        }, CONTROLS_FADE_TIME);
    });
    
    $videoPlayer.on('pause ended', function() {
        updatePlayPauseIcon();
        showControls();
    });
    
    // Video loading and buffering events
    $videoPlayer.on('loadedmetadata', function() {
        const videoEl = $videoPlayer[0];
        if (!isNaN(videoEl.duration)) {
            $timeInfo.text(`${formatTime(videoEl.currentTime)} / ${formatTime(videoEl.duration)}`);
            updateProgressUI();
            updateBufferUI();
        }
    });
    
    $videoPlayer.on('waiting', function() {
        state.buffering = true;
        showControls(); // Show controls during buffering
    });
    
    $videoPlayer.on('canplay playing', function() {
        state.buffering = false;
        if (!$videoPlayer[0].paused) {
            hideControls();
        }
    });
    
    // Playback updates
    $videoPlayer.on('timeupdate', function() {
        if (!state.isDraggingProgressBar) {
            updateProgressUI();
        }
    });
    
    $videoPlayer.on('progress', updateBufferUI);
    
    // Volume changes
    $videoPlayer.on('volumechange', function() {
        const videoEl = $videoPlayer[0];
        updateVolumeUI(videoEl.volume, videoEl.muted);
    });
    
    // Video ended
    $videoPlayer.on('ended', function() {
        updatePlayPauseIcon();
        showControls();
    });

    // ----------------------------------------------------------------------------------
    // SECTION 8: EVENT LISTENERS - UI INTERACTIONS
    // ----------------------------------------------------------------------------------
    
    // Play/Pause when clicking video (excluding controls)
    $videoWrapper.on('click', function(e) {
        // Prevent rapid successive clicks
        const now = Date.now();
        if (now - state.lastClickTime < 300) return; // Ignore rapid clicks
        state.lastClickTime = now;
        
        // Only toggle playback if not clicking on controls
        if (!isClickOnControls(e)) {
            togglePlayback();
        }
    });
    
    // Play/Pause button
    $playPauseBtn.on('click', function(e) {
        e.stopPropagation();
        togglePlayback();
    });

    // Volume button
    $volumeBtn.on('click', function(e) {
        e.stopPropagation();
        toggleMute();
    });
    
    // Volume slider
    $volumeSlider.on('input', function(e) {
        e.stopPropagation();
        const videoEl = $videoPlayer[0];
        const value = parseFloat(e.target.value);
        
        videoEl.volume = value;
        videoEl.muted = value === 0;
    });
    
    $volumeSlider.on('click', function(e) {
        e.stopPropagation();
    });

    // Fullscreen button
    $fullscreenBtn.on('click', function(e) {
        e.stopPropagation();
        toggleFullscreen();
    });

    // Settings button and speed menu
    $settingsBtn.on('click', function(e) {
        e.stopPropagation();
        $speedMenu.toggleClass('visible');
    });

    // Speed selection options
    $speedOptions.each(function() {
        $(this).on('click', function(e) {
            e.stopPropagation();
            
            $speedOptions.removeClass('active');
            $(this).addClass('active');
            
            const newSpeed = parseFloat($(this).data('speed'));
            if (!isNaN(newSpeed)) {
                $videoPlayer[0].playbackRate = newSpeed;
                
                // Add visual feedback - flash the indicator briefly
                $(this).addClass('speed-changed');
                setTimeout(() => {
                    $(this).removeClass('speed-changed');
                }, 300);
            }
            
            $speedMenu.removeClass('visible');
        });
    });

    // Close speed menu when clicking elsewhere
    $(document).on('click', function(e) {
        if ($speedMenu.hasClass('visible') && 
            !$speedMenu.is(e.target) && 
            !$settingsBtn.is(e.target) && 
            $speedMenu.has(e.target).length === 0) {
            $speedMenu.removeClass('visible');
        }
    });

    // Progress bar interactions
    $progressContainer.on('mousedown', handleSeekStart);
    $(document).on('mousemove', handleSeekMove);
    $(document).on('mouseup', handleSeekEnd);
    
    // Touch support for progress bar
    $progressContainer.on('touchstart', function(e) {
        handleSeekStart(e.originalEvent);
    });
    
    $(document).on('touchmove', function(e) {
        if (state.isDraggingProgressBar) {
            handleSeekMove(e.originalEvent);
        }
    });
    
    $(document).on('touchend touchcancel', handleSeekEnd);
    
    // Simple click on progress bar (not dragging)
    $progressContainer.on('click', function(e) {
        if (!state.isDraggingProgressBar && !$videoWrapper.hasClass('seeking')) {
            seek(e);
        }
    });

    // Controls visibility management
    $customControls.on('mouseenter', function() { 
        state.isMouseOverControls = true; 
        showControls(); 
    });
    
    $customControls.on('mouseleave', function() { 
        state.isMouseOverControls = false; 
        hideControls(); 
    });
    
    $videoWrapper.on('mouseenter mousemove', showControls);
    
    $videoWrapper.on('mouseleave', function() { 
        if (!state.isMouseOverControls) hideControls(); 
    });
    
    // Double-click to toggle fullscreen
    $videoWrapper.on('dblclick', function(e) {
        // Skip if clicking on controls
        if (!isClickOnControls(e)) {
            toggleFullscreen();
        }
    });
    
    // Fullscreen change events
    $(document).on('fullscreenchange webkitfullscreenchange msfullscreenchange', updateFullscreenIcon);

    // ----------------------------------------------------------------------------------
    // SECTION 9: KEYBOARD SHORTCUTS
    // ----------------------------------------------------------------------------------
    
    $(document).on('keydown', function(e) {
        // Skip if focus is on an input
        if ($(document.activeElement).is('input, textarea, select')) return;
        
        // Process keyboard shortcuts
        switch (e.key) {
            case ' ':
            case 'Space':
                // Space - toggle play/pause
                e.preventDefault();
                togglePlayback();
                break;
                
            case 'ArrowLeft':
                // Left arrow - seek backward
                e.preventDefault();
                seekToFrame(e.shiftKey ? -FRAME_STEP_LARGE : -FRAME_STEP_SMALL);
                break;
                
            case 'ArrowRight':
                // Right arrow - seek forward
                e.preventDefault();
                seekToFrame(e.shiftKey ? FRAME_STEP_LARGE : FRAME_STEP_SMALL);
                break;
                
            case 'ArrowUp':
                // Up arrow - increase volume
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    adjustVolume(VOLUME_ADJUST_STEP);
                }
                break;
                
            case 'ArrowDown':
                // Down arrow - decrease volume
                if (!e.ctrlKey && !e.metaKey) {
                    e.preventDefault();
                    adjustVolume(-VOLUME_ADJUST_STEP);
                }
                break;
                
            case 'm':
            case 'M':
                // M - toggle mute
                e.preventDefault();
                toggleMute();
                break;
                
            case 'f':
            case 'F':
                // F - toggle fullscreen
                e.preventDefault();
                toggleFullscreen();
                break;
        }
    });

    // ----------------------------------------------------------------------------------
    // SECTION 10: INITIALIZATION
    // ----------------------------------------------------------------------------------
    
    /**
     * Initialize all controls and UI state
     */
    function initializeControls() {
        const videoEl = $videoPlayer[0];
        
        // Update UI elements
        updatePlayPauseIcon();
        updateVolumeUI(videoEl.volume, videoEl.muted);
        updateFullscreenIcon();
        updateSpeedMenu(videoEl.playbackRate);
        
        // Initialize time display and progress if metadata loaded
        if (videoEl.readyState >= 1 && !isNaN(videoEl.duration)) {
            $timeInfo.text(`${formatTime(videoEl.currentTime)} / ${formatTime(videoEl.duration)}`);
            updateProgressUI();
            updateBufferUI();
        } else {
            // Or wait for metadata to load
            $videoPlayer.one('loadedmetadata', function() {
                if (!isNaN(videoEl.duration)) {
                    $timeInfo.text(`${formatTime(videoEl.currentTime)} / ${formatTime(videoEl.duration)}`);
                    updateProgressUI();
                    updateBufferUI();
                }
            });
        }
        
        // Set initial controls visibility
        if (videoEl.paused) {
            showControls();
        } else {
            $customControls.css('opacity', '0');
            $videoWrapper.removeClass('controls-visible');
        }
        
        // Apply mobile-specific adjustments
        if (state.isMobile) {
            $videoWrapper.addClass('mobile-device');
            
            // Always show controls on mobile when video is paused
            $videoPlayer.on('pause', function() {
                $customControls.css('opacity', '1');
            });
        }
        
        logDebug("Custom video controls initialized");
    }
    
    // Run initialization
    initializeControls();
}

/**
 * Add HTML for controls and initialize when document is ready
 */
$(document).ready(function() {
    // Create HTML for controls using template
    const CONTROLS_HTML = `
    <!-- Custom video controls - YouTube style UI -->
    <div class="custom-video-controls">
        <!-- Progress bar container -->
        <div class="custom-progress-container" id="customProgressContainer">
            <div class="custom-progress-bar" id="customProgressBarBackground">
                <div class="custom-progress-buffer" id="customProgressBuffer"></div>
                <div class="custom-progress-played" id="customProgressPlayed"></div>
                <div class="custom-progress-thumb" id="customProgressThumb"></div>
            </div>
        </div>
        
        <!-- Main controls area -->
        <div class="main-controls-area">
            <!-- Play/Pause button -->
            <button id="customPlayPause" class="control-button" title="Play/Pause">
                <i class="fas fa-play"></i>
            </button>
            
            <!-- Time display -->
            <span id="customTimeInfo" class="time-info">0:00 / 0:00</span>
            
            <!-- Right-aligned controls -->
            <div class="controls-right">
                <!-- Volume controls -->
                <div class="volume-control">
                    <button id="customVolume" class="control-button" title="Mute/Unmute">
                        <i class="fas fa-volume-up"></i>
                    </button>
                    <input type="range" id="customVolumeSlider" class="volume-slider" min="0" max="1" step="0.05" value="1">
                </div>
                
                <!-- Fullscreen button -->
                <button id="customFullscreen" class="control-button" title="Fullscreen">
                    <i class="fas fa-expand"></i>
                </button>
                
                <!-- Settings menu -->
                <div class="settings-control">
                    <button id="customSettings" class="control-button" title
```
