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


```
/**
 * @fileoverview Module for detecting the FPS (Frames Per Second) of a video.
 */

/**
 * Sets up FPS detection functionality.
 *
 * @param {HTMLVideoElement} videoPlayer The main video element.
 * @param {HTMLVideoElement} hiddenVideo A hidden video element used for measurement.
 * @param {HTMLElement} fpsBadge The element to display the detected FPS.
 * @param {Object} state A shared state object for the application. Expected properties:
 *                       `isMeasuring` (boolean), `measuringTimeout` (number|null),
 *                       `useDirectMethod` (boolean), `fps` (number|null),
 *                       `cachedFPS` (object|null).
 * @returns {Object} An object containing FPS detection methods.
 */
function setupFpsDetection(videoPlayer, hiddenVideo, fpsBadge, state) {
    // --- Constants ---
    const MAX_RETRIES = 3;
    const DEFAULT_FPS = 24;
    const MEASUREMENT_FRAME_LIMIT = 40; // Max frames to analyze
    const MEASUREMENT_TIME_LIMIT = 2000; // Max time (ms) for analysis
    const MEASUREMENT_TIMEOUT_BUFFER = 3000; // Extra time before declaring timeout
    const PREPARE_VIDEO_TIMEOUT = 5000; // Max time (ms) to wait for video readiness
    const RETRY_DELAY = 1000; // Delay (ms) between detection retries

    // --- Internal State ---
    let fpsDetectionRetries = 0;
    let retryTimeoutId = null;

    // --- Helper Functions ---

    /**
     * Creates a default FPS result object.
     * @param {number} [fps=DEFAULT_FPS] - The FPS value to use.
     * @returns {{fps: number, totalFrames: number, duration: number, measurements: Array, default: boolean}} The default result object.
     * @private
     */
    const _createDefaultFpsResult = (fps = DEFAULT_FPS) => ({
        fps: fps,
        totalFrames: 0,
        duration: 0,
        measurements: [],
        default: true,
    });

    /**
     * Cleans up the hidden video element to free resources.
     */
    function cleanupHiddenVideo() {
        console.log("Cleaning up hidden video element.");
        if (hiddenVideo) {
            try {
                hiddenVideo.pause();
                // Setting src to '' or removing the attribute is more effective
                // than just hiddenVideo.load() for stopping network activity.
                hiddenVideo.removeAttribute('src');
                hiddenVideo.load(); // Request browser to release resources
                hiddenVideo.onloadedmetadata = null;
                hiddenVideo.onerror = null;
                // Consider removing event listeners added elsewhere if necessary
            } catch (e) {
                console.error("Error during hidden video cleanup:", e);
            }
        }
    }

    /**
     * Prepares a video element for measurement, waiting for it to be ready.
     * @param {HTMLVideoElement} videoElement The video element to prepare.
     * @returns {Promise<void>} Resolves when the video is ready, rejects on timeout or error.
     * @private
     */
    const _prepareVideoForMeasurement = (videoElement) => {
        return new Promise((resolve, reject) => {
            // Check if video is already ready enough
            // readyState 3 (HAVE_FUTURE_DATA) or 4 (HAVE_ENOUGH_DATA)
            if (videoElement.readyState >= 3) {
                console.log("Video already ready for FPS measurement.");
                resolve();
                return;
            }
             // readyState 2 (HAVE_METADATA) might be sufficient sometimes
            if (videoElement.readyState === 2 && videoElement.duration > 0) {
                 console.log("Video has metadata, attempting measurement.");
                 resolve();
                 return;
            }


            console.log("Waiting for video to become ready for FPS measurement...");

            const timeoutId = setTimeout(() => {
                videoElement.removeEventListener('canplay', readyHandler);
                videoElement.removeEventListener('loadeddata', readyHandler); // Also listen for loadeddata
                videoElement.removeEventListener('error', errorHandler);
                // Attempt measurement even if only metadata is ready (readyState 2)
                if (videoElement.readyState >= 2) {
                     console.warn(`Video readiness timeout (${PREPARE_VIDEO_TIMEOUT}ms), proceeding with readyState: ${videoElement.readyState}`);
                     resolve();
                } else {
                     reject(new Error(`Video did not become ready within ${PREPARE_VIDEO_TIMEOUT}ms (readyState: ${videoElement.readyState})`));
                }
            }, PREPARE_VIDEO_TIMEOUT);

            const readyHandler = () => {
                clearTimeout(timeoutId);
                videoElement.removeEventListener('canplay', readyHandler);
                videoElement.removeEventListener('loadeddata', readyHandler);
                videoElement.removeEventListener('error', errorHandler);
                console.log("Video became ready (canplay or loadeddata event).");
                resolve();
            };

             const errorHandler = (event) => {
                clearTimeout(timeoutId);
                videoElement.removeEventListener('canplay', readyHandler);
                videoElement.removeEventListener('loadeddata', readyHandler);
                videoElement.removeEventListener('error', errorHandler);
                console.error("Video error during preparation:", event);
                reject(new Error("Video error occurred during preparation."));
            };


            // Listen for events indicating readiness
            videoElement.addEventListener('canplay', readyHandler);
             videoElement.addEventListener('loadeddata', readyHandler); // Often fires earlier than canplay
             videoElement.addEventListener('error', errorHandler);


            // If paused and not loading, try playing to trigger loading
            // Mute to avoid issues with autoplay policies
            if (videoElement.paused && videoElement.networkState < 3 /* NETWORK_LOADING or NETWORK_IDLE */) {
                const originalMuted = videoElement.muted;
                videoElement.muted = true;
                console.log("Attempting to play video to trigger loading...");
                videoElement.play()
                    .then(() => {
                        console.log("Video play initiated to assist loading.");
                        // Don't pause immediately, let it load a bit
                    })
                    .catch(err => {
                        console.warn("Could not play video to trigger loading (might be normal):", err);
                        // Continue waiting for events, don't reject here
                    })
                    .finally(() => {
                       // Restore muted state after a short delay, giving events time to fire
                       setTimeout(() => {
                           videoElement.muted = originalMuted;
                       }, 100);
                    });
            }
        });
    };


    /**
     * Detects FPS directly using requestVideoFrameCallback on a given video element.
     *
     * @param {HTMLVideoElement} videoElement The video element to measure.
     * @param {Object} [options={}] Measurement options.
     * @param {number} [options.frameLimit=MEASUREMENT_FRAME_LIMIT] The maximum number of frames to capture.
     * @param {number} [options.timeLimit=MEASUREMENT_TIME_LIMIT] The maximum time (ms) allowed for measurement.
     * @param {Function} [options.onComplete=()=>{}] Callback function when measurement completes.
     * @returns {Promise<Object>} A promise that resolves with the FPS detection result.
     * @throws {Error} If the browser doesn't support requestVideoFrameCallback or video has no source.
     */
    async function detectFPSDirectly(videoElement, options = {}) {
        const settings = {
            frameLimit: MEASUREMENT_FRAME_LIMIT,
            timeLimit: MEASUREMENT_TIME_LIMIT,
            onComplete: () => {},
            ...options
        };

        if (!('requestVideoFrameCallback' in HTMLVideoElement.prototype)) {
            throw new Error("Browser does not support requestVideoFrameCallback.");
        }

        if (!videoElement.currentSrc) {
            throw new Error("Video element has no source assigned.");
        }

        const measurementType = videoElement === hiddenVideo ? "hidden video" : "main video";
        console.log(`Starting direct FPS measurement on ${measurementType}...`);

        try {
            await _prepareVideoForMeasurement(videoElement);
        } catch (err) {
            console.error(`Error preparing ${measurementType} for measurement:`, err);
            const result = _createDefaultFpsResult();
            settings.onComplete(result);
            return result; // Return default FPS on preparation failure
        }

        // Ensure measurement doesn't start if already measuring
        // This check prevents race conditions if called multiple times quickly
        if (state.isMeasuring) {
            console.warn("Measurement attempt aborted: Another measurement is already in progress.");
            // Consider returning a specific status or error if needed
             return _createDefaultFpsResult(); // Or perhaps reject? For now, return default.
        }

        return new Promise((resolve) => { // No reject needed here as errors lead to default result
            // Store initial video state (only relevant for direct method on main player)
            const isDirectMethod = state.useDirectMethod; // Check state *before* starting measurement
            const wasPlaying = !videoElement.paused;
            const originalTime = videoElement.currentTime;
            const originalMuted = videoElement.muted;
            const originalVolume = videoElement.volume;

            // Measurement variables
            let frameCount = 0;
            let firstFrameTime = 0; // Renamed from startTime for clarity
            let lastFrameTime = 0;
            let measurements = [];
            let rafId = null; // Store the requestVideoFrameCallback handle
            let localIsMeasuring = true; // Use local flag to manage callback loop

            // Set global measuring flag and timeout
            state.isMeasuring = true;
            if (state.measuringTimeout) clearTimeout(state.measuringTimeout);

            state.measuringTimeout = setTimeout(() => {
                if (localIsMeasuring) { // Check local flag
                    console.warn(`FPS measurement timed out after ${settings.timeLimit + MEASUREMENT_TIMEOUT_BUFFER}ms.`);
                    localIsMeasuring = false; // Stop further processing in frameCallback
                    if (rafId) {
                         // Although requestVideoFrameCallback doesn't have a native cancel,
                         // setting localIsMeasuring to false should stop the chain.
                         // If using requestAnimationFrame fallback, you'd cancel here.
                         console.log("Cancelling pending frame callback (logically).");
                    }
                    cleanupAndResolve(true); // Indicate partial result due to timeout
                }
            }, settings.timeLimit + MEASUREMENT_TIMEOUT_BUFFER); // Total timeout

            const cleanup = () => {
                console.log(`Cleaning up after FPS measurement on ${measurementType}.`);
                if (state.measuringTimeout) {
                    clearTimeout(state.measuringTimeout);
                    state.measuringTimeout = null;
                }
                 state.isMeasuring = false; // Reset global flag *after* processing is done

                // Restore video state ONLY if measuring directly on the main player
                if (isDirectMethod && videoElement === videoPlayer) {
                    try {
                         // Only seek back if time actually changed significantly
                         if (Math.abs(videoElement.currentTime - originalTime) > 0.1) {
                              videoElement.currentTime = originalTime;
                         }
                         videoElement.muted = originalMuted;
                         videoElement.volume = originalVolume; // Restore volume as well

                         // Pause only if it was originally paused
                         if (!wasPlaying && !videoElement.paused) {
                              videoElement.pause();
                         }
                    } catch (e) {
                        console.error("Error restoring video state:", e);
                    }
                } else if (videoElement === hiddenVideo) {
                    // Ensure hidden video is paused after measurement
                     if (!hiddenVideo.paused) {
                           hiddenVideo.pause();
                     }
                }
            };

            const cleanupAndResolve = (isPartial = false) => {
                 cleanup(); // Perform cleanup first

                let measuredFPS = DEFAULT_FPS;
                let result;

                if (frameCount > 5) { // Require a minimum number of frames for a reasonable calculation
                    const durationMs = lastFrameTime - firstFrameTime;
                    measuredFPS = Math.round((frameCount / (durationMs / 1000)));
                    result = {
                        fps: measuredFPS,
                        totalFrames: frameCount,
                        duration: durationMs / 1000,
                        measurements: measurements,
                        partial: isPartial, // Indicate if result is from timeout/limit
                        default: false
                    };
                    console.log(`FPS Measurement Result (${measurementType}): ${measuredFPS} FPS (${frameCount} frames / ${(durationMs / 1000).toFixed(2)}s)`);
                } else {
                    console.warn(`Not enough frames (${frameCount}) captured for reliable FPS calculation. Using default: ${DEFAULT_FPS}`);
                    result = _createDefaultFpsResult();
                    result.partial = isPartial; // Mark as partial even if default
                }

                settings.onComplete(result);
                resolve(result);
            };


            const frameCallback = (now, metadata) => {
                // 'now' is performance.now() timestamp
                // 'metadata.mediaTime' is videoElement.currentTime
                // 'metadata.presentedFrames' could be useful but varies by browser

                if (!localIsMeasuring) { // Check flag before processing
                    return; // Measurement was stopped (timeout or completion)
                }

                if (firstFrameTime === 0) {
                    firstFrameTime = now;
                    lastFrameTime = now;
                }

                const deltaTime = now - lastFrameTime; // Time since last frame callback

                measurements.push({
                    frame: frameCount,
                    timestamp: now, // Absolute time
                    mediaTime: metadata.mediaTime,
                    delta: deltaTime,
                     presentedFrames: metadata.presentedFrames // Include for potential analysis
                });

                lastFrameTime = now;
                frameCount++;

                const timeElapsed = now - firstFrameTime;

                // Check termination conditions
                if (frameCount < settings.frameLimit && timeElapsed < settings.timeLimit && localIsMeasuring) {
                    // Continue measurement
                    try {
                         rafId = videoElement.requestVideoFrameCallback(frameCallback);
                    } catch(err) {
                         console.error("Error requesting next video frame callback:", err);
                         localIsMeasuring = false; // Stop measurement on error
                         cleanupAndResolve(true); // Resolve with partial/default data
                    }
                } else {
                    // Stop measurement (limit reached or flag set)
                    localIsMeasuring = false;
                    if (timeElapsed >= settings.timeLimit) {
                        console.log(`Measurement reached time limit (${settings.timeLimit}ms).`);
                    } else if (frameCount >= settings.frameLimit){
                        console.log(`Measurement reached frame limit (${settings.frameLimit} frames).`);
                    }
                    cleanupAndResolve(false); // Indicate completed normally
                }
            };

            // --- Start the measurement ---
            console.log(`Requesting first video frame callback for ${measurementType}...`);

            // Mute video during measurement if using direct method on main player
            // This is less critical for hiddenVideo as it should already be muted.
            if (isDirectMethod && videoElement === videoPlayer) {
                videoElement.muted = true;
            }

            // Ensure video is playing to receive frame callbacks
            const startMeasurement = () => {
                 try {
                      rafId = videoElement.requestVideoFrameCallback(frameCallback);
                 } catch (err) {
                      console.error("Error requesting initial video frame callback:", err);
                       localIsMeasuring = false; // Stop measurement on error
                       cleanupAndResolve(true); // Resolve with partial/default data
                 }
            };

            if (videoElement.paused) {
                videoElement.play()
                    .then(() => {
                        console.log(`Video playback started for ${measurementType} measurement.`);
                        startMeasurement();
                    })
                    .catch(err => {
                        console.error(`Error playing ${measurementType} for FPS measurement:`, err);
                        localIsMeasuring = false; // Stop measurement
                        cleanupAndResolve(true); // Resolve with default data
                    });
            } else {
                // Video is already playing
                startMeasurement();
            }
        });
    }

    /**
     * Detects video FPS, trying the hidden video first, then falling back to the main video.
     *
     * @param {HTMLVideoElement} mainVideo The main video player element.
     * @param {Object} [options={}] Measurement options (passed to detectFPSDirectly).
     * @returns {Promise<Object>} A promise resolving with the FPS detection result.
     */
    async function detectVideoFPS(mainVideo, options = {}) {
        console.log("Attempting FPS detection for:", mainVideo.currentSrc);

        // Clear any pending retry timeouts
        if (retryTimeoutId) {
            clearTimeout(retryTimeoutId);
            retryTimeoutId = null;
        }

        if (!mainVideo.currentSrc) {
             console.error("Main video has no source. Cannot detect FPS.");
            return _createDefaultFpsResult();
        }

        // --- Step 1: Prepare Hidden Video (if source differs or not set) ---
        let hiddenVideoReady = false;
        if (mainVideo.currentSrc && mainVideo.currentSrc !== hiddenVideo.src) {
            console.log("Setting up hidden video with source:", mainVideo.currentSrc);
            cleanupHiddenVideo(); // Clean up previous state first

            hiddenVideo.muted = true;
            hiddenVideo.volume = 0;
            hiddenVideo.crossOrigin = mainVideo.crossOrigin || 'anonymous'; // Ensure crossOrigin is set
            hiddenVideo.setAttribute('playsinline', '');
            // Autoplay might not always work; rely on manual play in measurement
            // hiddenVideo.setAttribute('autoplay', '');
             hiddenVideo.preload = 'auto'; // Suggest preloading

            hiddenVideo.src = mainVideo.currentSrc;

            try {
                // Wait for hidden video to load metadata
                 // Use a promise wrapper around events for cleaner async/await flow
                 await new Promise((resolve, reject) => {
                      const loadTimeout = setTimeout(() => {
                          hiddenVideo.onloadedmetadata = null;
                          hiddenVideo.onerror = null;
                          reject(new Error(`Hidden video timed out loading metadata (${PREPARE_VIDEO_TIMEOUT}ms)`));
                      }, PREPARE_VIDEO_TIMEOUT);

                      hiddenVideo.onloadedmetadata = () => {
                          clearTimeout(loadTimeout);
                          hiddenVideo.onloadedmetadata = null;
                          hiddenVideo.onerror = null;
                          console.log("Hidden video metadata loaded.");
                          resolve();
                      };
                      hiddenVideo.onerror = (err) => {
                          clearTimeout(loadTimeout);
                          hiddenVideo.onloadedmetadata = null;
                          hiddenVideo.onerror = null;
                          console.error("Error loading hidden video source:", err);
                          reject(new Error("Hidden video source failed to load."));
                      };
                      // Explicitly call load() after setting src might help some browsers
                      hiddenVideo.load();
                 });
                hiddenVideoReady = true;
            } catch (err) {
                console.error("Failed to prepare hidden video:", err);
                hiddenVideoReady = false;
                // Don't automatically clean up here, might still fallback to main video
            }
        } else if (hiddenVideo.currentSrc) {
            // Hidden video already has the correct source, assume it's ready enough or will be prepared in detectFPSDirectly
            console.log("Hidden video source already matches main video.");
            hiddenVideoReady = true;
        }


        // --- Step 2: Attempt Measurement (Hidden first, then Main) ---
        let result = null;

        if (hiddenVideoReady) {
            state.useDirectMethod = false; // Indicate measurement is on hidden video
            console.log("Attempting FPS measurement using hidden video...");
            try {
                result = await detectFPSDirectly(hiddenVideo, options);
                 // If hidden video measurement succeeded (even if it returned default), use its result
                 if (result) {
                      console.log("Measurement successful using hidden video.");
                 }
            } catch (err) {
                console.warn("Measurement failed on hidden video, falling back to main video. Error:", err);
                result = null; // Ensure fallback occurs
            }
        } else {
             console.log("Skipping hidden video measurement (not ready).");
        }


        // --- Step 3: Fallback to Main Video if necessary ---
        if (!result || (result && result.default && !result.partial)) { // Fallback if hidden failed or gave a non-partial default
            console.log("Falling back to FPS measurement using main video...");
            state.useDirectMethod = true; // Indicate measurement is on main video
            try {
                result = await detectFPSDirectly(mainVideo, options);
                console.log("Measurement successful using main video.");
            } catch (err) {
                console.error("Measurement failed on main video as well. Error:", err);
                result = _createDefaultFpsResult(); // Final fallback to default
            }
        }

        // --- Step 4: Final Cleanup and Return ---
        cleanupHiddenVideo(); // Clean up hidden video regardless of success/failure
        return result || _createDefaultFpsResult(); // Ensure a result object is always returned
    }

    /**
     * Displays the detected FPS in the designated badge element.
     * Adjusts FPS value to common standards (e.g., 23 -> 24).
     *
     * @param {number} fpsValue The raw detected FPS value.
     */
    function showFPSBadge(fpsValue) {
        if (!fpsBadge) {
            console.error("FPS badge element not provided.");
            return;
        }

        let adjustedFPS = Math.round(fpsValue); // Start by rounding

        // --- Standard FPS Adjustments ---
        // These ranges might need tuning based on observed results
        if (adjustedFPS >= 22 && adjustedFPS <= 24) {
             adjustedFPS = 24;
        } else if (adjustedFPS >= 25 && adjustedFPS <= 27) {
             adjustedFPS = 25; // Common PAL/broadcast rate
        } else if (adjustedFPS >= 29 && adjustedFPS <= 32) {
             adjustedFPS = 30;
        } else if (adjustedFPS >= 47 && adjustedFPS <= 52) {
              adjustedFPS = 50; // Common PAL/broadcast rate
        } else if (adjustedFPS >= 58 && adjustedFPS <= 62) {
             adjustedFPS = 60;
        }
        // Add more adjustments if needed (e.g., for 48 FPS)

        console.log(`Displaying FPS: ${adjustedFPS} (raw: ${fpsValue.toFixed(2)})`);

        state.fps = adjustedFPS; // Update shared state

        const span = fpsBadge.querySelector('span');
        const textContent = `${adjustedFPS} FPS`;

        if (span) {
            span.textContent = textContent;
        } else {
             // Fallback if no span found inside the badge
            fpsBadge.textContent = textContent;
        }

        fpsBadge.style.display = 'inline-flex'; // Use inline-flex or flex as appropriate

        // Re-trigger animation for visual feedback
        fpsBadge.style.animation = 'none';
        // void fpsBadge.offsetWidth; // Force reflow - sometimes needed
        requestAnimationFrame(() => { // Safer than setTimeout(..., 0/10)
             requestAnimationFrame(() => { // Double requestAnimationFrame for robustness
                 fpsBadge.style.animation = 'fadeInLeft 0.3s ease-out'; // Ensure animation name/duration match CSS
             });
        });
    }

    /**
     * Automatically detects FPS when required (e.g., on video load).
     * Uses cached value if available, otherwise initiates detection with retries.
     */
    async function autoDetectFPS() {
        if (state.isMeasuring) {
            console.log("FPS detection already in progress. Ignoring new request.");
            return;
        }

        // Use cached result if valid
        // Check for a non-default result in cache
        if (state.cachedFPS && state.cachedFPS.fps && !state.cachedFPS.default) {
            console.log("Using cached FPS value:", state.cachedFPS.fps);
            showFPSBadge(state.cachedFPS.fps);
            return;
        } else if (state.cachedFPS && state.cachedFPS.fps) {
             console.log("Using cached (but potentially default) FPS value:", state.cachedFPS.fps);
             showFPSBadge(state.cachedFPS.fps);
             // Optionally, you could still re-trigger detection if the cached value is default
             // if (!state.cachedFPS.default) return;
             // else console.log("Cached value was default, re-detecting...");
             return; // For now, always use cache if it exists
        }


        console.log("Initiating automatic FPS detection.");
        if (fpsBadge) {
            const span = fpsBadge.querySelector('span');
            if (span) span.textContent = "Detecting...";
            else fpsBadge.textContent = "Detecting...";
            fpsBadge.style.display = 'inline-flex'; // Show "Detecting..."
        }

        fpsDetectionRetries = 0; // Reset retry count for new detection sequence
        await tryDetectFPS(); // Start the detection process
    }

    /**
     * Attempts FPS detection with a retry mechanism.
     * @private
     */
    async function tryDetectFPS() {
        console.log(`Attempting FPS detection (Try ${fpsDetectionRetries + 1}/${MAX_RETRIES + 1})`);

        try {
            if (!videoPlayer.currentSrc) {
                throw new Error("Main video has no source.");
            }

            const result = await detectVideoFPS(videoPlayer, {
                // Pass options like onComplete directly
                onComplete: (completedResult) => {
                     // Only cache valid, non-error results (even if default)
                     if (completedResult && completedResult.fps) {
                           console.log("Caching FPS result:", completedResult);
                           state.cachedFPS = completedResult;
                           showFPSBadge(completedResult.fps);
                     } else {
                          console.warn("Measurement completed but result seems invalid, not caching.", completedResult);
                     }
                }
            });

             // Check if detectVideoFPS itself returned a valid result (it should always return something)
            if (!result || !result.fps) {
                 // This case should ideally be handled within detectVideoFPS returning a default
                 console.error("Detection process finished but yielded no valid result object.");
                 throw new Error("Detection yielded invalid result."); // Trigger retry/fallback
            }

            console.log(`FPS detection attempt ${fpsDetectionRetries + 1} successful. FPS: ${result.fps}`);
            // Success, no need to retry further. Result handled by onComplete.
            // Clear any pending retry timeout just in case
             if (retryTimeoutId) {
                clearTimeout(retryTimeoutId);
                retryTimeoutId = null;
            }

        } catch (err) {
            console.error(`Error during FPS detection attempt ${fpsDetectionRetries + 1}:`, err);

            if (fpsDetectionRetries < MAX_RETRIES) {
                fpsDetectionRetries++;
                console.log(`Scheduling retry ${fpsDetectionRetries} in ${RETRY_DELAY}ms...`);

                if (retryTimeoutId) clearTimeout(retryTimeoutId); // Clear previous timeout if exists

                retryTimeoutId = setTimeout(async () => {
                    retryTimeoutId = null; // Clear the ID once the timeout executes
                    await tryDetectFPS(); // Use await here if needed, though likely not necessary
                }, RETRY_DELAY);

            } else {
                console.error(`FPS detection failed after ${MAX_RETRIES + 1} attempts. Using default FPS: ${DEFAULT_FPS}.`);
                 // Set final default state
                state.fps = DEFAULT_FPS;
                state.cachedFPS = _createDefaultFpsResult(); // Cache the default result
                if (fpsBadge) {
                    const span = fpsBadge.querySelector('span');
                    const textContent = `${DEFAULT_FPS} FPS`;
                    if (span) span.textContent = textContent;
                    else fpsBadge.textContent = textContent;
                    fpsBadge.style.display = 'inline-flex'; // Ensure badge shows default
                     // Optionally trigger animation for the default value as well
                }
                // Ensure state reflects measurement stopped
                 state.isMeasuring = false;
                 if (state.measuringTimeout) {
                     clearTimeout(state.measuringTimeout);
                     state.measuringTimeout = null;
                 }
                 cleanupHiddenVideo(); // Ensure cleanup on final failure
            }
        }
    }

    // --- Public API ---
    return {
        detectFPSDirectly, // Expose for potential direct use/testing
        detectVideoFPS,    // Main detection function
        cleanupHiddenVideo,// Allow manual cleanup if needed
        showFPSBadge,      // Allow manual update of badge
        autoDetectFPS      // Primary function to trigger detection
    };
}

// --- Module Export ---
// CommonJS/Node export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { setupFpsDetection };
}
// Browser global export (optional)
// else if (typeof window !== 'undefined') {
//    window.setupFpsDetection = setupFpsDetection;
// }
```
