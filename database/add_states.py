import json
import psycopg2

# Connect to PostgreSQL (fill in your actual password!)
conn = psycopg2.connect(
    dbname="",
    user="",
    password="",
    host="",
    port=""
)
cur = conn.cursor()

# Load JSON
with open("states.json") as f:
    states_data = json.load(f)

# Example structure: [{"Name": "North Carolina", "Abbr": "NC"}, {...}]
for state in states_data:
    cur.execute(
        "INSERT INTO states (name, abbreviation) VALUES (%s, %s)"
        (state["Name"], state["Abbreviation"])
    )

conn.commit()
cur.close()
conn.close()
