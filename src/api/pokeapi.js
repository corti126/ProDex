// Cliente PokéAPI con caché solo en memoria.
const BASE = 'https://pokeapi.co/api/v2';

const MEM = new Map();

export async function apiGet(path) {
  const key = path.replace(/^\/+/, '');

  // Caché en memoria
  if (MEM.has(key)) {
    return MEM.get(key);
  }

  const url = path.startsWith('http') ? path : `${BASE}/${key}`;

  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) {
      const err = new Error('No encontrado');
      err.status = 404;
      throw err;
    }
    throw new Error(`Error de red (${res.status})`);
  }

  const data = await res.json();

  // Guardar solo en memoria
  MEM.set(key, data);

  return data;
}

export function getPokemon(idOrName) {
  return apiGet(`pokemon/${String(idOrName).toLowerCase().trim()}`);
}

export function getPokemonSpecies(idOrName) {
  return apiGet(`pokemon-species/${String(idOrName).toLowerCase().trim()}`);
}

export function getEvolutionChain(url) {
  return apiGet(url);
}

export function getType(name) {
  return apiGet(`type/${name}`);
}

export function getMove(idOrName) {
  return apiGet(`move/${String(idOrName).toLowerCase().trim()}`);
}

export async function listAllMoves() {
  return apiGet('move?limit=1000');
}

export async function listAllPokemon() {
  return apiGet('pokemon?limit=1302');
}

export function spriteFor(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function spriteSmall(id) {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
}

export function pickEsName(names, fallback = '') {
  if (!Array.isArray(names)) return fallback;
  const es = names.find(n => n.language?.name === 'es');
  return es?.name || fallback;
}

export function idFromUrl(url) {
  const m = String(url || '').match(/\/(\d+)\/?$/);
  return m ? Number(m[1]) : null;
}