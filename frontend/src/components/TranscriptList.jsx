import Button from "./Button";

export default function TranscriptList({ transcript, onRemove }) {
  if (!transcript || transcript.length === 0) {
    return <p className="text-sm text-slate-600">No courses added yet.</p>;
  }

  return (
    <div className="space-y-4">
      {transcript.map((entry, idx) => {
        const ext = entry.external_course || {};
        const equivs = entry.equivalencies || [];

        const schoolName = ext.school || "(Unknown School)";
        const schoolCode = ext.school_code; // used for remove
        const courseCode = ext.code || "(Unknown Code)";
        const courseName = ext.name || "";

        return (
          <div
            key={`${schoolCode || "noschool"}-${courseCode}-${idx}`}
            className="rounded-xl border border-slate-200 bg-white shadow-sm"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
              <div>
                <div className="text-sm text-slate-600">{schoolName}</div>
                <div className="text-base font-semibold text-slate-900">
                  {courseCode}
                  {courseName ? ` — ${courseName}` : ""}
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => onRemove({ schoolCode, courseCode })}
                disabled={!schoolCode || !courseCode}
              >
                Remove
              </Button>
            </div>

            {/* Body */}
            <div className="px-4 py-3">
              <div className="text-sm font-semibold text-slate-800 mb-2">
                UNCA equivalencies
              </div>

              {equivs.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No equivalencies found.
                </p>
              ) : (
                <ul className="list-disc list-inside space-y-1 text-sm text-slate-700">
                  {equivs.map((e, j) => (
                    <li key={`${e.code || "code"}-${j}`}>
                      <span className="font-medium">{e.code}</span>
                      {e.hours !== null && e.hours !== undefined
                        ? ` (${e.hours}h)`
                        : ""}
                      {e.name ? ` — ${e.name}` : ""}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
