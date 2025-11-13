# backend/routes/schools.py
from flask import Blueprint, jsonify, request
from db import get_db_connection

# Create the blueprint
schools_bp = Blueprint("schools", __name__, url_prefix="/api/schools")

# Example 1: Get all schools
@schools_bp.route("/", methods=["GET"])
def get_schools():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT school_id, name, type, state_id, school_code
        FROM schools
        ORDER BY name;
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(rows)

# Example 2: Get schools for a specific state
@schools_bp.route("/<state_abbr>", methods=["GET"])
def get_schools_by_state(state_abbr):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT s.school_id, s.name, s.type, s.school_code
        FROM schools s
        JOIN states st ON s.state_id = st.state_id
        WHERE st.abbreviation = %s
        ORDER BY s.name;
    """, (state_abbr.upper(),))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(rows)
