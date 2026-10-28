export function SearchField({ scope, onScopeChange, query, onQueryChange, onSubmit }) {
  return (
    <form aria-label="Buscar en Afterstage" className="header-search-form" onSubmit={onSubmit} role="search">
      <span aria-hidden="true" className="header-search-icon">
        ⌕
      </span>
      <label className="header-search-scope">
        <span className="sr-only">Buscar en</span>
        <select aria-label="Alcance de búsqueda" onChange={(event) => onScopeChange(event.target.value)} value={scope}>
          <option value="notas">Notas</option>
          <option value="eventos">Eventos</option>
        </select>
      </label>
      <input
        aria-label="Términos de búsqueda"
        onChange={(event) => onQueryChange(event.target.value)}
        placeholder="Buscar en Afterstage"
        type="search"
        value={query}
      />
      <button className="sr-only" type="submit">
        Buscar
      </button>
    </form>
  );
}
