import ProfileDetails from "./profile/ProfileDetails";
import ProfileHeader from "./profile/ProfileHeader";

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

/** Profile sidebar: avatar, name and status, then personal details and club / team details. */
export default function PlayerProfile({ player }: { player: PlayerProfileData }) {
  return (
    <section
      aria-label="Player information"
      className="min-w-0 rounded-2xl bg-white p-5 text-[#1a3049] min-[768px]:rounded-none min-[768px]:bg-transparent min-[768px]:p-0 min-[768px]:text-[#1a3049]"
    >
      <ProfileHeader displayName={player.displayName} avatarUrl={player.avatarUrl} status={player.status} />

      <div className="mt-6 min-w-0 max-w-full overflow-hidden text-sm leading-6 min-[768px]:mt-7 min-[768px]:bg-[#d9d9d9] min-[768px]:px-5 min-[768px]:py-8">
        <ProfileDetails
          rows={[
            ["Age", player.age ?? "Not supplied"],
            ["Gender", player.gender || "Not supplied"],
            ["Email", player.email || "Not supplied"],
            ["Phone", player.phone || "Not supplied"],
          ]}
        />

        <hr className="my-7 w-full border-slate-200 min-[768px]:border-black/30" />

        <ProfileDetails
          rows={[
            ["Clubs", player.clubs.length > 0 ? player.clubs.join(", ") : "Not supplied"],
            ["Association", player.association || "Not supplied"],
            ["Teams", player.teams.length > 0 ? player.teams.join(", ") : "No team assigned"],
            ["Player ID", player.playerId || "Not supplied"],
          ]}
        />
      </div>
    </section>
  );
}
