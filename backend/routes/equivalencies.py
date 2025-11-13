# backend/routes/equivalencies.py
from flask import Blueprint, jsonify, request
from db import get_db_connection

equivalencies_bp = Blueprint("equivalencies", __name__, url_prefix="/api/equivalencies")

# Reverse lookup: find all external courses that map to a given UNCA course
@equivalencies_bp.route("/reverse/<unca_course_code>", methods=["GET"])
def get_equivalencies_by_unccourse(unca_course_code):
    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT 
            s.name AS school_name,
            s.type AS school_type,
            s.school_code,
            c.course_code AS external_course_code,
            c.course_name AS external_course_name,
            e.unca_course_code,
            e.unca_course_name,
            e.hours,
            e.note,
            e.relationship
        FROM equivalencies e
        JOIN courses c ON e.course_id = c.course_id
        JOIN schools s ON c.school_id = s.school_id
        WHERE LOWER(e.unca_course_code) = LOWER(%s)
        ORDER BY s.name, c.course_code;
    """, (unca_course_code,))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        return jsonify({"message": "No matching equivalencies found"}), 404

    return jsonify(rows)