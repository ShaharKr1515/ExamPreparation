import React from "react";

/** Catches render-time errors and shows a message instead of a blank page. */
export default class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { error: null };
    }

    static getDerivedStateFromError(error) {
        return { error };
    }

    componentDidCatch(error, info) {
        console.error("Render error:", error, info?.componentStack);
    }

    render() {
        if (this.state.error) {
            return (
                <div className="wrap">
                    <p className="empty-msg" role="alert">
                        ⚠️ משהו השתבש: {String(this.state.error.message || this.state.error)}
                        <br />
                        רענן את הדף כדי להתאושש.
                    </p>
                </div>
            );
        }
        return this.props.children;
    }
}
