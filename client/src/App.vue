<template>
  <div class="app">
    <div class="main-layout">
      <div class="chat-container">
      <!-- Chat Header -->
      <div class="chat-header">
        <h2>🔧 Handyman Assistant</h2>
        <p>Ask about repairs and get instant quotations</p>
      </div>

      <!-- Chat Messages Area -->
      <div class="messages-area" ref="messagesArea">
        <div v-if="chatHistory.length === 0" class="placeholder">
          👋 Welcome! Describe your handyman needs and I'll help you with a quotation.
        </div>
        
        <div v-for="(msg, index) in chatHistory" :key="index" 
             :class="['message-wrapper', msg.role]">
          <div class="message-bubble">
            <div v-if="msg.image" class="message-image">
              <img :src="msg.image" alt="Attached image" />
            </div>
            <div class="message-text">{{ msg.content }}</div>
            <div class="message-time">{{ msg.timestamp }}</div>
          </div>
        </div>

        <div v-if="loading" class="message-wrapper assistant">
          <div class="message-bubble">
            <div class="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>

        <div v-if="error" class="error-message">
          ⚠️ {{ error }}
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
          <textarea
            ref="textareaRef"
            v-model="message"
            placeholder="Type your message... (Enter to send, Cmd+Enter for new line)"
            class="text-input"
            @keydown="handleKeyDown"
            :disabled="loading"
            rows="1"
          ></textarea>
          <button
            @click="sendMessage"
            class="send-button"
            :disabled="loading || (!message.trim() && !selectedImage)"
          >
            <span v-if="!loading">Send</span>
            <span v-else>...</span>
          </button>
        </div>
      </div>
    </div>

    <!-- AI Rules Editor -->
    <AiRulesEditor />
  </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue';
import AiRulesEditor from './components/AiRulesEditor.vue';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  image?: string;
}

const message = ref('');
const chatHistory = ref<ChatMessage[]>([]);
const loading = ref(false);
const error = ref('');
const fileInput = ref<HTMLInputElement | null>(null);
const selectedImage = ref<string | null>(null);
const messagesArea = ref<HTMLElement | null>(null);
const textareaRef = ref<HTMLTextAreaElement | null>(null);

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
      selectedImage.value = result;
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

function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function handleKeyDown(event: KeyboardEvent) {
  // Cmd+Enter (Mac) or Ctrl+Enter (Windows/Linux) for new line
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    // Allow default behavior (new line)
    return;
  }
  
  // Enter to send
  if (event.key === 'Enter' && !event.shiftKey && !event.metaKey && !event.ctrlKey) {
    event.preventDefault();
    sendMessage();
  }
}

async function scrollToBottom() {
  await nextTick();
  if (messagesArea.value) {
    messagesArea.value.scrollTop = messagesArea.value.scrollHeight;
  }
}

