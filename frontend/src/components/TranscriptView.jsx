import React from "react";

function TranscriptView({ transcript }) {
  return (
    <div style={{ marginTop: "30px" }}>
      <h2>Your Virtual Transcript</h2>

      {transcript.length === 0 ? (
        <p>No courses added yet.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={th}>School</th>
              <th style={th}>External Course</th>
              <th style={th}>UNCA Equivalencies</th>
            </tr>
          </thead>
          <tbody>
            {transcript.map((entry, idx) => (
              <tr key={idx}>
                {/* School + external course */}
                <td style={td}>{entry.external_course.school}</td>
                <td style={td}>
                  {entry.external_course.code} – {entry.external_course.name}
                </td>

                {/* One external course can have many UNCA equivalents */}
                <td style={td}>
                  {entry.equivalencies.length === 0 ? (
                    <span>No equivalencies</span>
                  ) : (
                    entry.equivalencies.map((eq, i) => (
                      <div key={i}>
                        {eq.code} – {eq.name} ({eq.hours ?? "-"} hrs)
                      </div>
                    ))
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// Basic styles
const th = {
  borderBottom: "2px solid #444",
  padding: "8px",
  textAlign: "left",
  background: "#444",
};

const td = {
  borderBottom: "1px solid #ccc",
  padding: "8px",
  verticalAlign: "top",
};

export default TranscriptView;
