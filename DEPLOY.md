# Деплой на Beget (Node.js)

Домен: **roman-off.by**. Приложение Next.js (SSR) + MariaDB/MySQL.
На сервере приложение лежит в `~/roman-off.by/roman-off-by` (рядом с `public_html`).

> Важно: `public_html` для Node-приложения не используется — запросы к домену проксируются в Node-процесс. Папку можно оставить как есть.

---

## 0. Подготовка в панели Beget

1. **SSH** — включить доступ (понадобится для команд `npm`/`prisma`).
2. **MySQL** — создать базу и пользователя, запомнить: имя БД, логин, пароль, хост (обычно `localhost`).
3. **Node.js** — в настройках сайта `roman-off.by` включить Node.js и выбрать версию **20** (минимум 18.17).

---

## 1. Загрузить код на сервер

Вариант с Git (репозиторий `https://github.com/aDmiter/roman-off.by.git`):

```bash
cd ~/roman-off.by/roman-off-by
git init
git remote add origin https://github.com/aDmiter/roman-off.by.git
git fetch origin
git checkout -b main origin/main
```

Если папка не пустая — очистить её перед этим (`ls -la`, удалить лишнее).

Альтернатива без Git: загрузить zip через файловый менеджер и распаковать в `roman-off-by`.

`node_modules` и `.next` на сервер **не заливать** — соберём на месте.

---

## 2. Создать `.env`

```bash
nano .env
```

```env
DATABASE_URL="mysql://ЛОГИН:ПАРОЛЬ@localhost:3306/ИМЯ_БД"
ADMIN_EMAIL="Centrfightbrest@gmail.com"
ADMIN_PASSWORD="ваш-пароль"
NEXT_PUBLIC_SITE_URL="https://roman-off.by"
NODE_ENV=production
```

`DATABASE_URL` — реальные данные БД из панели Beget (пароль со спецсимволами — URL-кодировать).

---

## 3. Установить зависимости

```bash
# при нехватке памяти ограничим heap
export NODE_OPTIONS=--max-old-space-size=1024
npm ci
```

Если `npm`/`node` не в PATH — используйте путь, который выдаёт панель Node.js (или `nvm`).

---

## 4. Prisma: движок (Linux) + схема

```bash
npx prisma generate
npx prisma db push
```

`prisma generate` обязательно выполнять **на сервере** (нужен linux-движок; с Windows заливать нельзя).

---

## 5. Сборка

```bash
npm run build
```

Это `prisma generate && next build`. Сборка Next может требовать до ~1 ГБ RAM.

---

## 6. Запуск через панель Node.js

В панели Beget для сайта `roman-off.by` укажите:

- **Каталог приложения:** `roman-off.by/roman-off-by`
- **Стартовый файл:** `server.js`
- **Версия Node:** 20
- **Переменные окружения:** `NODE_ENV=production` (остальное читается из `.env`)

Если панель просит не файл, а команду запуска — используйте `npm run serve`
(или `npm start`, если запускаете стандартным `next start`).

После включения дождитесь статуса «работает».

---

## 7. Домен и SSL

1. Убедитесь, что домен `roman-off.by` привязан к сайту с Node.js.
2. Включите **Let's Encrypt** (HTTPS) в панели.
3. Проверьте `https://roman-off.by` и вход в админку `https://roman-off.by/login`.

---

## 8. Первичные данные (один раз)

```bash
npx tsx prisma/seed.ts
```

Создаст суперадмина (если нет), демо-данные. Можно пропустить — суперадмин создастся автоматически при первом входе по `ADMIN_EMAIL`/`ADMIN_PASSWORD`.

---

## Обновление после изменений

```bash
cd ~/roman-off.by/roman-off-by
git pull
npm ci
npx prisma generate
npx prisma db push      # только если менялась prisma/schema.prisma
npm run build
# перезапустить Node-приложение в панели Beget
```

---

## Заметки

- **Загрузки пользователей** (`public/uploads/*`) создаются во время работы и не приходят из git — не удаляйте папку при деплое.
- **Брендовые ассеты** (`logo.png`, `favicon.ico`, `hero_bg.jpg`, `photo.JPG`) уже в репозитории.
- **Prisma-движок** генерируется под Linux на сервере; локальный (Windows) не подходит.
- **`public/uploads`** для runtime-загрузок отдаётся через API-роут `/api/files/[name]` — это уже работает и на `next start`.
