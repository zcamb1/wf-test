package com.example.demo

import com.intellij.openapi.diagnostic.Logger
import java.awt.Image
import java.io.ByteArrayInputStream
import java.io.File
import javax.imageio.ImageIO
import java.util.concurrent.TimeUnit

class ScreenCapturingService {
    private val LOG = Logger.getInstance(ScreenCapturingService::class.java)

    // Thay đổi trong ScreenCapturingService.kt
    fun captureScreen(deviceId: String): Image? {
        try {
            LOG.info("Cố gắng chụp màn hình của thiết bị: $deviceId")

            // Sử dụng exec-out - nhanh hơn vì không có bước trung gian
            val adbPath = AdbCommandExecutor.findAdbPath() ?: return null
            val process = Runtime.getRuntime().exec(arrayOf(adbPath, "-s", deviceId, "exec-out", "screencap", "-p"))

            // Đọc dữ liệu trực tiếp từ process
            val image = ImageIO.read(process.inputStream)
            process.waitFor(5, TimeUnit.SECONDS)

            return image
        } catch (e: Exception) {
            LOG.error("Lỗi khi chụp màn hình: ${e.message}")
            // Nếu lỗi, quay lại phương pháp cũ
            return captureScreenUsingFilePull(deviceId)
        }
    }

    private fun captureScreenUsingFilePull(deviceId: String): Image? {
        try {
            // Tạo thư mục tạm nếu chưa tồn tại
            val tempDir = File(System.getProperty("java.io.tmpdir"), "android_mirror")
            if (!tempDir.exists()) {
                tempDir.mkdirs()
            }

            // Tạo đường dẫn file
            val tempFile = File(tempDir, "screen_${System.currentTimeMillis()}.png")
            LOG.info("Sử dụng file tạm: ${tempFile.absolutePath}")

            // Xóa file cũ trên thiết bị nếu có
            AdbCommandExecutor.executeAdbCommand(deviceId, "shell rm -f /sdcard/screenshot.png")

            // Chụp và lưu vào thiết bị
            val captureResult = AdbCommandExecutor.executeAdbCommand(deviceId, "shell screencap /sdcard/screenshot.png")
            if (captureResult == null) {
                LOG.error("Không thể chụp màn hình và lưu vào thiết bị")
                return null
            }

            LOG.info("Đã chụp màn hình và lưu vào thiết bị, đang pull về máy tính...")

            // Sử dụng AdbCommandExecutor để pull file
            val adbPath = AdbCommandExecutor.findAdbPath()
            if (adbPath == null) {
                LOG.error("Không tìm thấy đường dẫn ADB")
                return null
            }

            // Pull file về máy tính
            val pullCmd = arrayOf(adbPath, "-s", deviceId, "pull", "/sdcard/screenshot.png", tempFile.absolutePath)
            LOG.info("Đang thực thi: ${pullCmd.joinToString(" ")}")

            val process = Runtime.getRuntime().exec(pullCmd)
            val complete = process.waitFor(15, TimeUnit.SECONDS)

            if (!complete || process.exitValue() != 0) {
                LOG.error("Lỗi khi pull file: ${process.errorStream.bufferedReader().readText()}")
                return null
            }

            // Đọc file
            if (tempFile.exists() && tempFile.length() > 0) {
                LOG.info("Đã pull file thành công, kích thước: ${tempFile.length()} bytes")
                val image = ImageIO.read(tempFile)

                // Xóa file tạm sau khi đọc
                try {
                    tempFile.delete()
                } catch (e: Exception) {
                    // Bỏ qua lỗi xóa file
                }

                if (image != null) {
                    LOG.info("Đã đọc hình ảnh thành công: ${image.getWidth(null)}x${image.getHeight(null)}")
                } else {
                    LOG.error("Không thể đọc hình ảnh từ file")
                }

                return image
            } else {
                LOG.error("File không tồn tại hoặc rỗng sau khi pull")
            }

        } catch (e: Exception) {
            LOG.error("Lỗi trong quá trình sử dụng file pull: ${e.message}")
            e.printStackTrace()
        }

        return null
    }

    fun saveScreenshot(deviceId: String, filePath: String): Boolean {
        try {
            val image = captureScreen(deviceId)
            if (image != null) {
                val outputFile = java.io.File(filePath)
                javax.imageio.ImageIO.write(image as java.awt.image.RenderedImage, "PNG", outputFile)
                LOG.info("Đã lưu ảnh chụp màn hình vào: $filePath")
                return true
            }
        } catch (e: Exception) {
            LOG.error("Lỗi khi lưu ảnh chụp màn hình: ${e.message}")
        }
        return false
    }
}