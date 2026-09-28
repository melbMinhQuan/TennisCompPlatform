type ProfileStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED";

const STATUS_STYLES: Record<ProfileStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  INACTIVE: "bg-slate-200 text-slate-600",
  SUSPENDED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<ProfileStatus, string> = {
  ACTIVE: "Active",
  INACTIVE: "Inactive",
  SUSPENDED: "Suspended",
};

type ProfileHeaderProps = { displayName: string; avatarUrl?: string; status: ProfileStatus };

/** Avatar (photo or initials), name and status badge. Mobile: avatar beside the name. Desktop: above it. */
export default function ProfileHeader({ displayName, avatarUrl, status }: ProfileHeaderProps) {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();

  return (
    <div className="flex items-center gap-4 min-[768px]:flex-col min-[768px]:gap-0">
      <div className="flex h-[88px] w-[88px] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#cbd5e1] text-3xl font-semibold text-[#1a3049] min-[768px]:mx-auto min-[768px]:mt-5 min-[768px]:h-[200px] min-[768px]:w-[200px] min-[768px]:text-5xl">
        {avatarUrl ? (
          <img src={avatarUrl} alt={`${displayName}'s profile`} className="h-full w-full object-cover" />
        ) : (
          <span aria-label={displayName}>{initials || "?"}</span>
        )}
      </div>

      <div className="min-w-0 min-[768px]:w-full">
        <h1 className="break-words text-xl font-semibold min-[768px]:mt-6 min-[768px]:text-center min-[768px]:text-2xl">
          {displayName}
        </h1>

        <div className="mt-2 flex min-[768px]:justify-center">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold min-[768px]:px-4 min-[768px]:text-lg ${STATUS_STYLES[status]}`}
          >
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-current" />
            {STATUS_LABELS[status]}
          </span>
        </div>
      </div>
    </div>
  );
}
