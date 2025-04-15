package com.example.demo

import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.ComboBox
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBScrollPane
import java.awt.BorderLayout
import java.awt.Dimension
import java.awt.FlowLayout
import java.awt.Image
import java.awt.event.WindowAdapter
import java.awt.event.WindowEvent
import java.io.File
import javax.swing.*
import java.util.Timer
import java.util.TimerTask

class MirrorToolWindowContent(private val project: Project) {
    private val LOG = Logger.getInstance(MirrorToolWindowContent::class.java)
    private val panel = JPanel(BorderLayout())
    private val imageLabel = JBLabel("Chưa có ảnh màn hình", JLabel.CENTER)
    private val refreshButton = JButton("Chụp màn hình")
    private val startStreamButton = JButton("Bắt đầu luồng liên tục")
    private val stopStreamButton = JButton("Dừng luồng")
    private val saveButton = JButton("Lưu ảnh")
    private val openScrcpyButton = JButton("Mở với scrcpy")
    private val deviceSelector = ComboBox<String>()
    private val screenCapturingService = ScreenCapturingService()
    private val scrcpyManager = ScrcpyManager(project)
    private var timer: Timer? = null
    private var currentImage: Image? = null

    // Các tùy chọn scrcpy
    private val scrcpyOptionPanel = JPanel()
    private val showScrcpyOptionsButton = JButton("Tùy chọn scrcpy")
    private val maxSizeField = JTextField("1080", 5)
    private val bitRateField = JTextField("8000000", 7)
    private val maxFpsField = JTextField("60", 3)
    private val borderlessCheckbox = JCheckBox("Không viền", false)
    private val alwaysOnTopCheckbox = JCheckBox("Luôn trên cùng", false)
    private val fullscreenCheckbox = JCheckBox("Toàn màn hình", false)
    private val showTouchesCheckbox = JCheckBox("Hiển thị chạm", true)

    // Trạng thái hiển thị tùy chọn
    private var showingOptions = false

    init {
        setupUI()
        setupListeners()
    }

    private fun setupUI() {
        // Thiết lập panel điều khiển chính
        val controlPanel = JPanel()
        controlPanel.layout = BoxLayout(controlPanel, BoxLayout.Y_AXIS)

        // Panel thứ nhất: Chọn thiết bị và các nút cơ bản
        val devicePanel = JPanel(FlowLayout(FlowLayout.LEFT))
        devicePanel.add(JLabel("Thiết bị: "))
        devicePanel.add(deviceSelector)
        devicePanel.add(Box.createHorizontalStrut(10))
        devicePanel.add(refreshButton)
        //devicePanel.add(startStreamButton)
        //devicePanel.add(stopStreamButton)
        devicePanel.add(saveButton)

        // Panel thứ hai: Nút scrcpy và tùy chọn
        //val scrcpyPanel = JPanel(FlowLayout(FlowLayout.LEFT))
        //scrcpyPanel.add(openScrcpyButton)
        //scrcpyPanel.add(showScrcpyOptionsButton)

        // Thiết lập panel tùy chọn scrcpy (mặc định ẩn)
        scrcpyOptionPanel.layout = BoxLayout(scrcpyOptionPanel, BoxLayout.Y_AXIS)

        val maxSizePanel = JPanel(FlowLayout(FlowLayout.LEFT))
        maxSizePanel.add(JLabel("Kích thước tối đa:"))
        maxSizePanel.add(maxSizeField)
        maxSizePanel.add(JLabel("px"))

        val bitRatePanel = JPanel(FlowLayout(FlowLayout.LEFT))
        bitRatePanel.add(JLabel("Bit rate:"))
        bitRatePanel.add(bitRateField)
        bitRatePanel.add(JLabel("bps"))

        val fpsPanel = JPanel(FlowLayout(FlowLayout.LEFT))
        fpsPanel.add(JLabel("FPS tối đa:"))
        fpsPanel.add(maxFpsField)

        val checkboxPanel = JPanel(FlowLayout(FlowLayout.LEFT))
        checkboxPanel.add(borderlessCheckbox)
        checkboxPanel.add(alwaysOnTopCheckbox)
        checkboxPanel.add(fullscreenCheckbox)
        checkboxPanel.add(showTouchesCheckbox)

        scrcpyOptionPanel.add(maxSizePanel)
        scrcpyOptionPanel.add(bitRatePanel)
        scrcpyOptionPanel.add(fpsPanel)
        scrcpyOptionPanel.add(checkboxPanel)
        scrcpyOptionPanel.isVisible = false

        // Thiết lập tình trạng ban đầu
        stopStreamButton.isEnabled = false
        saveButton.isEnabled = false

        // Kiểm tra và cập nhật trạng thái nút scrcpy
        updateScrcpyButtonState()

        // Thiết lập hiển thị ảnh
        imageLabel.horizontalAlignment = SwingConstants.CENTER
        imageLabel.verticalAlignment = SwingConstants.CENTER

        // Đặt preferred size để đảm bảo có đủ không gian hiển thị
        imageLabel.preferredSize = Dimension(480, 800)

        val scrollPane = JBScrollPane(imageLabel)

        // Thêm các panel vào panel điều khiển
        controlPanel.add(devicePanel)
        //controlPanel.add(scrcpyPanel)
        controlPanel.add(scrcpyOptionPanel)

        // Thêm các thành phần vào panel chính
        panel.add(controlPanel, BorderLayout.NORTH)
        panel.add(scrollPane, BorderLayout.CENTER)

        // Cập nhật danh sách thiết bị
        updateDeviceList()
    }

