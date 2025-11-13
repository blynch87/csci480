# backend/routes/core.py
from flask import Blueprint, jsonify, request
from db import get_db_connection

core_bp = Blueprint("core", __name__, url_prefix="/api/core")

# Get all core requirements 
@core_bp.route("/requirements", methods=["GET"])
def get_all_requirements():
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT req_id, code, description, min_hours
        FROM unca_core_requirements
        ORDER BY code;
    """)
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(rows)


# Get approved UNCA courses for a specific requirement (e.g., ARTS) NOT WORKING need correct table and figure out course_number
@core_bp.route("/requirements/<code>", methods=["GET"])
def get_courses_for_requirement(code):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT subject, course_number, title, note
        FROM unca_core_courses
        WHERE LOWER(core_code) = LOWER(%s)
        ORDER BY subject, course_number;
    """, (code,))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        return jsonify({"message": "No approved courses found for this requirement"}), 404

    return jsonify(rows)


# Check if a course fulfills any core requirement
@core_bp.route("/lookup/<subject>/<course_number>", methods=["GET"])
def get_requirement_for_course(subject, course_number):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT core_code, subject, course_number, title
        FROM unca_core_courses
        WHERE LOWER(subject) = LOWER(%s);
    """, (subject,))
    rows = cur.fetchall()
    cur.close()
    conn.close()

    if not rows:
        return jsonify({"message": "Subject not found in core curriculum"}), 404

    # Convert to integer for comparison if possible
    try:
        num = int(course_number)
    except ValueError:
        num = None

    matched = []
    for r in rows:
        rule = r["course_number"].strip()

        # Exact match
        if rule == str(course_number):
            matched.append(r)

        # Any course (*)
        elif rule in ("*", "ANY"):
            matched.append(r)

        # 200+, 300+, etc.
        elif rule.endswith("+"):
            try:
                min_level = int(rule[:-1])
                if num is not None and num >= min_level:
                    matched.append(r)
            except ValueError:
                continue

    if not matched:
        return jsonify({"message": "No matching core requirement found"}), 404

    return jsonify(matched)
