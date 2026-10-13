import { useMemo, useState } from "react";
import { Link } from "react-router";
import {
  mockPlayers,
  mockClubMemberships,
  mockTeamPlayers,
  mockTeams,
} from "../data/clubAdminPlayers";

type StatusFilter = "ACTIVE" | "INACTIVE" | "ALL";
const CLUB_ID = "CLB01";
const PAGE_SIZE = 3;

export default function ClubAdminPlayersPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("ACTIVE");
  const [page, setPage] = useState(1);

  const clubPlayers = useMemo(() => {
    const playerById = new Map(mockPlayers.map((player) => [player.id, player]));
    const clubTeamIds = new Set(mockTeams.filter((team) => team.clubId === CLUB_ID).map((team) => team.id));
    return mockClubMemberships
      .filter((membership) => membership.clubId === CLUB_ID)
      .flatMap((membership) => {
        const player = playerById.get(membership.playerId);
        if (!player) return [];
        const teamNames = [...new Set(mockTeamPlayers
          .filter((tp) => tp.playerId === player.id && clubTeamIds.has(tp.teamId) && tp.status === "ACTIVE")
          .map((tp) => mockTeams.find((team) => team.id === tp.teamId)?.name)
          .filter((name): name is string => Boolean(name)))];
        return [{ player, membership, teamNames }];
      })
      .sort((a, b) => `${a.player.firstName} ${a.player.lastName}`.localeCompare(`${b.player.firstName} ${b.player.lastName}`));
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clubPlayers.filter(({ player, membership }) =>
      (filter === "ALL" || membership.status === filter) &&
      (!query || `${player.firstName} ${player.lastName}`.toLowerCase().includes(query) || player.id.toLowerCase().includes(query))
    );
  }, [clubPlayers, search, filter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const label = filter === "ALL" ? "All players" : filter === "ACTIVE" ? "Active players" : "Inactive players";

  function changeFilter(next: StatusFilter) {
    setFilter(next);
    setPage(1);
  }

  return (
    <section className="text-white md:text-[#1a3049]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#d2dfed] md:text-[#526579]">
        <span className="md:hidden">Glen Waverley · Club Admin</span>
        <span className="hidden md:inline">Club administration&nbsp; / &nbsp;Players</span>
      </p>
      <h1 className="mt-5 text-[30px] font-bold leading-tight md:mt-6 md:text-[36px]">Players</h1>
      <p className="mt-4 text-sm leading-6 text-[#d2dfed] md:text-base md:text-[#60758d]">
        Everyone in Glen Waverley Tennis Club. <span className="hidden md:inline">To add someone, use “Add a player”.</span>
      </p>

      <div className="mt-5 flex flex-col gap-3 md:mt-4 md:flex-row md:items-end">
        <Link to="/club-admin/players/add" className="flex min-h-11 items-center justify-center rounded-lg bg-[#4278b7] px-5 font-medium text-white hover:bg-[#356aa8] md:order-3 md:whitespace-nowrap">
          + Add a player
        </Link>
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-sm font-medium">
          <span>Search my club’s players</span>
          <input
            type="search"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(1); }}
            placeholder="Name or Player ID"
            className="min-h-11 w-full rounded-lg border border-[#c6d6e8] bg-white px-4 text-base text-[#1a3049] outline-none placeholder:text-[#60758d] focus:ring-2 focus:ring-[#4278b7]"
          />
        </label>
        <div role="group" aria-label="Filter players by membership status" className="grid grid-cols-3 gap-2 md:order-2 md:flex">
          {(["ACTIVE", "INACTIVE", "ALL"] as const).map((value) => (
            <button key={value} type="button" aria-pressed={filter === value} onClick={() => changeFilter(value)}
              className={`min-h-11 rounded-lg px-4 text-sm font-medium md:px-5 ${filter === value ? "bg-[#4278b7] text-white" : "bg-[#e5effa] text-[#1a3049] hover:bg-[#d6e5f6]"}`}>
              {value === "ALL" ? "All" : value === "ACTIVE" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-white p-5 text-[#1a3049] md:p-6">
        <h2 className="border-b border-[#dbe4ef] pb-1 text-lg font-bold">{label} ({filtered.length})</h2>
        {visible.length === 0 ? (
          <p className="py-8 text-sm text-[#60758d]">No players match your search.</p>
        ) : visible.map(({ player, membership, teamNames }) => (
          <div key={membership.id} className="border-b border-[#dbe4ef] py-3 last:border-b-0 md:flex md:items-center md:justify-between md:gap-4">
            <div className="min-w-0">
              <p className="font-semibold">{player.firstName} {player.lastName}</p>
              <p className="mt-0.5 text-sm text-[#60758d]">{player.id} · {teamNames.join(", ") || "No team yet"}</p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 md:mt-0 md:justify-end">
              <span className={`rounded-md px-2.5 py-1 text-xs font-semibold ${membership.status === "ACTIVE" ? "bg-[#e4f5ec] text-[#187650]" : "bg-[#f0f1f3] text-[#64748b]"}`}>
                {membership.status === "ACTIVE" ? "Active" : "Inactive"}
              </span>
              {!membership.isPrimary && <span className="rounded-md bg-[#e7f0fa] px-2.5 py-1 text-xs font-semibold">Additional club</span>}
              <Link to={`/club-admin/players/${player.id}`} className="ml-1 text-sm font-medium text-[#4278b7] hover:underline">View ›</Link>
            </div>
          </div>
        ))}
        <nav aria-label="Player pages" className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#60758d]">
          <span>Showing {visible.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} ·</span>
          <button type="button" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} className="disabled:opacity-40 hover:underline">‹ Previous</button>
          <span>{currentPage} / {pageCount}</span>
          <button type="button" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} className="disabled:opacity-40 hover:underline">Next ›</button>
        </nav>
      </div>

      <div className="mt-4 hidden rounded-2xl bg-[#e5effa] p-6 text-[#1a3049] md:block">
        <h2 className="font-bold">How adding works</h2>
        <p className="mt-2 text-sm">1&nbsp; Search the whole Waverley Tennis system &nbsp; → &nbsp; 2&nbsp; Choose the right person (or create a new one only if they’re not there) &nbsp; → &nbsp; 3&nbsp; Done – then add them to a team.</p>
      </div>
    </section>
  );
}
