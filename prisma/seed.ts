import { PrismaClient } from '../src/generated/prisma';
import { generateMembershipCode } from '../src/lib/utils';
import { hashPassword } from '../src/lib/auth';

const prisma = new PrismaClient();

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'Centrfightbrest@gmail.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Romanoff2026#';

async function main() {
  await prisma.adminUser.deleteMany({ where: { email: '' } });

  const admin = await prisma.adminUser.findUnique({ where: { email: ADMIN_EMAIL } });
  if (!admin) {
    await prisma.adminUser.create({
      data: {
        name: 'Сергей Романов',
        email: ADMIN_EMAIL,
        phone: '+375297251640',
        password: hashPassword(ADMIN_PASSWORD),
        role: 'SUPERADMIN'
      }
    });
    console.log('✔ Создан суперадминистратор: ' + ADMIN_EMAIL);
  }

  const coachCount = await prisma.coach.count();
  if (coachCount === 0) {
    await prisma.coach.createMany({
      data: [
        { name: 'Сергей Романов', specialization: 'Рукопашный бой, ММА, самооборона', color: '#D4AF37' },
        { name: 'Андрей Ковалёв', specialization: 'Каратэ, кикбоксинг', color: '#4F9DA6' },
        { name: 'Дмитрий Волков', specialization: 'Кроссфит, функциональный тренинг', color: '#C06C84' }
      ]
    });
    console.log('✔ Создано 3 тренера');
  }

  const count = await prisma.training.count();
  if (count === 0) {
    const base = { coach: 'Сергей Романов', capacity: 20 };
    const data = [
      { groupName: 'Дети 8-12', title: 'Группа 1', category: 'ДЕТИ', dayOfWeek: 1, startTime: '08:30', endTime: '09:30', ...base },
      { groupName: 'Дети 8-12', title: 'Группа 2', category: 'ДЕТИ', dayOfWeek: 1, startTime: '16:00', endTime: '17:00', ...base },
      { groupName: 'Взрослые', title: '30+', category: 'ВЗРОСЛЫЕ', dayOfWeek: 1, startTime: '19:00', endTime: '20:00', ...base },
      { groupName: 'Взрослые', title: 'Старшая', category: 'ВЗРОСЛЫЕ', dayOfWeek: 1, startTime: '20:00', endTime: '21:20', ...base },
      { groupName: 'Женская', title: 'С нуля', category: 'ЖЕНСКАЯ', dayOfWeek: 1, startTime: '18:00', endTime: '19:00', capacity: 16, coach: 'Сергей Романов' },
      { groupName: 'Дети 8-12', title: 'Группа 1', category: 'ДЕТИ', dayOfWeek: 3, startTime: '08:30', endTime: '09:30', ...base },
      { groupName: 'Взрослые', title: '30+', category: 'ВЗРОСЛЫЕ', dayOfWeek: 3, startTime: '19:00', endTime: '20:00', ...base },
      { groupName: 'Дети 8-12', title: 'Группа 1', category: 'ДЕТИ', dayOfWeek: 5, startTime: '08:30', endTime: '09:30', ...base }
    ];
    await prisma.training.createMany({ data });
    console.log('✔ Создано ' + data.length + ' тренировок в расписании');
  }

  const memCount = await prisma.membership.count();
  if (memCount === 0) {
    await prisma.membership.create({
      data: { code: generateMembershipCode(), holderName: 'Демо Клиент', phone: '+375290000000', totalSessions: 4 }
    });
    console.log('✔ Создан демо-абонемент');
  }

  const clientCount = await prisma.client.count();
  if (clientCount === 0) {
    const firstCoach = await prisma.coach.findFirst({ orderBy: { id: 'asc' } });
    await prisma.client.create({
      data: {
        name: 'Демо Клиент',
        phone: '+375290000000',
        email: 'demo@club.by',
        birthDate: new Date('1995-06-15T00:00:00'),
        favoriteCoachId: firstCoach?.id ?? null
      }
    });
    console.log('✔ Создан демо-клиент');
  }

  const lessonCount = await prisma.lessonType.count();
  if (lessonCount === 0) {
    await prisma.lessonType.createMany({
      data: [
        { name: 'Индивидуальная тренировка', durationMinutes: 60 },
        { name: 'Детская тренировка', durationMinutes: 60 },
        { name: 'Групповая тренировка', durationMinutes: 80 },
        { name: 'Сплит-тренировка', durationMinutes: 60 }
      ]
    });
    console.log('✔ Добавлены типы занятий');
  }

  const whCount = await prisma.workingHours.count();
  if (whCount === 0) {
    await prisma.workingHours.createMany({
      data: Array.from({ length: 7 }, (_, i) => ({
        dayOfWeek: i + 1,
        openTime: '08:00',
        closeTime: '22:00'
      }))
    });
    console.log('✔ Добавлено время работы (7 дней)');
  }

  console.log('Seed завершён.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
