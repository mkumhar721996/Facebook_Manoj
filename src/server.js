const { createApp } = require('./app');

const port = process.env.ARC_DEV_PORT || 8004;

createApp().listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
