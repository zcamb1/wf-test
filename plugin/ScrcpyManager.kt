package com.example.demo

import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project
import com.intellij.openapi.ui.Messages
import com.intellij.util.ui.UIUtil
import java.io.File
import java.util.concurrent.ConcurrentHashMap
import javax.swing.JOptionPane
import javax.swing.SwingUtilities

/**
 * Manager để xử lý tích hợp với scrcpy
 */
class ScrcpyManager(private val project: Project) {
    private val LOG = Logger.getInstance(ScrcpyManager::class.java)
    private val runningProcesses = ConcurrentHashMap<String, Process>()

    /**
     * Tìm đường dẫn đến scrcpy executable
     */
    fun findScrcpyPath(): String? {
        // Tìm từ đường dẫn được chỉ định cụ thể (thư mục bạn đã tải)
        val specificPath = "C:/Users/ADMIN/Downloads/scrcpy-win64-v3.2/scrcpy.exe"
        val specificFile = File(specificPath)
        if (specificFile.exists() && specificFile.canExecute()) {
            LOG.info("Tìm thấy scrcpy tại đường dẫn chỉ định: $specificPath")
            return specificFile.absolutePath
        }

        // Tìm từ các vị trí phổ biến
        val commonPaths = listOf(
            // Windows
            "C:/Program Files/scrcpy/scrcpy.exe",
            "C:/scrcpy/scrcpy.exe",
            System.getProperty("user.home") + "/Downloads/scrcpy-win64-v3.2/scrcpy.exe",
            System.getProperty("user.home") + "/scrcpy/scrcpy.exe",
            // Linux
            "/usr/bin/scrcpy",
            "/usr/local/bin/scrcpy",
            // macOS
            "/usr/local/bin/scrcpy",
            System.getProperty("user.home") + "/Applications/scrcpy"
        )

        for (path in commonPaths) {
            val file = File(path)
            if (file.exists() && file.canExecute()) {
                LOG.info("Tìm thấy scrcpy tại: $path")
                return file.absolutePath
            }
        }

        // Kiểm tra scrcpy trong PATH
        try {
            val isWindows = System.getProperty("os.name").lowercase().contains("windows")
            val checkCommand = if (isWindows) "where scrcpy" else "which scrcpy"
            val process = Runtime.getRuntime().exec(checkCommand)
            process.waitFor()

            if (process.exitValue() == 0) {
                val path = process.inputStream.bufferedReader().readLine()
                if (path != null && File(path).exists()) {
                    LOG.info("Tìm thấy scrcpy trong PATH: $path")
                    return path
                }
            }
        } catch (e: Exception) {
            LOG.warn("Không thể kiểm tra scrcpy trong PATH: ${e.message}")
        }

        LOG.warn("Không tìm thấy scrcpy. Cần cài đặt trước khi sử dụng.")
        return null
    }

    /**
     * Khởi chạy scrcpy cho thiết bị cụ thể
     */
    fun startScrcpy(deviceId: String, options: ScrcpyOptions = ScrcpyOptions()): Boolean {
        // Kiểm tra xem process đã chạy cho thiết bị này chưa
        if (runningProcesses.containsKey(deviceId)) {
            val existingProcess = runningProcesses[deviceId]
            if (existingProcess != null && existingProcess.isAlive) {
                LOG.info("scrcpy đã đang chạy cho thiết bị $deviceId")
                return true
            } else {
                runningProcesses.remove(deviceId)
            }
        }

        val scrcpyPath = findScrcpyPath()
        if (scrcpyPath == null) {
            SwingUtilities.invokeLater {
                showScrcpyInstallDialog()
            }
            return false
        }

        try {
            LOG.info("Khởi động scrcpy cho thiết bị: $deviceId")

            // Xây dựng command với các tùy chọn
            val command = mutableListOf(scrcpyPath)

            // Thêm serial thiết bị
            command.add("--serial")
            command.add(deviceId)

            // Thêm các tùy chọn khác
            if (options.windowTitle != null) {
                command.add("--window-title")
                command.add(options.windowTitle)
            }

            if (options.maxSize != null) {
                command.add("--max-size")
                command.add(options.maxSize.toString())
            }

            if (options.bitRate != null) {
                command.add("--bit-rate")
                command.add(options.bitRate.toString())
            }

            if (options.maxFps != null) {
                command.add("--max-fps")
                command.add(options.maxFps.toString())
            }

            if (options.borderless) {
                command.add("--borderless")
            }

            if (options.alwaysOnTop) {
                command.add("--always-on-top")
            }

            if (options.fullscreen) {
                command.add("--fullscreen")
            }

            if (!options.showTouches) {
                command.add("--no-show-touches")
            }

            // Khởi động process
            val processBuilder = ProcessBuilder(command)
            processBuilder.redirectErrorStream(true)

            // Đặt thư mục làm việc là thư mục chứa scrcpy (quan trọng cho dependencies)
            val scrcpyDir = File(scrcpyPath).parentFile
            processBuilder.directory(scrcpyDir)

            val process = processBuilder.start()

            // Lưu process để theo dõi
            runningProcesses[deviceId] = process

            // Chạy một thread để log output
            Thread {
                val reader = process.inputStream.bufferedReader()
                var line: String? = null
                while (process.isAlive && reader.readLine().also { line = it } != null) {
                    line?.let { LOG.info("scrcpy output: $it") }
                }

                // Khi process kết thúc, loại bỏ khỏi map
                if (!process.isAlive) {
                    LOG.info("scrcpy process cho thiết bị $deviceId đã kết thúc với exit code: ${process.exitValue()}")
                    runningProcesses.remove(deviceId)
                }
            }.start()

            return true
        } catch (e: Exception) {
            LOG.error("Lỗi khi khởi động scrcpy: ${e.message}")
            e.printStackTrace()
            return false
        }
    }

