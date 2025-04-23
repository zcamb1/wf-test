package com.example.demo

import com.intellij.openapi.diagnostic.Logger
import java.awt.Image
import java.io.ByteArrayInputStream
import java.io.File
import javax.imageio.ImageIO
import java.util.concurrent.TimeUnit

class ScreenCapturingService {
    private val LOG = Logger.getInstance(ScreenCapturingService::class.java)

    fun captureScreen(deviceId: String): Image? {
        try {
            LOG.info("Cố gắng chụp màn hình của thiết bị: $deviceId")

            // Get ADB path
            val adbPath = AdbCommandExecutor.findAdbPath()
            if (adbPath == null) {
                LOG.error("Không tìm thấy đường dẫn ADB")
                return null
            }

            // Use exec-out - faster as there's no intermediate step
            val processBuilder = ProcessBuilder(adbPath, "-s", deviceId, "exec-out", "screencap", "-p")
            val process = processBuilder.start()

            // Read data directly from process
            val image = ImageIO.read(process.inputStream)
            process.waitFor(5, TimeUnit.SECONDS)

            return image
        } catch (e: Exception) {
            LOG.error("Lỗi khi chụp màn hình: ${e.message}")
            // Fallback to the old method if there's an error
            return captureScreenUsingFilePull(deviceId)
        }
    }

    private fun captureScreenUsingFilePull(deviceId: String): Image? {
        try {
            // Create temp directory if it doesn't exist
            val tempDir = File(System.getProperty("java.io.tmpdir"), "android_mirror")
            if (!tempDir.exists()) {
                tempDir.mkdirs()
            }

            // Create file path
            val tempFile = File(tempDir, "screen_${System.currentTimeMillis()}.png")
            LOG.info("Sử dụng file tạm: ${tempFile.absolutePath}")

            // Delete old file on device if it exists
            AdbCommandExecutor.executeAdbCommand(deviceId, "shell rm -f /sdcard/screenshot.png")

            // Capture and save to device
            val captureResult = AdbCommandExecutor.executeAdbCommand(deviceId, "shell screencap /sdcard/screenshot.png")
            if (captureResult == null) {
                LOG.error("Không thể chụp màn hình và lưu vào thiết bị")
                return null
            }

            LOG.info("Đã chụp màn hình và lưu vào thiết bị, đang pull về máy tính...")

            // Get ADB path
            val adbPath = AdbCommandExecutor.findAdbPath()
            if (adbPath == null) {
                LOG.error("Không tìm thấy đường dẫn ADB")
                return null
            }

            // Pull file to computer
            val pullCmd = listOf(adbPath, "-s", deviceId, "pull", "/sdcard/screenshot.png", tempFile.absolutePath)
            LOG.info("Đang thực thi: ${pullCmd.joinToString(" ")}")

            val processBuilder = ProcessBuilder(pullCmd)
            val process = processBuilder.start()
            val complete = process.waitFor(15, TimeUnit.SECONDS)

            if (!complete || process.exitValue() != 0) {
                LOG.error("Lỗi khi pull file: ${process.errorStream.bufferedReader().readText()}")
                return null
            }

            // Read file
            if (tempFile.exists() && tempFile.length() > 0) {
                LOG.info("Đã pull file thành công, kích thước: ${tempFile.length()} bytes")
                val image = ImageIO.read(tempFile)

                // Delete temp file after reading
                try {
                    tempFile.delete()
                } catch (e: Exception) {
                    // Ignore delete file error
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