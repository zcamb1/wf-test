package com.example.demo

import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.wm.ToolWindowManager

class RefreshMirrorAction : AnAction() {
    private val LOG = Logger.getInstance(RefreshMirrorAction::class.java)

    override fun actionPerformed(e: AnActionEvent) {
        LOG.info("RefreshMirrorAction được gọi")

        val project = e.project ?: return

        try {
            // Mở tool window
            val toolWindow = ToolWindowManager.getInstance(project).getToolWindow("Android Mirror")
            toolWindow?.show(null)

            LOG.info("Đã mở tool window thành công")
        } catch (ex: Exception) {
            LOG.error("Lỗi khi thực hiện RefreshMirrorAction: ${ex.message}")
            ex.printStackTrace()
        }
    }

    override fun update(e: AnActionEvent) {
        // Chỉ bật action khi có project và có ít nhất một thiết bị được kết nối
        val project = e.project
        e.presentation.isEnabled = project != null && AdbCommandExecutor.hasConnectedDevices()
    }
}