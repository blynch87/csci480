import json
import psycopg2

# Connect to PostgreSQL (fill in your actual password!)


# OOS Schools
# for state in states:
#    for school_code in state:

# In-State Schools
# for school in state:

state_abr = "AZ"
# Step 1: look up the state_id for Alabama (AL)
cur.execute("SELECT state_id FROM states WHERE abbreviation = %s", (state_abr,))
state_id = cur.fetchone()[0]

# Load JSON
with open(state_abr+".json") as f:
    schools_data = json.load(f)

# Example structure: [{"Name": "North Carolina", "Abbr": "NC"}, {...}]
for school in schools_data:
    cur.execute(
        "INSERT INTO schools (name, type, state_id, school_code) VALUES (%s, %s, %s, %s)",
        (school["Name"], "out-of-state", state_id, school["Code"])
    )

conn.commit()
cur.close()
conn.close()
