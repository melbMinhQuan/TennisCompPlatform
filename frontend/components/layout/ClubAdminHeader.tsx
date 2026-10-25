import type { RefObject } from "react";
import { Link } from "react-router";
import logo from "../../resources/Logo.png";

const ROLE_LABEL = "Club Administrator";

interface ClubAdminHeaderProps {
	displayName: string | null;
	clubName: string | null;
	initials: string;
	isMenuOpen: boolean;
	onOpenMenu: () => void;
	menuButtonRef: RefObject<HTMLButtonElement | null>;
}

export default function ClubAdminHeader({
	displayName,
	clubName,
	initials,
	isMenuOpen,
	onOpenMenu,
	menuButtonRef,
}: ClubAdminHeaderProps) {
	return (
		<header className="relative flex h-[72px] shrink-0 items-center bg-gradient-to-r from-[#1a3049] to-[#3f72af] px-4 min-[768px]:h-20 min-[768px]:justify-between min-[768px]:px-5">
			<button
				ref={menuButtonRef}
				type="button"
				aria-label="Open club admin menu"
				aria-expanded={isMenuOpen}
				aria-controls="mobile-club-admin-menu"
				onClick={onOpenMenu}
				className="relative z-10 flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-2 text-sm text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white min-[768px]:hidden"
			>
				<span aria-hidden="true">☰</span>
				<span>Menu</span>
			</button>

			<Link
				to="/club-admin"
				aria-label="Waverley Tennis club admin dashboard"
				className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 min-[768px]:static min-[768px]:translate-x-0 min-[768px]:translate-y-0"
			>
				<img
					src={logo}
					alt="Waverley Tennis"
					className="h-[54px] w-[132px] object-contain min-[768px]:h-[60px] min-[768px]:w-[170px] min-[768px]:object-left"
				/>
			</Link>

			{/* Mobile: the admin's initials with "Club Admin" underneath, beside the centred logo. */}
			<div
				role="img"
				aria-label={`${displayName ?? ROLE_LABEL}, ${ROLE_LABEL}`}
				className="relative z-10 ml-auto flex shrink-0 flex-col items-center gap-0.5 min-[768px]:hidden"
			>
				<span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-[#1a3049]">
					{initials}
				</span>
				<span className="whitespace-nowrap text-[11px] font-semibold text-white">Club Admin</span>
			</div>

			<div className="hidden items-center gap-3 min-[768px]:flex">
				<span
					aria-hidden="true"
					className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-semibold text-[#1a3049]"
				>
					{initials}
				</span>

				<div>
					<p className="text-sm font-semibold text-white">
						{displayName ?? ROLE_LABEL}
					</p>

					<p className="text-xs leading-5 text-[#d3e0ee]">
						{ROLE_LABEL}
						{clubName ? ` · ${clubName}` : ""}
					</p>
				</div>
			</div>
		</header>
	);
}
