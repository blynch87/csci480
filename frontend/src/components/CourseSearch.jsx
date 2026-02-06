import React, { useState } from "react";
import api from "../services/api";

export default function CourseSearch({ setTranscript }) {
  const [schoolCode, setSchoolCode] = useState("");
  const [courseCode, setCourseCode] = useState("");

  const handleAddCourse = async () => {
    try {
      const res = await api.post("/transcript/add", {
        school_code: schoolCode,
        course_code: courseCode,
      });

      // After adding, load the new transcript
      const updated = await api.get("/transcript/");
      setTranscript(updated.data);

      alert("Course added!");
    } catch (err) {
      console.error(err);
      alert("Error adding course. Check codes.");
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <h2>Add a Course to Transcript</h2>

      <input
        placeholder="School Code (e.g., 008310)"
        value={schoolCode}
        onChange={(e) => setSchoolCode(e.target.value)}
      />

      <input
        placeholder="Course Code (e.g., ACCT 1000)"
        value={courseCode}
        onChange={(e) => setCourseCode(e.target.value)}
      />

      <button onClick={handleAddCourse}>Add Course</button>
    </div>
  );
}
