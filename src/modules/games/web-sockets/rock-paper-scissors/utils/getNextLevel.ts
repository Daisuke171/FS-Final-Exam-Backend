export interface CreateLevelInput {
  atomicNumber: number;
  name: string;
  chemicalSymbol: string;
  color: string;
  experienceRequired: number;
}

export function getNextLevel(atomicNumber: number) {
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

  return levels.find((l) => l.atomicNumber === atomicNumber);
}