async function sendMessage() {
  if (!message.value.trim() && !selectedImage.value) {
    return;
  }

  const userMessage = message.value.trim();
  const userImage = selectedImage.value;

  // Add user message to chat history
  chatHistory.value.push({
    role: 'user',
    content: userMessage || '📷 Image attached',
    timestamp: getTimestamp(),
    image: userImage || undefined,
  });

  // Clear input immediately
  message.value = '';
  selectedImage.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }

  loading.value = true;
  error.value = '';
  
  await scrollToBottom();

  try {
    // Build chat history for API (exclude timestamps and only include role + content)
    const historyForAPI = chatHistory.value.map(msg => ({
      role: msg.role,
      content: msg.content,
      ...(msg.image && { image: msg.image })
    }));

    const requestBody: { text: string; image?: string; history?: any[] } = {
      text: userMessage,
      history: historyForAPI,
    };

    if (userImage) {
      requestBody.image = userImage;
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
    const assistantResponse = data.response || data.message || 'No response received';
    
    // Add assistant response to chat history
    chatHistory.value.push({
      role: 'assistant',
      content: assistantResponse,
      timestamp: getTimestamp(),
    });

    await scrollToBottom();
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to send message';
    console.error('Error sending message:', err);
    
    // Remove the user message if request failed
    chatHistory.value.pop();
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
* {
  box-sizing: border-box;
}

.app {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.main-layout {
  width: 100%;
  max-width: 1400px;
  height: 100%;
  max-height: 700px;
  display: flex;
  gap: 1rem;
  overflow: hidden;
}

.chat-container {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

/* Chat Header */
.chat-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1.5rem;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.chat-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
}

.chat-header p {
  margin: 0.5rem 0 0 0;
  font-size: 0.9rem;
  opacity: 0.9;
}

/* Messages Area */
.messages-area {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
  background-color: #f8f9fa;
  background-image: 
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(255, 255, 255, 0.03) 10px,
      rgba(255, 255, 255, 0.03) 20px
    );
  display: flex;
  flex-direction: column;
  gap: 1rem;
  scroll-behavior: smooth;
}

.messages-area::-webkit-scrollbar {
  width: 6px;
}

.messages-area::-webkit-scrollbar-track {
  background: transparent;
}

.messages-area::-webkit-scrollbar-thumb {
  background: #cbd5e0;
  border-radius: 3px;
}

.messages-area::-webkit-scrollbar-thumb:hover {
  background: #a0aec0;
}

.placeholder {
  color: #718096;
  text-align: center;
  padding: 3rem 2rem;
  font-size: 1.1rem;
  margin: auto;
}

/* Message Bubbles */
.message-wrapper {
  display: flex;
  margin-bottom: 0.5rem;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message-wrapper.user {
  justify-content: flex-end;
}

.message-wrapper.assistant {
  justify-content: flex-start;
}

.message-bubble {
  max-width: 70%;
  padding: 0.875rem 1.125rem;
  border-radius: 18px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  position: relative;
}

.message-wrapper.user .message-bubble {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-bottom-right-radius: 4px;
}

.message-wrapper.assistant .message-bubble {
  background: white;
  color: #2d3748;
  border-bottom-left-radius: 4px;
  border: 1px solid #e2e8f0;
}

.message-text {
  line-height: 1.5;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-size: 0.95rem;
}

.message-time {
  font-size: 0.7rem;
  margin-top: 0.5rem;
  opacity: 0.7;
}

.message-wrapper.user .message-time {
  text-align: right;
}

.message-image {
  margin-bottom: 0.5rem;
}

.message-image img {
  max-width: 100%;
  border-radius: 8px;
  display: block;
}

/* Typing Indicator */
.typing-indicator {
  display: flex;
  gap: 4px;
  padding: 0.5rem 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #cbd5e0;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

/* Error Message */
.error-message {
  background-color: #fff5f5;
  color: #c53030;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  border-left: 3px solid #fc8181;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

/* Image Preview Container */
.image-preview-container {
  padding: 0.75rem 1rem;
  background-color: #f7fafc;
  border-top: 1px solid #e2e8f0;
}

.image-preview {
  position: relative;
  display: inline-block;
  max-width: 150px;
  max-height: 100px;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e2e8f0;
}

.remove-image-button {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #e53e3e;
  color: white;
  border: 2px solid white;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-weight: bold;
}

.remove-image-button:hover {
  background-color: #c53030;
  transform: scale(1.1);
}

/* Input Area */
.input-area {
  padding: 1rem;
  background-color: white;
  border-top: 1px solid #e2e8f0;
}

.input-wrapper {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
}

.text-input {
  flex: 1;
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 0.95rem;
  font-family: inherit;
  outline: none;
  resize: none;
  max-height: 120px;
  min-height: 44px;
  transition: border-color 0.2s;
  line-height: 1.5;
}

.text-input:focus {
  border-color: #667eea;
}

.text-input:disabled {
  background-color: #f7fafc;
  cursor: not-allowed;
  opacity: 0.6;
}

.text-input::placeholder {
  color: #a0aec0;
}

.file-input {
  display: none;
}

.camera-button {
  padding: 0.75rem 1rem;
  background-color: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  font-size: 1.25rem;
  transition: all 0.2s;
  min-width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.camera-button:hover:not(:disabled) {
  background-color: #edf2f7;
  border-color: #cbd5e0;
  transform: translateY(-1px);
}

.camera-button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.send-button {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  transition: all 0.2s;
  min-width: 70px;
  height: 44px;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.3);
}

.send-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
}

.send-button:disabled {
  background: #cbd5e0;
  cursor: not-allowed;
  box-shadow: none;
}

.send-button:active:not(:disabled) {
  transform: translateY(0);
}

/* AI Rules Editor Layout */
.main-layout > :last-child {
  width: 400px;
  min-width: 350px;
  max-width: 500px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

/* Responsive design */
@media (max-width: 1200px) {
  .main-layout {
    flex-direction: column;
  }
  
  .main-layout > :last-child {
    width: 100%;
    max-width: 100%;
    height: 300px;
    min-height: 250px;
  }
}
</style>
