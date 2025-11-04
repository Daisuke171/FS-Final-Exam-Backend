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
  category: string;
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
    gameLogo: '/logos/rps-logo-lp.webp',
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
    gameLogo: '/logos/cw-logo-lp.webp',
    category: 'Estrategia / Programación',
    score: 50,
    duration: '5-10 min',
    maxPlayers: 2,
    minPlayers: 2,
  },
  {
    name: 'Turing Detective',
    description:
      'Sumérgete en un misterio donde la lógica y la deducción son tus mejores armas. Descubre si tu oponente es un robot o un humano.',
    rules: '',
    gameLogo: '/logos/td-logo-lp.jpg',
    category: 'Lógica / Deducción',
    score: 50,
    duration: '5-10 min',
    maxPlayers: 2,
    minPlayers: 2,
  },
];

const skins: CreateSkinInput[] = [
  // Cats
  {
    name: 'Cat Avatar 1',
    img: '/avatars/cats/cat-avatar-1.webp',
    level: 1,
    value: 100.0,
    category: 'Cats',
  },
  {
    name: 'Cat Avatar 2',
    img: '/avatars/cats/cat-avatar-2.webp',
    level: 2,
    value: 120.0,
    category: 'Cats',
  },
  {
    name: 'Cat Avatar 3',
    img: '/avatars/cats/cat-avatar-3.svg',
    level: 3,
    value: 140.0,
    category: 'Cats',
  },
  {
    name: 'Cat Avatar 4',
    img: '/avatars/cats/cat-avatar-4.svg',
    level: 4,
    value: 160.0,
    category: 'Cats',
  },
  {
    name: 'Cat Avatar 5',
    img: '/avatars/cats/cat-avatar-5.svg',
    level: 5,
    value: 180.0,
    category: 'Cats',
  },
  {
    name: 'Cat Avatar 6',
    img: '/avatars/cats/cat-avatar-6.svg',
    level: 6,
    value: 200.0,
    category: 'Cats',
  },
  {
    name: 'Cat Avatar 7',
    img: '/avatars/cats/cat-avatar-7.svg',
    level: 7,
    value: 220.0,
    category: 'Cats',
  },

  // General
  {
    name: 'General Avatar 1',
    img: '/avatars/general/gen-avatar-1.webp',
    level: 1,
    value: 100.0,
    category: 'General',
  },
  {
    name: 'General Avatar 2',
    img: '/avatars/general/gen-avatar-2.svg',
    level: 2,
    value: 120.0,
    category: 'General',
  },
  {
    name: 'General Avatar 3',
    img: '/avatars/general/gen-avatar-3.svg',
    level: 3,
    value: 140.0,
    category: 'General',
  },
  {
    name: 'General Avatar 4',
    img: '/avatars/general/gen-avatar-4.webp',
    level: 4,
    value: 160.0,
    category: 'General',
  },
  {
    name: 'General Avatar 5',
    img: '/avatars/general/gen-avatar-5.svg',
    level: 5,
    value: 180.0,
    category: 'General',
  },
  {
    name: 'General Avatar 6',
    img: '/avatars/general/gen-avatar-6.webp',
    level: 6,
    value: 200.0,
    category: 'General',
  },
  {
    name: 'General Avatar 7',
    img: '/avatars/general/gen-avatar-7.webp',
    level: 7,
    value: 220.0,
    category: 'General',
  },

  // Hunter x Hunter
  {
    name: 'HxH Avatar 1',
    img: '/avatars/hxh/hxh-avatar-1.webp',
    level: 3,
    value: 150.0,
    category: 'Hunter x Hunter',
  },
  {
    name: 'HxH Avatar 2',
    img: '/avatars/hxh/hxh-avatar-2.svg',
    level: 4,
    value: 180.0,
    category: 'Hunter x Hunter',
  },
  {
    name: 'HxH Avatar 3',
    img: '/avatars/hxh/hxh-avatar-3.webp',
    level: 5,
    value: 200.0,
    category: 'Hunter x Hunter',
  },
  // Naruto
  {
    name: 'Naruto Avatar 1',
    img: '/avatars/naruto/naruto-avatar-1.webp',
    level: 2,
    value: 120.0,
    category: 'Naruto',
  },
  {
    name: 'Naruto Avatar 2',
    img: '/avatars/naruto/naruto-avatar-2.webp',
    level: 3,
    value: 140.0,
    category: 'Naruto',
  },
  {
    name: 'Naruto Avatar 3',
    img: '/avatars/naruto/naruto-avatar-3.webp',
    level: 4,
    value: 160.0,
    category: 'Naruto',
  },
  {
    name: 'Naruto Avatar 4',
    img: '/avatars/naruto/naruto-avatar-4.webp',
    level: 5,
    value: 180.0,
    category: 'Naruto',
  },
  {
    name: 'Naruto Avatar 5',
    img: '/avatars/naruto/naruto-avatar-5.webp',
    level: 6,
    value: 200.0,
    category: 'Naruto',
  },

  //  One Piece
  {
    name: 'One Piece Avatar 1',
    img: '/avatars/one-piece/op-avatar-1.webp',
    level: 1,
    value: 100.0,
    category: 'One Piece',
  },
  {
    name: 'One Piece Avatar 2',
    img: '/avatars/one-piece/op-avatar-2.webp',
    level: 2,
    value: 120.0,
    category: 'One Piece',
  },
  {
    name: 'One Piece Avatar 3',
    img: '/avatars/one-piece/op-avatar-3.webp',
    level: 3,
    value: 140.0,
    category: 'One Piece',
  },
  {
    name: 'One Piece Avatar 4',
    img: '/avatars/one-piece/op-avatar-4.webp',
    level: 4,
    value: 160.0,
    category: 'One Piece',
  },
  {
    name: 'One Piece Avatar 5',
    img: '/avatars/one-piece/op-avatar-5.webp',
    level: 6,
    value: 180.0,
    category: 'One Piece',
  },
  {
    name: 'One Piece Avatar 6',
    img: '/avatars/one-piece/op-avatar-6.webp',
    level: 8,
    value: 200.0,
    category: 'One Piece',
  },
  {
    name: 'One Piece Avatar 7',
    img: '/avatars/one-piece/op-avatar-7.webp',
    level: 10,
    value: 220.0,
    category: 'One Piece',
  },

  // Pokémon
  {
    name: 'Pokémon Avatar 1',
    img: '/avatars/pokemon/pokemon-avatar-1.webp',
    level: 1,
    value: 100.0,
    category: 'Pokémon',
  },
  {
    name: 'Pokémon Avatar 2',
    img: '/avatars/pokemon/pokemon-avatar-2.webp',
    level: 2,
    value: 120.0,
    category: 'Pokémon',
  },
  {
    name: 'Pokémon Avatar 3',
    img: '/avatars/pokemon/pokemon-avatar-3.webp',
    level: 5,
    value: 140.0,
    category: 'Pokémon',
  },
  {
    name: 'Pokémon Avatar 4',
    img: '/avatars/pokemon/pokemon-avatar-4.webp',
    level: 10,
    value: 160.0,
    category: 'Pokémon',
  },
  {
    name: 'Pokémon Avatar 5',
    img: '/avatars/pokemon/pokemon-avatar-5.webp',
    level: 15,
    value: 180.0,
    category: 'Pokémon',
  },
  // Spy x Family
  {
    name: 'Spy x Family Avatar 1',
    img: '/avatars/spy-family/spy-avatar-1.webp',
    level: 1,
    value: 180.0,
    category: 'Spy x Family',
  },
  {
    name: 'Spy x Family Avatar 2',
    img: '/avatars/spy-family/spy-avatar-2.webp',
    level: 3,
    value: 180.0,
    category: 'Spy x Family',
  },
  {
    name: 'Spy x Family Avatar 3',
    img: '/avatars/spy-family/spy-avatar-3.webp',
    level: 5,
    value: 180.0,
    category: 'Spy x Family',
  },
];

