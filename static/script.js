
console.log("Sending message:", message);
const response = await fetch("/chat", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ message })
});
const data = await response.json();
console.log("Bruno replied:", data);


async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value;
  if (!message) return;

  const chatBox = document.getElementById("chat-box");

  // Show user message
  const userBubble = document.createElement("div");
  userBubble.textContent = "You: " + message;
  userBubble.className = "user-message";
  chatBox.appendChild(userBubble);

  input.value = "";

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

    const data = await response.json();

    // Show Bruno's reply
    const brunoBubble = document.createElement("div");
    brunoBubble.textContent = "Bruno: " + data.reply;
    brunoBubble.className = "bruno-message";
    chatBox.appendChild(brunoBubble);
  } catch (error) {
    const errorBubble = document.createElement("div");
    errorBubble.textContent = "⚠️ Bruno is having a moment...";
    errorBubble.className = "error-message";
    chatBox.appendChild(errorBubble);
  }
}