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

# Will have to make NC schools state_id 0, then have them either be in-state or CC for type

# Use endpoints to automate process

url = f"https://meteor.unca.edu/registrar/transfer-equivalencies/api/v1/equivalencies/military-schools"
response = requests.get(url)

# Make sure each state is working
if response.status_code != 200:
    print(f"Failed for in-state schools: {response.status_code}")
    
# Now its back to how I was doing it manually
data = response.json()

for school in data:
    cur.execute(
        "INSERT INTO schools (name, type, state_id, school_code) VALUES (%s, %s, %s, %s) ON CONFLICT (school_code) DO NOTHING;", #Make sure no duplicates, 
            (school["Name"], "military", 52, school["Code"])
    )
conn.commit()
print(f"Inserted {len(data)} schools for military schools")


cur.close()
conn.close()
print("All military schools imported successfully.")

# GET https://meteor.unca.edu/registrar/transfer-equivalencies/api/v1/equivalencies/out-of-state-schools/AR
# GET https://meteor.unca.edu/registrar/transfer-equivalencies/api/v1/equivalencies/out-of-state-equivalencies/001107
# GET https://meteor.unca.edu/registrar/transfer-equivalencies/api/v1/equivalencies/in-state-schools
# GET https://meteor.unca.edu/registrar/transfer-equivalencies/api/v1/equivalencies/in-state-equivalencies/002906
# GET https://meteor.unca.edu/registrar/transfer-equivalencies/api/v1/equivalencies/military-schools