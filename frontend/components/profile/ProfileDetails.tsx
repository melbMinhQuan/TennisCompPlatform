/** "Label: value" lines in the profile card. */
export default function ProfileDetails({ rows }: { rows: [label: string, value: string | number][] }) {
  return (
    <dl className="min-w-0 space-y-5">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0 max-w-full">
          <dt className="inline font-semibold">{label}: </dt>
          <dd className="inline font-normal [overflow-wrap:anywhere]">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
