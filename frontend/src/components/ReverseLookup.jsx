import { useMemo, useState } from "react";
import api from "../services/api";
import Button from "./Button";
import { Table } from "./Table";

// Pull a safe string from many possible shapes
function pick(...candidates) {
  for (const v of candidates) {
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

// Normalize one raw record from the API into the shape we need
function normalizeRecord(r) {
  // Try multiple keys because different endpoints/joins name things differently
  const schoolName = pick(
    r.school_name,
    r.school,
    r.SchoolName,
    r["School Name"]
  );

  const schoolCode = pick(r.school_code, r.schoolCode, r.SchoolCode);

  const stateAbbr = pick(
    r.state_abbr,
    r.state,
    r.state_abbreviation,
    r.stateAbbr,
    r.State
  );

  // External course might be flat or nested
  const externalCode = pick(
    r.course_code,
    r.external_course_code,
    r.code,
    r.Code,
    r?.ExternalCourse?.Code
  );

  const externalName = pick(
    r.course_name,
    r.external_course_name,
    r.name,
    r.Name,
    r?.ExternalCourse?.Name
  );

  return {
    schoolName: schoolName || "(Unknown School)",
    schoolCode: schoolCode, // may be undefined in some rows
    stateAbbr: stateAbbr || "—",
    externalCode: externalCode,
    externalName: externalName,
  };
}

export default function ReverseLookup({ onAdd }) {
  const [uncaCode, setUncaCode] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

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
      setResults(raw.map(normalizeRecord));
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

  // Group by state for easier browsing
  const groups = useMemo(() => {
    const map = new Map();
    for (const rec of results) {
      const key = rec.stateAbbr || "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(rec);
    }
    // sort groups alphabetically by state
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [results]);

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

      {!loading && results.length === 0 && !err && (
        <p className="text-sm text-slate-600">
          Enter a UNCA course code (ex.{" "}
          <span className="font-medium">LANG 120</span>) to see external
          matches.
        </p>
      )}

      {groups.map(([state, rows]) => {
        const tableRows = rows.map((r, idx) => ({
          school: `${r.schoolName} ${
            r.stateAbbr !== "—" ? `(${r.stateAbbr})` : ""
          }`,
          external: r.externalCode
            ? `${r.externalCode}${r.externalName ? ` — ${r.externalName}` : ""}`
            : "(no external code found)",
          action:
            r.schoolCode && r.externalCode && onAdd ? (
              <Button
                key={`${r.schoolCode}-${r.externalCode}-${idx}`}
                variant="subtle"
                onClick={() =>
                  onAdd({
                    schoolCode: r.schoolCode,
                    courseCode: r.externalCode,
                  })
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
            <h3 className="text-sm font-semibold text-slate-800">{state}</h3>
            <Table
              columns={[
                { key: "school", header: "School" },
                { key: "external", header: "External course" },
                { key: "action", header: "" },
              ]}
              rows={tableRows}
            />
          </div>
        );
      })}
    </div>
  );
}
