package com.example.demo

import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.concurrent.TimeUnit

object AdbCommandExecutor {
    private val LOG = Logger.getInstance(AdbCommandExecutor::class.java)

    // Thêm phương thức public để code bên ngoài có thể truy cập đường dẫn ADB
    fun findAdbPath(): String? {
        // Tìm ADB từ một số vị trí phổ biến
        val androidStudioPaths = listOf(
            "C:/Program Files/Android/Android Studio/sdk/platform-tools/adb.exe",
            "C:/Users/${System.getProperty("user.name")}/AppData/Local/Android/Sdk/platform-tools/adb.exe",
            "/Users/${System.getProperty("user.name")}/Library/Android/sdk/platform-tools/adb",
            "C:/Users/ADMIN/Downloads/platform-tools-latest-windows/platform-tools/adb.exe"
        )

        for (path in androidStudioPaths) {
            val file = File(path)
            if (file.exists()) {
                return file.absolutePath
            }
        }

        // Kiểm tra từ biến môi trường
        val androidHome = System.getenv("ANDROID_HOME") ?: System.getenv("ANDROID_SDK_ROOT")
        if (androidHome != null) {
            val adbFile = if (System.getProperty("os.name").lowercase().contains("windows")) {
                File("$androidHome/platform-tools/adb.exe")
            } else {
                File("$androidHome/platform-tools/adb")
            }

            if (adbFile.exists()) {
                return adbFile.absolutePath
            }
        }

        return null
    }

    fun initialize(project: Project) {
        // Chỉ kiểm tra ADB có sẵn không
        val adbPath = findAdbPath()
        if (adbPath == null) {
            LOG.error("ADB không được tìm thấy. Vui lòng đảm bảo Android SDK đã được cài đặt.")
        } else {
            LOG.info("Đã tìm thấy ADB tại: $adbPath")
        }
    }

    fun getConnectedDevices(): List<String> {
        val devices = mutableListOf<String>()

        try {
            val adbPath = findAdbPath() ?: return emptyList()

            // In ra đường dẫn ADB để debug
            LOG.info("Sử dụng ADB tại: $adbPath")

            val process = Runtime.getRuntime().exec(arrayOf(adbPath, "devices"))
            val success = process.waitFor(10, TimeUnit.SECONDS)
            if (!success) {
                LOG.error("Lệnh 'adb devices' bị timeout")
                return emptyList()
            }

            val output = ByteArrayOutputStream()
            process.inputStream.copyTo(output)
            val outputStr = output.toString()

            // In ra output cho debug
            LOG.info("ADB devices output: $outputStr")

            // Parse device list - sửa lại phương thức parse
            val lines = outputStr.lines()
            for (line in lines) {
                val trimmedLine = line.trim()
                if (trimmedLine.isNotEmpty() && !trimmedLine.startsWith("List") && !trimmedLine.startsWith("*")) {
                    // Split tại khoảng trắng đầu tiên để lấy ID thiết bị
                    val parts = trimmedLine.split("\\s+".toRegex(), 2)
                    if (parts.isNotEmpty()) {
                        val deviceId = parts[0]
                        devices.add(deviceId)
                        LOG.info("Đã tìm thấy thiết bị: $deviceId")
                    }
                }
            }
        } catch (e: Exception) {
            LOG.error("Lỗi khi lấy danh sách thiết bị: ${e.message}")
            e.printStackTrace()
        }

        // In ra danh sách thiết bị tìm được
        LOG.info("Đã tìm thấy ${devices.size} thiết bị: $devices")
        return devices
    }

    fun hasConnectedDevices(): Boolean {
        return getConnectedDevices().isNotEmpty()
    }

    fun executeAdbCommand(deviceId: String, command: String, timeoutSeconds: Int = 15): ByteArray? {
        try {
            val adbPath = findAdbPath() ?: return null

            val commandParts = command.split(" ").toTypedArray()
            val fullCommand = arrayOf(adbPath, "-s", deviceId) + commandParts

            // In ra command để debug
            LOG.info("Executing: ${fullCommand.joinToString(" ")}")

            val process = Runtime.getRuntime().exec(fullCommand)

            // Thiết lập timeout dài hơn cho lệnh screencap
            val completed = process.waitFor(timeoutSeconds.toLong(), TimeUnit.SECONDS)
            if (!completed) {
                process.destroy()
                LOG.error("ADB command timed out after $timeoutSeconds seconds")
                return null
            }

            if (process.exitValue() != 0) {
                val errorOutput = ByteArrayOutputStream()
                process.errorStream.copyTo(errorOutput)
                LOG.error("ADB command failed: ${errorOutput.toString()}")
                return null
            }

            val output = ByteArrayOutputStream()
            process.inputStream.copyTo(output)
            return output.toByteArray()
        } catch (e: Exception) {
            LOG.error("Error executing ADB command: ${e.message}")
            return null
        }
    }

    // Thêm phương thức kiểm tra thiết bị
    fun testDeviceConnection(deviceId: String): Boolean {
        try {
            val result = executeAdbCommand(deviceId, "shell echo test")
            return result != null && result.isNotEmpty()
        } catch (e: Exception) {
            LOG.error("Lỗi khi kiểm tra kết nối thiết bị: ${e.message}")
            return false
        }
    }
}