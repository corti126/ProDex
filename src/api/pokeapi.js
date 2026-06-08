// Cliente PokéAPI con caché en memoria + localStorage (TTL 7 días).
const BASE = 'https://pokeapi.co/api/v2';
const MEM = new Map();
const TTL = 7 * 24 * 60 * 60 * 1000;
const PREFIX = 'pbh::';

function readLS(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const { t, v } = JSON.parse(raw);
    if (Date.now() - t > TTL) {
      localStorage.removeItem(PREFIX + key);
      return null;
    }
    return v;
  } catch {
    return null;
  }
}

function writeLS(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify({ t: Date.now(), v: value }));
  } catch {
    /* cuota llena: ignorar */
  }
}

export async function apiGet(path) {
  const key = path.replace(/^\/+/, '');
  if (MEM.has(key)) return MEM.get(key);
  const cached = readLS(key);
  if (cached) {
    MEM.set(key, cached);
    return cached;
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
  MEM.set(key, data);
  writeLS(key, data);
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

// Lista paginada con caché
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
