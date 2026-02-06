export function Table({ columns = [], rows = [] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-slate-100 text-left text-sm text-slate-700">
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 border-b border-slate-200">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="text-sm">
          {rows.map((row, idx) => (
            <tr key={idx} className="odd:bg-white even:bg-slate-50">
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-4 py-3 border-b border-slate-100"
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
