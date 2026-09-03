import { mountTaskListPage } from './features/tasks/TaskListPage.ts';

const root = document.getElementById('app');
if (root) mountTaskListPage(root);
