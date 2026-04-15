import { useEffect, useState } from "react";
import PageShell from "./components/PageShell.jsx";
import Panel from "./components/Panel.jsx";
import Button from "./components/Button.jsx";
import ReverseLookup from "./components/ReverseLookup.jsx";
import TranscriptList from "./components/TranscriptList.jsx";
import api from "./services/api";
import AddCourseDropdowns from "./components/AddCourseDropdowns.jsx";

const TRANSCRIPT_STORAGE_KEY = "unca_virtual_transcript";

export default function App() {
  const [transcript, setTranscript] = useState(() => {
    try {
      const saved = localStorage.getItem(TRANSCRIPT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [coreSummary, setCoreSummary] = useState(null);

  // Save transcript to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(TRANSCRIPT_STORAGE_KEY, JSON.stringify(transcript));
  }, [transcript]);

  // Refresh core summary whenever transcript changes
  useEffect(() => {
    loadCoreSummary();
  }, [transcript]);

  const loadCoreSummary = async () => {
    try {
      if (!transcript.length) {
        setCoreSummary(null);
        return;
      }

      const res = await api.post("/transcript/summary", {
        transcript,
      });

      setCoreSummary(res.data);
    } catch (err) {
      setCoreSummary(null);
    }
  };

  const addCourse = async (payload) => {
    const school = payload?.schoolCode;
    const course = payload?.courseCode;

    if (!school || !course) return;

    try {
      // Ask backend to resolve one course into transcript-entry format
      const res = await api.post("/transcript/resolve", {
        school_code: school,
        course_code: course,
      });

      const entry = res.data?.course;
      if (!entry) return;

      setTranscript((prev) => {
        const alreadyExists = prev.some((existing) => {
          const ext = existing.external_course || {};
          return (
            (ext.school_code || "").toUpperCase() === school.toUpperCase() &&
            (ext.code || "").toUpperCase() === course.toUpperCase()
          );
        });

        if (alreadyExists) return prev;
        return [...prev, entry];
      });
    } catch (err) {
      console.error(err);
      alert("Error adding course.");
    }
  };

  const clearTranscript = () => {
    setTranscript([]);
    localStorage.removeItem(TRANSCRIPT_STORAGE_KEY);
    setCoreSummary(null);
  };

  const removeCourse = ({ schoolCode, courseCode }) => {
    setTranscript((prev) =>
      prev.filter((entry) => {
        const ext = entry.external_course || {};
        return !(
          (ext.school_code || "").toUpperCase() === schoolCode.toUpperCase() &&
          (ext.code || "").toUpperCase() === courseCode.toUpperCase()
        );
      }),
    );
  };

  return (
    <PageShell>
      <div className="mb-8">
        <p className="mt-2 text-slate-600 max-w-3xl">
          Build a virtual transcript by adding your courses. See UNCA
          equivalencies instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Panel
            title="Add a course"
            actions={
              <Button variant="ghost" onClick={clearTranscript}>
                Clear transcript
              </Button>
            }
          >
            <AddCourseDropdowns onAdd={addCourse} />
          </Panel>
        </div>

        <div className="lg:col-span-2">
          <Panel title="Virtual transcript">
            <TranscriptList transcript={transcript} onRemove={removeCourse} />
          </Panel>
        </div>

        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Panel title="Reverse lookup">
              <ReverseLookup onAdd={addCourse} />
            </Panel>

            <Panel title="Core summary">
              <div className="text-xs text-slate-600 mb-3">
                <span className="font-semibold">Core Key:</span>
                <div className="mt-2 grid grid-cols-2 gap-x-6">
                  <div>
                    <div>ARTS — Arts and Ideas</div>
                    <div>FAD — Foundations of American Democracy</div>
                    <div>FYS — First-Year Seminar</div>
                    <div>HUM - Humanities</div>
                    <div>NAT - Natural Sciences (with Lab)</div>
                  </div>
                  <div>
                    <div>QR — Quantitative Reasoning</div>
                    <div>SL — Second Language</div>
                    <div>SS — Social Sciences</div>
                    <div>SYS - Senior-Year Seminar</div>
                    <div>WR - Academic Writing and Critical Inquiry</div>
                  </div>
                </div>
              </div>
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
