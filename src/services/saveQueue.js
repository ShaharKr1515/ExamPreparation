/** Keep failed writes and later edits in order until the user retries. */
export function createSaveQueue() {
    const jobs = [];
    const listeners = new Set();
    let running = false;
    let snapshot = { status: "idle", pending: 0 };

    function publish(status) {
        snapshot = { status, pending: jobs.length };
        listeners.forEach((listener) => listener());
    }

    async function drain() {
        if (running) return;
        running = true;
        publish("saving");
        while (jobs.length) {
            const job = jobs[0];
            try {
                const result = await job.operation();
                jobs.shift();
                job.resolve(result);
            } catch (error) {
                const permanent = error.status >= 400 && error.status < 500 && ![408, 429].includes(error.status);
                if (permanent || !job.retryable) {
                    jobs.shift();
                    job.reject(error);
                    continue;
                }
                running = false;
                publish("failed");
                return;
            }
        }
        running = false;
        publish("saved");
    }

    return {
        getSnapshot: () => snapshot,
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        run(operation, { retryable = true } = {}) {
            const promise = new Promise((resolve, reject) => jobs.push({ operation, resolve, reject, retryable }));
            if (snapshot.status === "failed") publish("failed");
            else if (running) publish("saving");
            else drain();
            return promise;
        },
        retry() {
            if (snapshot.status === "failed") drain();
        },
    };
}