    private fun setupListeners() {
        refreshButton.addActionListener {
            captureAndDisplayScreen()
        }

        startStreamButton.addActionListener {
            startScreenStreaming()
        }

        stopStreamButton.addActionListener {
            stopScreenStreaming()
        }

        saveButton.addActionListener {
            saveCurrentImage()
        }

        openScrcpyButton.addActionListener {
            openWithScrcpy()
        }

        showScrcpyOptionsButton.addActionListener {
            toggleScrcpyOptions()
        }

        deviceSelector.addActionListener {
            // Khi thay đổi thiết bị, dừng stream nếu đang chạy
            if (timer != null) {
                stopScreenStreaming()
            }
        }
    }

    private fun toggleScrcpyOptions() {
        showingOptions = !showingOptions
        scrcpyOptionPanel.isVisible = showingOptions
        showScrcpyOptionsButton.text = if (showingOptions) "Ẩn tùy chọn" else "Tùy chọn scrcpy"
        panel.revalidate()
    }

    private fun updateScrcpyButtonState() {
        val isScrcpyInstalled = scrcpyManager.isScrcpyInstalled()
        openScrcpyButton.isEnabled = isScrcpyInstalled
        showScrcpyOptionsButton.isEnabled = isScrcpyInstalled

        if (!isScrcpyInstalled) {
            openScrcpyButton.toolTipText = "Cần cài đặt scrcpy để sử dụng tính năng này"
            showScrcpyOptionsButton.toolTipText = "Cần cài đặt scrcpy để sử dụng tính năng này"
        } else {
            openScrcpyButton.toolTipText = "Mở thiết bị với scrcpy - hiển thị chất lượng cao và điều khiển"
            showScrcpyOptionsButton.toolTipText = "Hiển thị/ẩn tùy chọn scrcpy"
        }
    }

    private fun updateDeviceList() {
        deviceSelector.removeAllItems()

        try {
            val devices = AdbCommandExecutor.getConnectedDevices()

            if (devices.isEmpty()) {
                deviceSelector.addItem("Không có thiết bị")
                refreshButton.isEnabled = false
                startStreamButton.isEnabled = false
                saveButton.isEnabled = false
                openScrcpyButton.isEnabled = false
            } else {
                for (device in devices) {
                    deviceSelector.addItem(device)
                }
                refreshButton.isEnabled = true
                startStreamButton.isEnabled = true
                updateScrcpyButtonState()
            }
        } catch (e: Exception) {
            LOG.error("Lỗi khi cập nhật danh sách thiết bị: ${e.message}")
            deviceSelector.addItem("Lỗi khi tìm thiết bị")
            refreshButton.isEnabled = false
            startStreamButton.isEnabled = false
            saveButton.isEnabled = false
            openScrcpyButton.isEnabled = false
        }
    }

    private fun captureAndDisplayScreen() {
        val selectedDevice = deviceSelector.selectedItem as? String
        if (selectedDevice != null && selectedDevice != "Không có thiết bị" && selectedDevice != "Lỗi khi tìm thiết bị") {
            imageLabel.icon = null
            imageLabel.text = "Đang chụp màn hình..."

            // Sử dụng SwingWorker để không chặn UI thread
            object : SwingWorker<Image?, Void>() {
                override fun doInBackground(): Image? {
                    return screenCapturingService.captureScreen(selectedDevice)
                }

                override fun done() {
                    try {
                        val image = get()
                        updateImage(image)
                    } catch (e: Exception) {
                        LOG.error("Lỗi khi chụp màn hình: ${e.message}")
                        imageLabel.text = "Lỗi khi chụp màn hình: ${e.message}"
                    }
                }
            }.execute()
        }
    }

    private fun startScreenStreaming() {
        val selectedDevice = deviceSelector.selectedItem as? String
        if (selectedDevice != null && selectedDevice != "Không có thiết bị" && selectedDevice != "Lỗi khi tìm thiết bị") {
            refreshButton.isEnabled = false
            startStreamButton.isEnabled = false
            stopStreamButton.isEnabled = true

            timer = Timer()
            timer?.scheduleAtFixedRate(object : TimerTask() {
                override fun run() {
                    val image = screenCapturingService.captureScreen(selectedDevice)
                    SwingUtilities.invokeLater {
                        updateImage(image)
                    }
                }
            }, 0, 250) // Cập nhật mỗi 250ms thay vì 1000ms để mượt hơn
        }
    }

    private fun stopScreenStreaming() {
        timer?.cancel()
        timer?.purge()
        timer = null

        refreshButton.isEnabled = true
        startStreamButton.isEnabled = true
        stopStreamButton.isEnabled = false
    }

