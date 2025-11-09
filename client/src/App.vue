<template>
  <div class="app">
    <div class="chat-container">
      <!-- Response Display Area -->
      <div class="response-area">
        <div v-if="loading" class="loading">
          <div class="spinner"></div>
          <span>Loading...</span>
        </div>
        <div v-else-if="error" class="error">
          {{ error }}
        </div>
        <div v-else-if="response" class="response">
          {{ response }}
        </div>
        <div v-else class="placeholder">
          Send a message to get started...
        </div>
      </div>

      <!-- Image Preview -->
      <div v-if="selectedImage" class="image-preview-container">
        <div class="image-preview">
          <img :src="selectedImage" alt="Preview" class="preview-image" />
          <button @click="clearImage" class="remove-image-button" title="Remove image">
            ×
          </button>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="input-wrapper">
          <input
            v-model="message"
            type="text"
            placeholder="Type your message..."
            class="text-input"
            @keyup.enter="sendMessage"
            :disabled="loading"
          />
          <button
            @click="triggerFileInput"
            class="camera-button"
            :disabled="loading"
            title="Upload image"
          >
            📷
          </button>
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            @change="handleImageSelect"
            class="file-input"
            :disabled="loading"
          />
          <button
            @click="sendMessage"
            class="send-button"
            :disabled="loading || (!message.trim() && !selectedImage)"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const message = ref('');
const response = ref('');
const loading = ref(false);
const error = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const selectedImage = ref<string | null>(null);

const API_URL = 'http://localhost:3000/gemini-ai/send';

function triggerFileInput() {
  fileInput.value?.click();
}

function handleImageSelect(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file && file.type.startsWith('image/')) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      selectedImage.value = result; // This will be base64
    };
    reader.readAsDataURL(file);
  } else {
    error.value = 'Please select a valid image file';
    selectedImage.value = null;
  }
}

function clearImage() {
  selectedImage.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

async function sendMessage() {
  if (!message.value.trim() && !selectedImage.value) {
    return;
  }

  loading.value = true;
  error.value = '';
  response.value = '';

  try {
    const requestBody: { text: string; image?: string } = {
      text: message.value.trim(),
    };

    if (selectedImage.value) {
      requestBody.image = selectedImage.value;
    }

    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!res.ok) {
      throw new Error(`Server error: ${res.status}`);
    }

    const data = await res.json();
    response.value = data.response || data.message || 'No response received';
    
    // Clear input and image after successful send
    message.value = '';
    selectedImage.value = null;
    if (fileInput.value) {
      fileInput.value.value = '';
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to send message';
    console.error('Error sending message:', err);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f5f5f5;
  padding: 1rem;
}

.chat-container {
  width: 100%;
  max-width: 800px;
  height: 100%;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.response-area {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  background-color: #fafafa;
}

.placeholder {
  color: #999;
  text-align: center;
  padding: 2rem;
  font-style: italic;
}

.response {
  color: #333;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #666;
}

.spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #e0e0e0;
  border-top-color: #4a90e2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error {
  color: #d32f2f;
  padding: 0.5rem;
  background-color: #ffebee;
  border-radius: 4px;
  border-left: 3px solid #d32f2f;
}

.input-area {
  padding: 1rem;
  background-color: white;
  border-top: 1px solid #e0e0e0;
}

.input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.text-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 1rem;
  outline: none;
}

.text-input:focus {
  border-color: #4a90e2;
}

.text-input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.file-input {
  display: none;
}

.camera-button {
  padding: 0.75rem 1rem;
  background-color: #f5f5f5;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
  transition: background-color 0.2s;
}

.camera-button:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.camera-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-button {
  padding: 0.75rem 1.5rem;
  background-color: #4a90e2;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: background-color 0.2s;
}

.send-button:hover:not(:disabled) {
  background-color: #357abd;
}

.send-button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.image-preview-container {
  padding: 0.5rem 1rem;
  background-color: #f9f9f9;
  border-top: 1px solid #e0e0e0;
}

.image-preview {
  position: relative;
  display: inline-block;
  max-width: 200px;
  max-height: 150px;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.remove-image-button {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #d32f2f;
  color: white;
  border: 2px solid white;
  cursor: pointer;
  font-size: 18px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.remove-image-button:hover {
  background-color: #b71c1c;
}
</style>
