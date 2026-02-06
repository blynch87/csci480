import { useEffect, useState } from "react";
import axios from "axios";
import PageShell from "./components/PageShell.jsx";
import Panel from "./components/Panel.jsx";
import Button from "./components/Button.jsx";
import { Table } from "./components/Table.jsx";
import ReverseLookup from "./components/ReverseLookup.jsx";

export default function App() {
  const [schoolCode, setSchoolCode] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [transcript, setTranscript] = useState([]);

  // Load transcript on mount
  useEffect(() => {
    axios.get("/api/transcript/").then((res) => setTranscript(res.data || []));
  }, []);

  const addCourse = async () => {
    if (!schoolCode || !courseCode) return;
    await axios.post("/api/transcript/add", {
      school_code: schoolCode,
      course_code: courseCode,
    });
    const res = await axios.get("/api/transcript/");
    setTranscript(res.data || []);
    setCourseCode("");
  };

  const clearTranscript = async () => {
    await axios.post("/api/transcript/clear");
    setTranscript([]);
  };

  const transcriptRows = transcript.map((entry) => ({
    external: `${entry.external_course.school} — ${entry.external_course.code}: ${entry.external_course.name}`,
    equivalencies: entry.equivalencies
      .map((eq) => `${eq.code} (${eq.hours ?? "?"}h)`)
      .join(", "),
  }));

  return (
    <PageShell>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-unca-900">
          Transfer Equivalencies
        </h1>
        <p className="mt-2 text-slate-600 max-w-3xl">
          Build a virtual transcript by adding your courses. See UNCA
          equivalencies instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add course */}
        <div className="lg:col-span-1">
          <Panel
            title="Add a course"
            actions={
              <Button variant="ghost" onClick={clearTranscript}>
                Clear transcript
              </Button>
            }
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-slate-700 mb-1">
                  School code
                </label>
                <input
                  value={schoolCode}
                  onChange={(e) => setSchoolCode(e.target.value)}
                  placeholder="ex. 008310"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-unca-300"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-700 mb-1">
                  Course code
                </label>
                <input
                  value={courseCode}
                  onChange={(e) => setCourseCode(e.target.value)}
                  placeholder="ex. ACCT 1000"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-unca-300"
                />
              </div>
              <Button onClick={addCourse}>Add to transcript</Button>
              <p className="text-xs text-slate-500">
                Next: we’ll swap these inputs for dropdowns (state → school →
                course).
              </p>
            </div>
          </Panel>
        </div>

        {/* Transcript table */}
        <div className="lg:col-span-2">
          <Panel title="Virtual transcript">
            <Table
              columns={[
                { key: "external", header: "External course" },
                {
                  key: "equivalencies",
                  header: "UNCA equivalency (code & hours)",
                },
              ]}
              rows={transcriptRows}
            />
          </Panel>

          {/* Coming soon panels */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel title="Core summary (coming soon)">
              <p className="text-sm text-slate-600">
                Will show which core requirements are met and what’s still
                needed.
              </p>
            </Panel>
            <Panel title="Reverse lookup">
              <ReverseLookup onAdd={addCourse} />
            </Panel>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
