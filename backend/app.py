from flask import Flask
from routes.states import states_bp
from routes.schools import schools_bp
from routes.courses import courses_bp
from routes.equivalencies import equiv_bp
from routes.core import core_bp
from routes.transcript import transcript_bp

from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Register Blueprints (modular routes)
app.register_blueprint(states_bp)
app.register_blueprint(schools_bp)
app.register_blueprint(courses_bp)
app.register_blueprint(equiv_bp)
app.register_blueprint(core_bp)
app.register_blueprint(transcript_bp)

@app.route("/")
def home():
    return {"message": "UNCA Transfer API is running successfully!"}

if __name__ == "__main__":
    app.run(debug=True)
