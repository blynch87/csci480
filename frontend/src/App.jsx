import { useEffect, useState } from "react";
import PageShell from "./components/PageShell.jsx";
import Panel from "./components/Panel.jsx";
import Button from "./components/Button.jsx";
import ReverseLookup from "./components/ReverseLookup.jsx";
import TranscriptList from "./components/TranscriptList.jsx";
import api from "./services/api";

export default function App() {
  const [schoolCode, setSchoolCode] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [transcript, setTranscript] = useState([]);
  const [coreSummary, setCoreSummary] = useState(null);

  // Load transcript + core summary on mount
  useEffect(() => {
    const init = async () => {
      const res = await api.get("/transcript/");
      setTranscript(res.data || []);
      await loadCoreSummary();
    };
    init();
  }, []);

  const loadCoreSummary = async () => {
    try {
      const res = await api.get("/transcript/summary");
      setCoreSummary(res.data);
    } catch (err) {
      // If transcript is empty, backend returns 400
      setCoreSummary(null);
    }
  };

  // Add course supports BOTH:
  // 1) manual inputs (uses state)
  // 2) ReverseLookup "Add" button (passes { schoolCode, courseCode })
  const addCourse = async (payload) => {
    const school = payload?.schoolCode ?? schoolCode;
    const course = payload?.courseCode ?? courseCode;

    if (!school || !course) return;

    await api.post("/transcript/add", {
      school_code: school,
      course_code: course,
    });

    const res = await api.get("/transcript/");
    setTranscript(res.data || []);
    setCourseCode("");

    await loadCoreSummary(); // auto refresh
  };

  const clearTranscript = async () => {
    await api.post("/transcript/clear");
    setTranscript([]);
    await loadCoreSummary(); // auto refresh (will set null)
  };

  const removeCourse = async ({ schoolCode, courseCode }) => {
    await api.post("/transcript/remove", {
      school_code: schoolCode,
      course_code: courseCode,
    });

    const res = await api.get("/transcript/");
    setTranscript(res.data || []);

    await loadCoreSummary(); // auto refresh
  };

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
              <Button onClick={() => addCourse()}>Add to transcript</Button>
              <p className="text-xs text-slate-500">
                Next: we’ll swap these inputs for dropdowns (state → school →
                course).
              </p>
            </div>
          </Panel>
        </div>

        {/* Transcript + panels */}
        <div className="lg:col-span-2">
          <Panel title="Virtual transcript">
            <TranscriptList transcript={transcript} onRemove={removeCourse} />
          </Panel>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel title="Core summary">
              {!coreSummary ? (
                <p className="text-sm text-slate-600">
                  Add courses to see which core requirements you’ve met.
                </p>
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="font-semibold text-slate-800 mb-1">
                      Fulfilled
                    </div>
                    {coreSummary.fulfilled_requirements?.length ? (
                      <div className="text-slate-700">
                        {coreSummary.fulfilled_requirements.join(", ")}
                      </div>
                    ) : (
                      <div className="text-slate-600">None yet</div>
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-slate-800 mb-1">
                      Remaining
                    </div>
                    {coreSummary.remaining_requirements?.length ? (
                      <div className="text-slate-700">
                        {coreSummary.remaining_requirements.join(", ")}
                      </div>
                    ) : (
                      <div className="text-slate-600">
                        No remaining requirements
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Panel>

            {/* Reverse lookup */}
            <Panel title="Reverse lookup">
              {/* ReverseLookup passes {schoolCode, courseCode} */}
              <ReverseLookup onAdd={addCourse} />
            </Panel>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
