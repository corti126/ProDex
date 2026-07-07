import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  getPokemon, getPokemonSpecies, getEvolutionChain,
  spriteFor, spriteSmall, listAllPokemon, pickEsName, idFromUrl, apiGet
} from '../api/pokeapi.js';
import { defensiveProfile, bucketize, offensiveProfileForTypes, TYPE_ES } from '../data/typeChart.js';
import TypeBadge from '../components/TypeBadge.jsx';
import Loader from '../components/Loader.jsx';
import ErrorMsg from '../components/ErrorMsg.jsx';

const STAT_LABELS = {
  hp: 'PS', attack: 'Ataque', defense: 'Defensa',
  'special-attack': 'At. Esp.', 'special-defense': 'Def. Esp.', speed: 'Velocidad'
};
const STAT_MAX = 255;

export default function PokemonPage() {
  const { name: nameParam } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(nameParam || '');
  const [pokemon, setPokemon] = useState(null);
  const [species, setSpecies] = useState(null);
  const [chain, setChain] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Autocompletado
  const [allList, setAllList] = useState([]); // [{name, id}]
  const [showSug, setShowSug] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    listAllPokemon()
      .then(d => {
        const items = d.results.map(r => ({ name: r.name, id: idFromUrl(r.url) }));
        setAllList(items);
      })
      .catch(() => { /* silencioso */ });
  }, []);

  useEffect(() => {
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowSug(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const byId = /^\d+$/.test(q);
    return allList
      .filter(p => byId ? String(p.id).startsWith(q) : p.name.includes(q))
      .slice(0, 8);
  }, [query, allList]);

  const load = useCallback(async (q) => {
    if (!q) return;
    setLoading(true);
    setError(null);
    try {
      const p = await getPokemon(q);
      setPokemon(p);
      try {
        const sp = await getPokemonSpecies(p.id);
        setSpecies(sp);
        if (sp?.evolution_chain?.url) {
          const ch = await getEvolutionChain(sp.evolution_chain.url);
          setChain(ch);
        } else {
          setChain(null);
        }
      } catch {
        setSpecies(null); setChain(null);
      }
    } catch (e) {
      setPokemon(null); setSpecies(null); setChain(null);
      setError(e.status === 404 ? 'No se encontró ese Pokémon. Prueba con otro nombre o número.' : 'Error al consultar la PokéAPI. Revisa tu conexión.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (nameParam) {
      setQuery(nameParam);
      load(nameParam);
    } else if (!pokemon) {
      load('pikachu');
      setQuery('pikachu');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameParam]);

  function goTo(nameOrId) {
    setShowSug(false);
    navigate(`/pokemon/${encodeURIComponent(String(nameOrId).toLowerCase())}`);
  }

  function onSubmit(e) {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    if (suggestions[activeIdx]) goTo(suggestions[activeIdx].name);
    else goTo(q);
  }

  function onKeyDown(e) {
    if (!showSug || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, suggestions.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === 'Escape') setShowSug(false);
  }

  return (
    <section className="page page-pokemon">
      <div className="page-head">
        <h1>Pokédex</h1>
        <p className="page-sub">Busca un Pokémon por nombre o número.</p>
      </div>

      <form className="search-bar" onSubmit={onSubmit} ref={wrapRef} autoComplete="off">
        <div className="search-wrap">
          <input
            className="search-input"
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSug(true); setActiveIdx(0); }}
            onFocus={() => setShowSug(true)}
            onKeyDown={onKeyDown}
            placeholder="Ej: pikachu, charizard, 25, 6"
            aria-label="Buscar Pokémon"
          />
          {showSug && suggestions.length > 0 && (
            <ul className="autocomplete">
              {suggestions.map((s, i) => (
                <li
                  key={s.name}
                  className={'autocomplete-item' + (i === activeIdx ? ' active' : '')}
                  onMouseEnter={() => setActiveIdx(i)}
                  onMouseDown={(e) => { e.preventDefault(); goTo(s.name); }}
                >
                  <img src={spriteSmall(s.id)} alt="" loading="lazy" />
                  <span className="ac-name">{s.name}</span>
                  <span className="ac-id">#{String(s.id).padStart(4, '0')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <button className="btn btn-primary" type="submit">Buscar</button>
      </form>

      {loading && <Loader label="Buscando Pokémon..." />}
      {error && <ErrorMsg message={error} onRetry={() => load(query)} />}
      {!loading && !error && pokemon && (
        <PokemonDetail pokemon={pokemon} species={species} chain={chain} />
      )}
    </section>
  );
}

function PokemonDetail({ pokemon, species, chain }) {
  const types = pokemon.types.map(t => t.type.name);
  const defProfile = useMemo(() => bucketize(defensiveProfile(types)), [types]);
  const offProfile = useMemo(() => offensiveProfileForTypes(types), [types]);
  const [abilitiesEs, setAbilitiesEs] = useState({});

  const nameEs = useMemo(() => pickEsName(species?.names, pokemon.name), [species, pokemon.name]);
  const flavor = useMemo(() => {
    if (!species?.flavor_text_entries) return null;
    const es = species.flavor_text_entries.find(e => e.language.name === 'es');
    const en = species.flavor_text_entries.find(e => e.language.name === 'en');
    return (es || en)?.flavor_text?.replace(/\f|\n/g, ' ');
  }, [species]);

  // Traducir habilidades al español (carga perezosa por habilidad).
  useEffect(() => {
    let cancel = false;
    (async () => {
      const map = {};
      await Promise.all(pokemon.abilities.map(async (a) => {
        try {
          const data = await apiGet(a.ability.url.replace('https://pokeapi.co/api/v2/', ''));
          map[a.ability.name] = pickEsName(data.names, a.ability.name);
        } catch {
          map[a.ability.name] = a.ability.name;
        }
      }));
      if (!cancel) setAbilitiesEs(map);
    })();
    return () => { cancel = true; };
  }, [pokemon]);

  return (
    <article className="poke-detail">
      <div className={`poke-hero type-bg-${types[0]}`}>
        <div className="poke-hero-text">
          <div className="poke-number">#{String(pokemon.id).padStart(4, '0')}</div>
          <h2 className="poke-name">{nameEs}</h2>
          <div className="poke-types">
            {types.map(t => <TypeBadge key={t} type={t} size="lg" />)}
          </div>
          <div className="poke-meta">
            <div><span>Altura</span><strong>{(pokemon.height / 10).toFixed(1)} m</strong></div>
            <div><span>Peso</span><strong>{(pokemon.weight / 10).toFixed(1)} kg</strong></div>
            <div>
              <span>Habilidades</span>
              <strong>{pokemon.abilities.map(a => abilitiesEs[a.ability.name] || a.ability.name).join(', ')}</strong>
            </div>
          </div>
        </div>
        <img className="poke-hero-img" src={spriteFor(pokemon.id)} alt={nameEs} loading="lazy" />
      </div>

      {flavor && (
        <section className="card">
          <h3>Descripción</h3>
          <p className="flavor">{flavor}</p>
        </section>
      )}

      <section className="card">
        <h3>Estadísticas base</h3>
        <div className="stats">
          {pokemon.stats.map(s => {
            const pct = Math.min(100, (s.base_stat / STAT_MAX) * 100);
            return (
              <div key={s.stat.name} className="stat-row">
                <div className="stat-label">{STAT_LABELS[s.stat.name] || s.stat.name}</div>
                <div className="stat-value">{s.base_stat}</div>
                <div className="stat-bar"><div className={`stat-fill stat-${s.stat.name}`} style={{ width: pct + '%' }} /></div>
              </div>
            );
          })}
          <div className="stat-row total">
            <div className="stat-label">Total</div>
            <div className="stat-value">{pokemon.stats.reduce((a, b) => a + b.base_stat, 0)}</div>
            <div />
          </div>
        </div>
      </section>

      <section className="card">
        <h3>Defensa: efectividad recibida</h3>
        <BucketGrid buckets={defProfile} />
      </section>

      <section className="card">
        <h3>Ataque: tipos contra los que es eficaz</h3>
        <OffensiveGrid offMap={offProfile} />
      </section>

      {chain && <EvolutionChain chain={chain} />}
    </article>
  );
}

function BucketGrid({ buckets }) {
  const rows = [
    { key: 'x4', label: 'Débil x4', cls: 'bucket-weak4' },
    { key: 'x2', label: 'Débil x2', cls: 'bucket-weak2' },
    { key: 'x05', label: 'Resiste x0.5', cls: 'bucket-res' },
    { key: 'x025', label: 'Resiste x0.25', cls: 'bucket-res2' },
    { key: 'x0', label: 'Inmune', cls: 'bucket-imm' },
  ];
  return (
    <div className="buckets">
      {rows.map(r => (
        <div key={r.key} className={`bucket ${r.cls}`}>
          <div className="bucket-label">{r.label}</div>
          <div className="bucket-list">
            {buckets[r.key].length === 0 ? <span className="muted">—</span> :
              buckets[r.key].map(t => <TypeBadge key={t} type={t} size="sm" />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function OffensiveGrid({ offMap }) {
  const entries = Object.entries(offMap);
  if (!entries.length) return <p className="muted">Sin ventajas ofensivas claras.</p>;
  return (
    <div className="off-grid">
      {entries.map(([t, m]) => (
        <div key={t} className="off-item">
          <TypeBadge type={t} size="sm" />
          <span className="off-mult">x{m}</span>
        </div>
      ))}
    </div>
  );
}

function EvolutionChain({ chain }) {
  const stages = flattenChain(chain.chain);
  return (
    <section className="card">
      <h3>Cadena evolutiva</h3>
      <div className="evo-chain">
        {stages.map((stageGroup, i) => (
          <div className="evo-stage-wrap" key={i}>
            {i > 0 && <div className="evo-arrow">→</div>}
            <div className="evo-stage">
              {stageGroup.map(s => <EvoNode key={s.name} node={s} />)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EvoNode({ node }) {
  const navigate = useNavigate();
  const id = extractIdFromSpeciesUrl(node.url);
  const [nameEs, setNameEs] = useState(node.name);
  useEffect(() => {
    let cancel = false;
    apiGet(`pokemon-species/${node.name}`)
      .then(data => { if (!cancel) setNameEs(pickEsName(data.names, node.name)); })
      .catch(() => {});
    return () => { cancel = true; };
  }, [node.name]);
  return (
    <button className="evo-node" onClick={() => navigate(`/pokemon/${node.name}`)}>
      <img src={spriteSmall(id)} alt={nameEs} loading="lazy" />
      <span>{nameEs}</span>
    </button>
  );
}

function flattenChain(node, depth = 0, acc = []) {
  if (!acc[depth]) acc[depth] = [];
  acc[depth].push({ name: node.species.name, url: node.species.url });
  for (const next of node.evolves_to || []) {
    flattenChain(next, depth + 1, acc);
  }
  return acc;
}
function extractIdFromSpeciesUrl(url) {
  const m = url.match(/\/pokemon-species\/(\d+)/);
  return m ? m[1] : '0';
}
