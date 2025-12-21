// Convert plain URLs into clickable links
function formatURLs(text) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.replace(urlRegex, url => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  const chatBox = document.getElementById("chat-box");

  // Show user message
  const userBubble = document.createElement("div");
  userBubble.className = "user-message";
  userBubble.textContent = "You: " + message;
  chatBox.appendChild(userBubble);

  input.value = "";

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    // Format URLs in Bruno's reply
    const formattedReply = formatURLs(data.reply);

    // Show Bruno's reply
    const brunoBubble = document.createElement("div");
    brunoBubble.className = "bruno-message";
    brunoBubble.innerHTML = "Bruno: " + formattedReply;
    chatBox.appendChild(brunoBubble);

  } catch (error) {
    const errorBubble = document.createElement("div");
    errorBubble.className = "error-message";
    errorBubble.textContent = "⚠️ Bruno is having a moment...";
    chatBox.appendChild(errorBubble);
  }
}
