import { useEffect, useState } from "react";
import PageShell from "./components/PageShell.jsx";
import Panel from "./components/Panel.jsx";
import Button from "./components/Button.jsx";
import ReverseLookup from "./components/ReverseLookup.jsx";
import TranscriptList from "./components/TranscriptList.jsx";
import api from "./services/api";
import AddCourseDropdowns from "./components/AddCourseDropdowns.jsx";

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
            {/* Whatever inside this panel (dropdowns) */}
            <AddCourseDropdowns onAdd={addCourse} />
          </Panel>
        </div>

        {/* Transcript */}
        <div className="lg:col-span-2">
          <Panel title="Virtual transcript">
            <TranscriptList transcript={transcript} onRemove={removeCourse} />
          </Panel>
        </div>

        {/* Full-width bottom row */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel title="Reverse lookup">
              <ReverseLookup onAdd={addCourse} />
            </Panel>

            <Panel title="Core summary">
              {/* core summary UI here */}
              {!coreSummary ? (
                <p className="text-sm text-slate-600">
                  Add courses to see which core requirements you’ve met.
                </p>
              ) : (
                <div className="space-y-4 text-sm">
                  <div>
                    <div className="font-semibold text-slate-800 mb-2">
                      Fulfilled
                    </div>

                    {coreSummary.fulfilled_requirements?.length ? (
                      <div className="space-y-2">
                        {coreSummary.fulfilled_requirements.map((req) => (
                          <div
                            key={req}
                            className="rounded-lg border border-slate-200 p-2"
                          >
                            <div className="font-medium text-slate-900">
                              {req}
                            </div>
                            {coreSummary.fulfilled_map?.[req]?.length ? (
                              <div className="mt-1 text-slate-700">
                                Met by:{" "}
                                <span className="text-slate-800">
                                  {coreSummary.fulfilled_map[req].join(", ")}
                                </span>
                              </div>
                            ) : (
                              <div className="mt-1 text-slate-600">
                                Met by: (unknown)
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-slate-600">None yet</div>
                    )}
                  </div>

                  <div>
                    <div className="font-semibold text-slate-800 mb-2">
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
          </div>
        </div>
      </div>
    </PageShell>
  );
}
