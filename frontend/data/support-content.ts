export const HELP_TOPICS = [
  { id: "account", title: "Account & Player Profile", description: "Login problems, missing profiles, personal details, and duplicate profiles." },
  { id: "clubs", title: "Clubs & Teams", description: "Club and association memberships, primary clubs, and team assignments." },
  { id: "competitions", title: "Competitions & Eligibility", description: "Seasons, sections and grades, registration, and emergency players." },
  { id: "fixtures", title: "Fixtures & Scheduling", description: "Upcoming fixtures, home and away teams, rounds, venues, and cancellations." },
  { id: "results", title: "Scores & Results", description: "Individual scores, finalised results, missing results, and corrections." },
  { id: "ratings", title: "Ratings & Statistics", description: "UTR, rating history, personal match totals, and unavailable statistics." },
];

const UTR_RESOURCES = [
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
    "id": "club-team",
    "topic": "clubs",
    "title": "My club or team details are incorrect.",
    "content": "Contact your club administrator and provide the club, team, and season involved."
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
    "content": "In TennisComp, a rating may not yet be recorded for your profile, and rating history is not currently available in this version. For Waverley results on UTR Sports, new results can take time to appear because they are transferred in batches. Red, orange, and green-dot ball matches are not submitted for UTR ratings; eligible yellow-ball competition results are uploaded. See the FAQs below for more information.",
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
    "content": "TROLS says it downloads ratings weekly, while UTR Sports recalculates ratings daily as results change. The two sites can therefore show different values. Result uploads may also be delayed by holidays or processing schedules. This describes TROLS, not a guaranteed update schedule for TennisComp.",
    "links": [UTR_RESOURCES[1]]
  },
  {
    "id": "statistics",
    "topic": "ratings",
    "title": "Why are some statistics blank?",
    "content": "Some statistics do not yet have enough supported data to display. An unavailable value does not mean zero."
  },
  {
    "id": "eligibility",
    "topic": "competitions",
    "title": "How do I check competition eligibility?",
    "content": "Ask your club administrator or competition organiser about the rules for your competition and grade."
  }
];
