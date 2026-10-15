// The three club administrator jobs, in the order of the client's core flow:
// search player → identify existing player → associate with club → manage membership → add to team.
const JOBS = [
  { title: "Add a player", steps: ["Players", "＋ Add a player", "1 Search", "2 Choose", "3 Done"] },
  { title: "Manage a membership", steps: ["Players", "View ›", "Player details", "End membership"] },
  { title: "Build a team", steps: ["Teams", "＋ Create team", "＋ Add players", "Team manager"] },
];

/** "What club administrators need to do": each task a club administrator needs to do, as a short click path. */
export default function ClubAdminQuickGuide() {
  return (
    <section className="rounded-2xl bg-white p-6" aria-labelledby="quick-guide-heading">
      <h2 id="quick-guide-heading" className="text-xl font-semibold text-[#1a3049]">
        What club administrators need to do
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted">
        Please search the player registry before creating a new player record. This ensures that each player
        retains a single Player ID across all clubs.
      </p>
      <ol className="mt-4 grid gap-3 md:grid-cols-3">
        {JOBS.map((job) => (
          <li key={job.title} className="min-w-0 rounded-xl bg-[#e8f0fa] p-4">
            <h3 className="font-semibold text-[#1a3049]">{job.title}</h3>
            <p className="mt-2 text-sm leading-6 text-[#1a3049] [overflow-wrap:anywhere]">{job.steps.join(" → ")}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
