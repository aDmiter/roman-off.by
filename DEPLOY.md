# Деплой на Beget (Passenger + Next.js)

Домен: **roman-off.by**, пользователь `admite`.
Приложение: `~/roman-off.by/roman-off-by`. Next.js (SSR) + MySQL/MariaDB.
Node запускается через **Phusion Passenger** (не через «панель Node.js»).

---

## Как это устроено (фактическая схема)

- `~/roman-off.by/public_html` — **симлинк** на `roman-off-by/public`.
- `~/roman-off.by/roman-off-by/public/.htaccess` — директивы Passenger.
- Стартовый файл приложения — `server.js` (в корне приложения).
- Перезапуск приложения — `touch ~/roman-off.by/roman-off-by/tmp/restart.txt`.

### `public/.htaccess`

```apache
PassengerNodejs /home/a/admite/.local/bin/node
PassengerAppRoot /home/a/admite/roman-off.by/roman-off-by
PassengerAppType node
PassengerStartupFile server.js
PassengerFriendlyErrorPages on
PassengerAppEnv production
PassengerPython none
```

---

## Первичная установка

```bash
cd ~/roman-off.by/roman-off-by
git init
git remote add origin https://github.com/aDmiter/roman-off.by.git
git fetch origin
git checkout -b main origin/main
```

Создать `.env` (реальные данные БД Beget):

```env
DATABASE_URL="mysql://admite_romanoff:ПАРОЛЬ@localhost:3306/admite_romanoff"
ADMIN_EMAIL="Centrfightbrest@gmail.com"
ADMIN_PASSWORD="ваш-пароль"
NEXT_PUBLIC_SITE_URL="https://roman-off.by"
NODE_ENV=production
```

Установка и БД:

```bash
export NODE_OPTIONS=--max-old-space-size=1024
npm ci
npx prisma generate
npx prisma db push
```

Сборка (важно: ограничиваем воркеры — у Beget лимит на потоки):

```bash
export TOKIO_WORKER_THREADS=1
export UV_THREADPOOL_SIZE=1
export NODE_OPTIONS=--max-old-space-size=1024
npm run build
```

`next.config.mjs` уже содержит `experimental: { cpus: 1, workerThreads: false }` — без этого сборка падает на «Collecting page data» с `OS can't spawn worker thread`.

### Привязка домена (Passenger)

```bash
cd ~/roman-off.by
rm -rf public_html
ln -s roman-off-by/public public_html

cat > roman-off-by/public/.htaccess <<'EOF'
PassengerNodejs /home/a/admite/.local/bin/node
PassengerAppRoot /home/a/admite/roman-off.by/roman-off-by
PassengerAppType node
PassengerStartupFile server.js
PassengerFriendlyErrorPages on
PassengerAppEnv production
PassengerPython none
EOF

mkdir -p roman-off-by/tmp
touch roman-off-by/tmp/restart.txt
```

Проверка:

```bash
curl -I http://roman-off.by
# ожидаемо: X-Powered-By: Next.js, Phusion Passenger ...
```

Затем включить **Let's Encrypt** (SSL) для домена в панели и проверить `https://roman-off.by`.

Первичные данные (опционально): `npx tsx prisma/seed.ts`.

---

## Обновление после изменений

```bash
cd ~/roman-off.by/roman-off-by
git pull
npm ci
npx prisma generate
npx prisma db push      # только если менялась prisma/schema.prisma
export TOKIO_WORKER_THREADS=1 UV_THREADPOOL_SIZE=1 NODE_OPTIONS=--max-old-space-size=1024
npm run build
touch tmp/restart.txt   # перезапуск Passenger
```

---

## Заметки

- **Загрузки пользователей** (`public/uploads/*`) создаются во время работы и не приходят из git — папку не удалять. Отдаются через API-роут `/api/files/[name]` (и как статика через public_html-симлинк).
- **Брендовые ассеты** (`logo.png`, `favicon.ico`, `hero_bg.jpg`, `photo.JPG`) — в репозитории.
- **Prisma-движок** генерируется под Linux на сервере (`npx prisma generate`); локальный (Windows) не подходит.
- **`public/.htaccess`** — деплой-специфичный, в git не коммитится.
