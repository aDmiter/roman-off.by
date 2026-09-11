# AGENTS.md — ROMANOFF FIGHT CLUB

Правила и контекст проекта для агента и разработчика. Читать в начале каждой задачи.

- **Проект:** бойцовский клуб ROMANOFF FIGHT CLUB, г. Брест.
- **Домен:** https://roman-off.by
- **Репозиторий:** https://github.com/aDmiter/roman-off.by.git

---

## Стек

- **Next.js 14.2.5 (App Router) + TypeScript**, React 18.
- **Prisma ORM 5.x** + **MariaDB** (локально XAMPP). Подключение через `DATABASE_URL` (`mysql://...`). Драйвер-адаптер `@prisma/adapter-mariadb` НЕ используется (доступен только с Prisma 6; оставлено стандартное подключение по `mysql://`).
- **База:** `romanoff_fight_club` (MariaDB 10.4, XAMPP).
- **UI:** Tailwind CSS 3 (utility-классы). BEM-блоки лежат в `src/styles/blocks/*.css`, но **сейчас не подключены** (не импортируются в `layout.tsx`) — при необходимости BEM вернуть осознанно.
- **Данные/формы:** SWR (клиент), React Hook Form + Zod.
- **Календарь:** FullCalendar 6 (`@fullcalendar/core|react|daygrid|timegrid|list|interaction`).
- **Сканер штрихкодов:** `@zxing/browser` (камера).
- **Штрихкоды:** `bwip-js` (Code128 → PNG data URL на сервере).

### Карта кода

```
src/app/                 — App Router: страницы и API-роуты
  page.tsx               — лендинг (одностраничник)
  login/                 — вход в админку
  admin/                 — админка (layout с guard + сайдбар)
    page.tsx             — Обзор
    coaches/             — Тренеры
    clients/             — Клиенты (CRM: профиль, визиты, абонементы, статистика)
    calendar/            — Календарь (FullCalendar)
    schedule/            — Расписание (недельные шаблоны для лендинга)
    slots/               — Слоты (страница есть; пункт меню убран)
    bookings/            — Заявки
    memberships/         — Абонементы (генерация + штрихкод)
    scan/                — Сканирование абонемента
    settings/            — Настройки (Занятия, Время работы)
    users/               — Пользователи и права (RBAC)
  api/                   — REST: auth, admin (me/users), coaches, clients, sessions, trainings, bookings, memberships, lesson-types, working-hours, upload, files
src/components/landing/  — секции лендинга (Header, Hero, Trainer, Directions, Schedule, Advantages, Pricing, Project, Contacts, Footer)
src/components/admin/    — Sidebar
src/lib/                 — prisma.ts, auth.ts, api.ts, constants.ts, utils.ts, barcode.ts, permissions.ts
src/middleware.ts        — прокидывает x-pathname для guard'а /admin/*
src/styles/blocks/       — BEM-блоки (не подключены)
src/generated/prisma/    — Prisma Client (генерируется, в .gitignore)
server.js                — стартовый сервер для хостинга (Beget)
prisma/schema.prisma     — схема БД
prisma/seed.ts           — сид
public/uploads/          — медиа: брендовые (logo/favicon/hero/photo — в git) + загрузки (в .gitignore)
DEPLOY.md                — инструкция по деплою на Beget
```

---

## Команды

```bash
npm install
npm run dev            # dev-сервер (http://localhost:3000)
npm run build          # prisma generate && next build
npm run typecheck      # tsc --noEmit
npm run db:push        # prisma db push (после правок schema.prisma)
npm run db:seed        # tsx prisma/seed.ts
npm run db:studio      # prisma studio
```

Перед завершением задачи с правками кода — запускать **`npm run build`** (или хотя бы `npm run typecheck`).

---

## Данные (модели Prisma)

`AdminUser`, `AdminSession`, `AdminUserPermission`, `Coach`, `Client`, `Visit`, `Training`, `Session`, `Booking`, `Membership`, `MembershipUsage`, `LessonType`, `WorkingHours`.

- **AdminUser:** вход по `email` + `password` (хэш scrypt, `salt:hash`), роль `SUPERADMIN|STAFF`, флаг `active`. Суперадмин: `Centrfightbrest@gmail.com` (пароль — в `.env` `ADMIN_PASSWORD`).
- **Права (RBAC):** разделы админки — единицы прав (`ADMIN_SECTIONS` в `constants.ts`). У `SUPERADMIN` доступ ко всем; у `STAFF` — выданные через `AdminUserPermission` (по строке на право). Управление — раздел «Пользователи» (только суперадмин/кто имеет право `users`).
- **Client ↔ Coach:** `favoriteCoachId`. **Client ↔ Visit** (история посещений), **Client ↔ Membership** (история абонементов).
- **Session:** слот на дату, `coachId`/`coachName`, `startTime`/`endTime`, `busy`, `bookedCount`.
- **Membership:** `code` формата **`RFC-` + 10 цифр**, `totalSessions`/`usedSessions`, `status`, `clientId`.
- **LessonType:** `name` + `durationMinutes` (Настройки → Занятия).
- **WorkingHours:** `dayOfWeek` (1=Пн..7=Вс, уникально) + `openTime`/`closeTime`.

