const test = require('node:test');
const assert = require('node:assert/strict');
const { render, toggleTask, deleteTask } = require('../../public/js/taskList');

function fakeJsonResponse(body) {
  return Promise.resolve({ json: () => Promise.resolve(body) });
}

test('toggling an incomplete task marks it complete and the list reflects it (AC1)', async () => {
  const tasks = [{ id: 't1', title: 'Buy milk', completed: false }];
  let calledUrl;
  let calledOptions;
  const fetchImpl = (url, options) => {
    calledUrl = url;
    calledOptions = options;
    return fakeJsonResponse({ id: 't1', completed: true });
  };

  const updatedTasks = await toggleTask(tasks, 't1', { fetchImpl });

  assert.equal(calledUrl, '/api/tasks/t1/toggle');
  assert.equal(calledOptions.method, 'PATCH');
  assert.equal(updatedTasks.find((t) => t.id === 't1').completed, true);
  assert.match(render(updatedTasks), /checked/);
});

test('toggling a complete task reverts it to incomplete and the list reflects it (AC2)', async () => {
  const tasks = [{ id: 't2', title: 'Walk dog', completed: true }];
  const fetchImpl = () => fakeJsonResponse({ id: 't2', completed: false });

  const updatedTasks = await toggleTask(tasks, 't2', { fetchImpl });

  assert.equal(updatedTasks.find((t) => t.id === 't2').completed, false);
  assert.doesNotMatch(render(updatedTasks), /checked/);
});

test('confirming deletion permanently removes the task from the list (AC3)', async () => {
  const tasks = [{ id: 't3', title: 'Pay bills', completed: false }];
  let confirmMessage;
  let deleteCalledUrl;
  let deleteCalledOptions;
  const confirmImpl = (message) => {
    confirmMessage = message;
    return true;
  };
  const fetchImpl = (url, options) => {
    deleteCalledUrl = url;
    deleteCalledOptions = options;
    return Promise.resolve({});
  };

  const remainingTasks = await deleteTask(tasks, 't3', { fetchImpl, confirmImpl });

  assert.ok(confirmMessage.length > 0);
  assert.equal(deleteCalledUrl, '/api/tasks/t3');
  assert.equal(deleteCalledOptions.method, 'DELETE');
  assert.equal(remainingTasks.find((t) => t.id === 't3'), undefined);
  assert.doesNotMatch(render(remainingTasks), /t3/);
});

test('cancelling deletion keeps the task in the list and sends no request (AC4)', async () => {
  const tasks = [{ id: 't4', title: 'Clean garage', completed: false }];
  let fetchCalled = false;
  const confirmImpl = () => false;
  const fetchImpl = () => {
    fetchCalled = true;
    return Promise.resolve({});
  };

  const remainingTasks = await deleteTask(tasks, 't4', { fetchImpl, confirmImpl });

  assert.equal(fetchCalled, false);
  assert.equal(remainingTasks.find((t) => t.id === 't4').id, 't4');
  assert.match(render(remainingTasks), /t4/);
});
