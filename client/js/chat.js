// ==========================================
// js/chat.js — auto-open new conv + per-chat drafts
// ==========================================

let conversations      = [];
let currentConversation = null;
let messages           = [];
let pollingInterval    = null;
let allUsers           = [];
const chatDrafts       = {};   // { conversation_id: draft_text }

async function initChat() {
    await Components.initLayout();
    const content = document.getElementById('mainContent');
    content.innerHTML = `
        <div class="page-header" style="margin-bottom:1.5rem;display:flex;justify-content:space-between;align-items:center;">
            <div><h1>Messages</h1><p class="text-muted">Chat with your team</p></div>
            <button class="btn btn-primary" onclick="showNewConversationModal()">+ New Conversation</button>
        </div>
        <div class="chat-container">
            <div class="conversations-panel">
                <div class="conversations-header">Conversations</div>
                <div class="conversations-list" id="conversationsList">
                    <div class="loading-spinner"><div class="spinner"></div></div>
                </div>
            </div>
            <div class="chat-panel">
                <div class="chat-header" id="chatHeader">Select a conversation</div>
                <div class="chat-messages" id="chatMessages">
                    <div style="text-align:center;padding:3rem;color:var(--secondary);">
                        <div style="font-size:4rem;">💬</div>
                        <p>Select a conversation to start chatting</p>
                    </div>
                </div>
                <div class="chat-input" id="chatInput" style="display:none;">
                    <form onsubmit="sendMessage(event)">
                        <div style="display:flex;gap:0.5rem;">
                            <input type="text" class="form-control" id="messageInput"
                                   placeholder="Type a message…" required
                                   oninput="saveDraftLive()"
                                   autocomplete="off">
                            <button type="submit" class="btn btn-primary">Send</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>`;

    try {
        const r = await API.users.getAll();
        allUsers = r.data || r || [];
    } catch(e) { allUsers = []; }

    await loadConversations();
    startPolling();
}

// ---- Draft Helpers ----

function saveDraftLive() {
    if (!currentConversation) return;
    chatDrafts[currentConversation.conversation_id] = document.getElementById('messageInput')?.value || '';
}

function persistDraft() {
    if (!currentConversation) return;
    chatDrafts[currentConversation.conversation_id] = document.getElementById('messageInput')?.value || '';
}

function restoreDraft(convId) {
    const input = document.getElementById('messageInput');
    if (input) input.value = chatDrafts[convId] || '';
}

// ---- Conversation name helper ----

function getConvName(conv) {
    if (conv.conversation_type === 'project_group')
        return conv.project_name ? `${conv.project_name} — Group Chat` : (conv.conversation_name || `Group #${conv.conversation_id}`);
    return conv.participant_names || `Direct Message #${conv.conversation_id}`;
}

// ---- Load & Render ----

async function loadConversations() {
    try {
        const r   = await API.messages.getConversations();
        conversations = r.data || r || [];
        renderConversations();
    } catch(e) { Utils.showToast('Failed to load conversations','error'); }
}

function renderConversations() {
    const list = document.getElementById('conversationsList');
    if (!list) return;
    if (!conversations.length) {
        list.innerHTML = '<div style="padding:2rem;text-align:center;color:var(--secondary);">No conversations yet</div>';
        return;
    }
    list.innerHTML = conversations.map(conv => {
        const isActive = currentConversation?.conversation_id === conv.conversation_id;
        const unread   = conv.unread_count || 0;
        const name     = getConvName(conv);
        return `
            <div class="conversation-item ${unread?'unread':''} ${isActive?'active':''}"
                 onclick="selectConversation(${conv.conversation_id})">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <strong style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-size:0.9rem;">
                        ${Utils.escapeHtml(name)}</strong>
                    ${unread?`<span style="background:var(--primary);color:white;border-radius:12px;padding:2px 7px;font-size:0.75rem;margin-left:4px;">${unread}</span>`:''}
                </div>
                <div style="font-size:0.8rem;color:var(--secondary);">
                    ${conv.conversation_type==='project_group'?'Group':'Direct'}
                    ${chatDrafts[conv.conversation_id]?` · <em style="color:var(--warning);">Draft</em>`:''}
                </div>
            </div>`;
    }).join('');
}

