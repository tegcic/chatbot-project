(function() {
    // Configuration for your Flask backend URL
    const FLASK_APP_URL = "https://brunbot.tegcic.org/"; // IMPORTANT: Change this to your Flask app's deployed URL!

    const CSS = `
        .bruno-widget-container {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px; /* Adjust width as needed */
            height: 450px; /* Adjust height as needed */
            background: #0a0a0a;
            border-radius: 8px;
            box-shadow: 0 0 15px rgba(0,255,213,0.6);
            display: flex;
            flex-direction: column;
            font-family: Arial, sans-serif;
            color: white;
            z-index: 10000; /* Ensure it's on top */
            overflow: hidden; /* To handle corner radius */
            transition: all 0.3s ease-in-out;
            transform: scale(0); /* Start hidden */
            transform-origin: bottom right;
            border: 1px solid #00ffd5;
        }
        .bruno-widget-container.open {
            transform: scale(1);
        }

        .bruno-widget-header {
            background: #00ffd5;
            color: #0a0a0a;
            padding: 10px;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: bold;
            font-size: 1.1em;
            cursor: pointer; /* To toggle the chat */
        }
        .bruno-widget-header button {
            background: none;
            border: none;
            color: #0a0a0a;
            font-size: 1.5em;
            cursor: pointer;
            padding: 0;
        }

        .bruno-bruno-avatar {
            width: 24px;
            height: 24px;
            border-radius: 30%;
            vertical-align: middle;
            margin-right: 6px;
            box-shadow: 0 0 3px #00ffd5;
        }
        .bruno-messages {
            flex-grow: 1;
            overflow-y: auto;
            padding: 10px;
            border-bottom: 1px solid #00ffd5; /* Separator from input */
        }
        .bruno-message { margin-bottom: 10px; font-size: 0.8em; }
        .bruno-user { font-weight: bold; color: #fff; font-size: 1.0em; }
        .bruno-bruno { font-weight: bold; color: #00ffd5; font-size: 1.0em; }
        .bruno-timestamp { font-size: 0.8em; color: #99d3c7; margin-left: 5px; }
        .bruno-input-row { display: flex; padding: 10px; gap: 10px; }
        .bruno-input-row input {
            flex: 1; padding: 10px; font-size: 14px;
            border: 1px solid #00ffd5; border-radius: 4px; background: #1a1a1a; color: white;
            outline: none; /* Remove blue focus border */
        }
        .bruno-input-row button {
            padding: 10px 14px; font-size: 14px; background: #00ffd5; color: #0a0a0a;
            border: none; border-radius: 4px; cursor: pointer; transition: background 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .bruno-input-row button:hover { background: #00ffc3; }
        .bruno-input-row button img {
            height: 20px;
            width: 20px;
        }

        /* Initial overlay styles */
        .bruno-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(10,10,10,0.98);
            z-index: 20;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 10px;
            box-sizing: border-box;
        }
        .bruno-overlay img {
            border-radius: 50%;
            box-shadow: 0 0 10px #00ffd5;
            cursor: pointer;
            width: 100px; /* Adjust size for widget */
            height: 100px;
        }
        .bruno-overlay h2 {
            color: #00ffd5;
            margin-top: 15px;
            font-size: 1.3em;
        }
        .bruno-overlay p {
            color: #99d3c7;
            max-width: 90%;
            font-size: 0.9em;
            margin-top: 5px;
        }

        /* Floating button to open chat */
        .bruno-floating-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #00ffd5;
            color: #0a0a0a;
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2em;
            cursor: pointer;
            box-shadow: 0 0 10px rgba(0,255,213,0.7);
            z-index: 10001; /* Above the widget when closed */
            transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
        }
        .bruno-floating-button img {
            width: 30px;
            height: 30px;
        }
        .bruno-floating-button.hidden {
            transform: scale(0);
            opacity: 0;
        }
    `;

    function getCurrentTimestamp() {
        const now = new Date();
        return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    async function sendMessage(messagesDiv, userInput, sendButton) {
        const message = userInput.value.trim();
        if (!message) return;

        const timestamp = getCurrentTimestamp();
        messagesDiv.innerHTML += `<div class="bruno-message"><span class="bruno-user">You:</span> ${message} <span class="bruno-timestamp">${timestamp}</span></div>`;
        userInput.value = "";

        const typingId = "bruno-typing-" + Date.now(); // Unique ID for typing indicator
        messagesDiv.innerHTML += `<div class="bruno-message" id="${typingId}"><span class="bruno-bruno"><img src='${FLASK_APP_URL}/static/bruno-avatar.png' alt='Bruno Avatar' class='bruno-bruno-avatar'></span> <img src="${FLASK_APP_URL}/static/icons/typing-dots.svg" alt="typing..." style="vertical-align: middle; height: 18px;"></div>`;
        messagesDiv.scrollTop = messagesDiv.scrollHeight;

        // Disable input and button while typing
        userInput.disabled = true;
        sendButton.disabled = true;

        try {
            const response = await fetch(`${FLASK_APP_URL}/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message })
            });

            const data = await response.json();
            const reply = data.reply || "Bruno didn’t respond. Please try again.";

            document.getElementById(typingId)?.remove(); // Use optional chaining for safer removal
            const replyTimestamp = getCurrentTimestamp();
            messagesDiv.innerHTML += `<div class="bruno-message"><span class="bruno-bruno"><img src='${FLASK_APP_URL}/static/bruno-avatar.png' alt='Bruno Avatar' class='bruno-bruno-avatar'></span> ${reply} <span class="bruno-timestamp">${replyTimestamp}</span></div>`;
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        } catch (error) {
            document.getElementById(typingId)?.remove();
            messagesDiv.innerHTML += `<div class="bruno-message"><span class="bruno-bruno"><img src='${FLASK_APP_URL}/static/bruno-avatar.png' alt='Bruno Avatar' class='bruno-bruno-avatar'></span> Sorry, something went wrong.</div>`;
            console.error("Fetch error:", error);
        } finally {
            // Re-enable input and button
            userInput.disabled = false;
            sendButton.disabled = false;
            userInput.focus(); // Focus back on input
        }
    }

    function createBrunoChatWidget() {
        // Inject CSS
        const styleTag = document.createElement('style');
        styleTag.innerHTML = CSS;
        document.head.appendChild(styleTag);

        // Create the main widget container
        const widgetContainer = document.createElement('div');
        widgetContainer.className = 'bruno-widget-container';
        document.body.appendChild(widgetContainer);

        // Create the floating button
        const floatingButton = document.createElement('div');
        floatingButton.className = 'bruno-floating-button';
        floatingButton.innerHTML = `<img src="${FLASK_APP_URL}/static/bruno-avatar.png" alt="Chat with Bruno">`;
        document.body.appendChild(floatingButton);

        // Build the chat content HTML
        widgetContainer.innerHTML = `
            <div class="bruno-widget-header">
                Chat with Bruno
                <button class="bruno-close-button">&times;</button>
            </div>
            <div class="bruno-overlay">
                <img src="${FLASK_APP_URL}/static/bruno-avatar.png" alt="Bruno Avatar" class="bruno-overlay-avatar">
                <h2>Hello, I'm Bruno 👋</h2>
                <p>Click avatar to start chatting.<br>
                <small>I am an AI assistant and cannot provide personal, legal, or medical advice. Please do not share sensitive personal information.</small>
                </p>
            </div>
            <div class="bruno-chat-area" style="display: none; flex-direction: column; height: 100%;">
                <div class="bruno-messages" aria-live="polite"></div>
                <div class="bruno-input-row">
                    <input type="text" class="bruno-userInput" placeholder="Type your message here..." aria-label="Type your message here" />
                    <button class="bruno-sendButton" aria-label="Send message">
                        <img src="${FLASK_APP_URL}/static/icons/send-icon.svg" alt="Send">
                    </button>
                </div>
            </div>
        `;

        const chatArea = widgetContainer.querySelector('.bruno-chat-area');
        const messagesDiv = widgetContainer.querySelector('.bruno-messages');
        const userInput = widgetContainer.querySelector('.bruno-userInput');
        const sendButton = widgetContainer.querySelector('.bruno-sendButton');
        const overlay = widgetContainer.querySelector('.bruno-overlay');
        const overlayAvatar = widgetContainer.querySelector('.bruno-overlay-avatar');
        const closeButton = widgetContainer.querySelector('.bruno-close-button');

        // Event Listeners
        sendButton.onclick = () => sendMessage(messagesDiv, userInput, sendButton);
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage(messagesDiv, userInput, sendButton);
        });

        // Toggle widget visibility
        floatingButton.addEventListener('click', () => {
            widgetContainer.classList.add('open');
            floatingButton.classList.add('hidden');
        });

        closeButton.addEventListener('click', () => {
            widgetContainer.classList.remove('open');
            floatingButton.classList.remove('hidden');
        });

        // Overlay click to start chat
        overlayAvatar.addEventListener('click', () => {
            overlay.style.display = 'none';
            chatArea.style.display = 'flex';
            const timestamp = getCurrentTimestamp();
            messagesDiv.innerHTML += `<div class="bruno-message"><span class="bruno-bruno"><img src='${FLASK_APP_URL}/static/bruno-avatar.png' alt='Bruno Avatar' class='bruno-bruno-avatar'></span> Hello, I'm Bruno. How can I help today?<span class="bruno-timestamp">${timestamp}</span></div>`;
            userInput.focus(); // Focus on input after starting chat
        });

        // Optional: Voice input (needs to be carefully integrated into a widget, might conflict with host page)
        // For simplicity, removed voice for now as it adds complexity and may not be universally supported/desired in a widget.
        // If you need it, you'd add a button and connect it to a function similar to your original `startVoice`.
    }

    // Expose the function globally so it can be called from the embedding page
    window.BrunoChatWidget = {
        init: createBrunoChatWidget
    };
})();
