export default function AppHeader() {
    return (
        <>
            <header className="page-header">
                <h1>📝 הכנה לבחינות</h1>
                <p className="subtitle">
                    בחר מקצוע בלשוניות, ולחץ על בחינה כדי לפתוח את העמוד שלה. בכל בחינה 5 שאלות (מסודרות אנכית), ולכל
                    שאלה: הצלחה, תאריך אחרון ונקודות.
                </p>
            </header>

            <div className="notice" role="note">
                <span aria-hidden="true">�</span>
                <div>
                    <strong>המידע נשמר.</strong>
                    הנתונים נשמרים על השרת — רענון הדף או חזרה אליו יציגו את מה שהוזן.
                </div>
            </div>
        </>
    );
}
