import { TABLE_CAPTIONS, TABLE_HEADERS, dateLabel, type TableRow, type View } from "./standings-helpers";

type StandingsTableProps = { view: View; rows: TableRow[]; asOf?: string };

/** Scrollable standings table. The player's own row is highlighted and tagged. */
export default function StandingsTable({ view, rows, asOf }: StandingsTableProps) {
  const headers = TABLE_HEADERS[view];
  return (
    <div
      className="overflow-x-auto rounded-lg border border-[#dce4ee]"
      role="region"
      aria-label="Standings table, scroll horizontally for all columns"
      tabIndex={0}
    >
      <table className="w-full text-sm">
        <caption className="sr-only">
          {TABLE_CAPTIONS[view]} as of {dateLabel(asOf ?? "")}
        </caption>
        <thead className="bg-[#f0f5fc] text-xs text-muted">
          <tr>
            {headers.map((header, index) => (
              <th
                key={header}
                scope="col"
                className={"whitespace-nowrap px-4 py-3 " + (index === 1 ? "text-left" : "text-right")}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#e4eaf2]">
          {rows.map((row) => (
            <tr key={row.id} className={row.mine ? "bg-[#edf5ff]" : "even:bg-[#f8fafc]"}>
              {row.values.map((value, index) =>
                index === 1 ? (
                  <th key={index} scope="row" className="min-w-48 px-4 py-4 text-left font-semibold">
                    {value}
                    {row.mine && (
                      <span className="ml-2 inline-block rounded bg-[#dbeafe] px-2 py-0.5 text-[10px] text-[#075bc5]">
                        {view === "teams" ? "YOUR TEAM" : "YOU"}
                      </span>
                    )}
                    {row.tag && (
                      <span className="ml-2 inline-block rounded bg-[#e5f4ec] px-2 py-0.5 text-[10px] text-[#197354]">
                        {row.tag}
                      </span>
                    )}
                  </th>
                ) : (
                  <td key={index} className="whitespace-nowrap px-4 py-4 text-right tabular-nums">
                    {value}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
