// ==========================================
// js/chat.js - Chat/Messages Logic
// ==========================================

let conversations = [];
let currentConversation = null;
let messages = [];
let pollingInterval = null;

async function initChat() {
    await Components.initLayout();
    
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="page-header" style="margin-bottom: 1.5rem; display: flex; justify-content: space-between; align-items: center;">
            <div>
                <h1>Messages</h1>
                <p class="text-muted">Chat with your team</p>
            </div>
            <button class="btn btn-primary" onclick="showNewConversationModal()">
                + New Conversation
            </button>
        </div>

        <div class="chat-container">
            <!-- Conversations List -->
            <div class="conversations-panel">
                <div class="conversations-header">Conversations</div>
                <div class="conversations-list" id="conversationsList">
                    <div class="loading-spinner"><div class="spinner"></div></div>
                </div>
            </div>

            <!-- Chat Messages -->
            <div class="chat-panel">
                <div class="chat-header" id="chatHeader">
                    Select a conversation
                </div>
                <div class="chat-messages" id="chatMessages">
                    <div class="empty-state" style="text-align: center; padding: 3rem; color: var(--secondary);">
                        <div style="font-size: 4rem;">💬</div>
                        <p>Select a conversation to start chatting</p>
                    </div>
                </div>
                <div class="chat-input" id="chatInput" style="display: none;">
                    <form onsubmit="sendMessage(event)">
                        <div style="display: flex; gap: 0.5rem;">
                            <input 
                                type="text" 
                                class="form-control" 
                                id="messageInput"
                                placeholder="Type a message..."
                                required
                            >
                            <button type="submit" class="btn btn-primary">Send</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    await loadConversations();
    startPolling();
}

async function loadConversations() {
    try {
        const response = await API.messages.getConversations();
        conversations = response.data || response || [];
        renderConversations();
    } catch (error) {
        console.error('Error loading conversations:', error);
        Utils.showToast('Failed to load conversations', 'error');
    }
}

function renderConversations() {
    const list = document.getElementById('conversationsList');
    
    if (conversations.length === 0) {
        list.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: var(--secondary);">
                <p>No conversations yet</p>
            </div>
        `;
        return;
    }

    list.innerHTML = conversations.map(conv => `
        <div 
            class="conversation-item ${conv.unread_count > 0 ? 'unread' : ''} ${currentConversation?.conversation_id === conv.conversation_id ? 'active' : ''}"
            onclick="selectConversation(${conv.conversation_id})"
        >
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                <strong>Conversation #${conv.conversation_id}</strong>
                ${conv.unread_count > 0 ? `<span class="badge" style="background: var(--primary); color: white; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.75rem;">${conv.unread_count}</span>` : ''}
            </div>
            <div style="font-size: 0.875rem; color: var(--secondary);">
                ${Utils.capitalize(conv.conversation_type)} • ${Utils.formatRelativeTime(conv.created_at)}
            </div>
        </div>
    `).join('');
}

async function selectConversation(conversationId) {
    try {
        currentConversation = conversations.find(c => c.conversation_id === conversationId);
        messages = await API.messages.getMessages(conversationId);
        
        // Mark as read
        await API.messages.markAsRead(conversationId);
        
        // Update UI
        renderConversations();
        renderMessages();
        
        // Show input
        document.getElementById('chatInput').style.display = 'block';
        document.getElementById('chatHeader').textContent = `Conversation #${conversationId}`;
        
        // Scroll to bottom
        scrollToBottom();
    } catch (error) {
        console.error('Error loading messages:', error);
        Utils.showToast('Failed to load messages', 'error');
    }
}

function renderMessages() {
    const container = document.getElementById('chatMessages');
    const currentUser = Auth.getUser();
    
    if (messages.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="text-align: center; padding: 3rem; color: var(--secondary);">
                <p>No messages yet. Start the conversation!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = messages.map(msg => {
        const isSent = msg.sender_id === currentUser.user_id;
        return `
            <div class="message ${isSent ? 'sent' : 'received'}">
                ${!isSent ? `<div style="font-weight: bold; margin-bottom: 0.25rem;">${msg.first_name} ${msg.last_name}</div>` : ''}
                <div>${Utils.escapeHtml(msg.message_text)}</div>
                <div class="message-time">${Utils.formatRelativeTime(msg.sent_at)}</div>
            </div>
        `;
    }).join('');
}

async function sendMessage(event) {
    event.preventDefault();
    
    if (!currentConversation) return;
    
    const input = document.getElementById('messageInput');
    const text = input.value.trim();
    
    if (!text) return;
    
    try {
        await API.messages.send(currentConversation.conversation_id, text);
        input.value = '';
        
        // Reload messages
        await selectConversation(currentConversation.conversation_id);
    } catch (error) {
        Utils.showToast('Failed to send message', 'error');
    }
}

function scrollToBottom() {
    const container = document.getElementById('chatMessages');
    container.scrollTop = container.scrollHeight;
}

function showNewConversationModal() {
    const modal = document.createElement('div');
    modal.className = 'modal show';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 400px;">
            <div class="modal-header">
                <h2>New Conversation</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">×</button>
            </div>
            <form id="newConversationForm">
                <div class="form-group">
                    <label class="form-label">Type</label>
                    <select class="form-control" id="conversationType" required>
                        <option value="direct">Direct Message</option>
                        <option value="group">Group Chat</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Receiver User ID (for DM)</label>
                    <input type="text" class="form-control" id="receiverId" placeholder="e.g., EMP001">
                </div>
                <button type="submit" class="btn btn-primary">Create Conversation</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('newConversationForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const type = document.getElementById('conversationType').value;
        const receiverId = document.getElementById('receiverId').value;

        try {
            const data = { conversation_type: type };
            if (type === 'direct' && receiverId) {
                data.receiver_id = receiverId;
            }

            await API.messages.createConversation(data);
            Utils.showToast('Conversation created', 'success');
            modal.remove();
            await loadConversations();
        } catch (error) {
            Utils.showToast('Failed to create conversation', 'error');
        }
    });
}

function startPolling() {
    // Poll for new messages every 10 seconds
    pollingInterval = setInterval(async () => {
        if (currentConversation) {
            const newMessages = await API.messages.getMessages(currentConversation.conversation_id);
            if (newMessages.length !== messages.length) {
                messages = newMessages;
                renderMessages();
                scrollToBottom();
            }
        }
        // Refresh conversations list
        await loadConversations();
    }, CONFIG.POLL_INTERVAL_MESSAGES);
}

// Clean up polling on page unload
window.addEventListener('beforeunload', () => {
    if (pollingInterval) {
        clearInterval(pollingInterval);
    }
});