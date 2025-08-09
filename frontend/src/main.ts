import { invoke } from "@tauri-apps/api/core";

// App State
let isGenerating = false;
let currentMessage = '';
let models: Array<{id: string, name: string, path: string, size_gb: number}> = [];
let activeModelId: string | null = null;

// DOM Elements
const sidebar = document.getElementById('sidebar') as HTMLElement;
const sidebarToggle = document.getElementById('sidebar-toggle') as HTMLButtonElement;
const newChatBtn = document.getElementById('new-chat-btn') as HTMLButtonElement;
const chatList = document.getElementById('chat-list') as HTMLElement;
const modelSelector = document.getElementById('model-selector') as HTMLSelectElement;
const addModelBtn = document.getElementById('add-model-btn') as HTMLButtonElement;
const statusIndicator = document.getElementById('status-indicator') as HTMLElement;
const statusText = document.getElementById('status-text') as HTMLElement;
const messagesContainer = document.getElementById('messages') as HTMLElement;
const inputBox = document.getElementById('input-box') as HTMLTextAreaElement;
const sendBtn = document.getElementById('send-btn') as HTMLButtonElement;
const stopBtn = document.getElementById('stop-btn') as HTMLButtonElement;
const modalOverlay = document.getElementById('modal-overlay') as HTMLElement;
const modelNameInput = document.getElementById('model-name-input') as HTMLInputElement;
const cancelBtn = document.getElementById('cancel-btn') as HTMLButtonElement;
const confirmBtn = document.getElementById('confirm-btn') as HTMLButtonElement;

// Initialize App
async function initApp() {
    await loadModels();
    setupEventListeners();
    updateStatus('Ready', 'ready');
    inputBox.focus();
}

// Load available models (simplified for your current setup)
async function loadModels() {
    try {
        // For now, we'll just add your current model setup
        models = [{
            id: '1',
            name: 'Llama 3 8B',
            path: '../models/llama3-8b.gguf',
            size_gb: 4.7
        }];
        
        updateModelSelector();
        
        if (models.length > 0 && !activeModelId) {
            activeModelId = models[0].id;
            modelSelector.value = activeModelId;
            const model = models.find(m => m.id === activeModelId);
            updateStatus(model?.name || 'Ready', 'ready');
        }
    } catch (error) {
        console.error('Failed to load models:', error);
        updateStatus('Error loading models', 'ready');
    }
}

// Update model selector dropdown
function updateModelSelector() {
    modelSelector.innerHTML = '';
    
    if (models.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No models available';
        modelSelector.appendChild(option);
    } else {
        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model.id;
            option.textContent = `${model.name} (${model.size_gb}GB)`;
            modelSelector.appendChild(option);
        });
    }
}

// Update status bar
function updateStatus(text: string, state: 'ready' | 'loading' = 'ready') {
    statusText.textContent = text;
    statusIndicator.className = `status-indicator ${state}`;
}

// Add message to chat
function addMessage(content: string, isUser = false): HTMLElement {
    const emptyState = messagesContainer.querySelector('.empty-state');
    if (emptyState) {
        emptyState.remove();
    }

    const messageEl = document.createElement('div');
    messageEl.classList.add('message', isUser ? 'user' : 'assistant');
    messageEl.innerHTML = formatMessage(content);
    messagesContainer.appendChild(messageEl);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return messageEl;
}

