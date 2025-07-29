from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from openai import OpenAI
import os
from datetime import datetime
import time # Needed for polling run status
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
app = Flask(__name__)
CORS(app)

# --- Global Variables for Assistant and Thread IDs ---
# Use your provided Assistant ID directly
assistant_id = "asst_g1G0wr7OQnnHC98TdgJw8IqO"
thread_id = None # This will be created per session (conceptually, for single user demo)
VECTOR_STORE_ID = "vs_687d565f05b08191916354eff38ba585" # Your specific Vector Store ID

# --- Assistant Setup Function ---
def setup_openai_assistant():
    """
    Ensures the specified OpenAI Assistant is correctly configured.
    It retrieves the assistant by ID and updates its instructions,
    model, tools (file_search), and links the specified Vector Store.
    """
    global assistant_id

    # 1. Read the system prompt from the file to use as Assistant instructions
    try:
        with open("bruno_prompt.txt", "r", encoding="utf-8") as f:
            assistant_instructions = f.read()
        print("Successfully loaded bruno_prompt.txt for assistant instructions.")
    except FileNotFoundError:
        print("Error: bruno_prompt.txt not found. Cannot set Assistant instructions.")
        print("Please ensure 'bruno_prompt.txt' is in the same directory.")
        return False
    except Exception as e:
        print(f"Error reading bruno_prompt.txt: {e}")
        return False

    # 2. Retrieve and Update the Assistant
    print(f"Attempting to retrieve and configure Assistant with ID: {assistant_id}")
    try:
        # Retrieve the assistant to confirm it exists and get its current state
        existing_assistant = client.beta.assistants.retrieve(assistant_id=assistant_id)
        print(f"Assistant '{existing_assistant.name}' (ID: {assistant_id}) retrieved.")

        # Update the assistant to ensure correct instructions, model, tools, and vector store
        client.beta.assistants.update(
            assistant_id=assistant_id,
            instructions=assistant_instructions,
            model="gpt-4o",
            tools=[{"type": "file_search"}],
            tool_resources={
                "file_search": {
                    "vector_store_ids": [VECTOR_STORE_ID]
                }
            }
        )
        print(f"Assistant {assistant_id} configured successfully with file search and Vector Store {VECTOR_STORE_ID}.")

    except Exception as e:
        print(f"Error configuring Assistant {assistant_id}: {e}")
        print("Please ensure the Assistant ID is correct and you have permissions to modify it.")
        print("If this Assistant does not exist, you will need to create it first, or modify the code to create one if not found.")
        return False

    return True

# --- Flask App Routes ---

# pass `year` to every template
@app.context_processor
def inject_year():
    return {'year': datetime.now().year}

@app.route("/help")
def help():
    return render_template("help.html")

@app.route("/healthz")
def health_check():
    return "OK", 200

@app.route("/submit-feedback", methods=["POST"])
def submit_feedback():
    rating = request.form.get("rating")
    comments = request.form.get("comments")
    print(f"Feedback received: {rating} stars — {comments}")
    return "<h2 style='color:white; background:#0a0a0a; padding:20px;'>Thanks for your feedback! <a href='/'>Back to Bruno</a></h2>"

# The old system_prompt read from file is now used for Assistant instructions
# with open("bruno_prompt.txt", "r", encoding="utf-8") as f:
#     system_prompt = f.read() # This line is functionally replaced by the setup_openai_assistant function

@app.route("/chat", methods=["POST"])
def chat():
    global thread_id # Access the global thread_id

    user_input = request.json.get("message")
    print(f"User said: {user_input}")

    # Although assistant_id is hardcoded, it's good to ensure setup was successful
    if assistant_id is None:
        return jsonify({"reply": "Error: AI Assistant not initialized on server startup."}), 500

    try:
        # Create a new thread if it doesn't exist for this session
        # IMPORTANT: For a production multi-user app, you would manage thread_id per user.
        # This global thread_id makes it a single-user demo.
        if thread_id is None:
            thread = client.beta.threads.create()
            thread_id = thread.id
            print(f"New conversation thread created with ID: {thread_id}")

        # Add the user's message to the current thread
        client.beta.threads.messages.create(
            thread_id=thread_id,
            role="user",
            content=user_input,
        )
        print("User message added to thread.")

        # Run the Assistant on the thread
        print(f"Running Assistant {assistant_id} on thread {thread_id}...")
        run = client.beta.threads.runs.create(
            thread_id=thread_id,
            assistant_id=assistant_id,
        )
        print(f"Run created with ID: {run.id}. Initial status: {run.status}")

        # Poll for the run completion
        while run.status in ["queued", "in_progress", "cancelling"]:
            time.sleep(0.5) # Poll every 0.5 seconds to avoid excessive API calls
            run = client.beta.threads.runs.retrieve(thread_id=thread_id, run_id=run.id)
            # print(f"Run status: {run.status}") # Uncomment for more detailed polling debug

        if run.status == "completed":
            print("Run completed successfully. Retrieving messages...")
            # Retrieve messages from the thread, in descending order to get the latest
            messages_page = client.beta.threads.messages.list(
                thread_id=thread_id,
                order="desc",
                limit="1" # We only need the latest assistant message
            )

            # The Assistant's reply should be the latest message
            if messages_page.data and messages_page.data[0].role == "assistant":
                latest_message = messages_page.data[0]
                reply_content = ""
                # Messages can have multiple content blocks (e.g., text, image)
                for content_block in latest_message.content:
                    if content_block.type == 'text':
                        reply_content += content_block.text.value
                        # You can also parse annotations/citations here if needed
                        # for annotation in content_block.text.annotations:
                        #     if hasattr(annotation, 'file_citation'):
                        #         cited_file = client.files.retrieve(annotation.file_citation.file_id)
                        #         reply_content += f"\n[Cited: {cited_file.filename}]"

                print(f"Assistant replied: {reply_content}")
                return jsonify({"reply": reply_content})
            else:
                print("No assistant reply found or unexpected message format in thread.")
                raise ValueError("Could not retrieve a valid assistant response.")
        else:
            print(f"Run ended with non-completed status: {run.status}. Last error: {run.last_error}")
            # Provide a more informative error message to the user
            error_message = f"Sorry, the AI assistant encountered an issue: Run status is '{run.status}'."
            if run.last_error and run.last_error.message:
                error_message += f" Details: {run.last_error.message}"
            return jsonify({"reply": error_message}), 500

    except Exception as e:
        import traceback
        traceback.print_exc() # Prints full traceback to console for debugging
        print(f"Fatal error during chat: {e}")
        return jsonify({"reply": "Sorry, an unexpected error occurred with the AI assistant. Please try again later."}), 500

@app.route("/")
def home():
    return render_template("bruno_chat_local.html")

if __name__ == "__main__":
    print("Starting Bruno Chatbot...")
    # Initialize the OpenAI Assistant before starting the Flask app
    if not setup_openai_assistant():
        print("Failed to set up OpenAI Assistant. Exiting application.")
        # If setup fails, the app cannot function, so exit.
        exit(1)

    # Render sets PORT automatically in production environments
    port = int(os.environ.get("PORT", 8080))
    # Host on 0.0.0.0 to be accessible externally (e.g., in a Docker container or Render)
    app.run(debug=False, host="0.0.0.0", port=port)
