package com.example.rulemaker.ui

import com.example.rulemaker.model.LayoutMatcher
import com.example.rulemaker.model.Step
import com.intellij.icons.AllIcons
import com.intellij.openapi.actionSystem.ActionManager
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.actionSystem.DefaultActionGroup
import com.intellij.openapi.ui.ComboBox
import com.intellij.ui.CollectionListModel
import com.intellij.ui.IdeBorderFactory
import com.intellij.ui.ToolbarDecorator
import com.intellij.ui.components.JBLabel
import com.intellij.ui.components.JBScrollPane
import com.intellij.ui.components.JBTabbedPane
import com.intellij.ui.components.JBTextField
import com.intellij.ui.table.JBTable
import com.intellij.util.ui.FormBuilder
import com.intellij.util.ui.JBUI
import com.intellij.util.ui.UIUtil
import java.awt.BorderLayout
import java.awt.Dimension
import java.awt.FlowLayout
import java.awt.GridLayout
import java.awt.Color
import javax.swing.*
import javax.swing.border.TitledBorder
import javax.swing.table.DefaultTableModel

/**
 * Panel for editing step details with enhanced features.
 */
class EditorPanel(
    private val onStepUpdated: (Step) -> Unit,
    private var currentRule: com.example.rulemaker.model.Rule? = null
) : JPanel(BorderLayout()) {
    
    private val idField = JBTextField()
    private val screenIdField = JBTextField()
    private val guideContentArea = JTextArea().apply {
        lineWrap = true
        wrapStyleWord = true
    }
    private val nextStepsField = JBTextField()
    private val isSubStepCheckbox = JCheckBox("Is Sub-Step")
    
    // New UI components for enhanced editing
    private val actionTypeComboBox = ComboBox<String>(arrayOf("tap", "swipe_left", "swipe_right", "swipe_up", "swipe_down", "long_press", "back"))
    private val layoutMatchersTable = createLayoutMatchersTable()
    private val transitionConditionField = JBTextField()
    
    // Step navigation buttons
    private val prevStepButton = JButton("Previous Step").apply {
        icon = AllIcons.Actions.Back
        isEnabled = false
    }
    private val nextStepButton = JButton("Next Step").apply {
        icon = AllIcons.Actions.Forward
        isEnabled = false
    }
    
    // Step history for navigation
    private val stepHistory = mutableListOf<String>()
    private var currentHistoryIndex = -1
    
    private var currentStep: Step? = null
    
    init {
        // Create tabbed pane for organizing content
        val tabbedPane = JBTabbedPane()
        
        // Chỉ giữ lại Basic info tab
        val basicInfoPanel = createBasicInfoPanel()
        tabbedPane.addTab("Basic Info", AllIcons.General.Information, basicInfoPanel, "Basic step information")
        
        // Navigation panel for moving between steps
        val navigationPanel = createNavigationPanel()
        
        // Create toolbar with actions
        val toolbarPanel = createToolbar()
        
        // Main layout
        add(toolbarPanel, BorderLayout.NORTH)
        add(tabbedPane, BorderLayout.CENTER)
        add(navigationPanel, BorderLayout.SOUTH)
        
        // Set border
        border = JBUI.Borders.empty(5)
    }
    
    /**
     * Create the basic information panel.
     */
    private fun createBasicInfoPanel(): JPanel {
        val panel = JPanel(BorderLayout())
        
        // Create form
        val formPanel = FormBuilder.createFormBuilder()
            .addLabeledComponent("Step ID:", idField)
            .addLabeledComponent("Screen ID:", screenIdField)
            .addLabeledComponent("Guide Content:", JBScrollPane(guideContentArea).apply {
                preferredSize = Dimension(300, 100)
                minimumSize = Dimension(200, 50)
            })
            .addLabeledComponent("Next Step IDs :", nextStepsField)
            .addComponent(isSubStepCheckbox)
            .addComponentFillVertically(JPanel(), 0)
            .panel
            
        // Add padding
        formPanel.border = JBUI.Borders.empty(10)
        
        panel.add(formPanel, BorderLayout.CENTER)
        
        return panel
    }
    
    /**
     * Create the layout matchers panel.
     */
    private fun createLayoutMatchersPanel(): JPanel {
        val panel = JPanel(BorderLayout())
        
        // Add toolbar decorator for table operations
        val decorator = ToolbarDecorator.createDecorator(layoutMatchersTable)
            .setAddAction { addLayoutMatcher() }
            .setRemoveAction { removeLayoutMatcher() }
            .setEditAction { editLayoutMatcher() }
            .setMoveUpAction { moveLayoutMatcherUp() }
            .setMoveDownAction { moveLayoutMatcherDown() }
            .createPanel()
        
        panel.add(decorator, BorderLayout.CENTER)
        
        // Add help text
        val helpLabel = JBLabel("Define UI elements to target in the app screen")
        helpLabel.border = JBUI.Borders.empty(5, 10)
        panel.add(helpLabel, BorderLayout.NORTH)
        
        return panel
    }
    
    /**
     * Create the action settings panel.
     */
    private fun createActionPanel(): JPanel {
        val panel = JPanel(BorderLayout())
        
        // Create form
        val formPanel = FormBuilder.createFormBuilder()
            .addLabeledComponent("Action Type:", actionTypeComboBox)
            .addLabeledComponent("Transition Condition:", transitionConditionField)
            .addComponentFillVertically(JPanel(), 0)
            .panel
            
        // Add padding
        formPanel.border = JBUI.Borders.empty(10)
        
        panel.add(formPanel, BorderLayout.CENTER)
        
        // Add help text
        val helpLabel = JBLabel("Define what actions should happen in this step")
        helpLabel.border = JBUI.Borders.empty(5, 10)
        panel.add(helpLabel, BorderLayout.NORTH)
        
        return panel
    }
    
    /**
     * Create the navigation panel.
     */
    private fun createNavigationPanel(): JPanel {
        val panel = JPanel(FlowLayout(FlowLayout.CENTER))
        
        // Chỉ giữ lại nút Save Changes
        panel.add(JButton("Save Changes").apply {
            addActionListener {
                saveChanges()
            }
        })
        
        panel.border = BorderFactory.createCompoundBorder(
            BorderFactory.createMatteBorder(1, 0, 0, 0, Color.LIGHT_GRAY),
            JBUI.Borders.empty(8)
        )
        
        return panel
    }
    
    /**
     * Create toolbar with actions.
     */
    private fun createToolbar(): JPanel {
        val panel = JPanel(BorderLayout())
        
        // Chỉ giữ lại step title label
        val titleLabel = JBLabel("Step Editor", SwingConstants.CENTER)
        titleLabel.font = titleLabel.font.deriveFont(titleLabel.font.size + 2f)
        titleLabel.border = JBUI.Borders.empty(5)
        panel.add(titleLabel, BorderLayout.CENTER)
        
        return panel
    }
    
    /**
     * Create the layout matchers table.
     */
    private fun createLayoutMatchersTable(): JBTable {
        val columnNames = arrayOf("Target Type", "Match Value", "Match Criteria", "Highlight")
        val tableModel = DefaultTableModel(columnNames, 0)
        
        val table = JBTable(tableModel)
        table.preferredScrollableViewportSize = Dimension(300, 150)
        
        return table
    }
    
    /**
     * Update the layout matchers table with data from the current step.
     */
    private fun updateLayoutMatchersTable() {
        val tableModel = layoutMatchersTable.model as DefaultTableModel
        tableModel.rowCount = 0
        
        val step = currentStep ?: return
        
        for (matcher in step.layoutMatchers) {
            tableModel.addRow(arrayOf(
                matcher.matchTarget,
                matcher.matchOperand,
                matcher.matchCriteria ?: "",
                matcher.highlightType ?: ""
            ))
        }
    }
    
    /**
     * Add a new layout matcher.
     */
    private fun addLayoutMatcher() {
        // This would open a dialog to add a new layout matcher
        // For now just adding a placeholder row
        val tableModel = layoutMatchersTable.model as DefaultTableModel
        tableModel.addRow(arrayOf("text", "New Element", "equals", "click"))
    }
    
    /**
     * Remove a layout matcher.
     */
    private fun removeLayoutMatcher() {
        val selectedRow = layoutMatchersTable.selectedRow
        if (selectedRow >= 0) {
            val tableModel = layoutMatchersTable.model as DefaultTableModel
            tableModel.removeRow(selectedRow)
        }
    }
    
    /**
     * Edit a layout matcher.
     */
    private fun editLayoutMatcher() {
        // This would open a dialog to edit the selected layout matcher
    }
    
    /**
     * Move a layout matcher up in the list.
     */
    private fun moveLayoutMatcherUp() {
        val selectedRow = layoutMatchersTable.selectedRow
        if (selectedRow > 0) {
            val tableModel = layoutMatchersTable.model as DefaultTableModel
            tableModel.moveRow(selectedRow, selectedRow, selectedRow - 1)
            layoutMatchersTable.setRowSelectionInterval(selectedRow - 1, selectedRow - 1)
        }
    }
    
    /**
     * Move a layout matcher down in the list.
     */
    private fun moveLayoutMatcherDown() {
        val selectedRow = layoutMatchersTable.selectedRow
        val tableModel = layoutMatchersTable.model as DefaultTableModel
        if (selectedRow >= 0 && selectedRow < tableModel.rowCount - 1) {
            tableModel.moveRow(selectedRow, selectedRow, selectedRow + 1)
            layoutMatchersTable.setRowSelectionInterval(selectedRow + 1, selectedRow + 1)
        }
    }
    
    /**
     * Highlight UI elements in the mirrored screen.
     */
    private fun highlightUiElements() {
        // This would trigger highlighting in the mirrored screen
        JOptionPane.showMessageDialog(
            this,
            "Highlighting UI elements in mirrored screen",
            "Highlight",
            JOptionPane.INFORMATION_MESSAGE
        )
    }
    
    /**
     * Navigate to the previous step in history.
     */
    private fun navigateToPreviousStep() {
        if (currentHistoryIndex > 0) {
            currentHistoryIndex--
            val stepId = stepHistory[currentHistoryIndex]
            // This would load the step without adding to history
            // For now just show a message
            JOptionPane.showMessageDialog(
                this,
                "Navigating to previous step: $stepId",
                "Navigation",
                JOptionPane.INFORMATION_MESSAGE
            )
        }
        
        updateNavigationButtons()
    }
    
    /**
     * Navigate to the next step in history.
     */
    private fun navigateToNextStep() {
        if (currentHistoryIndex < stepHistory.size - 1) {
            currentHistoryIndex++
            val stepId = stepHistory[currentHistoryIndex]
            // This would load the step without adding to history
            // For now just show a message
            JOptionPane.showMessageDialog(
                this,
                "Navigating to next step: $stepId",
                "Navigation",
                JOptionPane.INFORMATION_MESSAGE
            )
        }
        
        updateNavigationButtons()
    }
    
    /**
     * Update the enabled state of navigation buttons.
     */
    private fun updateNavigationButtons() {
        prevStepButton.isEnabled = currentHistoryIndex > 0
        nextStepButton.isEnabled = currentHistoryIndex < stepHistory.size - 1
    }
    
    /**
     * Delete the current step.
     */
    private fun deleteCurrentStep() {
        // This would trigger step deletion
        // For now just show a confirmation dialog
        JOptionPane.showMessageDialog(
            this,
            "Delete step: ${currentStep?.id}",
            "Delete Step",
            JOptionPane.INFORMATION_MESSAGE
        )
    }
    
    /**
     * Set the step to edit.
     */
    fun setStep(step: Step) {
        currentStep = step
        
        // Add to step history
        stepHistory.add(step.id)
        currentHistoryIndex = stepHistory.size - 1
        updateNavigationButtons()
        
        // Update UI with step details
        idField.text = step.id
        screenIdField.text = step.screenId
        guideContentArea.text = step.guideContent
        nextStepsField.text = step.nextStepIds.joinToString(", ")
        isSubStepCheckbox.isSelected = step.isSubStep
        
        // Update action type
        actionTypeComboBox.selectedItem = "tap" // Default to tap if no specific action is set
        
        // Update transition condition
        transitionConditionField.text = step.transitionCondition ?: ""
        
        // Update layout matchers table
        updateLayoutMatchersTable()
        
        // Allow editing of both ID fields
        idField.isEditable = true
        screenIdField.isEditable = true
    }
    
    /**
     * Set the current rule for reference.
     */
    fun setRule(rule: com.example.rulemaker.model.Rule) {
        currentRule = rule
    }
    
    /**
     * Save changes to the current step.
     */
    private fun saveChanges() {
        if (currentStep == null) return
        
        val oldId = currentStep!!.id
        val oldScreenId = currentStep!!.screenId
        
        val newId = idField.text
        val newScreenId = screenIdField.text
        
        // Track if ID was changed for message
        var idChanged = false
        
        // Check if ID has changed and update all references in the rule
        if (oldId != newId && currentRule != null) {
            val success = currentRule!!.updateStepId(oldId, newId)
            
            if (success) {
                idChanged = true
            } else {
                // ID change failed, revert to old ID
                JOptionPane.showMessageDialog(
                    this,
                    "Could not update step ID. ID reverted.",
                    "ID Change Failed",
                    JOptionPane.ERROR_MESSAGE
                )
                idField.text = oldId
                currentStep!!.id = oldId
                // Notify listener of the revert
                onStepUpdated(currentStep!!)
                return
            }
        }
        
        // Update step with values from UI
        currentStep!!.id = newId
        currentStep!!.screenId = newScreenId
        currentStep!!.guideContent = guideContentArea.text
        currentStep!!.isSubStep = isSubStepCheckbox.isSelected
        
        // Parse next step IDs
        val nextStepIds = nextStepsField.text
            .split(",")
            .map { it.trim() }
            .filter { it.isNotEmpty() }
        
        currentStep!!.nextStepIds.clear()
        currentStep!!.nextStepIds.addAll(nextStepIds)
        
        // Notify listener
        onStepUpdated(currentStep!!)
        
        // Show confirmation message with ID change info if applicable
        val message = if (idChanged) {
            "Changes saved successfully!\nStep ID changed from $oldId to $newId. All references updated."
        } else {
            "Changes saved successfully!"
        }
        
        JOptionPane.showMessageDialog(
            this,
            message,
            "Success",
            JOptionPane.INFORMATION_MESSAGE
        )
    }
    
    /**
     * Create a new step with initial values.
     */
    fun createNewStep(isSubStep: Boolean = false): Step {
        val newStepId = "step_${System.currentTimeMillis()}"
        val step = Step(
            id = newStepId,
            screenId = "com.example.activity",
            guideContent = "New step",
            isSubStep = isSubStep
        )
        
        // Set for editing
        setStep(step)
        
        // ID should be editable for new steps
        idField.isEditable = true
        
        return step
    }
    
    /**
     * Reset the form.
     */
    fun reset() {
        currentStep = null
        idField.text = ""
        screenIdField.text = ""
        guideContentArea.text = ""
        nextStepsField.text = ""
        isSubStepCheckbox.isSelected = false
        
        // Reset action type
        actionTypeComboBox.selectedItem = "tap"
        
        // Reset transition condition
        transitionConditionField.text = ""
        
        // Clear layout matchers table
        val tableModel = layoutMatchersTable.model as DefaultTableModel
        tableModel.rowCount = 0
    }
} 