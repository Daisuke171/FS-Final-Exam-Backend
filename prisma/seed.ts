import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateLevelInput } from '@modules/games/web-sockets/rock-paper-scissors/utils/getNextLevel';

// ========================================================================================
// ========================================================================================
// Esta seed crea 30 levels, 10 usuarios, 2 juegos y 8 skins. Úsenla para testear la app ;).

// COMANDO: Pnpm seed
// ========================================================================================
// ========================================================================================

interface CreateGameInput {
  name: string;
  description: string;
  rules: string;
  gameLogo: string;
  category: string;
  score: number;
  duration: string;
  maxPlayers: number;
  minPlayers: number;
}

interface CreateSkinInput {
  name: string;
  img: string;
  level: number;
  value: number;
}

interface RegisterInput {
  email: string;
  username: string;
  nickname: string;
  password: string;
  name: string;
  lastname: string;
  birthday: string;
}

const userData: RegisterInput[] = [
  {
    email: 'elon.musk@x.com',
    username: 'IronMan1',
    nickname: 'IronMan',
    password: 'password123',
    name: 'Elon',
    lastname: 'Musk',
    birthday: '1971-06-28',
  },
  {
    email: 'zuckerberg@meta.com',
    username: 'MarkZuck',
    nickname: 'MetaBoss',
    password: 'securepass',
    name: 'Mark',
    lastname: 'Zuckerberg',
    birthday: '1984-05-14',
  },
  {
    email: 'jeff@amazon.com',
    username: 'BezosPrime',
    nickname: 'PrimeOne',
    password: 'password456',
    name: 'Jeff',
    lastname: 'Bezos',
    birthday: '1964-01-12',
  },
  {
    email: 'sundar@google.com',
    username: 'GoogleCEO',
    nickname: 'SundarP',
    password: 'password789',
    name: 'Sundar',
    lastname: 'Pichai',
    birthday: '1972-07-10',
  },
  {
    email: 'satya@microsoft.com',
    username: 'SatyaMS',
    nickname: 'MSBoss',
    password: 'MSFtw!',
    name: 'Satya',
    lastname: 'Nadella',
    birthday: '1967-08-19',
  },
  {
    email: 'jen@nvidia.com',
    username: 'JenHsuang',
    nickname: 'NVidia',
    password: 'GPUpower',
    name: 'Jensen',
    lastname: 'Huang',
    birthday: '1963-02-17',
  },
  {
    email: 'tim@apple.com',
    username: 'TimApple',
    nickname: 'Cooked',
    password: 'iPassword',
    name: 'Tim',
    lastname: 'Cook',
    birthday: '1960-11-01',
  },
  {
    email: 'satoshi@anon.com',
    username: 'Nakamoto',
    nickname: 'Bitcoin01',
    password: 'hashhashhash',
    name: 'Satoshi',
    lastname: 'Nakamoto',
    birthday: '1975-04-05',
  },
  {
    email: 'bill@gates.com',
    username: 'WinGates',
    nickname: 'MicroSoft',
    password: 'oldpass',
    name: 'Bill',
    lastname: 'Gates',
    birthday: '1955-10-28',
  },
  {
    email: 'ladyada@invent.com',
    username: 'AdaLovelace',
    nickname: 'Lovelace',
    password: 'algopass',
    name: 'Ada',
    lastname: 'Lovelace',
    birthday: '1815-12-10',
  },
];

const gameData: CreateGameInput[] = [
  {
    name: 'Piedra, Papel o Tijeras',
    description:
      'El clásico juego de manos donde se elige una de tres formas: piedra, papel o tijeras. ¡Conquista al rival con estrategia y suerte!',
    rules:
      'La piedra rompe las tijeras (Piedra gana). El papel cubre la piedra (Papel gana). Las tijeras cortan el papel (Tijeras ganan). Si ambos eligen la misma forma, es empate.',
    gameLogo: 'public/games/rock-paper-scissors-logo.svg',
    category: 'Clásico / Duelo',
    score: 50,
    duration: '2 min',
    maxPlayers: 2,
    minPlayers: 2,
  },
  {
    name: 'Code War',
    description:
      'Una batalla de ingenio y velocidad de codificación. Los jugadores compiten por resolver un desafío de programación en el menor tiempo posible.',
    rules:
      'Los jugadores reciben el mismo problema de programación. El primero en enviar una solución que pase todas las pruebas (tests) gana la ronda. El juego puede ser al mejor de 3 o 5 rondas.',
    gameLogo: 'public/games/code-war-logo.svg',
    category: 'Estrategia / Programación',
    score: 100,
    duration: '5-10 min',
    maxPlayers: 2,
    minPlayers: 2,
  },
];

