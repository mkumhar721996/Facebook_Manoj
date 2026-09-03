function toDateOnly(d) {
  return d.toISOString().slice(0, 10);
}

function addDays(d, n) {
  const result = new Date(d.getTime());
  result.setUTCDate(result.getUTCDate() + n);
  return result;
}

module.exports = { toDateOnly, addDays };
