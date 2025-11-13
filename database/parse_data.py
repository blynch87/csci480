import json

with open("cc.json", "r") as file:
    parsed_data = json.load(file)
i=1

# for course in parsed_data:
#     external_course = course.get("ExternalCourse")
#     internal_course = course.get("InternalCourse")
#     # print(course, "\n\n")
#     print(i, external_course.get("Name"), "-", internal_course.get("Name"))
#     i+=1

for course in parsed_data:
    if course.get("InternalCourse").get("Note") != '':
        print(course.get("InternalCourse").get("Note"))