export const levels: CreateLevelInput[] = [
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
  {
    atomicNumber: 31,
    name: 'Galio',
    chemicalSymbol: 'Ga',
    color: '#C28F8F',
    experienceRequired: 23250,
  },
  {
    atomicNumber: 32,
    name: 'Germanio',
    chemicalSymbol: 'Ge',
    color: '#668F8F',
    experienceRequired: 24800,
  },
  {
    atomicNumber: 33,
    name: 'Arsénico',
    chemicalSymbol: 'As',
    color: '#BD80E3',
    experienceRequired: 26400,
  },
  {
    atomicNumber: 34,
    name: 'Selenio',
    chemicalSymbol: 'Se',
    color: '#FFA100',
    experienceRequired: 28050,
  },
  {
    atomicNumber: 35,
    name: 'Bromo',
    chemicalSymbol: 'Br',
    color: '#A62929',
    experienceRequired: 29750,
  },
  {
    atomicNumber: 36,
    name: 'Kriptón',
    chemicalSymbol: 'Kr',
    color: '#5CB8D1',
    experienceRequired: 31500,
  },
  {
    atomicNumber: 37,
    name: 'Rubidio',
    chemicalSymbol: 'Rb',
    color: '#702EB0',
    experienceRequired: 33300,
  },
  {
    atomicNumber: 38,
    name: 'Estroncio',
    chemicalSymbol: 'Sr',
    color: '#00FF00',
    experienceRequired: 35150,
  },
  {
    atomicNumber: 39,
    name: 'Itrio',
    chemicalSymbol: 'Y',
    color: '#94FFFF',
    experienceRequired: 37050,
  },
  {
    atomicNumber: 40,
    name: 'Circonio',
    chemicalSymbol: 'Zr',
    color: '#94E0E0',
    experienceRequired: 39000,
  },
  {
    atomicNumber: 41,
    name: 'Niobio',
    chemicalSymbol: 'Nb',
    color: '#73C2C9',
    experienceRequired: 41000,
  },
  {
    atomicNumber: 42,
    name: 'Molibdeno',
    chemicalSymbol: 'Mo',
    color: '#54B5B5',
    experienceRequired: 43050,
  },
  {
    atomicNumber: 43,
    name: 'Tecnecio',
    chemicalSymbol: 'Tc',
    color: '#3B9E9E',
    experienceRequired: 45150,
  },
  {
    atomicNumber: 44,
    name: 'Rutenio',
    chemicalSymbol: 'Ru',
    color: '#248F8F',
    experienceRequired: 47300,
  },
  {
    atomicNumber: 45,
    name: 'Rodio',
    chemicalSymbol: 'Rh',
    color: '#0A7D8C',
    experienceRequired: 49500,
  },
  {
    atomicNumber: 46,
    name: 'Paladio',
    chemicalSymbol: 'Pd',
    color: '#006985',
    experienceRequired: 51750,
  },
  {
    atomicNumber: 47,
    name: 'Plata',
    chemicalSymbol: 'Ag',
    color: '#C0C0C0',
    experienceRequired: 54050,
  },
  {
    atomicNumber: 48,
    name: 'Cadmio',
    chemicalSymbol: 'Cd',
    color: '#FFD98F',
    experienceRequired: 56400,
  },
  {
    atomicNumber: 49,
    name: 'Indio',
    chemicalSymbol: 'In',
    color: '#A67573',
    experienceRequired: 58800,
  },
  {
    atomicNumber: 50,
    name: 'Estaño',
    chemicalSymbol: 'Sn',
    color: '#668080',
    experienceRequired: 61250,
  },
  {
    atomicNumber: 51,
    name: 'Antimonio',
    chemicalSymbol: 'Sb',
    color: '#9E63B5',
    experienceRequired: 63750,
  },
  {
    atomicNumber: 52,
    name: 'Telurio',
    chemicalSymbol: 'Te',
    color: '#D47A00',
    experienceRequired: 66300,
  },
  {
    atomicNumber: 53,
    name: 'Yodo',
    chemicalSymbol: 'I',
    color: '#940094',
    experienceRequired: 68900,
  },
  {
    atomicNumber: 54,
    name: 'Xenón',
    chemicalSymbol: 'Xe',
    color: '#429EB0',
    experienceRequired: 71550,
  },
  {
    atomicNumber: 55,
    name: 'Cesio',
    chemicalSymbol: 'Cs',
    color: '#57178F',
    experienceRequired: 74250,
  },
  {
    atomicNumber: 56,
    name: 'Bario',
    chemicalSymbol: 'Ba',
    color: '#00C900',
    experienceRequired: 77000,
  },
  {
    atomicNumber: 57,
    name: 'Lantano',
    chemicalSymbol: 'La',
    color: '#70D4FF',
    experienceRequired: 79800,
  },
  {
    atomicNumber: 58,
    name: 'Cerio',
    chemicalSymbol: 'Ce',
    color: '#FFFFC7',
    experienceRequired: 82650,
  },
  {
    atomicNumber: 59,
    name: 'Praseodimio',
    chemicalSymbol: 'Pr',
    color: '#D9FFC7',
    experienceRequired: 85550,
  },
  {
    atomicNumber: 60,
    name: 'Neodimio',
    chemicalSymbol: 'Nd',
    color: '#C7FFC7',
    experienceRequired: 88500,
  },
  {
    atomicNumber: 61,
    name: 'Prometio',
    chemicalSymbol: 'Pm',
    color: '#A3FFC7',
    experienceRequired: 90550,
  },
  {
    atomicNumber: 62,
    name: 'Samario',
    chemicalSymbol: 'Sm',
    color: '#8FFFC7',
    experienceRequired: 92650,
  },
  {
    atomicNumber: 63,
    name: 'Europio',
    chemicalSymbol: 'Eu',
    color: '#61FFC7',
    experienceRequired: 94800,
  },
  {
    atomicNumber: 64,
    name: 'Gadolinio',
    chemicalSymbol: 'Gd',
    color: '#45FFC7',
    experienceRequired: 97000,
  },
  {
    atomicNumber: 65,
    name: 'Terbio',
    chemicalSymbol: 'Tb',
    color: '#30FFC7',
    experienceRequired: 99250,
  },
  {
    atomicNumber: 66,
    name: 'Disprosio',
    chemicalSymbol: 'Dy',
    color: '#1FFFC7',
    experienceRequired: 101550,
  },
  {
    atomicNumber: 67,
    name: 'Holmio',
    chemicalSymbol: 'Ho',
    color: '#00FF9C',
    experienceRequired: 103900,
  },
  {
    atomicNumber: 68,
    name: 'Erbio',
    chemicalSymbol: 'Er',
    color: '#00E675',
    experienceRequired: 106300,
  },
  {
    atomicNumber: 69,
    name: 'Tulio',
    chemicalSymbol: 'Tm',
    color: '#00C466',
    experienceRequired: 108750,
  },
  {
    atomicNumber: 70,
    name: 'Iterbio',
    chemicalSymbol: 'Yb',
    color: '#00A386',
    experienceRequired: 111250,
  },
  {
    atomicNumber: 71,
    name: 'Lutecio',
    chemicalSymbol: 'Lu',
    color: '#00A0FF',
    experienceRequired: 113800,
  },
  {
    atomicNumber: 72,
    name: 'Hafnio',
    chemicalSymbol: 'Hf',
    color: '#00C2FF',
    experienceRequired: 116400,
  },
  {
    atomicNumber: 73,
    name: 'Tántalo',
    chemicalSymbol: 'Ta',
    color: '#00E5FF',
    experienceRequired: 119050,
  },
  {
    atomicNumber: 74,
    name: 'Wolframio',
    chemicalSymbol: 'W',
    color: '#00FFFF',
    experienceRequired: 121750,
  },
  {
    atomicNumber: 75,
    name: 'Renio',
    chemicalSymbol: 'Re',
    color: '#00E5E5',
    experienceRequired: 124500,
  },
  {
    atomicNumber: 76,
    name: 'Osmio',
    chemicalSymbol: 'Os',
    color: '#00CCCC',
    experienceRequired: 127300,
  },
  {
    atomicNumber: 77,
    name: 'Iridio',
    chemicalSymbol: 'Ir',
    color: '#00B3B3',
    experienceRequired: 130150,
  },
  {
    atomicNumber: 78,
    name: 'Platino',
    chemicalSymbol: 'Pt',
    color: '#E5E4E2',
    experienceRequired: 133050,
  },
  {
    atomicNumber: 79,
    name: 'Oro',
    chemicalSymbol: 'Au',
    color: '#FFD700',
    experienceRequired: 136000,
  },
  {
    atomicNumber: 80,
    name: 'Mercurio',
    chemicalSymbol: 'Hg',
    color: '#B8B8D0',
    experienceRequired: 139000,
  },
  {
    atomicNumber: 81,
    name: 'Talio',
    chemicalSymbol: 'Tl',
    color: '#A6544D',
    experienceRequired: 142050,
  },
  {
    atomicNumber: 82,
    name: 'Plomo',
    chemicalSymbol: 'Pb',
    color: '#575961',
    experienceRequired: 145150,
  },
  {
    atomicNumber: 83,
    name: 'Bismuto',
    chemicalSymbol: 'Bi',
    color: '#9E4FB5',
    experienceRequired: 148300,
  },
  {
    atomicNumber: 84,
    name: 'Polonio',
    chemicalSymbol: 'Po',
    color: '#AB5C00',
    experienceRequired: 151500,
  },
  {
    atomicNumber: 85,
    name: 'Astato',
    chemicalSymbol: 'At',
    color: '#754F45',
    experienceRequired: 154750,
  },
  {
    atomicNumber: 86,
    name: 'Radón',
    chemicalSymbol: 'Rn',
    color: '#428296',
    experienceRequired: 158050,
  },
  {
    atomicNumber: 87,
    name: 'Francio',
    chemicalSymbol: 'Fr',
    color: '#420066',
    experienceRequired: 161400,
  },
  {
    atomicNumber: 88,
    name: 'Radio',
    chemicalSymbol: 'Ra',
    color: '#007D00',
    experienceRequired: 164800,
  },
  {
    atomicNumber: 89,
    name: 'Actinio',
    chemicalSymbol: 'Ac',
    color: '#70ABFA',
    experienceRequired: 168250,
  },
  {
    atomicNumber: 90,
    name: 'Torio',
    chemicalSymbol: 'Th',
    color: '#00BAFF',
    experienceRequired: 171750,
  },
  {
    atomicNumber: 91,
    name: 'Protactinio',
    chemicalSymbol: 'Pa',
    color: '#00A1FF',
    experienceRequired: 175300,
  },
  {
    atomicNumber: 92,
    name: 'Uranio',
    chemicalSymbol: 'U',
    color: '#008FFF',
    experienceRequired: 178900,
  },
  {
    atomicNumber: 93,
    name: 'Neptunio',
    chemicalSymbol: 'Np',
    color: '#0080FF',
    experienceRequired: 182550,
  },
  {
    atomicNumber: 94,
    name: 'Plutonio',
    chemicalSymbol: 'Pu',
    color: '#006BFF',
    experienceRequired: 186250,
  },
  {
    atomicNumber: 95,
    name: 'Americio',
    chemicalSymbol: 'Am',
    color: '#545CF2',
    experienceRequired: 190000,
  },
  {
    atomicNumber: 96,
    name: 'Curio',
    chemicalSymbol: 'Cm',
    color: '#785CE3',
    experienceRequired: 193800,
  },
  {
    atomicNumber: 97,
    name: 'Berkelio',
    chemicalSymbol: 'Bk',
    color: '#8A4FE3',
    experienceRequired: 197650,
  },
  {
    atomicNumber: 98,
    name: 'Californio',
    chemicalSymbol: 'Cf',
    color: '#A136D4',
    experienceRequired: 201550,
  },
  {
    atomicNumber: 99,
    name: 'Einsteinio',
    chemicalSymbol: 'Es',
    color: '#B31FD4',
    experienceRequired: 205500,
  },
  {
    atomicNumber: 100,
    name: 'Fermio',
    chemicalSymbol: 'Fm',
    color: '#B31FBA',
    experienceRequired: 209500,
  },
  {
    atomicNumber: 101,
    name: 'Mendelevio',
    chemicalSymbol: 'Md',
    color: '#B30DA6',
    experienceRequired: 213550,
  },
  {
    atomicNumber: 102,
    name: 'Nobelio',
    chemicalSymbol: 'No',
    color: '#BD0D87',
    experienceRequired: 217650,
  },
  {
    atomicNumber: 103,
    name: 'Lawrencio',
    chemicalSymbol: 'Lr',
    color: '#C70066',
    experienceRequired: 221800,
  },
  {
    atomicNumber: 104,
    name: 'Rutherfordio',
    chemicalSymbol: 'Rf',
    color: '#CC0059',
    experienceRequired: 226000,
  },
  {
    atomicNumber: 105,
    name: 'Dubnio',
    chemicalSymbol: 'Db',
    color: '#D1004F',
    experienceRequired: 230250,
  },
  {
    atomicNumber: 106,
    name: 'Seaborgio',
    chemicalSymbol: 'Sg',
    color: '#D90045',
    experienceRequired: 234550,
  },
  {
    atomicNumber: 107,
    name: 'Bohrio',
    chemicalSymbol: 'Bh',
    color: '#E00038',
    experienceRequired: 238900,
  },
  {
    atomicNumber: 108,
    name: 'Hassio',
    chemicalSymbol: 'Hs',
    color: '#E6002B',
    experienceRequired: 243300,
  },
  {
    atomicNumber: 109,
    name: 'Meitnerio',
    chemicalSymbol: 'Mt',
    color: '#EB0020',
    experienceRequired: 247750,
  },
  {
    atomicNumber: 110,
    name: 'Darmstadtio',
    chemicalSymbol: 'Ds',
    color: '#FF0066',
    experienceRequired: 252250,
  },
  {
    atomicNumber: 111,
    name: 'Roentgenio',
    chemicalSymbol: 'Rg',
    color: '#FF3385',
    experienceRequired: 256800,
  },
  {
    atomicNumber: 112,
    name: 'Copernicio',
    chemicalSymbol: 'Cn',
    color: '#FF66A3',
    experienceRequired: 261400,
  },
  {
    atomicNumber: 113,
    name: 'Nihonio',
    chemicalSymbol: 'Nh',
    color: '#FF99C2',
    experienceRequired: 266050,
  },
  {
    atomicNumber: 114,
    name: 'Flerovio',
    chemicalSymbol: 'Fl',
    color: '#FFCCE0',
    experienceRequired: 270750,
  },
  {
    atomicNumber: 115,
    name: 'Moscovio',
    chemicalSymbol: 'Mc',
    color: '#FFD6E7',
    experienceRequired: 275500,
  },
  {
    atomicNumber: 116,
    name: 'Livermorio',
    chemicalSymbol: 'Lv',
    color: '#FFE0EE',
    experienceRequired: 280300,
  },
  {
    atomicNumber: 117,
    name: 'Tenesino',
    chemicalSymbol: 'Ts',
    color: '#FFEAF4',
    experienceRequired: 285150,
  },
  {
    atomicNumber: 118,
    name: 'Oganesón',
    chemicalSymbol: 'Og',
    color: '#FFF5FA',
    experienceRequired: 290050,
  },
];

const prisma = new PrismaClient();

async function seed() {
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
seed().finally(() => prisma.$disconnect());
/* main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect().catch((err) => {
      console.error('Error disconnecting Prisma Client:', err);
    });
  }); */
