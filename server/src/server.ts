import app from './app';
import { config } from './config';

const server = app.listen(config.port, () => {
  console.log(`Server listening on http://localhost:${config.port}`);
});

process.on('SIGTERM', () => server.close());
process.on('SIGINT', () => server.close());
