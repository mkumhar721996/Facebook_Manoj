function isValidCalendarDate(value) {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function validate(task) {
  const errors = [];

  if (typeof task.title !== 'string' || task.title.trim() === '') {
    errors.push({ field: 'title', message: 'Title is required.' });
  }

  if (task.tags !== undefined && task.tags !== null) {
    if (!Array.isArray(task.tags)) {
      errors.push({ field: 'tags', message: 'Tags must be an array.' });
    } else if (task.tags.length > 5) {
      errors.push({ field: 'tags', message: 'A task cannot have more than 5 tags.' });
    }
  }

  if (
    task.dueDate !== undefined &&
    task.dueDate !== null &&
    task.dueDate !== '' &&
    !isValidCalendarDate(task.dueDate)
  ) {
    errors.push({ field: 'dueDate', message: 'Due date must be a valid calendar date (YYYY-MM-DD).' });
  }

  return errors;
}

module.exports = { validate, isValidCalendarDate };
