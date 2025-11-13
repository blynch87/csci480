# backend/routes/states.py
from flask import Blueprint, jsonify
from db import get_db_connection

states_bp = Blueprint("states", __name__, url_prefix="/api/states")

@states_bp.route("/", methods=["GET"])
def get_states():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT state_id, name, abbreviation FROM states ORDER BY name;")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(rows)
