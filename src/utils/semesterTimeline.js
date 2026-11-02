// Date-only arithmetic avoids DST changing the length of a semester day.
function dateNumber(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return NaN;
    const date = new Date(`${value}T00:00:00Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? date.getTime() : NaN;
}

export function getSemesterProgress(start, end, today) {
    const first = dateNumber(start);
    const last = dateNumber(end);
    const current = dateNumber(today);
    if (![first, last, current].every(Number.isFinite) || last <= first) return null;
    const totalDays = (last - first) / 86400000;
    const elapsedDays = Math.max(0, Math.min(totalDays, (current - first) / 86400000));
    return { percent: Math.round(elapsedDays / totalDays * 100), totalDays, elapsedDays,
        week: Math.min(Math.ceil(totalDays / 7), Math.floor(elapsedDays / 7) + 1), before: current < first, after: current > last };
}

export function getAssignmentStatus(assignment, today) {
    if (assignment.completed) return "completed";
    if (assignment.dueDate < today) return "overdue";
    return assignment.dueDate === today ? "today" : "upcoming";
}

export function formatSemesterDate(value) {
    return new Intl.DateTimeFormat("he-IL", { day: "numeric", month: "short" }).format(new Date(`${value}T12:00:00`));
}

export function getSemesterMarkers(assignments, start, end) {
    const range = getSemesterProgress(start, end, start);
    if (!range) return [];
    const first = dateNumber(start);
    const duration = dateNumber(end) - first;
    const minimumWidth = Math.max(360, Math.ceil(range.totalDays / 7) * 38);
    const minimumGap = 32 / minimumWidth * 100;
    const laneEnds = [];
    return [...assignments].sort((a, b) => a.dueDate.localeCompare(b.dueDate) || a.id - b.id)
        .map((assignment, index) => ({ ...assignment, number: index + 1 }))
        .filter(a => a.dueDate >= start && a.dueDate <= end)
        .map(assignment => {
            const position = (dateNumber(assignment.dueDate) - first) / duration * 100;
            let lane = laneEnds.findIndex(last => position - last >= minimumGap);
            if (lane < 0) lane = laneEnds.length;
            laneEnds[lane] = position;
            return { ...assignment, position, lane };
        });
}
