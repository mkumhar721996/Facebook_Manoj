const { createApp } = require('./app');

const port = process.env.ARC_WEB_PORT || 3000;

createApp().listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
