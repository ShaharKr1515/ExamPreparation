import Icon from "./Icon.jsx";

export default function AppHeader() {
    return <header className="page-header">
        <div className="app-wordmark"><Icon name="book" size={26} /><span>הכנה לבחינות</span></div>
        <p className="subtitle">פחות עומס. יותר התקדמות.</p>
    </header>;
}
