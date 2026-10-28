export function ItemList({ items, renderItem, empty, className = "" }) {
  return (
    <div className={`item-list ${className}`.trim()}>
      {items.length ? items.map((item, index) => renderItem(item, index)) : empty}
    </div>
  );
}
