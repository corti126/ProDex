import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPokemon, getPokemonSpecies, getEvolutionChain, spriteFor, spriteSmall } from '../api/pokeapi.js';
import { defensiveProfile, bucketize, offensiveProfileForTypes, TYPE_ES } from '../data/typeChart.js';
import TypeBadge from '../components/TypeBadge.jsx';
import Loader from '../components/Loader.jsx';
import ErrorMsg from '../components/ErrorMsg.jsx';

const STAT_LABELS = {
  hp: 'HP', attack: 'Ataque', defense: 'Defensa',
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
      // Carga inicial con un Pokémon destacado
      load('pikachu');
      setQuery('pikachu');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameParam]);

  function onSubmit(e) {
    e.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    navigate(`/pokemon/${encodeURIComponent(q)}`);
  }

  return (
    <section className="page page-pokemon">
      <div className="page-head">
        <h1>Pokédex</h1>
        <p className="page-sub">Busca un Pokémon por nombre o número.</p>
      </div>

      <form className="search-bar" onSubmit={onSubmit}>
        <input
          className="search-input"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ej: pikachu, charizard, 25, 6"
          aria-label="Buscar Pokémon"
        />
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
  const flavor = useMemo(() => {
    if (!species?.flavor_text_entries) return null;
    const es = species.flavor_text_entries.find(e => e.language.name === 'es');
    const en = species.flavor_text_entries.find(e => e.language.name === 'en');
    return (es || en)?.flavor_text?.replace(/\f|\n/g, ' ');
  }, [species]);

  return (
    <article className="poke-detail">
      <div className={`poke-hero type-bg-${types[0]}`}>
        <div className="poke-hero-text">
          <div className="poke-number">#{String(pokemon.id).padStart(4, '0')}</div>
          <h2 className="poke-name">{pokemon.name}</h2>
          <div className="poke-types">
            {types.map(t => <TypeBadge key={t} type={t} size="lg" />)}
          </div>
          <div className="poke-meta">
            <div><span>Altura</span><strong>{(pokemon.height / 10).toFixed(1)} m</strong></div>
            <div><span>Peso</span><strong>{(pokemon.weight / 10).toFixed(1)} kg</strong></div>
            <div>
              <span>Habilidades</span>
              <strong>{pokemon.abilities.map(a => a.ability.name).join(', ')}</strong>
            </div>
          </div>
        </div>
        <img className="poke-hero-img" src={spriteFor(pokemon.id)} alt={pokemon.name} loading="lazy" />
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
  return (
    <button className="evo-node" onClick={() => navigate(`/pokemon/${node.name}`)}>
      <img src={spriteSmall(id)} alt={node.name} loading="lazy" />
      <span>{node.name}</span>
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
