// Club administrator Help & Support content (hardcoded display for Sprint 2).
// Sources: User Stories Model v2.1, Sprint 2 planning and the Sprint 1 client review (Confluence),
// and the Sprint 2 Club Administration Figma screens. Wording matches those screens:
// Players → Add a player (1 Search → 2 Choose → 3 Done), Teams → Create team → Add players, Team manager.
// Each answer is a short sentence plus numbered `steps` or bullet `points`. Player FAQs stay in support-content.ts.
import { UTR_RESOURCES } from "./support-content";

export const CLUB_ADMIN_HELP_TOPICS = [
  { id: "players", title: "Find & Add Players", description: "Search first, choose the right person and avoid duplicate records." },
  { id: "membership", title: "Club Memberships", description: "Active and inactive memberships, primary clubs and kept history." },
  { id: "teams", title: "Teams & Squads", description: "Create season teams and add eligible club players." },
  { id: "managers", title: "Team Managers", description: "Assign, change or remove a manager for one team." },
  { id: "access", title: "Account & Privacy", description: "Your club access, player logins and protecting junior details." },
  { id: "results", title: "Fixtures & Results", description: "Viewing matches, score questions, notices and UTR." },
];

export const CLUB_ADMIN_HELP_FAQS = [
  {
    id: "link-player",
    topic: "players",
    title: "How do I add an existing player to my club?",
    content: "A player who joins another club keeps their existing record. To add them to your club:",
    steps: [
      "Go to Players and select ＋ Add a player.",
      "Search: enter the player’s full name, and their date of birth or email if you have them.",
      "Choose: select the result that matches the player, then select Add to my club.",
      "Done: the player keeps the same Player ID and history. You can then select Add to a team.",
    ],
  },
  {
    id: "result-labels",
    topic: "players",
    title: "What do the labels on search results mean?",
    content: "Each search result has a label that tells you what to do next.",
    points: [
      "In another club: the player already has a Player ID through another club. Select Add to my club.",
      "Possible match: the name or details are similar but not the same. Please check with the player before adding them.",
      "Already in your club: there is nothing to add. Open the player instead.",
      "The ticks show which details matched (name, date of birth or email). The details themselves are never shown.",
    ],
  },
  {
    id: "no-match",
    topic: "players",
    title: "What if the search finds no one?",
    content: "Only create a new player record when the player is not already in the registry.",
    steps: [
      "Check the spelling, and search again using the player’s date of birth or email.",
      "If no result matches the player, select Create new player.",
      "Complete the required details. For a player under 18, a parent or guardian email is required, and the login invitation is sent to that address.",
      "If a possible duplicate is shown before saving, go back to the results and review it.",
    ],
  },
  {
    id: "duplicate",
    topic: "players",
    title: "Two records look like the same player. Should I create another?",
    content: "No. Please do not create another record.",
    points: [
      "Send both Player IDs to the association and ask them to review the possible duplicate.",
      "Do not create a new record to fix a login problem.",
      "If the player is already in your club, keep using their existing membership.",
    ],
  },
  {
    id: "save-failed",
    topic: "players",
    title: "A save failed. What should I do before retrying?",
    content: "The first attempt may have saved, so please check before trying again.",
    steps: [
      "Check your Players list to see whether the player was added.",
      "Read the error message and correct any required fields.",
      "Try again.",
      "If it keeps failing, contact the association with the page, what you tried and the error message. Please do not create the player again.",
    ],
  },
  {
    id: "membership-team",
    topic: "membership",
    title: "Is club membership the same as being in a team?",
    content: "No. They are two separate things.",
    points: [
      "Club membership links the player’s record to your club and continues across seasons.",
      "A team belongs to one competition, season and section.",
      "Add the player to your club first, then add them to a team.",
      "Being in a squad is also different from being picked for a particular match.",
    ],
  },
  {
    id: "end-membership",
    topic: "membership",
    title: "What happens when I end a membership?",
    content: "Ending a membership does not delete the player. Their record, history and memberships at other clubs are kept. To end a membership:",
    steps: [
      "Check any current team commitments with the team manager.",
      "Go to Players, select View › for the player, then select End membership.",
      "Review the details and confirm. The membership becomes Inactive with an end date.",
    ],
    points: ["How ending a membership affects current squads is still being confirmed with the client."],
  },
  {
    id: "primary-club",
    topic: "membership",
    title: "Can a player belong to several clubs or change their primary club?",
    content: "Yes. A player can belong to several clubs and keeps one Player ID.",
    points: [
      "Their primary club looks after their personal details.",
      "Their other clubs show as Additional club.",
      "A change of primary club is arranged between the clubs involved and the association. The exact rules are still being confirmed.",
      "Never create a new player record when a player transfers.",
    ],
  },
  {
    id: "create-team",
    topic: "teams",
    title: "How do I create a team for a new season?",
    content: "Teams belong to a single season, so a new team is created each season. To create a team:",
    steps: [
      "Go to Teams and select ＋ Create team.",
      "Choose the competition, the season and a section with available places.",
      "Check the suggested team name. It must be unique within the section.",
      "Select Create team, then use ＋ Add players and Assign team manager.",
    ],
    points: ["If the season or section you need is not available, please contact the association."],
  },
  {
    id: "blocked-player",
    topic: "teams",
    title: "Why can’t I add a player to a team?",
    content: "Only your club’s players are listed. A player who can’t be added is greyed out with the reason, for example:",
    points: [
      "They are under the competition’s minimum age.",
      "Their membership is inactive.",
      "They are already in this squad.",
      "If the details are wrong, correct them, or ask the association about the competition rules. Finals and emergency player rules are not checked yet.",
    ],
  },
  {
    id: "fixture-selection",
    topic: "teams",
    title: "Does adding a player to the squad pick them for every match?",
    content: "No. The squad is the list of players who can play for the team.",
    points: ["The team manager picks the players for each match and arranges match day."],
  },
  {
    id: "assign-manager",
    topic: "managers",
    title: "How do I assign, change or remove a team manager?",
    content: "A team manager can only view and manage their own team. To assign or change a manager:",
    steps: [
      "Open the team and select Team manager.",
      "Search your club’s players and choose one person.",
      "Select Save manager.",
    ],
    points: [
      "To remove a manager, select Remove manager and confirm. Their access ends straight away, and the team and squad are kept.",
      "If a new manager can’t see the team, check their login email and contact the association.",
    ],
  },
  {
    id: "own-club",
    topic: "access",
    title: "Why can’t I see another club’s players or teams?",
    content: "Club administrators can only see and manage their own club.",
    points: [
      "A search can show that a player belongs to another club, but it never gives you access to that club.",
      "If your account shows the wrong club or is missing the club administrator role, please contact the association.",
    ],
  },
  {
    id: "login-help",
    topic: "access",
    title: "A player can’t log in. How can I help?",
    content: "Please check the following:",
    points: [
      "They are using the email your club registered for them, or their parent’s email for a junior player.",
      "That email belongs to the right player.",
      "Players don’t sign themselves up. They receive an invitation from their club.",
      "Online password reset isn’t available yet, so ask the association to help reset their access.",
      "Never ask a player for their password.",
    ],
  },
  {
    id: "junior-privacy",
    topic: "access",
    title: "How should I handle junior players’ details?",
    content: "Dates of birth and contact details are only shown to authorised club administrators and are never shown in search results.",
    points: [
      "Use these details only for club administration.",
      "When asking for help, send the Player ID instead of personal details.",
      "Remove dates of birth and contact details from any screenshots.",
    ],
  },
  {
    id: "fixture-change",
    topic: "results",
    title: "Who handles a changed fixture, missing venue or urgent notice?",
    content: "Please check Fixtures & Results and Notifications first.",
    points: [
      "The team manager handles match day arrangements.",
      "Draws, venues and schedule changes come from the association, so contact them if something looks wrong.",
      "Confirm urgent changes directly rather than relying on email alone.",
    ],
  },
  {
    id: "score-correction",
    topic: "results",
    title: "How do I report a missing or incorrect result?",
    content: "Club administrators can view fixtures and results, but cannot change them.",
    points: [
      "Team managers enter results, and the other team’s manager confirms them.",
      "To correct a confirmed result or settle a dispute, contact the association administrator.",
      "Include the competition, season, round, date, teams and the correct score.",
    ],
  },
  {
    id: "utr",
    topic: "results",
    title: "Can I change a player’s UTR?",
    content: "No. UTR is calculated by Universal Tennis, not Waverley Tennis, and it is separate from Waverley Tennis standings. Please refer players to these guides if their UTR looks wrong.",
    links: UTR_RESOURCES,
  },
];
