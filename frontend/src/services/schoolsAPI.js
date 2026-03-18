import api from "./api";

export async function fetchStates() {
  const res = await api.get("/states");
  return res.data || [];
}

export async function fetchSchoolsByState(stateAbbr) {
  const res = await api.get(`/schools/${encodeURIComponent(stateAbbr)}`);
  return res.data || [];
}

export async function fetchCoursesBySchool(schoolCode) {
  const res = await api.get(`/courses/${encodeURIComponent(schoolCode)}`);
  return res.data || [];
}
