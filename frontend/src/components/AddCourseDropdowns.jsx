import { useEffect, useMemo, useState } from "react";
import Button from "./Button";
import {
  fetchStates,
  fetchSchoolsByState,
  fetchCoursesBySchool,
} from "../services/schoolsAPI";

export default function AddCourseDropdowns({ onAdd }) {
  const [states, setStates] = useState([]);
  const [schools, setSchools] = useState([]);
  const [courses, setCourses] = useState([]);

  const [stateAbbr, setStateAbbr] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [courseCode, setCourseCode] = useState("");

  // only course search
  const [courseQuery, setCourseQuery] = useState("");

  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(false);

  const selectedSchool = useMemo(
    () => schools.find((s) => s.school_code === schoolCode),
    [schools, schoolCode],
  );

  const selectedCourse = useMemo(
    () => courses.find((c) => c.course_code === courseCode),
    [courses, courseCode],
  );

  const filteredCourses = useMemo(() => {
    const q = courseQuery.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter((c) =>
      `${c.course_code} ${c.course_name || ""}`.toLowerCase().includes(q),
    );
  }, [courses, courseQuery]);

  // Load states once
  useEffect(() => {
    const load = async () => {
      setLoadingStates(true);
      try {
        const data = await fetchStates();
        setStates(data);
      } finally {
        setLoadingStates(false);
      }
    };
    load();
  }, []);

  // Load schools when state changes
  useEffect(() => {
    const loadSchools = async () => {
      setSchools([]);
      setCourses([]);
      setSchoolCode("");
      setCourseCode("");
      setCourseQuery("");

      if (!stateAbbr) return;

      setLoadingSchools(true);
      try {
        const data = await fetchSchoolsByState(stateAbbr);
        setSchools(data);
      } finally {
        setLoadingSchools(false);
      }
    };
    loadSchools();
  }, [stateAbbr]);

  // Load courses when school changes
  useEffect(() => {
    const loadCourses = async () => {
      setCourses([]);
      setCourseCode("");
      setCourseQuery("");

      if (!schoolCode) return;

      setLoadingCourses(true);
      try {
        const data = await fetchCoursesBySchool(schoolCode);
        setCourses(data);
      } finally {
        setLoadingCourses(false);
      }
    };
    loadCourses();
  }, [schoolCode]);

  const addSelected = async () => {
    if (!schoolCode || !courseCode) return;
    await onAdd({ schoolCode, courseCode });
    setCourseCode("");
  };

  return (
    <div className="space-y-3">
      {/* ✅ NC Community College note */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
        <span className="font-semibold">Note:</span> All North Carolina
        community colleges are listed under{" "}
        <span className="font-semibold">NC</span> (state) →{" "}
        <span className="font-semibold">North Carolina Community College</span>{" "}
        (school). For example, AB-Tech courses are found there.
      </div>

      {/* State */}
      <div>
        <label className="block text-sm text-slate-700 mb-1">State</label>
        <select
          value={stateAbbr}
          onChange={(e) => setStateAbbr(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
        >
          <option value="">
            {loadingStates ? "Loading states..." : "Select a state"}
          </option>
          {states.map((s) => (
            <option key={s.abbreviation} value={s.abbreviation}>
              {s.abbreviation} — {s.name}
            </option>
          ))}
        </select>
      </div>

      {/* School */}
      <div>
        <label className="block text-sm text-slate-700 mb-1">School</label>
        <select
          value={schoolCode}
          onChange={(e) => setSchoolCode(e.target.value)}
          disabled={!stateAbbr || loadingSchools}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white disabled:bg-slate-100"
        >
          <option value="">
            {!stateAbbr
              ? "Select a state first"
              : loadingSchools
                ? "Loading schools..."
                : "Select a school"}
          </option>
          {schools.map((sch) => (
            <option key={sch.school_code} value={sch.school_code}>
              {sch.name} ({sch.type})
            </option>
          ))}
        </select>

        {selectedSchool?.school_code && (
          <p className="mt-1 text-xs text-slate-500">
            School code: {selectedSchool.school_code}
          </p>
        )}
      </div>

      {/* Course search */}
      <div>
        <label className="block text-sm text-slate-700 mb-1">Course</label>

        <input
          value={courseQuery}
          onChange={(e) => setCourseQuery(e.target.value)}
          disabled={!schoolCode || loadingCourses}
          placeholder="Search courses (ex. ENG 111)..."
          className="mb-2 w-full rounded-lg border border-slate-300 px-3 py-2 bg-white disabled:bg-slate-100"
        />

        <select
          value={courseCode}
          onChange={(e) => setCourseCode(e.target.value)}
          disabled={!schoolCode || loadingCourses}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white disabled:bg-slate-100"
        >
          <option value="">
            {!schoolCode
              ? "Select a school first"
              : loadingCourses
                ? "Loading courses..."
                : `Select a course (${filteredCourses.length})`}
          </option>
          {filteredCourses.map((c) => (
            <option key={c.course_code} value={c.course_code}>
              {c.course_code}
              {c.course_name ? ` — ${c.course_name}` : ""}
            </option>
          ))}
        </select>

        {selectedCourse?.course_code && (
          <p className="mt-1 text-xs text-slate-500">
            Selected: {selectedCourse.course_code}
          </p>
        )}
      </div>

      <Button onClick={addSelected} disabled={!schoolCode || !courseCode}>
        Add to transcript
      </Button>
    </div>
  );
}
