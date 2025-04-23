package com.example.rulemaker

import com.example.rulemaker.ui.RuleMakerWindow
import com.intellij.openapi.project.Project
import com.intellij.openapi.wm.ToolWindow
import com.intellij.openapi.wm.ToolWindowFactory
import com.intellij.ui.content.ContentFactory

/**
 * Entry point for the Rule Maker plugin.
 */
class RuleMakerToolWindowFactory : ToolWindowFactory {
    
    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val ruleMakerWindow = RuleMakerWindow(project)
        val contentFactory = ContentFactory.SERVICE.getInstance()
        val content = contentFactory.createContent(ruleMakerWindow.getComponent(), "", false)
        toolWindow.contentManager.addContent(content)
    }
} 