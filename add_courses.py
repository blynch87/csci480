import psycopg2
import requests

# Database Connection ----------
conn = psycopg2.connect(
    dbname="",
    user="",
    password="",  # consider env vars for production
    host="",
    port=""
)
cur = conn.cursor()

# Constants ----------
BASE_URL = "https://meteor.unca.edu/registrar/transfer-equivalencies/api/v1/equivalencies"

# Helper Functions ----------
def safe_decimal(value):
    try:
        num = float(value)
        # PostgreSQL DECIMAL(4,2) allows only -99.99 to 99.99
        if abs(num) >= 100:
            return None
        return num
    except (TypeError, ValueError):
        return None


def safe_note(value):
    # If it's not a string, return None
    if not isinstance(value, str):
        return None
    
    # Remove spaces
    cleaned = value.strip()

    # If it's empty after stripping, return None
    if cleaned == "":
        return None

    # Otherwise, return the cleaned string
    return cleaned

# Fetch All Schools ----------
cur.execute("SELECT school_id, school_code, name, type FROM schools ORDER BY school_id;")
schools = cur.fetchall()
print(f"Found {len(schools)} schools to process.\n")

# Main Loop ----------
for school_id, school_code, school_name, school_type in schools:
    # Determine API endpoint
    if school_type == "CC":
        url = f"{BASE_URL}/community-college"
    elif school_type == "in-state":
        url = f"{BASE_URL}/in-state-equivalencies/{school_code}"
    else:  # out-of-state or military
        url = f"{BASE_URL}/out-of-state-equivalencies/{school_code}"

    print(f"Fetching {school_name} ({school_type}) from {url}")

    try:
        response = requests.get(url, timeout=30)
    except requests.exceptions.RequestException as e:
        print(f"Request failed for {school_name}: {e}")
        continue

    if response.status_code != 200:
        print(f" {school_name}: HTTP {response.status_code}")
        continue

    data = response.json()
    if not data:
        print(f"No data returned for {school_name}")
        continue

    # Process Each Record ----------
    for record in data:
        external = record["ExternalCourse"]
        internal = record["InternalCourse"]
        extra = record.get("ExtraCourses", [])

        # Insert course
        cur.execute("""
            INSERT INTO courses (school_id, course_code, course_name, credits)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (school_id, course_code) DO NOTHING
            RETURNING course_id;
        """, (school_id, external["Code"], external["Name"], None))

        result = cur.fetchone()
        if result:
            course_id = result[0]
        else:
            cur.execute("""
                SELECT course_id FROM courses
                WHERE school_id = %s AND course_code = %s;
            """, (school_id, external["Code"]))
            course_id = cur.fetchone()[0]

        # Insert primary equivalency
        cur.execute("""
            INSERT INTO equivalencies (
                course_id, unca_course_code, unca_course_name,
                hours, note, relationship
            )
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (course_id, unca_course_code, relationship) DO NOTHING;
        """, (
            course_id,
            internal["Code"],
            internal["Name"],
            safe_decimal(internal["Hours"]),
            safe_note(internal.get("Note", "")),
            "MAIN"
        ))

        # Insert any extra equivalencies
        for extra_eq in extra:
            course = extra_eq["Course"]
            rel = extra_eq.get("Relationship", "OR")
            cur.execute("""
                INSERT INTO equivalencies (
                    course_id, unca_course_code, unca_course_name,
                    hours, note, relationship
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                ON CONFLICT (course_id, unca_course_code, relationship) DO NOTHING;
            """, (
                course_id,
                course["Code"],
                course["Name"],
                safe_decimal(course["Hours"]),
                safe_note(course.get("Note", "")),
                rel
            ))

    conn.commit()
    print(f"Imported {len(data)} course mappings for {school_name}\n")

# Cleanup ----------
cur.close()
conn.close()
print("All courses and equivalencies imported successfully!")
