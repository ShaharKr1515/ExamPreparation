export default function AppHeader() {
    return (
        <header className="page-header">
            <h1>
                <span className="header-icon-badge" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" />
                        <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                    </svg>
                </span>
                <span>הכנה לבחינות</span>
            </h1>
            <p className="subtitle">
                בחר מקצוע, תכנן את יעדי התרגול ועדכן בכל בחינה את תוצאות השאלות, תאריך הניסיון והנקודות.
            </p>
        </header>
    );
}