const skins: CreateSkinInput[] = [
  {
    name: 'Star Wars 2',
    img: '/avatars/star-wars-2.webp',
    level: 1, // Nivel 1 (no requiere desbloqueo)
    value: 100.0,
  },
  {
    name: 'Star Wars Clásico',
    img: '/avatars/star-wars.webp',
    level: 1, // Nivel 1 (no requiere desbloqueo)
    value: 90.0,
  },
  {
    name: 'Robot',
    img: '/avatars/robot.webp',
    level: 1, // Nivel 1 (no requiere desbloqueo)
    value: 80.0,
  },
  {
    name: 'Chica con Gato',
    img: '/avatars/girl-with-cat.webp',
    level: 1, // Nivel 1 (no requiere desbloqueo)
    value: 120.0,
  },
  {
    name: 'Gato Negro 2',
    img: '/avatars/black-cat-2.webp',
    level: 1, // Nivel 1 (no requiere desbloqueo)
    value: 70.0,
  },
  {
    name: 'Gato Negro',
    img: '/avatars/black-cat.webp',
    level: 1, // Nivel 1 (no requiere desbloqueo)
    value: 65.0,
  },
  {
    name: 'Gon (Hunter x Hunter)',
    img: '/avatars/gon.webp',
    level: 10, // Se desbloquea en nivel 10
    value: 150.0,
  },
  {
    name: 'Killua (Hunter x Hunter)',
    img: '/avatars/killua.webp',
    level: 15, // Se desbloquea en nivel 15
    value: 180.0,
  },
];

const levels: CreateLevelInput[] = [
  {
    atomicNumber: 1,
    name: 'Hidrógeno',
    chemicalSymbol: 'H',
    color: '#F0F0F0',
    experienceRequired: 0,
  },
  {
    atomicNumber: 2,
    name: 'Helio',
    chemicalSymbol: 'He',
    color: '#D9FFFF',
    experienceRequired: 50,
  },
  {
    atomicNumber: 3,
    name: 'Litio',
    chemicalSymbol: 'Li',
    color: '#CC80FF',
    experienceRequired: 150,
  },
  {
    atomicNumber: 4,
    name: 'Berilio',
    chemicalSymbol: 'Be',
    color: '#C2FF00',
    experienceRequired: 300,
  },
  {
    atomicNumber: 5,
    name: 'Boro',
    chemicalSymbol: 'B',
    color: '#FFB5B5',
    experienceRequired: 500,
  },
  {
    atomicNumber: 6,
    name: 'Carbono',
    chemicalSymbol: 'C',
    color: '#909090',
    experienceRequired: 750,
  },
  {
    atomicNumber: 7,
    name: 'Nitrógeno',
    chemicalSymbol: 'N',
    color: '#3050F8',
    experienceRequired: 1050,
  },
  {
    atomicNumber: 8,
    name: 'Oxígeno',
    chemicalSymbol: 'O',
    color: '#FF0D0D',
    experienceRequired: 1400,
  },
  {
    atomicNumber: 9,
    name: 'Flúor',
    chemicalSymbol: 'F',
    color: '#90E050',
    experienceRequired: 1800,
  },
  {
    atomicNumber: 10,
    name: 'Neón',
    chemicalSymbol: 'Ne',
    color: '#B3E3F5',
    experienceRequired: 2250,
  },
  {
    atomicNumber: 11,
    name: 'Sodio',
    chemicalSymbol: 'Na',
    color: '#AB5BFF',
    experienceRequired: 2750,
  },
  {
    atomicNumber: 12,
    name: 'Magnesio',
    chemicalSymbol: 'Mg',
    color: '#8AFF00',
    experienceRequired: 3300,
  },
  {
    atomicNumber: 13,
    name: 'Aluminio',
    chemicalSymbol: 'Al',
    color: '#BFA6A6',
    experienceRequired: 3900,
  },
  {
    atomicNumber: 14,
    name: 'Silicio',
    chemicalSymbol: 'Si',
    color: '#F0C8A0',
    experienceRequired: 4550,
  },
  {
    atomicNumber: 15,
    name: 'Fósforo',
    chemicalSymbol: 'P',
    color: '#FF8000',
    experienceRequired: 5250,
  },
  {
    atomicNumber: 16,
    name: 'Azufre',
    chemicalSymbol: 'S',
    color: '#FFFF30',
    experienceRequired: 6000,
  },
  {
    atomicNumber: 17,
    name: 'Cloro',
    chemicalSymbol: 'Cl',
    color: '#1FF01F',
    experienceRequired: 6800,
  },
  {
    atomicNumber: 18,
    name: 'Argón',
    chemicalSymbol: 'Ar',
    color: '#80D1E3',
    experienceRequired: 7650,
  },
  {
    atomicNumber: 19,
    name: 'Potasio',
    chemicalSymbol: 'K',
    color: '#8F40D4',
    experienceRequired: 8550,
  },
  {
    atomicNumber: 20,
    name: 'Calcio',
    chemicalSymbol: 'Ca',
    color: '#3DFF00',
    experienceRequired: 9500,
  },
  {
    atomicNumber: 21,
    name: 'Escandio',
    chemicalSymbol: 'Sc',
    color: '#E6E6E6',
    experienceRequired: 10500,
  },
  {
    atomicNumber: 22,
    name: 'Titanio',
    chemicalSymbol: 'Ti',
    color: '#BFC2C7',
    experienceRequired: 11550,
  },
  {
    atomicNumber: 23,
    name: 'Vanadio',
    chemicalSymbol: 'V',
    color: '#A6A6AB',
    experienceRequired: 12650,
  },
  {
    atomicNumber: 24,
    name: 'Cromo',
    chemicalSymbol: 'Cr',
    color: '#8A99C7',
    experienceRequired: 13800,
  },
  {
    atomicNumber: 25,
    name: 'Manganeso',
    chemicalSymbol: 'Mn',
    color: '#9C7AC7',
    experienceRequired: 15000,
  },
  {
    atomicNumber: 26,
    name: 'Hierro',
    chemicalSymbol: 'Fe',
    color: '#E06633',
    experienceRequired: 16250,
  },
  {
    atomicNumber: 27,
    name: 'Cobalto',
    chemicalSymbol: 'Co',
    color: '#F090A0',
    experienceRequired: 17550,
  },
  {
    atomicNumber: 28,
    name: 'Níquel',
    chemicalSymbol: 'Ni',
    color: '#50D050',
    experienceRequired: 18900,
  },
  {
    atomicNumber: 29,
    name: 'Cobre',
    chemicalSymbol: 'Cu',
    color: '#C88033',
    experienceRequired: 20300,
  },
  {
    atomicNumber: 30,
    name: 'Zinc',
    chemicalSymbol: 'Zn',
    color: '#7D80B0',
    experienceRequired: 21750,
  },
];

