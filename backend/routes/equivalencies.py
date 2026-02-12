# routes/equivalencies.py
from flask import Blueprint, jsonify
from db import get_db_connection

equiv_bp = Blueprint("equivalencies", __name__, url_prefix="/api/equivalencies")

@equiv_bp.route("/reverse/<unca_course_code>", methods=["GET"])
def reverse_lookup(unca_course_code):
    code = unca_course_code.strip()
    conn = get_db_connection()
    cur = conn.cursor()  # works with RealDictCursor OR regular cursor

    cur.execute("""
        SELECT
            s.name            AS school_name,
            s.school_code     AS school_code,
            st.abbreviation   AS state_abbr,
            c.course_code     AS course_code,
            c.course_name     AS course_name
        FROM equivalencies e
        JOIN courses c ON c.course_id = e.course_id
        JOIN schools s ON s.school_id = c.school_id
        LEFT JOIN states st ON st.state_id = s.state_id
        WHERE UPPER(e.unca_course_code) = UPPER(%s)
        ORDER BY st.abbreviation NULLS LAST, s.name, c.course_code;
    """, (code,))

    rows = cur.fetchall()
    cur.close()
    conn.close()

    out = []
    for r in rows:
        # If dict-like (RealDictCursor)
        if hasattr(r, "keys"):
            out.append({
                "school_name": r.get("school_name"),
                "school_code": r.get("school_code"),
                "state_abbr":  r.get("state_abbr"),
                "course_code": r.get("course_code"),
                "course_name": r.get("course_name"),
            })
        else:
            # tuple-like fallback
            school_name, school_code, state_abbr, course_code, course_name = r
            out.append({
                "school_name": school_name,
                "school_code": school_code,
                "state_abbr":  state_abbr,
                "course_code": course_code,
                "course_name": course_name,
            })

    return jsonify(out)
