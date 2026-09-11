// Стартовый файл для production-запуска Next.js на хостинге (Beget и подобных).
// В панели Node.js укажите этот файл как стартовый; хостинг сам передаст PORT.
const http = require('http');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';

const app = next({ dev: false });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    http
      .createServer((req, res) => handle(req, res))
      .listen(port, hostname, () => {
        console.log(`ROMANOFF FIGHT CLUB ready on http://${hostname}:${port}`);
      });
  })
  .catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
  });
