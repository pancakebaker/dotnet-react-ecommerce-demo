type DataTableProps = {
  columns: string[];
  rows: Array<Array<string | number>>;
};

export function DataTable({ columns, rows }: DataTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-line bg-white">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-line text-sm">
          <thead className="bg-field text-left text-xs uppercase text-slate-500">
            <tr>{columns.map(column => <th key={column} className="px-4 py-3 font-semibold">{column}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((row, index) => (
              <tr key={index} className="hover:bg-field">
                {row.map((cell, cellIndex) => <td key={cellIndex} className="whitespace-nowrap px-4 py-3">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
