# backend/routes/courses.py
from flask import Blueprint, jsonify, request
from db import get_db_connection

courses_bp = Blueprint("courses", __name__, url_prefix="/api/courses")

# Get all courses for a given school
@courses_bp.route("/<school_code>", methods=["GET"])
def get_courses_by_school(school_code):
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT c.course_id, c.course_code, c.course_name, c.credits
        FROM courses c
        JOIN schools s ON c.school_id = s.school_id
        WHERE s.school_code = %s
        ORDER BY c.course_code;
    """, (school_code,))
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return jsonify(rows)


# Get one course and all its UNCA equivalencies
@courses_bp.route("/<school_code>/<course_code>", methods=["GET"])
def get_equivalencies_for_course(school_code, course_code):
    conn = get_db_connection()
    cur = conn.cursor()

    # Fetch external course info
    cur.execute("""
        SELECT c.course_id, c.course_code, c.course_name, c.credits
        FROM courses c
        JOIN schools s ON c.school_id = s.school_id
        WHERE s.school_code = %s AND c.course_code = %s;
    """, (school_code, course_code))
    course = cur.fetchone()

    if not course:
        cur.close()
        conn.close()
        return jsonify({"error": "Course not found"}), 404

    # Fetch equivalencies (UNCA side)
    cur.execute("""
        SELECT unca_course_code, unca_course_name, hours, note, relationship
        FROM equivalencies
        WHERE course_id = %s
        ORDER BY unca_course_code;
    """, (course["course_id"],))
    equivs = cur.fetchall()

    cur.close()
    conn.close()

    # Combine results in one object
    return jsonify({
        "course": course,
        "equivalencies": equivs
    })
