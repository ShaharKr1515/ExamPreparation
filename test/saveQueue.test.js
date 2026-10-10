import test from "node:test";
import assert from "node:assert/strict";
import * as queueModule from "../src/services/saveQueue.js";

function makeQueue() {
    assert.equal(typeof queueModule.createSaveQueue, "function");
    return queueModule.createSaveQueue();
}

test("failed writes remain pending and recover in order when retried", async () => {
    const queue = makeQueue();
    let online = false;
    const stored = [];
    const first = queue.run(async () => {
        if (!online) throw new Error("offline");
        stored.push("first");
        return 1;
    });
    const second = queue.run(async () => { stored.push("second"); return 2; });
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(queue.getSnapshot().status, "failed");
    assert.equal(queue.getSnapshot().pending, 2);
    assert.deepEqual(stored, []);
    online = true;
    queue.retry();
    assert.deepEqual(await Promise.all([first, second]), [1, 2]);
    assert.deepEqual(stored, ["first", "second"]);
    assert.equal(queue.getSnapshot().status, "saved");
    assert.equal(queue.getSnapshot().pending, 0);
});

test("new writes cannot dismiss an unresolved save failure", async () => {
    const queue = makeQueue();
    let attempts = 0;
    queue.run(async () => { attempts++; throw new Error("offline"); });
    await new Promise((resolve) => setImmediate(resolve));
    queue.run(async () => "later");
    assert.equal(queue.getSnapshot().status, "failed");
    queue.retry();
    queue.retry();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(attempts, 2);
    assert.equal(queue.getSnapshot().pending, 2);
});

test("overlapping successful writes finish before saved feedback is emitted", async () => {
    const queue = makeQueue();
    let finish;
    const first = queue.run(() => new Promise((resolve) => { finish = resolve; }));
    const second = queue.run(async () => "second");
    assert.equal(queue.getSnapshot().status, "saving");
    assert.equal(queue.getSnapshot().pending, 2);
    finish("first");
    await Promise.all([first, second]);
    assert.equal(queue.getSnapshot().status, "saved");
});

test("a permanent validation error rejects that write and allows later saves", async () => {
    const queue = makeQueue();
    const conflict = Object.assign(new Error("duplicate subject"), { status: 409 });
    const invalid = queue.run(async () => { throw conflict; });
    const valid = queue.run(async () => "saved");
    await assert.rejects(invalid, { status: 409 });
    assert.equal(await valid, "saved");
    assert.equal(queue.getSnapshot().pending, 0);
});

test("an unsafe mutation is not replayed after its committed response is lost", async () => {
    const queue = makeQueue();
    let created = 0;
    const write = queue.run(async () => { created++; throw new Error("response lost"); }, { retryable: false });
    await assert.rejects(write, /response lost/);
    queue.retry();
    assert.equal(created, 1);
    assert.equal(queue.getSnapshot().pending, 0);
});
