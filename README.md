# ROMANOFF FIGHT CLUB

Сайт и админ-панель бойцовского клуба ROMANOFF FIGHT CLUB (г. Брест).
Домен: https://roman-off.by

Одностраничный лендинг + админка с расписанием, календарём записей, клиентской базой (CRM), абонементами со штрихкодом и их сканированием.

## Стек

- Next.js 14 (App Router) + TypeScript
- Prisma ORM + MariaDB/MySQL
- Tailwind CSS, SWR, React Hook Form + Zod
- FullCalendar (календарь), ZXing (сканер штрихкодов), bwip-js (генерация штрихкодов)

## Быстрый старт

1. Установить зависимости:

```bash
npm install
```

2. Создать `.env` (по образцу `.env.example`):

```
DATABASE_URL="mysql://root@127.0.0.1:3306/romanoff_fight_club"
ADMIN_EMAIL="Centrfightbrest@gmail.com"
ADMIN_PASSWORD="ваш-пароль"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

3. Применить схему БД и засеять данные:

```bash
npm run db:push
npm run db:seed
```

4. Запустить:

```bash
npm run dev
```

- Лендинг: http://localhost:3000
- Админка: http://localhost:3000/login

## Скрипты

| Команда | Назначение |
| --- | --- |
| `npm run dev` | Dev-сервер |
| `npm run build` | `prisma generate && next build` |
| `npm run typecheck` | Проверка типов (`tsc --noEmit`) |
| `npm run db:push` | Применить схему Prisma к БД |
| `npm run db:seed` | Заполнить БД стартовыми данными |
| `npm run db:studio` | Prisma Studio |

## Структура

См. `AGENTS.md` — там карта кода, модель данных, ключевые решения и особенности окружения.

## Разработка

Перед сдачей задачи с правками кода: `npm run build` (или `npm run typecheck`).
Секреты хранятся только в `.env` (в git не коммитятся); шаблон — `.env.example`.
