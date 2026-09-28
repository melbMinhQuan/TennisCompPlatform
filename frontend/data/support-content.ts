export const HELP_TOPICS = [
  { id: "account", title: "Account & Player Profile", description: "Login problems, missing profiles, personal details, and duplicate profiles." },
  { id: "clubs", title: "Clubs & Teams", description: "Club and association memberships, primary clubs, and team assignments." },
  { id: "competitions", title: "Competitions & Eligibility", description: "Seasons, sections and grades, registration, and emergency players." },
  { id: "fixtures", title: "Fixtures & Scheduling", description: "Upcoming fixtures, home and away teams, rounds, venues, and cancellations." },
  { id: "results", title: "Scores & Results", description: "Individual scores, finalised results, missing results, and corrections." },
  { id: "ratings", title: "Ratings & Statistics", description: "UTR, ladders and standings, personal match totals, and unavailable statistics." },
];

export const UTR_RESOURCES = [
  { label: "Waverley Tennis UTR FAQ", url: "https://www.waverleytennis.asn.au/utr.html" },
  { label: "TROLS / UTR FAQs", url: "https://trols.org.au/trols_utr_faq.html" },
];

export const HELP_FAQS = [
  {
    "id": "missing-profile",
    "topic": "account",
    "title": "I can log in, but my player profile is missing. What should I do?",
    "content": "Your account may not yet be linked to a player profile. Contact your club administrator with your name and account email so they can investigate."
  },
  {
    "id": "login-problems",
    "topic": "account",
    "title": "I can't log in. What should I check?",
    "content": "Use the email address your club registered for you, and check that your password is typed correctly (passwords are case-sensitive). Password reset is not available in this version, so if you still can't log in, contact your club administrator."
  },
  {
    "id": "personal-details",
    "topic": "account",
    "title": "How do I update my name, date of birth, email, or phone number?",
    "content": "Your player details are managed by your club, not edited by players. Ask your club administrator to update them. If you belong to more than one club, contact your primary club."
  },
  {
    "id": "duplicate-profile",
    "topic": "account",
    "title": "I think I have two player profiles.",
    "content": "Each player should have one record across all clubs, competitions, and associations. Tell your club administrator which profiles look like duplicates. They can ask the association to review them, and the profiles are only merged once both sides confirm they belong to the same person."
  },
  {
    "id": "club-team",
    "topic": "clubs",
    "title": "My club or team details are incorrect.",
    "content": "Contact your club administrator and provide the club, team, and season involved."
  },
  {
    "id": "multiple-memberships",
    "topic": "clubs",
    "title": "Can I belong to more than one club or association?",
    "content": "Yes. One player record can be linked to several clubs and associations, and you can play for different clubs in different competitions. One of your clubs is your primary club, which is responsible for keeping your player details up to date."
  },
  {
    "id": "primary-club",
    "topic": "clubs",
    "title": "How do I change my primary club?",
    "content": "Ask your club administrator. Changing your primary club is arranged between the clubs involved, so let both clubs know."
  },
  {
    "id": "team-assignment",
    "topic": "clubs",
    "title": "Why am I not listed in a team?",
    "content": "Teams are created each season, and your club chooses which of its players are in each team. If you expected to be in a team, ask your club administrator or team manager."
  },
  {
    "id": "team-fixture",
    "topic": "fixtures",
    "title": "Does an upcoming team fixture mean I am selected to play?",
    "content": "Upcoming fixtures show your team’s schedule. Confirm your individual selection with your team manager."
  },
  {
    "id": "venue-time",
    "topic": "fixtures",
    "title": "The fixture has no venue or start time. What should I do?",
    "content": "Confirm the details with your team manager before travelling."
  },
  {
    "id": "cannot-attend",
    "topic": "fixtures",
    "title": "What should I do if I cannot attend my match?",
    "content": "Contact your team manager as soon as possible so they can arrange a replacement if needed."
  },
  {
    "id": "fixture-changes",
    "topic": "fixtures",
    "title": "How do I check if my match time or venue has changed, or if it has been cancelled?",
    "content": "Contact your team manager to confirm the latest match date, time, venue, or cancellation before travelling."
  },
  {
    "id": "missing-result",
    "topic": "results",
    "title": "Why is a recent result missing?",
    "content": "Personal results appear when the result is finalised and your participation is recorded. Ask your team manager to check the result."
  },
  {
    "id": "incorrect-score",
    "topic": "results",
    "title": "How do I report an incorrect score?",
    "content": "Provide the competition, round, teams, match date, and the score you believe is correct to your team manager or competition organiser."
  },
  {
    "id": "match-total",
    "topic": "ratings",
    "title": "Why is my match total different from my team’s fixture count?",
    "content": "Your personal total counts finalised singles and doubles matches in which you participated. A team fixture can contain several individual matches."
  },
  {
    "id": "utr",
    "topic": "ratings",
    "title": "Why is my UTR rating or history unavailable?",
    "content": "On this website, a rating may not yet be recorded for your profile, and rating history is not currently available in this version. For Waverley results on UTR Sports, new results can take time to appear because they are transferred in batches. Red, orange, and green-dot ball matches are not submitted for UTR ratings; eligible yellow-ball competition results are uploaded. See the FAQs below for more information.",
    "links": UTR_RESOURCES
  },
  {
    "id": "utr-overview",
    "topic": "ratings",
    "title": "What is UTR and how does Waverley Tennis use it?",
    "content": "UTR is a results-based tennis rating that considers opponents, games won, and recent match results. Waverley Tennis sends eligible competition results to UTR Sports through TROLS so they can contribute to player ratings. For more information about ratings, accounts, and claiming your results, visit these guides.",
    "links": UTR_RESOURCES
  },
  {
    "id": "utr-updates",
    "topic": "ratings",
    "title": "Why is my rating in TROLS different from UTR Sports?",
    "content": "TROLS says it downloads ratings weekly, while UTR Sports recalculates ratings daily as results change. The two sites can therefore show different values. Result uploads may also be delayed by holidays or processing schedules. This describes TROLS, not a guaranteed update schedule for this website.",
    "links": [UTR_RESOURCES[1]]
  },
  {
    "id": "statistics",
    "topic": "ratings",
    "title": "Why are some statistics blank?",
    "content": "Some statistics do not yet have enough supported data to display. An unavailable value does not mean zero."
  },
  {
    "id": "ladder-premiers",
    "topic": "ratings",
    "title": "Why isn't the team at the top of the ladder the premiers?",
    "content": "The ladder shows the home-and-away rounds only. After those rounds, the top teams play finals, and the team that wins the Grand Final are the premiers. For past seasons, Standings & Rankings shows the premiers and runners-up above the ladder."
  },
  {
    "id": "better-than",
    "topic": "ratings",
    "title": "What does \"Better than 60%\" mean in UTR rankings?",
    "content": "It means your UTR is higher than 60% of players in that ranking group, such as Waverley Tennis adult singles. It compares you only with that group on the selected date, not with every player in the world. UTR ratings are supplied by Universal Tennis; Waverley Tennis does not calculate them."
  },
  {
    "id": "few-matches",
    "topic": "ratings",
    "title": "Why is a player with only a few matches high on player standings?",
    "content": "Player standings are ordered by win percentage, so a player who won their only rubber shows 100%. Check the Rubbers played column to see how many rubbers each percentage is based on."
  },
  {
    "id": "eligibility",
    "topic": "competitions",
    "title": "How do I check competition eligibility?",
    "content": "Ask your club administrator or competition organiser about the rules for your competition and grade."
  },
  {
    "id": "registration",
    "topic": "competitions",
    "title": "How do I register for a competition?",
    "content": "Players don't enter competitions themselves. Your club enters its teams and selects the players for each team. Contact your club administrator if you would like to play."
  },
  {
    "id": "seasons-sections",
    "topic": "competitions",
    "title": "What are seasons, sections, and grades?",
    "content": "Each competition runs in seasons, for example Winter and Summer. Each season is split into sections (also called grades) of teams of a similar standard, and your team plays the other teams in its section."
  },
  {
    "id": "emergency-players",
    "topic": "competitions",
    "title": "What is an emergency player?",
    "content": "An emergency player fills in when a team is short of players. The rules depend on the competition. For example, in Weekend Senior an emergency must not strengthen the team or play for another club in the same competition, and is marked with (E) on the scoresheet. Check with your team manager before playing as an emergency."
  }
];