async function selectConversation(conversationId) {
    // Save draft of current conversation before switching
    persistDraft();

    try {
        currentConversation = conversations.find(c => c.conversation_id === conversationId);
        const r  = await API.messages.getMessages(conversationId);
        messages = r.data || r || [];
        await API.messages.markAsRead(conversationId);

        renderConversations();
        renderMessages();

        document.getElementById('chatInput').style.display = 'block';
        document.getElementById('chatHeader').textContent  = getConvName(currentConversation);

        // Restore draft for this conversation
        restoreDraft(conversationId);
        scrollToBottom();
    } catch(e) { Utils.showToast('Failed to load messages','error'); }
}

function renderMessages() {
    const container  = document.getElementById('chatMessages');
    const currentUser = Auth.getUser();
    if (!messages.length) {
        container.innerHTML = '<div style="text-align:center;padding:3rem;color:var(--secondary);">No messages yet. Start the conversation!</div>';
        return;
    }
    container.innerHTML = messages.map(msg => {
        const isSent = msg.sender_id === currentUser.user_id;
        return `
            <div class="message ${isSent?'sent':'received'}">
                ${!isSent?`<div style="font-weight:bold;font-size:0.8rem;margin-bottom:0.2rem;">${msg.first_name} ${msg.last_name}</div>`:''}
                <div>${Utils.escapeHtml(msg.message_text)}</div>
                <div class="message-time">${Utils.formatRelativeTime(msg.sent_at)}</div>
            </div>`;
    }).join('');
}

async function sendMessage(event) {
    event.preventDefault();
    if (!currentConversation) return;
    const input = document.getElementById('messageInput');
    const text  = input.value.trim();
    if (!text) return;
    try {
        await API.messages.send(currentConversation.conversation_id, text);
        // Clear draft after send
        chatDrafts[currentConversation.conversation_id] = '';
        input.value = '';
        await selectConversation(currentConversation.conversation_id);
    } catch(e) { Utils.showToast('Failed to send','error'); }
}

function scrollToBottom() {
    const c = document.getElementById('chatMessages');
    if (c) c.scrollTop = c.scrollHeight;
}

// ---- New Conversation Modal ----

