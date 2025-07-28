from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from openai import OpenAI
import socket
import qrcode
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=api_key)

app = Flask(__name__)
CORS(app)

# pass `year` to every template
@app.context_processor
def inject_year():
    return {'year': datetime.now().year}

@app.route("/help")
def help():
    return render_template("help.html")

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
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_input}
            ]
        )
        reply = response.choices[0].message.content
        return jsonify({"reply": reply})
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({"reply": "Sorry, something went wrong."}), 500

@app.route("/")
def home():
    return render_template("bruno_chat_local.html")

if __name__ == "__main__":
    ip = socket.gethostbyname(socket.gethostname())
    url = f"https://ac5a43ed8fdc.ngrok-free.app/"
    print(f"Bruno is live at {url}")

    qr = qrcode.make(url)
    # qr.show() #Disabled to prevent popup

app.run(debug=True, host='0.0.0.0', port=8080)