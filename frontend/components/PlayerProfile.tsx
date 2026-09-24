export type PlayerProfileData = {
  displayName: string;
  avatarUrl?: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  age: number | null;
  gender: string | null;
  email: string | null;
  phone: string | null;
  clubs: string[];
  teams: string[];
  association: string | null;
  playerId: string | null;
};

type PlayerProfileProps = {
  player: PlayerProfileData;
};

const statusStyles = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-slate-200 text-slate-600",
  SUSPENDED: "bg-red-100 text-red-700",
};

const statusLabels = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
};

export default function PlayerProfile({ player }: PlayerProfileProps) {
  const initials = player.displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <section
      aria-label="Player information"
      className="min-w-0 rounded-[32px] bg-white p-5 text-[#1a3049]
                min-[768px]:rounded-none min-[768px]:bg-transparent
                min-[768px]:p-0 min-[768px]:text-black"
    >
      {/* Mobile: avatar beside name. Desktop: avatar above name. */}
      <div
        className="flex items-center gap-4 min-[768px]:flex-col min-[768px]:gap-0"
      >
        <div
          className="flex h-[88px] w-[88px] shrink-0 items-center
                    justify-center overflow-hidden rounded-full
                    bg-[#cbd5e1] text-3xl font-semibold text-[#1a3049]
                    min-[768px]:mx-auto min-[768px]:mt-5
                    min-[768px]:h-[200px] min-[768px]:w-[200px]
                    min-[768px]:text-5xl"
        >
          {player.avatarUrl ? (
            <img
              src={player.avatarUrl}
              alt={`${player.displayName}'s profile`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span aria-label={player.displayName}>
              {initials || "?"}
            </span>
          )}
        </div>

        <div className="min-w-0 min-[768px]:w-full">
          <h1
            className="break-words text-xl font-semibold
                      min-[768px]:mt-6 min-[768px]:text-center
                      min-[768px]:text-2xl"
          >
            {player.displayName}
          </h1>

          <div className="mt-2 flex min-[768px]:justify-center">
            <span
              className={`inline-flex items-center gap-2 rounded-full
                          px-3 py-1 text-sm font-semibold
                          min-[768px]:px-4 min-[768px]:text-lg
                          ${statusStyles[player.status]}`}
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-current"
              />
              {statusLabels[player.status]}
            </span>
          </div>
        </div>
      </div>

      {/* Profile header: avatar + name + status badge */}
      <div
        className="mt-6 min-w-0 max-w-full overflow-hidden text-sm leading-6
                  min-[768px]:mt-7 min-[768px]:bg-[#d9d9d9]
                  min-[768px]:px-5 min-[768px]:py-8"
      >
        {/* Primary profile details */}
        <dl className="min-w-0 space-y-5">
          <div className="min-w-0">
            <dt className="inline font-semibold">Age: </dt>
            <dd className="inline font-normal">
              {player.age ?? "Not supplied"}
            </dd>
          </div>

          <div className="min-w-0">
            <dt className="inline font-semibold">Gender: </dt>
            <dd className="inline font-normal">
              {player.gender || "Not supplied"}
            </dd>
          </div>

          <div className="min-w-0 max-w-full">
            <dt className="inline font-semibold">Email: </dt>
            <dd className="inline font-normal [overflow-wrap:anywhere]">
              {player.email || "Not supplied"}
            </dd>
          </div>

          <div className="min-w-0">
            <dt className="inline font-semibold">Phone: </dt>
            <dd className="inline font-normal [overflow-wrap:anywhere]">
              {player.phone || "Not supplied"}
            </dd>
          </div>
        </dl>

        <hr
          className="my-7 w-full border-slate-200 min-[768px]:border-black/30"
        />

        {/* Club / association / team / id info */}
        <dl className="min-w-0 space-y-5">
          <div className="min-w-0">
            <dt className="inline font-semibold">Clubs: </dt>
            <dd className="inline font-normal [overflow-wrap:anywhere]">
              {player.clubs.length > 0
                ? player.clubs.join(", ")
                : "Not supplied"}
            </dd>
          </div>

          <div className="min-w-0">
            <dt className="inline font-semibold">Association: </dt>
            <dd className="inline font-normal [overflow-wrap:anywhere]">
              {player.association || "Not supplied"}
            </dd>
          </div>

          <div className="min-w-0">
            <dt className="inline font-semibold">Teams: </dt>
            <dd className="inline font-normal [overflow-wrap:anywhere]">
              {player.teams.length > 0
                ? player.teams.join(", ")
                : "No team assigned"}
            </dd>
          </div>

          <div className="min-w-0">
            <dt className="inline font-semibold">Player ID: </dt>
            <dd className="inline font-normal [overflow-wrap:anywhere]">
              {player.playerId || "Not supplied"}
            </dd>
          </div>
        </dl>
      </div>
    </section>
  );
}