function showNewConversationModal() {
    const depts = [...new Set(allUsers.map(u=>u.department).filter(Boolean))].sort();
    const modal = document.createElement('div');
    modal.className = 'modal show'; modal.id = 'newConvModal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width:480px;">
            <div class="modal-header">
                <h2>New Conversation</h2>
                <button class="modal-close" onclick="document.getElementById('newConvModal').remove()">×</button>
            </div>
            <div class="form-group">
                <label class="form-label">Type</label>
                <select class="form-control" id="newConvType" onchange="renderConvFields()">
                    <option value="direct">Direct Message</option>
                    <option value="group">Group Chat</option>
                </select>
            </div>
            <div id="newConvFields"></div>
            <div style="display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1rem;">
                <button class="btn btn-secondary" onclick="document.getElementById('newConvModal').remove()">Cancel</button>
                <button class="btn btn-primary" onclick="createNewConversation()">Create</button>
            </div>
        </div>`;
    document.body.appendChild(modal);
    renderConvFields();
}

function renderConvFields() {
    const type  = document.getElementById('newConvType').value;
    const depts = [...new Set(allUsers.map(u=>u.department).filter(Boolean))].sort();
    const fields = document.getElementById('newConvFields');

    if (type === 'direct') {
        fields.innerHTML = `
            <div class="form-group"><label class="form-label">Department</label>
                <select class="form-control" id="dmDept" onchange="populateDmUsers()">
                    <option value="">— All —</option>
                    ${depts.map(d=>`<option value="${d}">${d}</option>`).join('')}
                </select></div>
            <div class="form-group"><label class="form-label">Select Employee</label>
                <select class="form-control" id="dmUserSel" onchange="syncDmId()">
                    <option value="">— choose from list —</option>
                    ${allUsers.map(u=>`<option value="${u.user_id}">${u.first_name} ${u.last_name} (${u.user_id})</option>`).join('')}
                </select></div>
            <div class="form-group"><label class="form-label">or type User ID</label>
                <input type="text" class="form-control" id="dmUserId" placeholder="e.g. ebj001" oninput="syncDmSel()"></div>`;
    } else {
        fields.innerHTML = `
            <div class="form-group"><label class="form-label">Group Name *</label>
                <input type="text" class="form-control" id="groupName" placeholder="e.g. Dev Team Alpha"></div>
            <div class="form-group"><label class="form-label">Department</label>
                <select class="form-control" id="grpDept" onchange="populateGrpUsers()">
                    <option value="">— All —</option>
                    ${depts.map(d=>`<option value="${d}">${d}</option>`).join('')}
                </select></div>
            <div class="form-group"><label class="form-label">Add Members</label>
                <select class="form-control" id="grpUserSel" onchange="addGrpUser()">
                    <option value="">— add from list —</option>
                    ${allUsers.map(u=>`<option value="${u.user_id}">${u.first_name} ${u.last_name} (${u.user_id})</option>`).join('')}
                </select></div>
            <div class="form-group"><label class="form-label">Member IDs (comma-separated)</label>
                <input type="text" class="form-control" id="grpUserIds" placeholder="e.g. ebj001, esa004"></div>`;
    }
}

function populateDmUsers() {
    const dept = document.getElementById('dmDept').value;
    const sel  = document.getElementById('dmUserSel');
    const list = dept ? allUsers.filter(u=>u.department===dept) : allUsers;
    sel.innerHTML = `<option value="">— choose —</option>`+list.map(u=>`<option value="${u.user_id}">${u.first_name} ${u.last_name} (${u.user_id})</option>`).join('');
}
function syncDmId()  { const v=document.getElementById('dmUserSel').value; if(v) document.getElementById('dmUserId').value=v; }
function syncDmSel() { const v=document.getElementById('dmUserId').value.trim(); const s=document.getElementById('dmUserSel'); if(s) s.value=v||''; }

function populateGrpUsers() {
    const dept = document.getElementById('grpDept').value;
    const sel  = document.getElementById('grpUserSel');
    const list = dept ? allUsers.filter(u=>u.department===dept) : allUsers;
    sel.innerHTML = `<option value="">— add —</option>`+list.map(u=>`<option value="${u.user_id}">${u.first_name} ${u.last_name} (${u.user_id})</option>`).join('');
}
function addGrpUser() {
    const v = document.getElementById('grpUserSel').value; if (!v) return;
    const inp = document.getElementById('grpUserIds');
    const ids = inp.value.split(',').map(s=>s.trim()).filter(Boolean);
    if (!ids.includes(v)) { ids.push(v); inp.value=ids.join(', '); }
    document.getElementById('grpUserSel').value='';
}

async function createNewConversation() {
    const type = document.getElementById('newConvType').value;
    let newConvId = null;
    try {
        if (type === 'direct') {
            const receiverId = document.getElementById('dmUserId').value.trim();
            if (!receiverId) { Utils.showToast('Please enter a User ID','error'); return; }
            const r  = await API.messages.createConversation({ conversation_type:'direct', receiver_id:receiverId });
            newConvId = (r.data||r).conversation_id;
        } else {
            const name = (document.getElementById('groupName')?.value||'').trim();
            if (!name) { Utils.showToast('Please enter a group name','error'); return; }
            const r  = await API.messages.createConversation({ conversation_type:'group', conversation_name:name });
            newConvId = (r.data||r).conversation_id;
        }
        Utils.showToast('Conversation created!','success');
        document.getElementById('newConvModal').remove();

        // Auto-open the new conversation
        await loadConversations();
        if (newConvId) await selectConversation(newConvId);
    } catch(e) { Utils.showToast('Failed: '+e.message,'error'); }
}

// ---- Polling ----

function startPolling() {
    pollingInterval = setInterval(async () => {
        if (currentConversation) {
            try {
                const r = await API.messages.getMessages(currentConversation.conversation_id);
                const nm = r.data || r || [];
                if (nm.length !== messages.length) { messages=nm; renderMessages(); scrollToBottom(); }
            } catch(e) {}
        }
        await loadConversations();
    }, CONFIG.POLL_INTERVAL_MESSAGES);
}

window.addEventListener('beforeunload', () => { if(pollingInterval) clearInterval(pollingInterval); });
