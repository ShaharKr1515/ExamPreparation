// Persistence seam. Data is intentionally kept in memory only for now — a page
// refresh wipes everything (by design, same as before the migration).
//
// To add persistence later: implement loadInitialData() to hydrate from
// localStorage / an API and persistState(state) to save on every change
// (call it from ExamsProvider via useEffect). Nothing else needs to change.

export function loadInitialData() {
    return { exams: [], subjects: [], activeSubject: null };
}

export function persistState(_state) {
    // no-op for now
}