    private fun openWithScrcpy() {
        val selectedDevice = deviceSelector.selectedItem as? String
        if (selectedDevice != null && selectedDevice != "Không có thiết bị" && selectedDevice != "Lỗi khi tìm thiết bị") {
            try {
                // Lấy các tùy chọn từ UI
                val options = ScrcpyOptions(
                    windowTitle = "Android Mirror: $selectedDevice",
                    maxSize = maxSizeField.text.toIntOrNull(),
                    bitRate = bitRateField.text.toIntOrNull(),
                    maxFps = maxFpsField.text.toIntOrNull(),
                    borderless = borderlessCheckbox.isSelected,
                    alwaysOnTop = alwaysOnTopCheckbox.isSelected,
                    fullscreen = fullscreenCheckbox.isSelected,
                    showTouches = showTouchesCheckbox.isSelected
                )

                val success = scrcpyManager.startScrcpy(selectedDevice, options)
                if (!success) {
                    JOptionPane.showMessageDialog(
                        panel,
                        "Không thể khởi động scrcpy. Vui lòng kiểm tra cài đặt.",
                        "Lỗi khởi động scrcpy",
                        JOptionPane.ERROR_MESSAGE
                    )
                }
            } catch (e: Exception) {
                LOG.error("Lỗi khi mở thiết bị với scrcpy: ${e.message}")
                e.printStackTrace()

                JOptionPane.showMessageDialog(
                    panel,
                    "Lỗi khi mở scrcpy: ${e.message}",
                    "Lỗi",
                    JOptionPane.ERROR_MESSAGE
                )
            }
        }
    }

    private fun saveCurrentImage() {
        val currentImage = this.currentImage ?: return

        val fileChooser = JFileChooser()
        fileChooser.dialogTitle = "Lưu ảnh chụp màn hình"
        fileChooser.fileSelectionMode = JFileChooser.FILES_ONLY

        // Thiết lập filter cho file PNG
        val filter = javax.swing.filechooser.FileNameExtensionFilter("PNG Images", "png")
        fileChooser.fileFilter = filter

        val result = fileChooser.showSaveDialog(panel)
        if (result == JFileChooser.APPROVE_OPTION) {
            var file = fileChooser.selectedFile
            // Đảm bảo file có đuôi .png
            if (!file.name.lowercase().endsWith(".png")) {
                file = File(file.absolutePath + ".png")
            }

            try {
                javax.imageio.ImageIO.write(currentImage as java.awt.image.RenderedImage, "PNG", file)
                JOptionPane.showMessageDialog(panel, "Đã lưu ảnh thành công vào: ${file.absolutePath}",
                    "Lưu ảnh thành công", JOptionPane.INFORMATION_MESSAGE)
            } catch (e: Exception) {
                LOG.error("Lỗi khi lưu ảnh: ${e.message}")
                JOptionPane.showMessageDialog(panel, "Không thể lưu ảnh: ${e.message}",
                    "Lỗi", JOptionPane.ERROR_MESSAGE)
            }
        }
    }

    private fun updateImage(image: Image?) {
        if (image != null) {
            // Lưu ảnh hiện tại để có thể lưu nếu cần
            currentImage = image

            // Xác định kích thước hiển thị tối đa
            val scrollPane = SwingUtilities.getAncestorOfClass(JScrollPane::class.java, imageLabel) as? JScrollPane
            val maxWidth = scrollPane?.viewport?.width ?: 480
            val maxHeight = scrollPane?.viewport?.height ?: 800

            // Tính toán tỷ lệ để hiển thị đúng kích thước
            val originalWidth = image.getWidth(null)
            val originalHeight = image.getHeight(null)

            val widthRatio = maxWidth.toDouble() / originalWidth
            val heightRatio = maxHeight.toDouble() / originalHeight
            val ratio = Math.min(widthRatio, heightRatio)

            // Chỉ resize nếu ảnh lớn hơn khu vực hiển thị
            val newWidth = if (ratio < 1) (originalWidth * ratio).toInt() else originalWidth
            val newHeight = if (ratio < 1) (originalHeight * ratio).toInt() else originalHeight

            // Cập nhật hiển thị với kích thước phù hợp
            // Sử dụng SCALE_FAST để cải thiện hiệu suất với streaming
            imageLabel.icon = ImageIcon(image.getScaledInstance(newWidth, newHeight, Image.SCALE_FAST))
            imageLabel.text = ""

            // Cho phép lưu ảnh
            saveButton.isEnabled = true
        } else {
            imageLabel.icon = null
            imageLabel.text = "Không thể chụp màn hình. Vui lòng kiểm tra kết nối thiết bị."

            // Không cho phép lưu khi không có ảnh
            saveButton.isEnabled = false
        }
    }

    fun getContent(): JComponent {
        return panel
    }

    fun dispose() {
        // Dừng tất cả các tác vụ đang chạy khi đóng tool window
        stopScreenStreaming()
        scrcpyManager.stopAllScrcpy()
    }
}