## Ключевые решения/правила

- **Вход в админку** — только email+пароль. Сессия: таблица `AdminSession`, cookie `rfc_session` (httpOnly; `secure` только при https). Неактивные (`active=false`) не входят, их сессии сбрасываются.
- **RBAC:** проверка прав — на сервере (`requirePermission`/`requireAnyPermission`/`requireAuth` в `src/lib/permissions.ts`), а не только в UI. Меню фильтруется, маршруты `/admin/*` защищены через `middleware.ts` (заголовок `x-pathname`) + guard в `admin/layout.tsx` (редирект на первый доступный раздел).
- **Абонемент:** код `RFC-XXXXXXXXXX`; штрихкод Code128 генерируется на сервере (`bwip-js.toBuffer` — async, обязательно `await`). Сканирование — по коду, затем списание занятия (при привязке к клиенту создаётся `Visit`).
- **Загрузка файлов:** API `/api/upload` пишет в `public/uploads`, возвращает `/api/files/<name>`; раздача — через API-роут `/api/files/[name]` (т.к. `next start` не отдаёт файлы, добавленные в `public` после сборки).
- **Календарь:** рабочая сетка **08:00–22:00**; создание записи по шагам: тренер → занятие (из Настроек) → дата → доступные слоты (шаг 30 мин в рамках `WorkingHours` дня, свободные от пересечений) → конец = начало + `durationMinutes`.
- **Время работы** (Настройки) — 7 фиксированных дней 08:00–22:00, редактируется; в дальнейшем влияет на генерацию слотов.
- **Шрифты** — Google Fonts (Oswald/Roboto) через `<link>` в `layout.tsx`.
- **favicon/лого** — `public/uploads/favicon.ico`, `logo.png`.

---

## Особенности окружения (важно!)

1. **Сборка в песочнице Kilo на диске `D:`** падает с `EPERM: scandir 'C:\Users\...\Application Data'`. Это ограничение песочницы (webpack/glob обходит профиль пользователя), **не ошибка кода**: тот же код собирается в другом месте, а `npm run dev` на `D:` работает. В обычном терминале сборка проходит.
2. **Dev-сервер держит Prisma-движок** (`query_engine-windows.dll.node`) → `prisma generate`/`db push` падают с `EPERM ... rename`. **Остановить dev (и убить зависшие `node`) перед миграцией.**
3. **Порт 3000 может занимать старый dev** → новый молча уедет на 3001. Перед запуском убить старые `node` на 3000.
4. Медиа пользователей (`public/uploads/*`) не коммитятся; брендовые ассеты (`logo.png`, `favicon.ico`, `hero_bg.jpg`, `photo.JPG`) — коммитятся (исключения в `.gitignore`).

---

## Правила качества

1. `npm run build` (или `typecheck`) перед завершением задач с кодом.
2. Не ломать существующее поведение; при падении — чинить код, а не тесты.
3. Без лишнего мусора (дебаг, комментарии-вода).
4. **Не коммитить секреты** (`.env` в `.gitignore`; шаблон — `.env.example` с плейсхолдерами). Проверять `git status` перед коммитом.
5. Коммиты/пуш — только по явной просьбе.

---

## Деплой (Beget, Node.js)

- Хостинг: **beget.com**, домен `roman-off.by`. Приложение — в `~/roman-off.by/roman-off-by` (рядом с `public_html`, который для Node не используется).
- Стартовый файл для панели Node.js — `server.js` (кастомный сервер Next; хостинг передаёт `PORT`). Альтернатива — команда `npm run serve`.
- Сборка — на сервере (Prisma-движок под Linux; `.next`/`node_modules` не заливать).
- Полная пошаговая инструкция — в **`DEPLOY.md`**.

Кратко (обновление):

```bash
cd ~/roman-off.by/roman-off-by
git pull && npm ci && npx prisma generate
npx prisma db push    # только если менялась prisma/schema.prisma
npm run build
# затем перезапустить Node-приложение в панели Beget
```

> При переходе на Prisma-миграции: `npx prisma migrate deploy`.

---

## Форматирование ответов агента (CRITICAL)

1. Не использовать нативные reasoning-теги в финальном тексте.
2. Внутренние размышления — молча; вызовы инструментов и код — только чистый XML/JSON.
3. Объяснения — после завершения вызовов инструментов.

---

## Чек-лист перед сдачей

- [ ] Правки касаются кода → `npm run build`/`typecheck` прошёл.
- [ ] Нет лишнего мусора в коде.
- [ ] Секреты не попали в git.
- [ ] Актуализированы `AGENTS.md`/`CHANGELOG.md` при значимых изменениях.
- [ ] Выдан список изменённых файлов + команда деплоя.
