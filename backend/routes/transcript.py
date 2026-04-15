from flask import Blueprint, jsonify, request
from db import get_db_connection

transcript_bp = Blueprint("transcript", __name__, url_prefix="/api/transcript")


@transcript_bp.route("/resolve", methods=["POST"])
def resolve_course():
    data = request.get_json(silent=True) or {}

    school_code = (data.get("school_code") or "").strip()
    course_code = (data.get("course_code") or "").strip()

    if not school_code or not course_code:
        return jsonify({"error": "school_code and course_code are required"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute("""
        SELECT c.course_id, c.course_code, c.course_name, s.name AS school_name
        FROM courses c
        JOIN schools s ON c.school_id = s.school_id
        WHERE s.school_code = %s AND c.course_code = %s;
    """, (school_code, course_code))
    course = cur.fetchone()

    if not course:
        cur.close()
        conn.close()
        return jsonify({"error": "Course not found"}), 404

    cur.execute("""
        SELECT unca_course_code, unca_course_name, hours
        FROM equivalencies
        WHERE course_id = %s;
    """, (course["course_id"],))
    equivalencies = cur.fetchall()

    cur.close()
    conn.close()

    entry = {
        "external_course": {
            "school_code": school_code,
            "school": course["school_name"],
            "code": course["course_code"],
            "name": course["course_name"]
        },
        "equivalencies": [
            {
                "code": e["unca_course_code"],
                "name": e["unca_course_name"],
                "hours": e["hours"]
            }
            for e in equivalencies
        ]
    }

    return jsonify({"course": entry})


@transcript_bp.route("/summary", methods=["POST"])
def get_core_summary():
    data = request.get_json(silent=True) or {}
    transcript = data.get("transcript") or []

    if not transcript:
        return jsonify({"message": "No courses added yet"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    all_unca_courses = []
    for entry in transcript:
        for eq in entry.get("equivalencies", []):
            code = (eq.get("code") or "").strip()
            if code:
                all_unca_courses.append(code)

    cur.execute("""
        SELECT core_code, subject, course_number
        FROM unca_core_courses;
    """)
    core_rules = cur.fetchall()

    cur.execute("SELECT DISTINCT code FROM unca_core_requirements;")
    all_requirements = {r["code"] for r in cur.fetchall()}

    cur.close()
    conn.close()

    fulfilled = set()
    fulfilled_map = {}

    for course in all_unca_courses:
        try:
            subject, number = course.split()
            number = int(float(number))
        except ValueError:
            continue

        for rule in core_rules:
            rule_subject = rule["subject"].strip().upper()
            rule_number = str(rule["course_number"]).strip()
            core_code = rule["core_code"]

            if subject.upper() != rule_subject:
                continue

            matched = False

            if rule_number.isdigit() and int(rule_number) == number:
                matched = True
            elif rule_number in ("*", "ANY"):
                matched = True
            elif rule_number.endswith("+"):
                try:
                    min_level = int(rule_number[:-1])
                    if number >= min_level:
                        matched = True
                except ValueError:
                    pass

            if matched:
                fulfilled.add(core_code)
                fulfilled_map.setdefault(core_code, []).append(course)

    remaining = sorted(all_requirements - fulfilled)
    fulfilled_sorted = sorted(list(fulfilled))

    return jsonify({
        "fulfilled_requirements": fulfilled_sorted,
        "remaining_requirements": remaining,
        "courses_checked": all_unca_courses,
        "fulfilled_map": fulfilled_map
    })