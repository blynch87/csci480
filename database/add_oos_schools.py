import json
import psycopg2
import time
import requests

# Connect to PostgreSQL (fill in your actual password!)
conn = psycopg2.connect(
    dbname="",
    user="",
    password="",
    host="",
    port=""
)
cur = conn.cursor()

# OOS Schools
# for state in states:
#    for school_code in state:

# In-State Schools
# for school in state:

# Fetchall states from table
cur.execute("SELECT abbreviation, state_id FROM states;")
states = cur.fetchall()
#This gives me all the state abbreviations and ids

# Will have to make NC schools state_id 0, then have them either be in-state or CC for type

# Use endpoints to automate process
for abbr, state_id in states:
    url = f"https://meteor.unca.edu/registrar/transfer-equivalencies/api/v1/equivalencies/out-of-state-schools/{abbr}"
    response = requests.get(url)

    # Make sure each state is working
    if response.status_code != 200:
        print(f"Failed for {abbr}: {response.status_code}")
        continue
    
    # Now its back to how I was doing it manually
    data = response.json()

    for school in data:
        cur.execute(
            "INSERT INTO schools (name, type, state_id, school_code) VALUES (%s, %s, %s, %s) ON CONFLICT (school_code) DO NOTHING;", #Make sure no duplicates, 
                (school["Name"], "out-of-state", state_id, school["Code"])
        )
    conn.commit()
    print(f"Inserted {len(data)} schools for {abbr}")


cur.close()
conn.close()
print("All out-of-state schools imported successfully.")

# GET https://meteor.unca.edu/registrar/transfer-equivalencies/api/v1/equivalencies/out-of-state-schools/AR
# GET https://meteor.unca.edu/registrar/transfer-equivalencies/api/v1/equivalencies/out-of-state-equivalencies/001107