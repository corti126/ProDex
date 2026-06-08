// Tabla oficial de efectividades (atacante -> defensor)
// 0 = inmune, 0.5 = poco eficaz, 1 = normal, 2 = súper eficaz
export const TYPES = [
  'normal','fire','water','electric','grass','ice','fighting','poison',
  'ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy'
];

export const TYPE_ES = {
  normal: 'Normal', fire: 'Fuego', water: 'Agua', electric: 'Eléctrico',
  grass: 'Planta', ice: 'Hielo', fighting: 'Lucha', poison: 'Veneno',
  ground: 'Tierra', flying: 'Volador', psychic: 'Psíquico', bug: 'Bicho',
  rock: 'Roca', ghost: 'Fantasma', dragon: 'Dragón', dark: 'Siniestro',
  steel: 'Acero', fairy: 'Hada'
};

// Multiplicador del ataque[atk] contra defensor[def]
const CHART = {
  normal:   { rock: .5, ghost: 0, steel: .5 },
  fire:     { fire: .5, water: .5, grass: 2, ice: 2, bug: 2, rock: .5, dragon: .5, steel: 2 },
  water:    { fire: 2, water: .5, grass: .5, ground: 2, rock: 2, dragon: .5 },
  electric: { water: 2, electric: .5, grass: .5, ground: 0, flying: 2, dragon: .5 },
  grass:    { fire: .5, water: 2, grass: .5, poison: .5, ground: 2, flying: .5, bug: .5, rock: 2, dragon: .5, steel: .5 },
  ice:      { fire: .5, water: .5, grass: 2, ice: .5, ground: 2, flying: 2, dragon: 2, steel: .5 },
  fighting: { normal: 2, ice: 2, poison: .5, flying: .5, psychic: .5, bug: .5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: .5 },
  poison:   { grass: 2, poison: .5, ground: .5, rock: .5, ghost: .5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: .5, poison: 2, flying: 0, bug: .5, rock: 2, steel: 2 },
  flying:   { electric: .5, grass: 2, fighting: 2, bug: 2, rock: .5, steel: .5 },
  psychic:  { fighting: 2, poison: 2, psychic: .5, dark: 0, steel: .5 },
  bug:      { fire: .5, grass: 2, fighting: .5, poison: .5, flying: .5, psychic: 2, ghost: .5, dark: 2, steel: .5, fairy: .5 },
  rock:     { fire: 2, ice: 2, fighting: .5, ground: .5, flying: 2, bug: 2, steel: .5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: .5 },
  dragon:   { dragon: 2, steel: .5, fairy: 0 },
  dark:     { fighting: .5, psychic: 2, ghost: 2, dark: .5, fairy: .5 },
  steel:    { fire: .5, water: .5, electric: .5, ice: 2, rock: 2, steel: .5, fairy: 2 },
  fairy:    { fire: .5, fighting: 2, poison: .5, dragon: 2, dark: 2, steel: .5 },
};

export function getAttackMultiplier(atk, def) {
  return CHART[atk]?.[def] ?? 1;
}

// Defensa: dados tipos del defensor (1 o 2), calcula multiplicador recibido por cada tipo atacante
export function defensiveProfile(defenderTypes) {
  const result = {};
  for (const atk of TYPES) {
    let mult = 1;
    for (const def of defenderTypes) {
      mult *= getAttackMultiplier(atk, def);
    }
    result[atk] = mult;
  }
  return result;
}

export function bucketize(profile) {
  const x4 = [], x2 = [], x05 = [], x025 = [], x0 = [], x1 = [];
  for (const [t, m] of Object.entries(profile)) {
    if (m === 0) x0.push(t);
    else if (m === 4) x4.push(t);
    else if (m === 2) x2.push(t);
    else if (m === 0.5) x05.push(t);
    else if (m === 0.25) x025.push(t);
    else x1.push(t);
  }
  return { x4, x2, x1, x05, x025, x0 };
}

// Ofensiva: dado un tipo atacante, devuelve listas de defensores
export function offensiveProfile(atkType) {
  const sup = [], notVery = [], no = [];
  for (const def of TYPES) {
    const m = getAttackMultiplier(atkType, def);
    if (m === 0) no.push(def);
    else if (m === 2) sup.push(def);
    else if (m === 0.5) notVery.push(def);
  }
  return { sup, notVery, no };
}

// Para perfil ofensivo de un Pokémon con varios tipos: unión de tipos contra los que es eficaz
export function offensiveProfileForTypes(atkTypes) {
  const map = {};
  for (const def of TYPES) {
    let best = 1;
    for (const atk of atkTypes) {
      const m = getAttackMultiplier(atk, def);
      if (m > best) best = m;
    }
    if (best > 1) map[def] = best;
  }
  return map;
}
