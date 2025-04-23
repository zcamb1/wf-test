package com.example.rulemaker.model

/**
 * Represents a step in a rule.
 */
data class Step(
    var id: String,
    var screenId: String,
    var guideContent: String = "",
    val layoutMatchers: List<LayoutMatcher> = mutableListOf(),
    val nextStepIds: MutableList<String> = mutableListOf(),
    val screenMatcher: String? = null,
    val transitionCondition: String? = null,
    var isSubStep: Boolean = false
) {
    // Helper function to check if this step has any children
    fun hasChildren(): Boolean = nextStepIds.isNotEmpty()
    
    // Helper function to add a next step
    fun addNextStep(stepId: String) {
        if (!nextStepIds.contains(stepId)) {
            nextStepIds.add(stepId)
        }
    }
    
    // Helper function to remove a next step
    fun removeNextStep(stepId: String) {
        nextStepIds.remove(stepId)
    }
    
    // Add a function to clear and set all next steps at once
    fun setNextSteps(stepIds: List<String>) {
        nextStepIds.clear()
        nextStepIds.addAll(stepIds)
    }
    
    override fun toString(): String {
        return "Step(id='$id', nextStepIds=$nextStepIds)"
    }
} 