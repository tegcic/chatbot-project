from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from openai import OpenAI
import socket
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY")
app = Flask(__name__)
CORS(app)

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

with open("bruno_prompt.txt", "r", encoding="utf-8") as f:
    system_prompt = f.read()

@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("message")
    print(f"User said: {user_input}")

    try: 
        print("Calling OpenAI API...")
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ]
        )
        print("API call successful.")
        print("Checking response structure...")

        # Debug: Print raw response structure
        #print("Raw response:", response)

        # Defensive parsing
        if hasattr(response, "choices") and len(response.choices) > 0:
            choice = response.choices[0]
            if hasattr(choice, "message") and hasattr(choice.message, "content"):
                reply = choice.message.content
                return jsonify({"reply": reply})
            else:
                raise ValueError("Missing 'message.content' in response. Structure may have changed.")
        else:
            raise ValueError("Empty or malformed 'choices' in response.")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error: {e}")
        return jsonify({"reply": "Sorry, something went wrong."}), 500

@app.route("/")
def home():
    return render_template("bruno_chat_local.html")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))  # Render sets PORT automatically
    app.run(debug=False, host="0.0.0.0", port=port)