    /**
     * Dừng scrcpy cho thiết bị cụ thể
     */
    fun stopScrcpy(deviceId: String) {
        val process = runningProcesses[deviceId]
        if (process != null && process.isAlive) {
            LOG.info("Dừng scrcpy cho thiết bị: $deviceId")
            try {
                process.destroy()
                process.waitFor()
                runningProcesses.remove(deviceId)
            } catch (e: Exception) {
                LOG.error("Lỗi khi dừng scrcpy: ${e.message}")
            }
        }
    }

    /**
     * Dừng tất cả các processes scrcpy đang chạy
     */
    fun stopAllScrcpy() {
        for ((deviceId, process) in runningProcesses) {
            if (process.isAlive) {
                LOG.info("Dừng scrcpy cho thiết bị: $deviceId")
                try {
                    process.destroy()
                } catch (e: Exception) {
                    LOG.error("Lỗi khi dừng scrcpy cho $deviceId: ${e.message}")
                }
            }
        }
        runningProcesses.clear()
    }

    /**
     * Hiện dialog hướng dẫn cài đặt scrcpy
     */
    private fun showScrcpyInstallDialog() {
        val result = Messages.showDialog(
            project,
            "Để sử dụng tính năng Mirror Screen chất lượng cao, bạn cần cài đặt scrcpy.\n\n" +
                    "Hướng dẫn cài đặt:\n" +
                    "1. Truy cập https://github.com/Genymobile/scrcpy/releases\n" +
                    "2. Tải bản phù hợp với hệ điều hành của bạn\n" +
                    "3. Giải nén và cài đặt\n\n" +
                    "Sau khi cài đặt, khởi động lại plugin để sử dụng tính năng này.",
            "Cần cài đặt scrcpy",
            arrayOf("Mở trang tải scrcpy", "Đóng"),
            0, // default: Mở trang tải
            UIUtil.getWarningIcon()
        )

        if (result == 0) { // Người dùng chọn "Mở trang tải"
            try {
                java.awt.Desktop.getDesktop().browse(
                    java.net.URI("https://github.com/Genymobile/scrcpy/releases")
                )
            } catch (e: Exception) {
                LOG.error("Không thể mở trình duyệt: ${e.message}")
            }
        }
    }

    /**
     * Kiểm tra xem scrcpy đã được cài đặt chưa
     */
    fun isScrcpyInstalled(): Boolean {
        return findScrcpyPath() != null
    }
}

/**
 * Class chứa các tùy chọn cho scrcpy
 */
data class ScrcpyOptions(
    val windowTitle: String? = "Android Mirror", // Tiêu đề cửa sổ
    val maxSize: Int? = 1080,                    // Kích thước tối đa (pixel)
    val bitRate: Int? = 8000000,                 // Bitrate (bps)
    val maxFps: Int? = 60,                       // FPS tối đa
    val borderless: Boolean = false,             // Không viền
    val alwaysOnTop: Boolean = false,            // Luôn hiển thị trên cùng
    val fullscreen: Boolean = false,             // Toàn màn hình
    val showTouches: Boolean = true              // Hiển thị thao tác chạm
)