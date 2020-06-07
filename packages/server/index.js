const http = require('http');
const app = require('./app');
const config = require('./config');

const port = normalizePort(config.PORT || '3000');
app.set('port', port);

const server = http.createServer(app);

server.listen(port);

function normalizePort(val) {
  const parsedPort = parseInt(val, 10);

  if (isNaN(parsedPort)) {
    // named pipe
    return val;
  }

  if (parsedPort >= 0) {
    // port number
    return parsedPort;
  }

  return false;
}

server.on('error', function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  /* eslint-disable no-fallthrough */
  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
    default:
      throw error;
  }
  /* eslint-enable no-fallthrough */
});

server.on('listening', function onListening() {
  const addr = server.address();
  const bind =
    typeof addr === 'string' ? 'pipe ' + addr : 'http://localhost:' + addr.port;
  console.log('Listening on ' + bind);
});