// Format message content
function formatMessage(content: string): string {
    return content
        .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
        .replace(/`([^`]+)`/g, '<code>$1</code>')
        .replace(/\n/g, '<br>');
}

// Send message
async function sendMessage() {
    const prompt = inputBox.value.trim();
    if (!prompt || isGenerating || !activeModelId) return;

    addMessage(prompt, true);
    inputBox.value = '';
    autoResize(inputBox);
    
    isGenerating = true;
    inputBox.disabled = true;
    sendBtn.style.display = 'none';
    stopBtn.style.display = 'flex';
    updateStatus('Generating...', 'loading');

    const assistantMessageEl = addMessage('', false);

    try {
        const response = await invoke<string>("run_prompt", { prompt });
        assistantMessageEl.innerHTML = formatMessage(response);
    } catch (error) {
        console.error('Generation failed:', error);
        assistantMessageEl.innerHTML = formatMessage('Sorry, an error occurred while generating the response.');
    } finally {
        finishGeneration();
    }
}

// Stop generation (placeholder for future streaming implementation)
async function stopGeneration() {
    if (!isGenerating) return;
    
    // For now, we can't actually stop the current implementation
    // but we can prepare the UI for when streaming is implemented
    finishGeneration();
}

// Finish generation
function finishGeneration() {
    isGenerating = false;
    inputBox.disabled = false;
    sendBtn.style.display = 'flex';
    stopBtn.style.display = 'none';
    const model = models.find(m => m.id === activeModelId);
    updateStatus(model?.name || 'Ready', 'ready');
    inputBox.focus();
}

// Auto-resize textarea
function autoResize(textarea: HTMLTextAreaElement) {
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
}

// Show add model modal
function showAddModelModal() {
    modalOverlay.style.display = 'flex';
    modelNameInput.value = '';
    modelNameInput.focus();
}

// Hide add model modal
function hideAddModelModal() {
    modalOverlay.style.display = 'none';
}

// Add new model (simplified for current setup)
async function addNewModel() {
    try {
        const modelName = modelNameInput.value.trim();
        if (!modelName) {
            alert('Please enter a model name');
            return;
        }

        // For now, just show that it would work
        // You can extend this later when you add file selection to your Rust backend
        alert(`Model "${modelName}" would be added. File selection dialog requires additional Tauri plugins.`);
        hideAddModelModal();
        
    } catch (error) {
        console.error('Failed to add model:', error);
        updateStatus('Failed to add model', 'ready');
    }
}

// Toggle sidebar on mobile
function toggleSidebar() {
    sidebar.classList.toggle('open');
}

// Create new chat
function createNewChat() {
    // Clear current chat
    messagesContainer.innerHTML = `
        <div class="empty-state">
            <h2>New Conversation</h2>
            <p>Start a new conversation with your local AI assistant.</p>
        </div>
    `;
    
    // Update chat list (you can expand this to actually manage multiple chats)
    const chatItems = chatList.querySelectorAll('.chat-item');
    chatItems.forEach(item => item.classList.remove('active'));
    
    // Focus input
    inputBox.focus();
    
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('open');
    }
}

// Event Listeners
function setupEventListeners() {
    // Sidebar toggle
    sidebarToggle?.addEventListener('click', toggleSidebar);

    // New chat button
    newChatBtn?.addEventListener('click', createNewChat);

    // Chat list items
    chatList?.addEventListener('click', (e) => {
        const chatItem = (e.target as HTMLElement).closest('.chat-item');
        if (chatItem) {
            // Remove active class from all items
            chatList.querySelectorAll('.chat-item').forEach(item => {
                item.classList.remove('active');
            });
            // Add active class to clicked item
            chatItem.classList.add('active');
            
            // Close sidebar on mobile after selection
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('open');
            }
        }
    });

    // Model selector change
    modelSelector?.addEventListener('change', async (e) => {
        const target = e.target as HTMLSelectElement;
        if (target.value && target.value !== activeModelId) {
            activeModelId = target.value;
            const model = models.find(m => m.id === activeModelId);
            updateStatus(model?.name || 'Ready', 'ready');
        }
    });

    // Add model button
    addModelBtn?.addEventListener('click', showAddModelModal);

    // Send message
    sendBtn?.addEventListener('click', sendMessage);
    stopBtn?.addEventListener('click', stopGeneration);

    // Input box
    inputBox?.addEventListener('input', (e) => autoResize(e.target as HTMLTextAreaElement));
    inputBox?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        } else if (e.key === 'Enter' && e.shiftKey) {
            setTimeout(() => autoResize(e.target as HTMLTextAreaElement), 0);
        }
    });

    // Modal
    cancelBtn?.addEventListener('click', hideAddModelModal);
    confirmBtn?.addEventListener('click', addNewModel);
    modelNameInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addNewModel();
        }
    });

    // Close modal on overlay click
    modalOverlay?.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            hideAddModelModal();
        }
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && 
            sidebar.classList.contains('open') && 
            !sidebar.contains(e.target as Node) && 
            !sidebarToggle.contains(e.target as Node)) {
            sidebar.classList.remove('open');
        }
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            sidebar.classList.remove('open');
        }
    });

    // Handle escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (modalOverlay.style.display === 'flex') {
                hideAddModelModal();
            } else if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
            }
        }
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);