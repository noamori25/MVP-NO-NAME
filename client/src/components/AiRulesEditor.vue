<template>
  <div class="ai-rules-editor">
    <div class="editor-header">
      <h3>🔧 AI Rules Editor</h3>
      <p>Edit the AI behavior rules</p>
    </div>

    <div class="editor-content">
      <textarea
        v-model="rulesContent"
        class="rules-textarea"
        placeholder="Loading rules..."
        :disabled="loading || saving"
      ></textarea>
    </div>

    <div class="editor-actions">
      <button
        @click="saveRules"
        class="save-button"
        :disabled="loading || saving || !hasChanges"
      >
        <span v-if="!saving">💾 Save Rules</span>
        <span v-else>Saving...</span>
      </button>
    </div>

    <div v-if="successMessage" class="success-message">
      ✅ {{ successMessage }}
    </div>

    <div v-if="errorMessage" class="error-message">
      ⚠️ {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';

const API_URL = 'http://localhost:3000/gemini-ai';
const rulesContent = ref('');
const originalContent = ref('');
const loading = ref(false);
const saving = ref(false);
const successMessage = ref('');
const errorMessage = ref('');

const hasChanges = computed(() => {
  return rulesContent.value !== originalContent.value && rulesContent.value.trim() !== '';
});

async function loadRules() {
  loading.value = true;
  errorMessage.value = '';
  
  try {
    const res = await fetch(`${API_URL}/rules`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to load rules: ${res.status}`);
    }

    const data = await res.json();
    rulesContent.value = data.content || '';
    originalContent.value = data.content || '';
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to load rules';
    console.error('Error loading rules:', err);
  } finally {
    loading.value = false;
  }
}

async function saveRules() {
  if (!hasChanges.value) return;

  saving.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const res = await fetch(`${API_URL}/rules`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ content: rulesContent.value }),
    });

    if (!res.ok) {
      throw new Error(`Failed to save rules: ${res.status}`);
    }

    const data = await res.json();
    successMessage.value = data.message || 'Rules saved successfully!';
    originalContent.value = rulesContent.value;

    // Clear success message after 10 seconds
    setTimeout(() => {
      successMessage.value = '';
    }, 10000);
  } catch (err) {
    errorMessage.value = err instanceof Error ? err.message : 'Failed to save rules';
    console.error('Error saving rules:', err);
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadRules();
});
</script>

<style scoped>
.ai-rules-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-left: 2px solid #e2e8f0;
}

.editor-header {
  padding: 1.5rem;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border-bottom: 2px solid #e2e8f0;
}

.editor-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.editor-header p {
  margin: 0.5rem 0 0 0;
  font-size: 0.85rem;
  opacity: 0.9;
}

.editor-content {
  flex: 1;
  padding: 1rem;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.rules-textarea {
  flex: 1;
  width: 100%;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  font-size: 0.9rem;
  line-height: 1.6;
  resize: none;
  outline: none;
  transition: border-color 0.2s;
}

.rules-textarea:focus {
  border-color: #48bb78;
}

.rules-textarea:disabled {
  background-color: #f7fafc;
  cursor: not-allowed;
  opacity: 0.6;
}

.editor-actions {
  padding: 1rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: center;
}

.save-button {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 2px 4px rgba(72, 187, 120, 0.3);
  min-width: 150px;
}

.save-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(72, 187, 120, 0.4);
}

.save-button:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  box-shadow: none;
  transform: none;
}

.success-message {
  margin: 0.5rem 1rem;
  padding: 0.75rem 1rem;
  background-color: #f0fff4;
  color: #22543d;
  border-radius: 8px;
  border-left: 3px solid #48bb78;
  font-size: 0.9rem;
  animation: slideIn 0.3s ease-out;
}

.error-message {
  margin: 0.5rem 1rem;
  padding: 0.75rem 1rem;
  background-color: #fff5f5;
  color: #c53030;
  border-radius: 8px;
  border-left: 3px solid #fc8181;
  font-size: 0.9rem;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

