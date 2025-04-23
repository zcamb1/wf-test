package com.example.demo

import com.intellij.openapi.diagnostic.Logger
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory

class MirrorToolWindowFactory : ToolWindowFactory {
    private val LOG = Logger.getInstance(MirrorToolWindowFactory::class.java)

    init {
        LOG.info("MirrorToolWindowFactory được khởi tạo")
    }

    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        LOG.info("Đang tạo nội dung tool window")

        try {
            // Khởi tạo ADB
            AdbCommandExecutor.initialize()

            // Tạo content
            val mirrorContent = MirrorToolWindowContent(project)
            val contentFactory = ContentFactory.SERVICE.getInstance()
            val content = contentFactory.createContent(mirrorContent.getContent(), "", false)

            // Thiết lập listener để xử lý khi tool window đóng
            toolWindow.addContentManagerListener(object : com.intellij.ui.content.ContentManagerListener {
                override fun contentRemoved(event: com.intellij.ui.content.ContentManagerEvent) {
                    if (event.content == content) {
                        mirrorContent.dispose() // Dọn dẹp khi tool window bị đóng
                    }
                }

                // Triển khai các phương thức bắt buộc khác
                override fun contentAdded(event: com.intellij.ui.content.ContentManagerEvent) {}
                override fun contentRemoveQuery(event: com.intellij.ui.content.ContentManagerEvent) {}
                override fun selectionChanged(event: com.intellij.ui.content.ContentManagerEvent) {}
            })

            toolWindow.contentManager.addContent(content)

            LOG.info("Đã tạo nội dung tool window thành công")
        } catch (e: Exception) {
            LOG.error("Lỗi khi tạo nội dung tool window: ${e.message}")
            e.printStackTrace()
        }
    }
}