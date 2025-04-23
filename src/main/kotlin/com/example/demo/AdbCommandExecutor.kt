package com.example.demo

import com.android.ddmlib.AndroidDebugBridge
import com.android.ddmlib.IDevice
import com.intellij.openapi.diagnostic.Logger
import java.io.ByteArrayOutputStream
import java.io.File
import java.util.concurrent.TimeUnit

object AdbCommandExecutor {
    private val LOG = Logger.getInstance(AdbCommandExecutor::class.java)
    private var androidDebugBridge: AndroidDebugBridge? = null

    fun initialize() {
        try {
            if (androidDebugBridge == null || !androidDebugBridge!!.isConnected) {
                val adbPath = findAdbPath()
                if (adbPath != null) {
                    LOG.info("Initializing ADB with path: $adbPath")
                    
                    // Initialize the bridge
                    AndroidDebugBridge.init(false)
                    androidDebugBridge = AndroidDebugBridge.createBridge(adbPath, false, 5, TimeUnit.SECONDS)
                    
                    if (androidDebugBridge != null && androidDebugBridge!!.isConnected) {
                        LOG.info("Successfully connected to ADB")
                    } else {
                        LOG.error("Failed to connect to ADB")
                    }
                } else {
                    LOG.error("Unable to locate ADB. Please make sure Android SDK is properly installed.")
                }
            }
        } catch (e: Exception) {
            LOG.error("Error initializing ADB: ${e.message}", e)
        }
    }

    fun findAdbPath(): String? {
        // First check ANDROID_HOME environment variable
        val androidHome = System.getenv("ANDROID_HOME")
        if (androidHome != null) {
            val path = File(androidHome, "platform-tools${File.separator}adb${if(isWindows()) ".exe" else ""}")
            if (path.exists()) {
                return path.absolutePath
            }
        }
        
        // Check ANDROID_SDK_ROOT environment variable
        val androidSdkRoot = System.getenv("ANDROID_SDK_ROOT")
        if (androidSdkRoot != null) {
            val path = File(androidSdkRoot, "platform-tools${File.separator}adb${if(isWindows()) ".exe" else ""}")
            if (path.exists()) {
                return path.absolutePath
            }
        }
        
        // Try common locations
        val commonLocations = listOf(
            // Windows
            "C:\\Android\\sdk\\platform-tools\\adb.exe",
            "C:\\Program Files\\Android\\android-sdk\\platform-tools\\adb.exe",
            "C:\\Program Files (x86)\\Android\\android-sdk\\platform-tools\\adb.exe",
            // macOS
            "/Applications/Android Studio.app/Contents/sdk/platform-tools/adb",
            "/Users/${System.getProperty("user.name")}/Library/Android/sdk/platform-tools/adb",
            // Linux
            "/usr/local/android-sdk/platform-tools/adb",
            "/home/${System.getProperty("user.name")}/Android/Sdk/platform-tools/adb"
        )
        
        for (location in commonLocations) {
            val file = File(location)
            if (file.exists()) {
                return file.absolutePath
            }
        }
        
        // Try to find from PATH
        return try {
            val process = if (isWindows()) {
                ProcessBuilder("where", "adb").start()
            } else {
                ProcessBuilder("which", "adb").start()
            }
            
            process.waitFor(5, TimeUnit.SECONDS)
            val output = process.inputStream.bufferedReader().readText().trim()
            if (output.isNotEmpty() && File(output).exists()) {
                output
            } else {
                null
            }
        } catch (e: Exception) {
            LOG.error("Error finding ADB from PATH", e)
            null
        }
    }
    
    private fun isWindows(): Boolean {
        return System.getProperty("os.name").lowercase().contains("windows")
    }

    fun getConnectedDevices(): List<String> {
        // Try using AndroidDebugBridge first
        try {
            if (androidDebugBridge != null && androidDebugBridge!!.isConnected) {
                return androidDebugBridge!!.devices.filter { it.isOnline }.map { it.serialNumber }
            }
        } catch (e: Exception) {
            LOG.error("Error getting devices from AndroidDebugBridge: ${e.message}", e)
        }
        
        // Fallback to command line
        val devices = mutableListOf<String>()
        try {
            val adb = findAdbPath() ?: return emptyList()
            val process = ProcessBuilder(adb, "devices").start()
            process.waitFor()

            val output = ByteArrayOutputStream()
            process.inputStream.copyTo(output)
            val outputStr = output.toString()

            val lines = outputStr.lines().drop(1) // Skip header line
            for (line in lines) {
                val trimmedLine = line.trim()
                if (trimmedLine.isNotEmpty() && !trimmedLine.startsWith("*")) {
                    val parts = trimmedLine.split("\\s+".toRegex())
                    if (parts.size >= 2) {
                        devices.add(parts[0])
                    }
                }
            }
        } catch (e: Exception) {
            LOG.error("Error getting connected devices", e)
        }

        return devices
    }

    fun hasConnectedDevices(): Boolean {
        return getConnectedDevices().isNotEmpty()
    }

    fun executeAdbCommand(deviceId: String, command: String): ByteArray? {
        try {
            val adb = findAdbPath() ?: return null
            val fullCommand = mutableListOf(adb, "-s", deviceId)
            fullCommand.addAll(command.split(" "))
            
            val process = ProcessBuilder(fullCommand).start()
            process.waitFor()

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
            LOG.error("Error executing ADB command", e)
            return null
        }
    }
}