package com.example.rulemaker.model

/**
 * Represents a rule containing multiple steps.
 */
data class Rule(
    val id: String,
    val ruleSpecVersion: Int,
    val ruleVersion: Int,
    val targetAppPackages: List<TargetApp> = listOf(),
    val landingUri: String? = null,
    val utterances: List<String> = listOf(),
    val preConditions: List<String> = listOf(),
    val steps: MutableList<Step> = mutableListOf(),
    val edgeColor: String? = null
) {
    // Helper function to find a step by ID
    fun findStepById(id: String): Step? {
        return steps.find { it.id == id }
    }
    
    // Helper function to add a step
    fun addStep(step: Step) {
        steps.add(step)
    }
    
    // Helper function to remove a step
    fun removeStep(stepId: String): Boolean {
        val step = findStepById(stepId) ?: return false
        
        // Do not remove steps that have next steps
        if (step.hasChildren()) {
            return false
        }
        
        // Remove this step from all other steps' nextStepIds
        steps.forEach { s ->
            s.nextStepIds.remove(stepId)
        }
        
        return steps.removeIf { it.id == stepId }
    }
    
    // Validate that all nextStepIds reference existing steps
    fun validateNextStepReferences(): List<String> {
        val allStepIds = steps.map { it.id }.toSet()
        val invalidReferences = mutableListOf<String>()
        
        steps.forEach { step ->
            step.nextStepIds.forEach { nextId ->
                if (!allStepIds.contains(nextId)) {
                    invalidReferences.add("Step ${step.id} references non-existent step $nextId")
                }
            }
        }
        
        return invalidReferences
    }
    
    // Find isolated steps (no incoming or outgoing connections)
    fun findIsolatedSteps(): List<Step> {
        val referencedStepIds = mutableSetOf<String>()
        steps.forEach { step ->
            referencedStepIds.addAll(step.nextStepIds)
        }
        
        return steps.filter { step ->
            !referencedStepIds.contains(step.id) && step.nextStepIds.isEmpty()
        }
    }
    
    // Update step ID and all references to it throughout the rule
    fun updateStepId(oldId: String, newId: String): Boolean {
        // Find the step with the oldId
        val step = findStepById(oldId) ?: return false
        
        // First, update all references to this step in other steps' nextStepIds
        steps.forEach { s ->
            // Replace oldId with newId in the nextStepIds list
            val index = s.nextStepIds.indexOf(oldId)
            if (index >= 0) {
                s.nextStepIds[index] = newId
            }
        }
        
        // Then update the step's own id
        step.id = newId
        
        return true
    }
}

/**
 * Represents a target app package for a rule.
 */
data class TargetApp(
    val packageName: String,
    val minAppVersion: Long
) 