{% block scripts %}
<script>
  function getCurrentTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  // Escape HTML to prevent XSS
  function escapeHtml(str) {
    if (str == null) return "";
    return String(str).replace(/[&<>"']/g, function (s) {
      return {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;'
      }[s];
    });
  }

  // Convert markdown links and plain URLs to clickable anchors safely.
  // Uses DOM operations to ensure we only replace text nodes (avoids double-replacing inside anchors).
  async function formatMessage(text) {
    if (!text) return "";

    // First, escape the entire text so any user-supplied HTML is neutralized
    const escaped = escapeHtml(text);

    // Convert Markdown style [label](https://url) into anchors.
    // We operate on the escaped text and escape the label again to be safe.
    const mdConverted = escaped.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, function(_, label, url) {
      // label is already escaped (from escaped variable), but ensure it's safe
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
    });

    // Parse to DOM and convert plain URLs found in text nodes to anchors.
    const container = document.createElement('div');
    container.innerHTML = mdConverted;

    const urlRegex = /(https?:\/\/[^\s<]+)/g;

    // Walk the DOM and process text nodes
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null, false);
    const textNodes = [];
    while (walker.nextNode()) {
      textNodes.push(walker.currentNode);
    }

    textNodes.forEach((node) => {
      const parent = node.parentNode;
      // Don't touch text nodes that are already inside an anchor
      if (!parent || parent.nodeName.toLowerCase() === 'a') return;

      const text = node.nodeValue;
      if (!text || !urlRegex.test(text)) return;

      // Create a document fragment and replace url occurrences with anchor elements
      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      text.replace(urlRegex, function (match, url, offset) {
        // Append preceding text
        if (offset > lastIndex) {
          frag.appendChild(document.createTextNode(text.substring(lastIndex, offset)));
        }
        // Create anchor
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.appendChild(document.createTextNode(url));
        frag.appendChild(a);
        lastIndex = offset + match.length;
      });
      // Append any remaining text
      if (lastIndex < text.length) {
        frag.appendChild(document.createTextNode(text.substring(lastIndex)));
      }

      // Replace original text node
      parent.replaceChild(frag, node);
    });

    // Preserve line breaks: convert remaining newlines in the serialized HTML into <br>
    // (Note: text nodes keep \n, but innerHTML will not convert them, so do replacement on a string)
    let resultHtml = container.innerHTML;
    resultHtml = resultHtml.replace(/\n/g, '<br>');

    return resultHtml;
  }

  window.onload = () => {
    // reserved if you want a greeting later
  };

  async function sendMessage() {
    const input = document.getElementById('userInput');
    if (!input) return;
    const rawMessage = input.value.trim();
    if (!rawMessage) return;

    const messagesDiv = document.getElementById('messages');
    if (!messagesDiv) return;

    // Show user message (escaped and with URLs converted)
    const userHtml = await formatMessage(rawMessage);
    const timestamp = getCurrentTimestamp();
    messagesDiv.innerHTML += `
      <div class="message">
        <span class="user">You:</span> ${userHtml}
        <span class="timestamp">${timestamp}</span>
      </div>`;
    input.value = "";

    // Create a unique typing indicator id so multiple calls don't clash
    const typingId = `typing-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    messagesDiv.innerHTML += `
      <div class="message" id="${typingId}">
        <span class="bruno">
          <img src="{{ url_for('static', filename='bruno-avatar.png') }}" alt="Bruno Avatar" class="bruno-avatar">
        </span>
        <img src="{{ url_for('static', filename='icons/typing-dots.svg') }}" alt="typing..." style="vertical-align: middle; height: 18px;">
      </div>`;
    messagesDiv.scrollTop = messagesDiv.scrollHeight;

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: rawMessage })
      });

      // Remove typing indicator early if response is not ok
      const typingEl = document.getElementById(typingId);

      if (!response.ok) {
        if (typingEl) typingEl.remove();
        const text = await response.text();
        messagesDiv.innerHTML += `
          <div class="message">
            <span class="bruno">
              <img src="{{ url_for('static', filename='bruno-avatar.png') }}" alt="Bruno Avatar" class="bruno-avatar">
            </span>
            Sorry, something went wrong: ${escapeHtml(text || response.statusText)}
          </div>`;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
        return;
      }

      const data = await response.json();
      const rawReply = data.reply || "Brun didn’t respond. Please try again.";
      const replyHtml = await formatMessage(rawReply);

      // Remove typing indicator
      if (typingEl) typingEl.remove();

      const replyTimestamp = getCurrentTimestamp();
      messagesDiv.innerHTML += `
        <div class="message">
          <span class="bruno">
            <img src="{{ url_for('static', filename='bruno-avatar.png') }}" alt="Bruno Avatar" class="bruno-avatar">
          </span>
          ${replyHtml}
          <span class="timestamp">${replyTimestamp}</span>
        </div>`;
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    } catch (error) {
      const typingEl = document.getElementById(typingId);
      if (typingEl) typingEl.remove();

      messagesDiv.innerHTML += `
        <div class="message">
          <span class="bruno">
            <img src="{{ url_for('static', filename='bruno-avatar.png') }}" alt="Bruno Avatar" class="bruno-avatar">
          </span>
          Sorry, something went wrong.
        </div>`;
      console.error("Fetch error:", error);
      messagesDiv.scrollTop = messagesDiv.scrollHeight;
    }
  }

  // Enter key sends message (no-op if input element missing)
  document.addEventListener("DOMContentLoaded", function() {
    const inputEl = document.getElementById('userInput');
    if (inputEl) {
      inputEl.addEventListener('keypress', function(e) {
        // Allow Shift+Enter for newline if desired; only submit on plain Enter
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    // Hide avatar overlay and show chat area on click (guard against missing elements)
    const avatarOverlay = document.getElementById('avatar-overlay');
    const chatArea = document.getElementById('chat-area');
    const avatarImg = document.getElementById('avatar-img');
    const messagesDiv = document.getElementById('messages');

    if (avatarImg && avatarOverlay && chatArea && messagesDiv) {
      avatarImg.addEventListener('click', function() {
        avatarOverlay.style.display = 'none';
        chatArea.style.display = 'flex';

        const timestamp = getCurrentTimestamp();
        messagesDiv.innerHTML += `
          <div class="message">
            <span class="bruno">
              <img src="{{ url_for('static', filename='bruno-avatar.png') }}" alt="Bruno Avatar" class="bruno-avatar">
            </span>
            Hello, I'm Brun. How can I help today?
            <span class="timestamp">${timestamp}</span>
          </div>`;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;
      });
    }
  });
</script>
{% endblock %}
