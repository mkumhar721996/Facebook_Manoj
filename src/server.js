const http = require('http');
const app = require('./app');

const port = process.env.ARC_DEV_PORT || 8003;
http.createServer(app).listen(port);
