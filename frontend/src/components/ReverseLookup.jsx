import { useMemo, useState } from "react";
import api from "../services/api";
import Button from "./Button";
import { Table } from "./Table";

// Return the first non-empty candidate
function pick(...vals) {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

// Normalize one raw record from the API into the shape we need
function normalize(r) {
  return {
    schoolName:
      pick(r.school_name, r.school, r.SchoolName, r["School Name"]) ||
      "(Unknown School)",
    schoolCode: pick(r.school_code, r.schoolCode, r.SchoolCode),
    stateAbbr: pick(r.state_abbr, r.state, r.stateAbbr, r.State) || "—",
    courseCode: pick(
      r.course_code,
      r.external_course_code,
      r?.ExternalCourse?.Code,
      r.code,
      r.Code
    ),
    courseName: pick(
      r.course_name,
      r.external_course_name,
      r?.ExternalCourse?.Name,
      r.name,
      r.Name
    ),
  };
}

export default function ReverseLookup({ onAdd }) {
  const [uncaCode, setUncaCode] = useState("");
  const [results, setResults] = useState([]);
  const [collapsed, setCollapsed] = useState({}); // state -> boolean (true = collapsed)
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [filter, setFilter] = useState("");

  const toggleState = (state) => {
    setCollapsed((prev) => ({ ...prev, [state]: !prev[state] }));
  };

  const search = async () => {
    const code = uncaCode.trim();
    if (!code) return;
    try {
      setLoading(true);
      setErr("");
      setResults([]);
      const res = await api.get(
        `/equivalencies/reverse/${encodeURIComponent(code)}`
      );
      const raw = Array.isArray(res.data) ? res.data : [];
      const normalized = raw.map(normalize);
      setResults(normalized);

      // Seed all states to collapsed by default
      const states = [...new Set(normalized.map((n) => n.stateAbbr || "—"))];
      setCollapsed(Object.fromEntries(states.map((s) => [s, true])));
    } catch (e) {
      setErr(
        "Could not load reverse equivalencies. Check the code and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter") search();
  };

  // Filter results client-side by school/course text
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return results;
    return results.filter((r) => {
      const hay = [r.schoolName, r.stateAbbr, r.courseCode, r.courseName]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [filter, results]);

  // Group by state abbreviation
  const groups = useMemo(() => {
    const map = new Map();
    for (const rec of filtered) {
      const key = rec.stateAbbr || "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(rec);
    }
    // sort states alphabetically; within each group sort by school then course
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([state, arr]) => [
        state,
        arr.sort((x, y) => {
          const a = `${x.schoolName} ${x.courseCode || ""}`.toLowerCase();
          const b = `${y.schoolName} ${y.courseCode || ""}`.toLowerCase();
          return a.localeCompare(b);
        }),
      ]);
  }, [filtered]);

  const expandAll = () => {
    const states = [...new Set(results.map((n) => n.stateAbbr || "—"))];
    setCollapsed(Object.fromEntries(states.map((s) => [s, false])));
  };

  const collapseAll = () => {
    const states = [...new Set(results.map((n) => n.stateAbbr || "—"))];
    setCollapsed(Object.fromEntries(states.map((s) => [s, true])));
  };

  return (
    <div className="space-y-3">
      {err && (
        <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {err}
        </div>
      )}

      <div className="flex gap-2">
        <input
          value={uncaCode}
          onChange={(e) => setUncaCode(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="ex. LANG 120"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-unca-300"
        />
        <Button onClick={search} variant="primary">
          {loading ? "Searching..." : "Search"}
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter by school or course…"
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-unca-300"
        />
        {filter && (
          <Button variant="ghost" onClick={() => setFilter("")}>
            Clear
          </Button>
        )}
      </div>

      {results.length > 0 && (
        <div className="flex items-center gap-2">
          <Button variant="subtle" onClick={expandAll}>
            Expand all
          </Button>
          <Button variant="subtle" onClick={collapseAll}>
            Collapse all
          </Button>
        </div>
      )}

      {!loading && results.length === 0 && !err && (
        <p className="text-sm text-slate-600">
          Enter a UNCA course code (ex.{" "}
          <span className="font-medium">LANG 120</span>) to see external
          matches.
        </p>
      )}

      {groups.map(([state, rows]) => {
        // default to collapsed if not explicitly set yet
        const isCollapsed = Object.prototype.hasOwnProperty.call(
          collapsed,
          state
        )
          ? !!collapsed[state]
          : true;

        const tableRows = rows.map((r, idx) => ({
          school: `${r.schoolName}${
            r.stateAbbr && r.stateAbbr !== "—" ? ` (${r.stateAbbr})` : ""
          }`,
          external: r.courseCode
            ? `${r.courseCode}${r.courseName ? ` — ${r.courseName}` : ""}`
            : "(no external code found)",
          action:
            r.schoolCode && r.courseCode && onAdd ? (
              <Button
                key={`${r.schoolCode}-${r.courseCode}-${idx}`}
                variant="subtle"
                onClick={() =>
                  onAdd({ schoolCode: r.schoolCode, courseCode: r.courseCode })
                }
              >
                Add
              </Button>
            ) : (
              <span className="text-slate-400">—</span>
            ),
        }));

        return (
          <div key={state} className="space-y-2">
            <button
              onClick={() => toggleState(state)}
              className="w-full text-left px-2 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-sm font-semibold text-slate-800"
            >
              {isCollapsed ? "▶" : "▼"} {state}{" "}
              <span className="font-normal text-slate-600">
                ({rows.length})
              </span>
            </button>

            {!isCollapsed && (
              <Table
                columns={[
                  { key: "school", header: "School" },
                  { key: "external", header: "External course" },
                  { key: "action", header: "" },
                ]}
                rows={tableRows}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