const prisma = new PrismaClient();

async function main() {
  console.log(`Iniciando el seeding...`);

  for (const level of levels) {
    const createdLevel = await prisma.level.upsert({
      where: { atomicNumber: level.atomicNumber },
      update: {},
      create: level,
    });
    console.log(
      `Creado o actualizado nivel con Z=${createdLevel.atomicNumber} (${createdLevel.name})`,
    );
  }

  console.log(`Seeding terminado.`);

  console.log(`\nIniciando el seeding de Skins...`);
  for (const skin of skins) {
    const createdSkin = await prisma.skin.upsert({
      where: { name: skin.name },
      update: {},
      create: skin,
    });
    console.log(`Creada o actualizada Skin: ${createdSkin.name}`);
  }
  console.log(`Seeding de Skins terminado.`);

  console.log(`\nIniciando el seeding de Juegos...`);
  for (const game of gameData) {
    const createdGame = await prisma.game.upsert({
      where: { name: game.name },
      update: {},
      create: game,
    });
    console.log(`Creado o actualizado Juego: ${createdGame.name}`);
  }
  console.log(`Seeding de Juegos terminado.`);

  console.log(`\nIniciando el seeding de Usuarios...`);

  for (const user of userData) {
    const hashedPassword = await bcrypt.hash(user.password, 10);

    const userDataToCreate = {
      email: user.email,
      username: user.username,
      nickname: user.nickname,
      password: hashedPassword,
      name: user.name,
      lastname: user.lastname,
      birthday: new Date(user.birthday),
      level: { connect: { atomicNumber: 1 } },
    };

    const createdUser = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: userDataToCreate,
    });
    console.log(`Creado o actualizado Usuario: ${createdUser.username}`);
  }
  console.log(`Seeding de Usuarios terminado.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect().catch((err) => {
      console.error('Error disconnecting Prisma Client:', err);
    });
  });
