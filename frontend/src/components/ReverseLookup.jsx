import { useMemo, useState } from "react";
import api from "../services/api";
import Button from "./Button";

export default function ReverseLookup({ onAdd }) {
  const [uncaCode, setUncaCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState("");

  // UI selections
  const [mode, setMode] = useState("NC_CC"); // NC_CC | NC_INSTATE | OOS
  const [selectedState, setSelectedState] = useState("");
  const [selectedSchool, setSelectedSchool] = useState("");

  const runSearch = async () => {
    const code = uncaCode.trim();
    if (!code) return;

    setLoading(true);
    setError("");
    setResults([]);

    // reset dropdown selections for new search
    setSelectedState("");
    setSelectedSchool("");

    try {
      const res = await api.get(
        `/equivalencies/reverse/${encodeURIComponent(code)}`,
      );
      setResults(res.data || []);
    } catch (e) {
      setError("No results found (or server error).");
    } finally {
      setLoading(false);
    }
  };

  // ---- Group results --------------------------------------------------------

  // Helpers (expect backend to provide these fields)
  // school_type: "CC" | "in-state" | "out-of-state" | "military"
  // state_abbr: "NC", "VA", etc.
  const ncCommunityCollegeResults = useMemo(
    () =>
      results.filter((r) => r.school_type === "CC" || r.school_type === "cc"),
    [results],
  );

  const ncInstateResults = useMemo(
    () =>
      results.filter(
        (r) =>
          r.school_type === "in-state" &&
          (r.state_abbr || "").toUpperCase() === "NC",
      ),
    [results],
  );

  const outOfStateResults = useMemo(
    () =>
      results.filter(
        (r) =>
          r.school_type === "out-of-state" ||
          r.school_type === "military" ||
          ((r.state_abbr || "").toUpperCase() !== "NC" &&
            r.school_type !== "CC" &&
            r.school_type !== "in-state"),
      ),
    [results],
  );

  // Unique states for OOS dropdown
  const oosStates = useMemo(() => {
    const set = new Set();
    for (const r of outOfStateResults) {
      const ab = (r.state_abbr || "").toUpperCase();
      if (ab) set.add(ab);
      else set.add("??");
    }
    return Array.from(set).sort();
  }, [outOfStateResults]);

  // Schools for the selected state (OOS)
  const oosSchoolsForState = useMemo(() => {
    if (!selectedState) return [];
    const map = new Map(); // school_code -> school_name
    for (const r of outOfStateResults) {
      const ab = ((r.state_abbr || "??") + "").toUpperCase();
      if (ab !== selectedState) continue;
      if (!r.school_code) continue;
      if (!map.has(r.school_code))
        map.set(r.school_code, r.school_name || r.school_code);
    }
    return Array.from(map.entries())
      .map(([school_code, school_name]) => ({ school_code, school_name }))
      .sort((a, b) => a.school_name.localeCompare(b.school_name));
  }, [outOfStateResults, selectedState]);

  // Schools for NC in-state dropdown
  const ncSchools = useMemo(() => {
    const map = new Map();
    for (const r of ncInstateResults) {
      if (!r.school_code) continue;
      if (!map.has(r.school_code))
        map.set(r.school_code, r.school_name || r.school_code);
    }
    return Array.from(map.entries())
      .map(([school_code, school_name]) => ({ school_code, school_name }))
      .sort((a, b) => a.school_name.localeCompare(b.school_name));
  }, [ncInstateResults]);

  // What results are currently “in view” based on dropdowns
  const visibleResults = useMemo(() => {
    if (mode === "NC_CC") {
      return ncCommunityCollegeResults;
    }

    if (mode === "NC_INSTATE") {
      if (!selectedSchool) return [];
      return ncInstateResults.filter((r) => r.school_code === selectedSchool);
    }

    // OOS
    if (!selectedState || !selectedSchool) return [];
    return outOfStateResults.filter(
      (r) =>
        ((r.state_abbr || "??") + "").toUpperCase() === selectedState &&
        r.school_code === selectedSchool,
    );
  }, [
    mode,
    ncCommunityCollegeResults,
    ncInstateResults,
    outOfStateResults,
    selectedState,
    selectedSchool,
  ]);

  // ---- Render ---------------------------------------------------------------

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm text-slate-700 mb-1">
          UNCA course code
        </label>
        <input
          value={uncaCode}
          onChange={(e) => setUncaCode(e.target.value)}
          placeholder="ex. LANG 120"
          className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-unca-300"
        />
      </div>

      <Button onClick={runSearch} disabled={loading || !uncaCode.trim()}>
        {loading ? "Searching..." : "Search"}
      </Button>

      {error && (
        <p className="text-sm text-red-700 border border-red-200 bg-red-50 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      {!loading && results.length > 0 && (
        <>
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            Results found:{" "}
            <span className="font-semibold">{results.length}</span>
          </div>

          {/* Mode dropdown */}
          <div>
            <label className="block text-sm text-slate-700 mb-1">
              Browse results
            </label>
            <select
              value={mode}
              onChange={(e) => {
                setMode(e.target.value);
                setSelectedState("");
                setSelectedSchool("");
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
            >
              <option value="NC_CC">
                NC community colleges (standardized catalog)
              </option>
              <option value="NC_INSTATE">NC colleges (in-state)</option>
              <option value="OOS">Out-of-state colleges (by state)</option>
            </select>

            {mode === "NC_CC" && (
              <p className="mt-2 text-xs text-slate-600">
                Note: All North Carolina community colleges are represented by{" "}
                <span className="font-semibold">
                  North Carolina Community College
                </span>
                .
              </p>
            )}
          </div>

          {/* Conditional dropdowns */}
          {mode === "NC_INSTATE" && (
            <div>
              <label className="block text-sm text-slate-700 mb-1">
                NC school
              </label>
              <select
                value={selectedSchool}
                onChange={(e) => setSelectedSchool(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
              >
                <option value="">Select a school</option>
                {ncSchools.map((s) => (
                  <option key={s.school_code} value={s.school_code}>
                    {s.school_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {mode === "OOS" && (
            <>
              <div>
                <label className="block text-sm text-slate-700 mb-1">
                  State
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => {
                    setSelectedState(e.target.value);
                    setSelectedSchool("");
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                >
                  <option value="">Select a state</option>
                  {oosStates.map((ab) => (
                    <option key={ab} value={ab}>
                      {ab}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-700 mb-1">
                  School
                </label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  disabled={!selectedState}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white disabled:bg-slate-100"
                >
                  <option value="">
                    {!selectedState
                      ? "Select a state first"
                      : "Select a school"}
                  </option>
                  {oosSchoolsForState.map((s) => (
                    <option key={s.school_code} value={s.school_code}>
                      {s.school_name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {/* Visible results list */}
          <div className="space-y-2">
            {visibleResults.length === 0 ? (
              <p className="text-sm text-slate-600">
                Select options above to view matching courses.
              </p>
            ) : (
              visibleResults.map((r, idx) => {
                const schoolName = r.school_name || "(Unknown school)";
                const schoolCode = r.school_code;
                const extCode = r.course_code || "";
                const extName = r.course_name || "";

                return (
                  <div
                    key={`${schoolCode || "noschool"}-${extCode}-${idx}`}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2"
                  >
                    <div className="text-xs text-slate-600">{schoolName}</div>
                    <div className="text-sm font-semibold text-slate-900">
                      {extCode}
                      {extName ? ` — ${extName}` : ""}
                    </div>

                    {schoolCode && extCode && onAdd && (
                      <div className="mt-2">
                        <Button
                          variant="ghost"
                          onClick={() =>
                            onAdd({ schoolCode, courseCode: extCode })
                          }
                        >
                          Add to transcript
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </>
      )}

      {!loading && !error && results.length === 0 && (
        <p className="text-sm text-slate-600">
          No results yet. Try searching for a UNCA course code.
        </p>
      )}
    </div>
  );
}
