export function DataTable({
  columns,
  rows,
  rowKey,
  rowClassName,
  empty,
  className = "",
  tableClassName = "",
  ...props
}) {
  return (
    <div className={`data-table-wrap ${className}`.trim()} {...props}>
      <table className={`data-table ${tableClassName}`.trim()}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length ? (
            rows.map((row, index) => (
              <tr
                className={rowClassName ? rowClassName(row, index) : undefined}
                key={rowKey ? rowKey(row, index) : index}
              >
                {columns.map((column) => (
                  <td data-label={column.label || column.key || ""} key={column.key}>
                    {column.render ? column.render(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length}>{empty}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
