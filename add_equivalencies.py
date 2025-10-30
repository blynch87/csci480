import json
import psycopg2

# Database Connection ----------
conn = psycopg2.connect(
    dbname="",
    user="",
    password="",
    host="",
    port=""
)
cur = conn.cursor()

# Recreate Table ----------
cur.execute("""
DROP TABLE IF EXISTS unca_core_courses;
CREATE TABLE unca_core_courses (
    core_code VARCHAR(20) NOT NULL,
    subject VARCHAR(50) NOT NULL,
    course_number VARCHAR(50) NOT NULL,
    title TEXT,
    note TEXT,
    PRIMARY KEY (core_code, subject, course_number)
);
""")
print("Recreated table unca_core_courses")

# Helper Function ----------
def insert_course(core_code, subject, course_number, title, note=None):
    cur.execute("""
        INSERT INTO unca_core_courses (core_code, subject, course_number, title, note)
        VALUES (%s, %s, %s, %s, %s)
        ON CONFLICT (core_code, subject, course_number) DO NOTHING;
    """, (core_code, subject, course_number, title, note))

# Add Verified FAD Courses ----------
fad_courses = [
    ("FAD", "FAD", "120", "Apparel Studio I"),
    ("FAD", "FAD", "130", "Interior Studio I"),
    ("FAD", "FAD", "230", "Interior Studio II"),
    ("FAD", "FAD", "231", "Interior Architecture Drafting"),
    ("FAD", "FAD", "240", "Fashion Studio II"),
    ("FAD", "FAD", "250", "Visual Communication for Design"),
    ("FAD", "FAD", "270", "Introduction to Fashion Illustration"),
    ("FAD", "FAD", "301", "Digital Textile Printing"),
    ("FAD", "FAD", "315", "Fashion Design III"),
    ("FAD", "FAD", "321", "Advanced Patternmaking"),
    ("FAD", "FAD", "322", "Textiles for Apparel"),
    ("FAD", "FAD", "340", "Sustainable Fashion"),
    ("FAD", "FAD", "342", "Fashion Design History"),
    ("FAD", "FAD", "345", "Portfolio Development"),
    ("FAD", "FAD", "352", "Advanced Interior Design"),
    ("FAD", "FAD", "370", "Fashion Illustration II")
]

for core_code, subject, number, title in fad_courses:
    insert_course(core_code, subject, number, title)
print(f"Added {len(fad_courses)} FAD courses\n")

# Load JSON File ----------
with open("core_rules.json", "r", encoding="utf-8") as f:
    json_data = json.load(f)
    core_rules = json_data.get("rules", [])

print(f"Loaded {len(core_rules)} rules from JSON\n")

# Insert JSON Courses ----------
added_count = 0
for rule in core_rules:
    core_code = rule.get("core_code", "").strip()
    subject = rule.get("subject", "").strip()
    numbers = rule.get("numbers", [])
    title = rule.get("title", "").strip()
    note = rule.get("note")

    for num in numbers:
        insert_course(core_code, subject, str(num), title, note)
        added_count += 1

conn.commit()
print(f"Added {added_count} total courses from JSON\n")

# Verify ----------
cur.execute("SELECT COUNT(*) FROM unca_core_courses;")
print(f"Table now contains {cur.fetchone()[0]} rows.")

# Cleanup ----------
cur.close()
conn.close()
print("All done — unca_core_courses populated successfully!")
