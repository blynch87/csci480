from flask import Blueprint, jsonify, request, session
from db import get_db_connection

# Flask Blueprint for transcript routes
transcript_bp = Blueprint("transcript", __name__, url_prefix="/api/transcript")

# Temporary in-memory "virtual transcript"
# Each item will look like:
# {
#   "external_course": {"school_code": "002906", "school": "Wake Tech", "code": "ENG111", "name": "English Comp I"},
#   "equivalencies": [{"code": "LANG 120", "name": "Academic Writing", "hours": 4.0}]
# }
virtual_transcript = []


# 1) Add a course to the transcript
@transcript_bp.route("/add", methods=["POST"])
def add_course():
    data = request.get_json()

    # Basic validation
    if "school_code" not in data or "course_code" not in data:
        return jsonify({"error": "Missing required fields"}), 400

    school_code = data["school_code"].strip()
    course_code = data["course_code"].strip()

    conn = get_db_connection()
    cur = conn.cursor()

    # Find the course by its school code and course code
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

    # Get the UNCA equivalencies for that course
    cur.execute("""
        SELECT unca_course_code, unca_course_name, hours
        FROM equivalencies
        WHERE course_id = %s;
    """, (course["course_id"],))
    equivalencies = cur.fetchall()

    cur.close()
    conn.close()

    # Format the course entry
    equivalency_list = []
    for e in equivalencies:
        equivalency = {
            "code": e["unca_course_code"],
            "name": e["unca_course_name"],
            "hours": e["hours"]
        }
        equivalency_list.append(equivalency)

    entry = {
        "external_course": {
            "school_code": school_code, 
            "school": course["school_name"],
            "code": course["course_code"],
            "name": course["course_name"]
        },
        "equivalencies": equivalency_list
    }

    # Check for duplicates manually
    duplicate_found = False
    for existing_entry in virtual_transcript:
        same_school = existing_entry["external_course"].get("school_code") == entry["external_course"].get("school_code")
        same_code = existing_entry["external_course"]["code"] == entry["external_course"]["code"]

        if same_school and same_code:
            duplicate_found = True
            break

    if not duplicate_found:
        virtual_transcript.append(entry)
        msg = "Course added"
    else:
        msg = "Course already exists in transcript"

    return jsonify({"message": msg, "course": entry})


# 2) View all courses in transcript
@transcript_bp.route("/", methods=["GET"])
def get_transcript():
    return jsonify(virtual_transcript)


# 3) Clear the transcript
@transcript_bp.route("/clear", methods=["POST"])
def clear_transcript():
    virtual_transcript.clear()
    return jsonify({"message": "Transcript cleared"})


# 4) Get summary of core requirements
@transcript_bp.route("/summary", methods=["GET"])
def get_core_summary():
    if not virtual_transcript:
        return jsonify({"message": "No courses added yet"}), 400

    conn = get_db_connection()
    cur = conn.cursor()

    # Collect all UNCA courses earned from the transcript
    all_unca_courses = []
    for entry in virtual_transcript:
        for eq in entry["equivalencies"]:
            all_unca_courses.append(eq["code"])

    # Load the UNCA core rules (which courses meet which requirements)
    cur.execute("""
        SELECT core_code, subject, course_number
        FROM unca_core_courses;
    """)
    core_rules = cur.fetchall()

    # Get list of all possible requirement codes
    cur.execute("SELECT DISTINCT code FROM unca_core_requirements;")
    all_requirements = {r["code"] for r in cur.fetchall()}

    cur.close()
    conn.close()

    fulfilled = set()       # which requirements are satisfied
    fulfilled_map = {}      # which courses satisfied them

    # Check every UNCA course against every core rule
    for course in all_unca_courses:
        # Each course code looks like "LANG 120" or "HIST 321"
        try:
            subject, number = course.split()
            number = int(float(number))  
        except ValueError:
            # Skip anything without a numeric part
            continue

        for rule in core_rules:
            rule_subject = rule["subject"].strip().upper()
            rule_number = str(rule["course_number"]).strip()
            core_code = rule["core_code"]

            # Skip if subjects don’t match
            if subject.upper() != rule_subject:
                continue

            matched = False

            # Exact match
            if rule_number.isdigit() and int(rule_number) == number:
                matched = True

            # Wildcards
            elif rule_number in ("*", "ANY"):
                matched = True

            # Range based match (ex. "200+", "300+")
            elif rule_number.endswith("+"):
                try:
                    min_level = int(rule_number[:-1])
                    if number >= min_level:
                        matched = True
                except ValueError:
                    pass

            # If match found, add it
            if matched:
                fulfilled.add(core_code)
                if core_code not in fulfilled_map:
                    fulfilled_map[core_code] = []
                fulfilled_map[core_code].append(course)

    # Figure out which requirements are still not satisfied
    remaining = sorted(all_requirements - fulfilled)
    fulfilled_sorted = sorted(list(fulfilled))

    return jsonify({
        "fulfilled_requirements": fulfilled_sorted,
        "remaining_requirements": remaining,
        "courses_checked": all_unca_courses,
        "fulfilled_map": fulfilled_map
    })


# 5) Remove a course from transcript
@transcript_bp.route("/remove", methods=["POST"])
def remove_from_transcript():
    """
    Expected JSON:
      { "school_code": "...", "course_code": "..." }

    Removes any transcript entry whose external course matches both codes.
    """
    data = request.get_json(silent=True) or {}
    school_code = (data.get("school_code") or "").strip()
    course_code = (data.get("course_code") or "").strip()

    if not school_code or not course_code:
        return jsonify({"error": "school_code and course_code are required"}), 400

    # remove from virtual_transcript (not session)
    removed = 0
    new_transcript = []

    for entry in virtual_transcript:
        external = entry.get("external_course", {}) or {}
        entry_school = (external.get("school_code") or "").strip()
        entry_course = (external.get("code") or "").strip()

        if entry_school.upper() == school_code.upper() and entry_course.upper() == course_code.upper():
            removed += 1
        else:
            new_transcript.append(entry)

    # Replace contents in place
    virtual_transcript.clear()
    virtual_transcript.extend(new_transcript)

    return jsonify({"removed": removed, "size": len(virtual_transcript)})
