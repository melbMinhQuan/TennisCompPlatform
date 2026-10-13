// This is the mock data for the Club Admin Players page. 
// Generated from backend/prisma/competition_data.xlsx. Do not edit records by hand.
// The IDs and relationships match the source workbook.
import type { ClubAdminPlayer, ClubAdminClub, ClubAdminMembership, ClubAdminTeam, ClubAdminTeamPlayer } from "../types/clubAdminPlayer";

export const mockPlayers: ClubAdminPlayer[] = [
  {
    "id": "PLR001",
    "firstName": "Raj",
    "lastName": "Mitchell",
    "dateOfBirth": "1979-01-01",
    "email": "raj.mitchell001@players.example",
    "phone": "0494 479 386",
    "status": "ACTIVE"
  },
  {
    "id": "PLR002",
    "firstName": "Mia",
    "lastName": "Coleman",
    "dateOfBirth": "1980-02-02",
    "email": "mia.coleman002@players.example",
    "phone": "0471 070 703",
    "status": "ACTIVE"
  },
  {
    "id": "PLR003",
    "firstName": "Yuki",
    "lastName": "Smith",
    "dateOfBirth": "1981-03-03",
    "email": "yuki.smith003@players.example",
    "phone": "0439 878 676",
    "status": "ACTIVE"
  },
  {
    "id": "PLR004",
    "firstName": "Charlotte",
    "lastName": "Reed",
    "dateOfBirth": "1982-04-04",
    "email": "charlotte.reed004@players.example",
    "phone": "0487 105 004",
    "status": "ACTIVE"
  },
  {
    "id": "PLR005",
    "firstName": "Chloe",
    "lastName": "Cooper",
    "dateOfBirth": "1983-05-05",
    "email": "chloe.cooper005@players.example",
    "phone": "0478 027 095",
    "status": "ACTIVE"
  },
  {
    "id": "PLR006",
    "firstName": "Ethan",
    "lastName": "Wright",
    "dateOfBirth": "1984-06-06",
    "email": "ethan.wright006@players.example",
    "phone": "0440 532 780",
    "status": "ACTIVE"
  },
  {
    "id": "PLR007",
    "firstName": "Ava",
    "lastName": "Clark",
    "dateOfBirth": "1985-07-07",
    "email": "ava.clark007@players.example",
    "phone": "0455 112 375",
    "status": "ACTIVE"
  },
  {
    "id": "PLR008",
    "firstName": "Yuki",
    "lastName": "Green",
    "dateOfBirth": "1986-08-08",
    "email": "yuki.green008@players.example",
    "phone": "0456 500 912",
    "status": "ACTIVE"
  },
  {
    "id": "PLR009",
    "firstName": "Elsa",
    "lastName": "Hill",
    "dateOfBirth": "1987-09-09",
    "email": "elsa.hill009@players.example",
    "phone": "0456 201 241",
    "status": "ACTIVE"
  },
  {
    "id": "PLR010",
    "firstName": "Hiro",
    "lastName": "Parker",
    "dateOfBirth": "1988-10-10",
    "email": "hiro.parker010@players.example",
    "phone": "0484 425 203",
    "status": "ACTIVE"
  },
  {
    "id": "PLR011",
    "firstName": "Jun",
    "lastName": "Murphy",
    "dateOfBirth": "1989-11-11",
    "email": "jun.murphy011@players.example",
    "phone": "0440 380 054",
    "status": "ACTIVE"
  },
  {
    "id": "PLR012",
    "firstName": "Lucas",
    "lastName": "Brooks",
    "dateOfBirth": "1990-12-12",
    "email": "lucas.brooks012@players.example",
    "phone": "0411 607 939",
    "status": "ACTIVE"
  },
  {
    "id": "PLR013",
    "firstName": "Emily",
    "lastName": "Jenkins",
    "dateOfBirth": "1991-01-13",
    "email": "emily.jenkins013@players.example",
    "phone": "0433 203 987",
    "status": "ACTIVE"
  },
  {
    "id": "PLR014",
    "firstName": "Zara",
    "lastName": "Adams",
    "dateOfBirth": "1992-02-14",
    "email": "zara.adams014@players.example",
    "phone": "0460 306 690",
    "status": "ACTIVE"
  },
  {
    "id": "PLR015",
    "firstName": "Hiro",
    "lastName": "Mitchell",
    "dateOfBirth": "1993-03-15",
    "email": "hiro.mitchell015@players.example",
    "phone": "0499 029 540",
    "status": "ACTIVE"
  },
  {
    "id": "PLR016",
    "firstName": "Henry",
    "lastName": "Barnes",
    "dateOfBirth": "1994-04-16",
    "email": "henry.barnes016@players.example",
    "phone": "0443 156 273",
    "status": "ACTIVE"
  },
  {
    "id": "PLR017",
    "firstName": "Oliver",
    "lastName": "Evans",
    "dateOfBirth": "1995-05-17",
    "email": "oliver.evans017@players.example",
    "phone": "0460 489 465",
    "status": "ACTIVE"
  },
  {
    "id": "PLR018",
    "firstName": "Ruby",
    "lastName": "Mitchell",
    "dateOfBirth": "1996-06-18",
    "email": "ruby.mitchell018@players.example",
    "phone": "0429 312 220",
    "status": "ACTIVE"
  },
  {
    "id": "PLR019",
    "firstName": "Mia",
    "lastName": "Mitchell",
    "dateOfBirth": "1997-07-19",
    "email": "mia.mitchell019@players.example",
    "phone": "0477 295 151",
    "status": "ACTIVE"
  },
  {
    "id": "PLR020",
    "firstName": "Diego",
    "lastName": "Parker",
    "dateOfBirth": "1998-08-20",
    "email": "diego.parker020@players.example",
    "phone": "0434 204 524",
    "status": "ACTIVE"
  },
  {
    "id": "PLR021",
    "firstName": "Daniel",
    "lastName": "Hill",
    "dateOfBirth": "1999-09-21",
    "email": "daniel.hill021@players.example",
    "phone": "0491 105 346",
    "status": "ACTIVE"
  },
  {
    "id": "PLR022",
    "firstName": "Elena",
    "lastName": "Roberts",
    "dateOfBirth": "2000-10-22",
    "email": "elena.roberts022@players.example",
    "phone": "0458 623 736",
    "status": "ACTIVE"
  },
  {
    "id": "PLR023",
    "firstName": "Mei",
    "lastName": "Tran",
    "dateOfBirth": "2001-11-23",
    "email": "mei.tran023@players.example",
    "phone": "0414 387 738",
    "status": "ACTIVE"
  },
  {
    "id": "PLR024",
    "firstName": "William",
    "lastName": "Turner",
    "dateOfBirth": "2002-12-24",
    "email": "william.turner024@players.example",
    "phone": "0485 002 447",
    "status": "ACTIVE"
  },
  {
    "id": "PLR025",
    "firstName": "Nour",
    "lastName": "Parker",
    "dateOfBirth": "2003-01-25",
    "email": "nour.parker025@players.example",
    "phone": "0411 499 645",
    "status": "ACTIVE"
  },
  {
    "id": "PLR026",
    "firstName": "Hiro",
    "lastName": "Mitchell",
    "dateOfBirth": "2004-02-26",
    "email": "hiro.mitchell026@players.example",
    "phone": "0465 877 067",
    "status": "ACTIVE"
  },
  {
    "id": "PLR027",
    "firstName": "Lucas",
    "lastName": "Chen",
    "dateOfBirth": "1979-03-27",
    "email": "lucas.chen027@players.example",
    "phone": "0417 270 966",
    "status": "ACTIVE"
  },
  {
    "id": "PLR028",
    "firstName": "Mei",
    "lastName": "Phillips",
    "dateOfBirth": "1980-04-28",
    "email": "mei.phillips028@players.example",
    "phone": "0492 345 395",
    "status": "ACTIVE"
  },
  {
    "id": "PLR029",
    "firstName": "Thomas",
    "lastName": "Mitchell",
    "dateOfBirth": "1981-05-01",
    "email": "thomas.mitchell029@players.example",
    "phone": "0480 657 482",
    "status": "ACTIVE"
  },
  {
    "id": "PLR030",
    "firstName": "Noah",
    "lastName": "Wright",
    "dateOfBirth": "1982-06-02",
    "email": "noah.wright030@players.example",
    "phone": "0463 139 842",
    "status": "ACTIVE"
  },
  {
    "id": "PLR031",
    "firstName": "Ben",
    "lastName": "Walker",
    "dateOfBirth": "1983-07-03",
    "email": "ben.walker031@players.example",
    "phone": "0496 145 760",
    "status": "ACTIVE"
  },
  {
    "id": "PLR032",
    "firstName": "Grace",
    "lastName": "Hill",
    "dateOfBirth": "1984-08-04",
    "email": "grace.hill032@players.example",
    "phone": "0465 732 239",
    "status": "ACTIVE"
  },
  {
    "id": "PLR033",
    "firstName": "Zara",
    "lastName": "Evans",
    "dateOfBirth": "1985-09-05",
    "email": "zara.evans033@players.example",
    "phone": "0434 186 659",
    "status": "ACTIVE"
  },
  {
    "id": "PLR034",
    "firstName": "Emily",
    "lastName": "Wilson",
    "dateOfBirth": "1986-10-06",
    "email": "emily.wilson034@players.example",
    "phone": "0476 920 793",
    "status": "ACTIVE"
  },
  {
    "id": "PLR035",
    "firstName": "Samuel",
    "lastName": "Smith",
    "dateOfBirth": "1987-11-07",
    "email": "samuel.smith035@players.example",
    "phone": "0413 136 039",
    "status": "ACTIVE"
  },
  {
    "id": "PLR036",
    "firstName": "Lara",
    "lastName": "Green",
    "dateOfBirth": "1988-12-08",
    "email": "lara.green036@players.example",
    "phone": "0453 718 125",
    "status": "ACTIVE"
  },
  {
    "id": "PLR037",
    "firstName": "Chloe",
    "lastName": "Parker",
    "dateOfBirth": "1989-01-09",
    "email": "chloe.parker037@players.example",
    "phone": "0472 827 533",
    "status": "ACTIVE"
  },
  {
    "id": "PLR038",
    "firstName": "Claire",
    "lastName": "Carter",
    "dateOfBirth": "1990-02-10",
    "email": "claire.carter038@players.example",
    "phone": "0472 758 107",
    "status": "ACTIVE"
  },
  {
    "id": "PLR039",
    "firstName": "Noah",
    "lastName": "Parker",
    "dateOfBirth": "1991-03-11",
    "email": "noah.parker039@players.example",
    "phone": "0435 228 095",
    "status": "ACTIVE"
  },
  {
    "id": "PLR040",
    "firstName": "Yuki",
    "lastName": "Henderson",
    "dateOfBirth": "1992-04-12",
    "email": "yuki.henderson040@players.example",
    "phone": "0453 319 929",
    "status": "ACTIVE"
  },
  {
    "id": "PLR041",
    "firstName": "Sana",
    "lastName": "Brown",
    "dateOfBirth": "1993-05-13",
    "email": "sana.brown041@players.example",
    "phone": "0488 082 980",
    "status": "ACTIVE"
  },
  {
    "id": "PLR042",
    "firstName": "Felix",
    "lastName": "Turner",
    "dateOfBirth": "1994-06-14",
    "email": "felix.turner042@players.example",
    "phone": "0460 548 145",
    "status": "ACTIVE"
  },
  {
    "id": "PLR043",
    "firstName": "Tara",
    "lastName": "Barnes",
    "dateOfBirth": "1995-07-15",
    "email": "tara.barnes043@players.example",
    "phone": "0460 961 753",
    "status": "ACTIVE"
  },
  {
    "id": "PLR044",
    "firstName": "Thomas",
    "lastName": "Wood",
    "dateOfBirth": "1996-08-16",
    "email": "thomas.wood044@players.example",
    "phone": "0492 269 171",
    "status": "ACTIVE"
  },
  {
    "id": "PLR045",
    "firstName": "Mia",
    "lastName": "Rivera",
    "dateOfBirth": "1997-09-17",
    "email": "mia.rivera045@players.example",
    "phone": "0490 879 174",
    "status": "ACTIVE"
  },
  {
    "id": "PLR046",
    "firstName": "Nour",
    "lastName": "Ward",
    "dateOfBirth": "1998-10-18",
    "email": "nour.ward046@players.example",
    "phone": "0417 688 934",
    "status": "ACTIVE"
  },
  {
    "id": "PLR047",
    "firstName": "Thomas",
    "lastName": "Baker",
    "dateOfBirth": "1999-11-19",
    "email": "thomas.baker047@players.example",
    "phone": "0418 428 071",
    "status": "ACTIVE"
  },
  {
    "id": "PLR048",
    "firstName": "Hannah",
    "lastName": "Bennett",
    "dateOfBirth": "2000-12-20",
    "email": "hannah.bennett048@players.example",
    "phone": "0419 727 730",
    "status": "ACTIVE"
  },
  {
    "id": "PLR049",
    "firstName": "Yuki",
    "lastName": "King",
    "dateOfBirth": "2001-01-21",
    "email": "yuki.king049@players.example",
    "phone": "0469 955 666",
    "status": "ACTIVE"
  },
  {
    "id": "PLR050",
    "firstName": "Sana",
    "lastName": "Cooper",
    "dateOfBirth": "2002-02-22",
    "email": "sana.cooper050@players.example",
    "phone": "0422 255 072",
    "status": "ACTIVE"
  },
  {
    "id": "PLR051",
    "firstName": "Amelia",
    "lastName": "Lee",
    "dateOfBirth": "2003-03-23",
    "email": "amelia.lee051@players.example",
    "phone": "0477 531 945",
    "status": "ACTIVE"
  },
  {
    "id": "PLR052",
    "firstName": "Sana",
    "lastName": "Mitchell",
    "dateOfBirth": "2004-04-24",
    "email": "sana.mitchell052@players.example",
    "phone": "0434 600 454",
    "status": "ACTIVE"
  },
  {
    "id": "PLR053",
    "firstName": "Felix",
    "lastName": "Adams",
    "dateOfBirth": "1979-05-25",
    "email": "felix.adams053@players.example",
    "phone": "0419 253 015",
    "status": "ACTIVE"
  },
  {
    "id": "PLR054",
    "firstName": "Kai",
    "lastName": "Roberts",
    "dateOfBirth": "1980-06-26",
    "email": "kai.roberts054@players.example",
    "phone": "0464 757 542",
    "status": "ACTIVE"
  },
  {
    "id": "PLR055",
    "firstName": "Thomas",
    "lastName": "Kelly",
    "dateOfBirth": "1981-07-27",
    "email": "thomas.kelly055@players.example",
    "phone": "0451 211 413",
    "status": "ACTIVE"
  },
  {
    "id": "PLR056",
    "firstName": "Ruby",
    "lastName": "Chen",
    "dateOfBirth": "1982-08-28",
    "email": "ruby.chen056@players.example",
    "phone": "0439 779 072",
    "status": "ACTIVE"
  },
  {
    "id": "PLR057",
    "firstName": "Elena",
    "lastName": "Walker",
    "dateOfBirth": "1983-09-01",
    "email": "elena.walker057@players.example",
    "phone": "0479 640 929",
    "status": "ACTIVE"
  },
  {
    "id": "PLR058",
    "firstName": "Samuel",
    "lastName": "Watson",
    "dateOfBirth": "1984-10-02",
    "email": "samuel.watson058@players.example",
    "phone": "0412 960 888",
    "status": "ACTIVE"
  },
  {
    "id": "PLR059",
    "firstName": "Niko",
    "lastName": "Brooks",
    "dateOfBirth": "1985-11-03",
    "email": "niko.brooks059@players.example",
    "phone": "0438 779 513",
    "status": "ACTIVE"
  },
  {
    "id": "PLR060",
    "firstName": "Ethan",
    "lastName": "Wood",
    "dateOfBirth": "1986-12-04",
    "email": "ethan.wood060@players.example",
    "phone": "0461 374 487",
    "status": "ACTIVE"
  },
  {
    "id": "PLR061",
    "firstName": "Grace",
    "lastName": "Reed",
    "dateOfBirth": "1987-01-05",
    "email": "grace.reed061@players.example",
    "phone": "0469 052 795",
    "status": "ACTIVE"
  },
  {
    "id": "PLR062",
    "firstName": "Hiro",
    "lastName": "Scott",
    "dateOfBirth": "1988-02-06",
    "email": "hiro.scott062@players.example",
    "phone": "0473 490 457",
    "status": "ACTIVE"
  },
  {
    "id": "PLR063",
    "firstName": "Wei",
    "lastName": "Nguyen",
    "dateOfBirth": "1989-03-07",
    "email": "wei.nguyen063@players.example",
    "phone": "0482 759 710",
    "status": "ACTIVE"
  },
  {
    "id": "PLR064",
    "firstName": "Thomas",
    "lastName": "Taylor",
    "dateOfBirth": "1990-04-08",
    "email": "thomas.taylor064@players.example",
    "phone": "0434 007 638",
    "status": "ACTIVE"
  },
  {
    "id": "PLR065",
    "firstName": "Samuel",
    "lastName": "Parker",
    "dateOfBirth": "1991-05-09",
    "email": "samuel.parker065@players.example",
    "phone": "0448 491 288",
    "status": "ACTIVE"
  },
  {
    "id": "PLR066",
    "firstName": "James",
    "lastName": "Wilson",
    "dateOfBirth": "1992-06-10",
    "email": "james.wilson066@players.example",
    "phone": "0440 714 360",
    "status": "ACTIVE"
  },
  {
    "id": "PLR067",
    "firstName": "Jun",
    "lastName": "Nguyen",
    "dateOfBirth": "1993-07-11",
    "email": "jun.nguyen067@players.example",
    "phone": "0412 604 805",
    "status": "ACTIVE"
  },
  {
    "id": "PLR068",
    "firstName": "Daniel",
    "lastName": "Walker",
    "dateOfBirth": "1994-08-12",
    "email": "daniel.walker068@players.example",
    "phone": "0440 080 809",
    "status": "ACTIVE"
  },
  {
    "id": "PLR069",
    "firstName": "Raj",
    "lastName": "Ross",
    "dateOfBirth": "1995-09-13",
    "email": "raj.ross069@players.example",
    "phone": "0431 571 766",
    "status": "ACTIVE"
  },
  {
    "id": "PLR070",
    "firstName": "Hannah",
    "lastName": "Watson",
    "dateOfBirth": "1996-10-14",
    "email": "hannah.watson070@players.example",
    "phone": "0431 430 779",
    "status": "ACTIVE"
  },
  {
    "id": "PLR071",
    "firstName": "Thomas",
    "lastName": "Nguyen",
    "dateOfBirth": "1997-11-15",
    "email": "thomas.nguyen071@players.example",
    "phone": "0436 669 071",
    "status": "ACTIVE"
  },
  {
    "id": "PLR072",
    "firstName": "Elsa",
    "lastName": "Coleman",
    "dateOfBirth": "1998-12-16",
    "email": "elsa.coleman072@players.example",
    "phone": "0474 551 912",
    "status": "ACTIVE"
  },
  {
    "id": "PLR073",
    "firstName": "James",
    "lastName": "Cox",
    "dateOfBirth": "1999-01-17",
    "email": "james.cox073@players.example",
    "phone": "0473 594 937",
    "status": "ACTIVE"
  },
  {
    "id": "PLR074",
    "firstName": "Ethan",
    "lastName": "Campbell",
    "dateOfBirth": "2000-02-18",
    "email": "ethan.campbell074@players.example",
    "phone": "0422 943 146",
    "status": "ACTIVE"
  },
  {
    "id": "PLR075",
    "firstName": "Niko",
    "lastName": "Tran",
    "dateOfBirth": "2001-03-19",
    "email": "niko.tran075@players.example",
    "phone": "0421 866 338",
    "status": "ACTIVE"
  },
  {
    "id": "PLR076",
    "firstName": "Grace",
    "lastName": "Henderson",
    "dateOfBirth": "2002-04-20",
    "email": "grace.henderson076@players.example",
    "phone": "0492 878 031",
    "status": "ACTIVE"
  },
  {
    "id": "PLR077",
    "firstName": "Nour",
    "lastName": "Nguyen",
    "dateOfBirth": "2003-05-21",
    "email": "nour.nguyen077@players.example",
    "phone": "0427 386 749",
    "status": "ACTIVE"
  },
  {
    "id": "PLR078",
    "firstName": "Daniel",
    "lastName": "Mitchell",
    "dateOfBirth": "2004-06-22",
    "email": "daniel.mitchell078@players.example",
    "phone": "0436 587 425",
    "status": "ACTIVE"
  },
  {
    "id": "PLR079",
    "firstName": "Thomas",
    "lastName": "Price",
    "dateOfBirth": "1979-07-23",
    "email": "thomas.price079@players.example",
    "phone": "0449 072 327",
    "status": "ACTIVE"
  },
  {
    "id": "PLR080",
    "firstName": "Priya",
    "lastName": "Wright",
    "dateOfBirth": "1980-08-24",
    "email": "priya.wright080@players.example",
    "phone": "0469 748 119",
    "status": "ACTIVE"
  },
  {
    "id": "PLR081",
    "firstName": "Ali",
    "lastName": "Cox",
    "dateOfBirth": "1981-09-25",
    "email": "ali.cox081@players.example",
    "phone": "0442 342 039",
    "status": "ACTIVE"
  },
  {
    "id": "PLR082",
    "firstName": "Lara",
    "lastName": "Bennett",
    "dateOfBirth": "1982-10-26",
    "email": "lara.bennett082@players.example",
    "phone": "0454 130 151",
    "status": "ACTIVE"
  },
  {
    "id": "PLR083",
    "firstName": "Lara",
    "lastName": "Reed",
    "dateOfBirth": "1983-11-27",
    "email": "lara.reed083@players.example",
    "phone": "0431 204 660",
    "status": "ACTIVE"
  },
  {
    "id": "PLR084",
    "firstName": "Iris",
    "lastName": "Brown",
    "dateOfBirth": "1984-12-28",
    "email": "iris.brown084@players.example",
    "phone": "0498 170 345",
    "status": "ACTIVE"
  },
  {
    "id": "PLR085",
    "firstName": "Amelia",
    "lastName": "Smith",
    "dateOfBirth": "1985-01-01",
    "email": "amelia.smith085@players.example",
    "phone": "0489 631 974",
    "status": "ACTIVE"
  },
  {
    "id": "PLR086",
    "firstName": "Henry",
    "lastName": "Wright",
    "dateOfBirth": "1986-02-02",
    "email": "henry.wright086@players.example",
    "phone": "0418 826 026",
    "status": "ACTIVE"
  },
  {
    "id": "PLR087",
    "firstName": "Isla",
    "lastName": "Cox",
    "dateOfBirth": "1987-03-03",
    "email": "isla.cox087@players.example",
    "phone": "0479 845 132",
    "status": "ACTIVE"
  },
  {
    "id": "PLR088",
    "firstName": "Freya",
    "lastName": "Coleman",
    "dateOfBirth": "1988-04-04",
    "email": "freya.coleman088@players.example",
    "phone": "0411 921 549",
    "status": "ACTIVE"
  },
  {
    "id": "PLR089",
    "firstName": "Freya",
    "lastName": "Bennett",
    "dateOfBirth": "1989-05-05",
    "email": "freya.bennett089@players.example",
    "phone": "0420 769 971",
    "status": "ACTIVE"
  },
  {
    "id": "PLR090",
    "firstName": "Wei",
    "lastName": "Scott",
    "dateOfBirth": "1990-06-06",
    "email": "wei.scott090@players.example",
    "phone": "0499 383 152",
    "status": "ACTIVE"
  },
  {
    "id": "PLR091",
    "firstName": "Amelia",
    "lastName": "Lee",
    "dateOfBirth": "1991-07-07",
    "email": "amelia.lee091@players.example",
    "phone": "0444 494 354",
    "status": "ACTIVE"
  },
  {
    "id": "PLR092",
    "firstName": "Hiro",
    "lastName": "Martin",
    "dateOfBirth": "1992-08-08",
    "email": "hiro.martin092@players.example",
    "phone": "0414 483 809",
    "status": "ACTIVE"
  },
  {
    "id": "PLR093",
    "firstName": "Tara",
    "lastName": "Walker",
    "dateOfBirth": "1993-09-09",
    "email": "tara.walker093@players.example",
    "phone": "0465 563 953",
    "status": "ACTIVE"
  },
  {
    "id": "PLR094",
    "firstName": "Ruby",
    "lastName": "Young",
    "dateOfBirth": "1994-10-10",
    "email": "ruby.young094@players.example",
    "phone": "0471 235 772",
    "status": "ACTIVE"
  },
  {
    "id": "PLR095",
    "firstName": "Lara",
    "lastName": "Adams",
    "dateOfBirth": "1995-11-11",
    "email": "lara.adams095@players.example",
    "phone": "0443 248 418",
    "status": "ACTIVE"
  },
  {
    "id": "PLR096",
    "firstName": "Marco",
    "lastName": "White",
    "dateOfBirth": "1996-12-12",
    "email": "marco.white096@players.example",
    "phone": "0480 997 026",
    "status": "ACTIVE"
  },
  {
    "id": "PLR097",
    "firstName": "Sana",
    "lastName": "Barnes",
    "dateOfBirth": "1997-01-13",
    "email": "sana.barnes097@players.example",
    "phone": "0439 157 590",
    "status": "ACTIVE"
  },
  {
    "id": "PLR098",
    "firstName": "Luna",
    "lastName": "Taylor",
    "dateOfBirth": "1998-02-14",
    "email": "luna.taylor098@players.example",
    "phone": "0415 417 025",
    "status": "ACTIVE"
  },
  {
    "id": "PLR099",
    "firstName": "Kai",
    "lastName": "Nguyen",
    "dateOfBirth": "1999-03-15",
    "email": "kai.nguyen099@players.example",
    "phone": "0434 486 338",
    "status": "ACTIVE"
  },
  {
    "id": "PLR100",
    "firstName": "Diego",
    "lastName": "Brooks",
    "dateOfBirth": "2000-04-16",
    "email": "diego.brooks100@players.example",
    "phone": "0413 236 258",
    "status": "ACTIVE"
  }
];

export const mockClubs: ClubAdminClub[] = [
  {
    "id": "CLB01",
    "name": "Glen Waverley Tennis Club"
  },
  {
    "id": "CLB02",
    "name": "Mount Waverley Tennis Club"
  },
  {
    "id": "CLB03",
    "name": "Syndal Tennis Club"
  },
  {
    "id": "CLB04",
    "name": "Pinewood Tennis Club"
  },
  {
    "id": "CLB05",
    "name": "Wheelers Hill Tennis Club"
  },
  {
    "id": "CLB06",
    "name": "Mulgrave Tennis Club"
  },
  {
    "id": "CLB07",
    "name": "Ashwood Tennis Club"
  },
  {
    "id": "CLB08",
    "name": "Burwood Tennis Club"
  },
  {
    "id": "CLB09",
    "name": "Chadstone Tennis Club"
  },
  {
    "id": "CLB10",
    "name": "Notting Hill Tennis Club"
  },
  {
    "id": "CLB11",
    "name": "Forest Hill Tennis Club"
  },
  {
    "id": "CLB12",
    "name": "Vermont South Tennis Club"
  }
];

export const mockClubMemberships: ClubAdminMembership[] = [
  {
    "id": "CM001",
    "playerId": "PLR006",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM002",
    "playerId": "PLR005",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM003",
    "playerId": "PLR004",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM004",
    "playerId": "PLR003",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM005",
    "playerId": "PLR002",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM006",
    "playerId": "PLR001",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM007",
    "playerId": "PLR012",
    "clubId": "CLB02",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM008",
    "playerId": "PLR011",
    "clubId": "CLB02",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM009",
    "playerId": "PLR010",
    "clubId": "CLB02",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM010",
    "playerId": "PLR009",
    "clubId": "CLB02",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM011",
    "playerId": "PLR008",
    "clubId": "CLB02",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM012",
    "playerId": "PLR007",
    "clubId": "CLB02",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM013",
    "playerId": "PLR015",
    "clubId": "CLB03",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM014",
    "playerId": "PLR014",
    "clubId": "CLB03",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM015",
    "playerId": "PLR013",
    "clubId": "CLB03",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM016",
    "playerId": "PLR018",
    "clubId": "CLB03",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM017",
    "playerId": "PLR017",
    "clubId": "CLB03",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM018",
    "playerId": "PLR016",
    "clubId": "CLB03",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM019",
    "playerId": "PLR024",
    "clubId": "CLB04",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM020",
    "playerId": "PLR023",
    "clubId": "CLB04",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM021",
    "playerId": "PLR022",
    "clubId": "CLB04",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM022",
    "playerId": "PLR021",
    "clubId": "CLB04",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM023",
    "playerId": "PLR020",
    "clubId": "CLB04",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM024",
    "playerId": "PLR019",
    "clubId": "CLB04",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM025",
    "playerId": "PLR030",
    "clubId": "CLB05",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM026",
    "playerId": "PLR029",
    "clubId": "CLB05",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM027",
    "playerId": "PLR028",
    "clubId": "CLB05",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM028",
    "playerId": "PLR027",
    "clubId": "CLB05",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM029",
    "playerId": "PLR026",
    "clubId": "CLB05",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM030",
    "playerId": "PLR025",
    "clubId": "CLB05",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM031",
    "playerId": "PLR036",
    "clubId": "CLB06",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM032",
    "playerId": "PLR035",
    "clubId": "CLB06",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM033",
    "playerId": "PLR034",
    "clubId": "CLB06",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM034",
    "playerId": "PLR033",
    "clubId": "CLB06",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM035",
    "playerId": "PLR032",
    "clubId": "CLB06",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM036",
    "playerId": "PLR031",
    "clubId": "CLB06",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM037",
    "playerId": "PLR042",
    "clubId": "CLB07",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM038",
    "playerId": "PLR041",
    "clubId": "CLB07",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM039",
    "playerId": "PLR040",
    "clubId": "CLB07",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM040",
    "playerId": "PLR039",
    "clubId": "CLB07",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM041",
    "playerId": "PLR038",
    "clubId": "CLB07",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM042",
    "playerId": "PLR037",
    "clubId": "CLB07",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM043",
    "playerId": "PLR045",
    "clubId": "CLB08",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM044",
    "playerId": "PLR044",
    "clubId": "CLB08",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM045",
    "playerId": "PLR043",
    "clubId": "CLB08",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM046",
    "playerId": "PLR048",
    "clubId": "CLB08",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM047",
    "playerId": "PLR047",
    "clubId": "CLB08",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM048",
    "playerId": "PLR046",
    "clubId": "CLB08",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-05-06",
    "endDate": null
  },
  {
    "id": "CM049",
    "playerId": "PLR054",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM050",
    "playerId": "PLR053",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM051",
    "playerId": "PLR052",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM052",
    "playerId": "PLR051",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM053",
    "playerId": "PLR050",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM054",
    "playerId": "PLR049",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM055",
    "playerId": "PLR059",
    "clubId": "CLB02",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM056",
    "playerId": "PLR058",
    "clubId": "CLB02",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM057",
    "playerId": "PLR057",
    "clubId": "CLB02",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM058",
    "playerId": "PLR056",
    "clubId": "CLB02",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM059",
    "playerId": "PLR055",
    "clubId": "CLB02",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM060",
    "playerId": "PLR060",
    "clubId": "CLB02",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM061",
    "playerId": "PLR066",
    "clubId": "CLB03",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM062",
    "playerId": "PLR065",
    "clubId": "CLB03",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM063",
    "playerId": "PLR064",
    "clubId": "CLB03",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM064",
    "playerId": "PLR063",
    "clubId": "CLB03",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM065",
    "playerId": "PLR062",
    "clubId": "CLB03",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM066",
    "playerId": "PLR061",
    "clubId": "CLB03",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM067",
    "playerId": "PLR072",
    "clubId": "CLB04",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM068",
    "playerId": "PLR071",
    "clubId": "CLB04",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM069",
    "playerId": "PLR070",
    "clubId": "CLB04",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM070",
    "playerId": "PLR069",
    "clubId": "CLB04",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM071",
    "playerId": "PLR068",
    "clubId": "CLB04",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM072",
    "playerId": "PLR067",
    "clubId": "CLB04",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM073",
    "playerId": "PLR074",
    "clubId": "CLB05",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM074",
    "playerId": "PLR073",
    "clubId": "CLB05",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM075",
    "playerId": "PLR078",
    "clubId": "CLB05",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM076",
    "playerId": "PLR077",
    "clubId": "CLB05",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM077",
    "playerId": "PLR076",
    "clubId": "CLB05",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM078",
    "playerId": "PLR075",
    "clubId": "CLB05",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM079",
    "playerId": "PLR084",
    "clubId": "CLB06",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM080",
    "playerId": "PLR083",
    "clubId": "CLB06",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM081",
    "playerId": "PLR082",
    "clubId": "CLB06",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM082",
    "playerId": "PLR081",
    "clubId": "CLB06",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM083",
    "playerId": "PLR080",
    "clubId": "CLB06",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM084",
    "playerId": "PLR079",
    "clubId": "CLB06",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM085",
    "playerId": "PLR089",
    "clubId": "CLB07",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM086",
    "playerId": "PLR088",
    "clubId": "CLB07",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM087",
    "playerId": "PLR087",
    "clubId": "CLB07",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM088",
    "playerId": "PLR086",
    "clubId": "CLB07",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM089",
    "playerId": "PLR085",
    "clubId": "CLB07",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM090",
    "playerId": "PLR090",
    "clubId": "CLB07",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM091",
    "playerId": "PLR096",
    "clubId": "CLB08",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM092",
    "playerId": "PLR095",
    "clubId": "CLB08",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM093",
    "playerId": "PLR094",
    "clubId": "CLB08",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM094",
    "playerId": "PLR093",
    "clubId": "CLB08",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM095",
    "playerId": "PLR092",
    "clubId": "CLB08",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM096",
    "playerId": "PLR091",
    "clubId": "CLB08",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2025-09-02",
    "endDate": null
  },
  {
    "id": "CM097",
    "playerId": "PLR100",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM098",
    "playerId": "PLR099",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM099",
    "playerId": "PLR098",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM100",
    "playerId": "PLR097",
    "clubId": "CLB01",
    "isPrimary": true,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM101",
    "playerId": "PLR006",
    "clubId": "CLB02",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM102",
    "playerId": "PLR005",
    "clubId": "CLB02",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM103",
    "playerId": "PLR004",
    "clubId": "CLB02",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM104",
    "playerId": "PLR003",
    "clubId": "CLB02",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM105",
    "playerId": "PLR012",
    "clubId": "CLB03",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM106",
    "playerId": "PLR011",
    "clubId": "CLB03",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM107",
    "playerId": "PLR010",
    "clubId": "CLB03",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM108",
    "playerId": "PLR009",
    "clubId": "CLB03",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM109",
    "playerId": "PLR015",
    "clubId": "CLB04",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM110",
    "playerId": "PLR018",
    "clubId": "CLB04",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM111",
    "playerId": "PLR017",
    "clubId": "CLB04",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM112",
    "playerId": "PLR016",
    "clubId": "CLB04",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM113",
    "playerId": "PLR024",
    "clubId": "CLB05",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM114",
    "playerId": "PLR023",
    "clubId": "CLB05",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM115",
    "playerId": "PLR022",
    "clubId": "CLB05",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM116",
    "playerId": "PLR021",
    "clubId": "CLB05",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM117",
    "playerId": "PLR030",
    "clubId": "CLB06",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM118",
    "playerId": "PLR029",
    "clubId": "CLB06",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM119",
    "playerId": "PLR028",
    "clubId": "CLB06",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM120",
    "playerId": "PLR027",
    "clubId": "CLB06",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM121",
    "playerId": "PLR036",
    "clubId": "CLB07",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM122",
    "playerId": "PLR035",
    "clubId": "CLB07",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM123",
    "playerId": "PLR034",
    "clubId": "CLB07",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM124",
    "playerId": "PLR033",
    "clubId": "CLB07",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM125",
    "playerId": "PLR042",
    "clubId": "CLB08",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM126",
    "playerId": "PLR041",
    "clubId": "CLB08",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM127",
    "playerId": "PLR040",
    "clubId": "CLB08",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM128",
    "playerId": "PLR039",
    "clubId": "CLB08",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM129",
    "playerId": "PLR045",
    "clubId": "CLB09",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM130",
    "playerId": "PLR050",
    "clubId": "CLB09",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM131",
    "playerId": "PLR049",
    "clubId": "CLB09",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM132",
    "playerId": "PLR048",
    "clubId": "CLB09",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM133",
    "playerId": "PLR047",
    "clubId": "CLB09",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM134",
    "playerId": "PLR046",
    "clubId": "CLB09",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM135",
    "playerId": "PLR056",
    "clubId": "CLB10",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM136",
    "playerId": "PLR055",
    "clubId": "CLB10",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM137",
    "playerId": "PLR054",
    "clubId": "CLB10",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM138",
    "playerId": "PLR053",
    "clubId": "CLB10",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM139",
    "playerId": "PLR052",
    "clubId": "CLB10",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM140",
    "playerId": "PLR051",
    "clubId": "CLB10",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM141",
    "playerId": "PLR059",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM142",
    "playerId": "PLR058",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM143",
    "playerId": "PLR057",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM144",
    "playerId": "PLR062",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM145",
    "playerId": "PLR061",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM146",
    "playerId": "PLR060",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM147",
    "playerId": "PLR068",
    "clubId": "CLB12",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM148",
    "playerId": "PLR067",
    "clubId": "CLB12",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM149",
    "playerId": "PLR066",
    "clubId": "CLB12",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM150",
    "playerId": "PLR065",
    "clubId": "CLB12",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM151",
    "playerId": "PLR064",
    "clubId": "CLB12",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM152",
    "playerId": "PLR063",
    "clubId": "CLB12",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM153",
    "playerId": "PLR074",
    "clubId": "CLB01",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM154",
    "playerId": "PLR073",
    "clubId": "CLB01",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM155",
    "playerId": "PLR072",
    "clubId": "CLB01",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM156",
    "playerId": "PLR071",
    "clubId": "CLB01",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM157",
    "playerId": "PLR070",
    "clubId": "CLB01",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM158",
    "playerId": "PLR069",
    "clubId": "CLB01",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM159",
    "playerId": "PLR080",
    "clubId": "CLB02",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM160",
    "playerId": "PLR079",
    "clubId": "CLB02",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM161",
    "playerId": "PLR078",
    "clubId": "CLB02",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM162",
    "playerId": "PLR077",
    "clubId": "CLB02",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM163",
    "playerId": "PLR076",
    "clubId": "CLB02",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM164",
    "playerId": "PLR075",
    "clubId": "CLB02",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM165",
    "playerId": "PLR086",
    "clubId": "CLB03",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM166",
    "playerId": "PLR085",
    "clubId": "CLB03",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM167",
    "playerId": "PLR084",
    "clubId": "CLB03",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM168",
    "playerId": "PLR083",
    "clubId": "CLB03",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM169",
    "playerId": "PLR082",
    "clubId": "CLB03",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM170",
    "playerId": "PLR081",
    "clubId": "CLB03",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM171",
    "playerId": "PLR089",
    "clubId": "CLB04",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM172",
    "playerId": "PLR088",
    "clubId": "CLB04",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM173",
    "playerId": "PLR087",
    "clubId": "CLB04",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM174",
    "playerId": "PLR092",
    "clubId": "CLB04",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM175",
    "playerId": "PLR091",
    "clubId": "CLB04",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM176",
    "playerId": "PLR090",
    "clubId": "CLB04",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2026-05-05",
    "endDate": null
  },
  {
    "id": "CM177",
    "playerId": "PLR096",
    "clubId": "CLB01",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM178",
    "playerId": "PLR095",
    "clubId": "CLB01",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM179",
    "playerId": "PLR094",
    "clubId": "CLB01",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM180",
    "playerId": "PLR093",
    "clubId": "CLB01",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM181",
    "playerId": "PLR100",
    "clubId": "CLB02",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM182",
    "playerId": "PLR099",
    "clubId": "CLB02",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM183",
    "playerId": "PLR002",
    "clubId": "CLB02",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM184",
    "playerId": "PLR001",
    "clubId": "CLB02",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM185",
    "playerId": "PLR008",
    "clubId": "CLB03",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM186",
    "playerId": "PLR007",
    "clubId": "CLB03",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM187",
    "playerId": "PLR006",
    "clubId": "CLB03",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM188",
    "playerId": "PLR005",
    "clubId": "CLB03",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM189",
    "playerId": "PLR014",
    "clubId": "CLB04",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM190",
    "playerId": "PLR013",
    "clubId": "CLB04",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM191",
    "playerId": "PLR012",
    "clubId": "CLB04",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM192",
    "playerId": "PLR011",
    "clubId": "CLB04",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM193",
    "playerId": "PLR020",
    "clubId": "CLB05",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM194",
    "playerId": "PLR019",
    "clubId": "CLB05",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM195",
    "playerId": "PLR018",
    "clubId": "CLB05",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM196",
    "playerId": "PLR017",
    "clubId": "CLB05",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM197",
    "playerId": "PLR026",
    "clubId": "CLB06",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM198",
    "playerId": "PLR025",
    "clubId": "CLB06",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM199",
    "playerId": "PLR024",
    "clubId": "CLB06",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM200",
    "playerId": "PLR023",
    "clubId": "CLB06",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM201",
    "playerId": "PLR030",
    "clubId": "CLB07",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM202",
    "playerId": "PLR029",
    "clubId": "CLB07",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM203",
    "playerId": "PLR032",
    "clubId": "CLB07",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM204",
    "playerId": "PLR031",
    "clubId": "CLB07",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM205",
    "playerId": "PLR038",
    "clubId": "CLB08",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM206",
    "playerId": "PLR037",
    "clubId": "CLB08",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM207",
    "playerId": "PLR036",
    "clubId": "CLB08",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM208",
    "playerId": "PLR035",
    "clubId": "CLB08",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-12-04",
    "endDate": null
  },
  {
    "id": "CM209",
    "playerId": "PLR001",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM210",
    "playerId": "PLR005",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM211",
    "playerId": "PLR009",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM212",
    "playerId": "PLR013",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM213",
    "playerId": "PLR017",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM214",
    "playerId": "PLR021",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM215",
    "playerId": "PLR025",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM216",
    "playerId": "PLR029",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM217",
    "playerId": "PLR033",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM218",
    "playerId": "PLR037",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM219",
    "playerId": "PLR041",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM220",
    "playerId": "PLR045",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM221",
    "playerId": "PLR049",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM222",
    "playerId": "PLR053",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM223",
    "playerId": "PLR065",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM224",
    "playerId": "PLR069",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM225",
    "playerId": "PLR073",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM226",
    "playerId": "PLR077",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM227",
    "playerId": "PLR081",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM228",
    "playerId": "PLR085",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM229",
    "playerId": "PLR089",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM230",
    "playerId": "PLR093",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM231",
    "playerId": "PLR097",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-02-10",
    "endDate": null
  },
  {
    "id": "CM232",
    "playerId": "PLR026",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-03-01",
    "endDate": null
  },
  {
    "id": "CM233",
    "playerId": "PLR091",
    "clubId": "CLB11",
    "isPrimary": false,
    "status": "ACTIVE",
    "startDate": "2025-03-01",
    "endDate": null
  }
];

export const mockTeams: ClubAdminTeam[] = [
  {
    "id": "TEAM001",
    "clubId": "CLB01",
    "sectionId": "SEC01",
    "name": "Glen Waverley A"
  },
  {
    "id": "TEAM002",
    "clubId": "CLB02",
    "sectionId": "SEC01",
    "name": "Mount Waverley A"
  },
  {
    "id": "TEAM003",
    "clubId": "CLB03",
    "sectionId": "SEC01",
    "name": "Syndal A"
  },
  {
    "id": "TEAM004",
    "clubId": "CLB04",
    "sectionId": "SEC01",
    "name": "Pinewood A"
  },
  {
    "id": "TEAM005",
    "clubId": "CLB05",
    "sectionId": "SEC01",
    "name": "Wheelers Hill A"
  },
  {
    "id": "TEAM006",
    "clubId": "CLB06",
    "sectionId": "SEC01",
    "name": "Mulgrave A"
  },
  {
    "id": "TEAM007",
    "clubId": "CLB07",
    "sectionId": "SEC01",
    "name": "Ashwood A"
  },
  {
    "id": "TEAM008",
    "clubId": "CLB08",
    "sectionId": "SEC01",
    "name": "Burwood A"
  },
  {
    "id": "TEAM009",
    "clubId": "CLB01",
    "sectionId": "SEC02",
    "name": "Glen Waverley A"
  },
  {
    "id": "TEAM010",
    "clubId": "CLB02",
    "sectionId": "SEC02",
    "name": "Mount Waverley A"
  },
  {
    "id": "TEAM011",
    "clubId": "CLB03",
    "sectionId": "SEC02",
    "name": "Syndal A"
  },
  {
    "id": "TEAM012",
    "clubId": "CLB04",
    "sectionId": "SEC02",
    "name": "Pinewood A"
  },
  {
    "id": "TEAM013",
    "clubId": "CLB05",
    "sectionId": "SEC02",
    "name": "Wheelers Hill A"
  },
  {
    "id": "TEAM014",
    "clubId": "CLB06",
    "sectionId": "SEC02",
    "name": "Mulgrave A"
  },
  {
    "id": "TEAM015",
    "clubId": "CLB07",
    "sectionId": "SEC02",
    "name": "Ashwood A"
  },
  {
    "id": "TEAM016",
    "clubId": "CLB08",
    "sectionId": "SEC02",
    "name": "Burwood A"
  },
  {
    "id": "TEAM017",
    "clubId": "CLB01",
    "sectionId": "SEC03",
    "name": "Glen Waverley A"
  },
  {
    "id": "TEAM018",
    "clubId": "CLB02",
    "sectionId": "SEC03",
    "name": "Mount Waverley A"
  },
  {
    "id": "TEAM019",
    "clubId": "CLB03",
    "sectionId": "SEC03",
    "name": "Syndal A"
  },
  {
    "id": "TEAM020",
    "clubId": "CLB04",
    "sectionId": "SEC03",
    "name": "Pinewood A"
  },
  {
    "id": "TEAM021",
    "clubId": "CLB05",
    "sectionId": "SEC03",
    "name": "Wheelers Hill A"
  },
  {
    "id": "TEAM022",
    "clubId": "CLB06",
    "sectionId": "SEC03",
    "name": "Mulgrave A"
  },
  {
    "id": "TEAM023",
    "clubId": "CLB07",
    "sectionId": "SEC03",
    "name": "Ashwood A"
  },
  {
    "id": "TEAM024",
    "clubId": "CLB08",
    "sectionId": "SEC03",
    "name": "Burwood A"
  },
  {
    "id": "TEAM025",
    "clubId": "CLB09",
    "sectionId": "SEC04",
    "name": "Chadstone B"
  },
  {
    "id": "TEAM026",
    "clubId": "CLB10",
    "sectionId": "SEC04",
    "name": "Notting Hill B"
  },
  {
    "id": "TEAM027",
    "clubId": "CLB11",
    "sectionId": "SEC04",
    "name": "Forest Hill B"
  },
  {
    "id": "TEAM028",
    "clubId": "CLB12",
    "sectionId": "SEC04",
    "name": "Vermont South B"
  },
  {
    "id": "TEAM029",
    "clubId": "CLB01",
    "sectionId": "SEC04",
    "name": "Glen Waverley B"
  },
  {
    "id": "TEAM030",
    "clubId": "CLB02",
    "sectionId": "SEC04",
    "name": "Mount Waverley B"
  },
  {
    "id": "TEAM031",
    "clubId": "CLB03",
    "sectionId": "SEC04",
    "name": "Syndal B"
  },
  {
    "id": "TEAM032",
    "clubId": "CLB04",
    "sectionId": "SEC04",
    "name": "Pinewood B"
  },
  {
    "id": "TEAM033",
    "clubId": "CLB01",
    "sectionId": "SEC05",
    "name": "Glen Waverley A"
  },
  {
    "id": "TEAM034",
    "clubId": "CLB02",
    "sectionId": "SEC05",
    "name": "Mount Waverley A"
  },
  {
    "id": "TEAM035",
    "clubId": "CLB03",
    "sectionId": "SEC05",
    "name": "Syndal A"
  },
  {
    "id": "TEAM036",
    "clubId": "CLB04",
    "sectionId": "SEC05",
    "name": "Pinewood A"
  },
  {
    "id": "TEAM037",
    "clubId": "CLB05",
    "sectionId": "SEC05",
    "name": "Wheelers Hill A"
  },
  {
    "id": "TEAM038",
    "clubId": "CLB06",
    "sectionId": "SEC05",
    "name": "Mulgrave A"
  },
  {
    "id": "TEAM039",
    "clubId": "CLB07",
    "sectionId": "SEC05",
    "name": "Ashwood A"
  },
  {
    "id": "TEAM040",
    "clubId": "CLB08",
    "sectionId": "SEC05",
    "name": "Burwood A"
  }
];

export const mockTeamPlayers: ClubAdminTeamPlayer[] = [
  {
    "id": "TP0001",
    "teamId": "TEAM001",
    "playerId": "PLR006",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0002",
    "teamId": "TEAM001",
    "playerId": "PLR005",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0003",
    "teamId": "TEAM001",
    "playerId": "PLR004",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0004",
    "teamId": "TEAM001",
    "playerId": "PLR003",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0005",
    "teamId": "TEAM001",
    "playerId": "PLR002",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0006",
    "teamId": "TEAM001",
    "playerId": "PLR001",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0007",
    "teamId": "TEAM002",
    "playerId": "PLR012",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0008",
    "teamId": "TEAM002",
    "playerId": "PLR011",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0009",
    "teamId": "TEAM002",
    "playerId": "PLR010",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0010",
    "teamId": "TEAM002",
    "playerId": "PLR009",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0011",
    "teamId": "TEAM002",
    "playerId": "PLR008",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0012",
    "teamId": "TEAM002",
    "playerId": "PLR007",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0013",
    "teamId": "TEAM003",
    "playerId": "PLR015",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0014",
    "teamId": "TEAM003",
    "playerId": "PLR014",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0015",
    "teamId": "TEAM003",
    "playerId": "PLR013",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0016",
    "teamId": "TEAM003",
    "playerId": "PLR018",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0017",
    "teamId": "TEAM003",
    "playerId": "PLR017",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0018",
    "teamId": "TEAM003",
    "playerId": "PLR016",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0019",
    "teamId": "TEAM004",
    "playerId": "PLR024",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0020",
    "teamId": "TEAM004",
    "playerId": "PLR023",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0021",
    "teamId": "TEAM004",
    "playerId": "PLR022",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0022",
    "teamId": "TEAM004",
    "playerId": "PLR021",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0023",
    "teamId": "TEAM004",
    "playerId": "PLR020",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0024",
    "teamId": "TEAM004",
    "playerId": "PLR019",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0025",
    "teamId": "TEAM005",
    "playerId": "PLR030",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0026",
    "teamId": "TEAM005",
    "playerId": "PLR029",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0027",
    "teamId": "TEAM005",
    "playerId": "PLR028",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0028",
    "teamId": "TEAM005",
    "playerId": "PLR027",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0029",
    "teamId": "TEAM005",
    "playerId": "PLR026",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0030",
    "teamId": "TEAM005",
    "playerId": "PLR025",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0031",
    "teamId": "TEAM006",
    "playerId": "PLR036",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0032",
    "teamId": "TEAM006",
    "playerId": "PLR035",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0033",
    "teamId": "TEAM006",
    "playerId": "PLR034",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0034",
    "teamId": "TEAM006",
    "playerId": "PLR033",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0035",
    "teamId": "TEAM006",
    "playerId": "PLR032",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0036",
    "teamId": "TEAM006",
    "playerId": "PLR031",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0037",
    "teamId": "TEAM007",
    "playerId": "PLR042",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0038",
    "teamId": "TEAM007",
    "playerId": "PLR041",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0039",
    "teamId": "TEAM007",
    "playerId": "PLR040",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0040",
    "teamId": "TEAM007",
    "playerId": "PLR039",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0041",
    "teamId": "TEAM007",
    "playerId": "PLR038",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0042",
    "teamId": "TEAM007",
    "playerId": "PLR037",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0043",
    "teamId": "TEAM008",
    "playerId": "PLR045",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0044",
    "teamId": "TEAM008",
    "playerId": "PLR044",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0045",
    "teamId": "TEAM008",
    "playerId": "PLR043",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0046",
    "teamId": "TEAM008",
    "playerId": "PLR048",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0047",
    "teamId": "TEAM008",
    "playerId": "PLR047",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0048",
    "teamId": "TEAM008",
    "playerId": "PLR046",
    "status": "ACTIVE",
    "registerAt": "2025-06-15T23:00:00Z"
  },
  {
    "id": "TP0049",
    "teamId": "TEAM009",
    "playerId": "PLR054",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0050",
    "teamId": "TEAM009",
    "playerId": "PLR053",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0051",
    "teamId": "TEAM009",
    "playerId": "PLR052",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0052",
    "teamId": "TEAM009",
    "playerId": "PLR051",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0053",
    "teamId": "TEAM009",
    "playerId": "PLR050",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0054",
    "teamId": "TEAM009",
    "playerId": "PLR049",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0055",
    "teamId": "TEAM010",
    "playerId": "PLR059",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0056",
    "teamId": "TEAM010",
    "playerId": "PLR058",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0057",
    "teamId": "TEAM010",
    "playerId": "PLR057",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0058",
    "teamId": "TEAM010",
    "playerId": "PLR056",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0059",
    "teamId": "TEAM010",
    "playerId": "PLR055",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0060",
    "teamId": "TEAM010",
    "playerId": "PLR060",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0061",
    "teamId": "TEAM011",
    "playerId": "PLR066",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0062",
    "teamId": "TEAM011",
    "playerId": "PLR065",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0063",
    "teamId": "TEAM011",
    "playerId": "PLR064",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0064",
    "teamId": "TEAM011",
    "playerId": "PLR063",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0065",
    "teamId": "TEAM011",
    "playerId": "PLR062",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0066",
    "teamId": "TEAM011",
    "playerId": "PLR061",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0067",
    "teamId": "TEAM012",
    "playerId": "PLR072",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0068",
    "teamId": "TEAM012",
    "playerId": "PLR071",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0069",
    "teamId": "TEAM012",
    "playerId": "PLR070",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0070",
    "teamId": "TEAM012",
    "playerId": "PLR069",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0071",
    "teamId": "TEAM012",
    "playerId": "PLR068",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0072",
    "teamId": "TEAM012",
    "playerId": "PLR067",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0073",
    "teamId": "TEAM013",
    "playerId": "PLR074",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0074",
    "teamId": "TEAM013",
    "playerId": "PLR073",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0075",
    "teamId": "TEAM013",
    "playerId": "PLR078",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0076",
    "teamId": "TEAM013",
    "playerId": "PLR077",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0077",
    "teamId": "TEAM013",
    "playerId": "PLR076",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0078",
    "teamId": "TEAM013",
    "playerId": "PLR075",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0079",
    "teamId": "TEAM014",
    "playerId": "PLR084",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0080",
    "teamId": "TEAM014",
    "playerId": "PLR083",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0081",
    "teamId": "TEAM014",
    "playerId": "PLR082",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0082",
    "teamId": "TEAM014",
    "playerId": "PLR081",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0083",
    "teamId": "TEAM014",
    "playerId": "PLR080",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0084",
    "teamId": "TEAM014",
    "playerId": "PLR079",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0085",
    "teamId": "TEAM015",
    "playerId": "PLR089",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0086",
    "teamId": "TEAM015",
    "playerId": "PLR088",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0087",
    "teamId": "TEAM015",
    "playerId": "PLR087",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0088",
    "teamId": "TEAM015",
    "playerId": "PLR086",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0089",
    "teamId": "TEAM015",
    "playerId": "PLR085",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0090",
    "teamId": "TEAM015",
    "playerId": "PLR090",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0091",
    "teamId": "TEAM016",
    "playerId": "PLR096",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0092",
    "teamId": "TEAM016",
    "playerId": "PLR095",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0093",
    "teamId": "TEAM016",
    "playerId": "PLR094",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0094",
    "teamId": "TEAM016",
    "playerId": "PLR093",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0095",
    "teamId": "TEAM016",
    "playerId": "PLR092",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0096",
    "teamId": "TEAM016",
    "playerId": "PLR091",
    "status": "ACTIVE",
    "registerAt": "2025-10-12T22:00:00Z"
  },
  {
    "id": "TP0097",
    "teamId": "TEAM017",
    "playerId": "PLR100",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0098",
    "teamId": "TEAM017",
    "playerId": "PLR099",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0099",
    "teamId": "TEAM017",
    "playerId": "PLR098",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0100",
    "teamId": "TEAM017",
    "playerId": "PLR097",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0101",
    "teamId": "TEAM017",
    "playerId": "PLR002",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0102",
    "teamId": "TEAM017",
    "playerId": "PLR001",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0103",
    "teamId": "TEAM018",
    "playerId": "PLR008",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0104",
    "teamId": "TEAM018",
    "playerId": "PLR007",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0105",
    "teamId": "TEAM018",
    "playerId": "PLR006",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0106",
    "teamId": "TEAM018",
    "playerId": "PLR005",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0107",
    "teamId": "TEAM018",
    "playerId": "PLR004",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0108",
    "teamId": "TEAM018",
    "playerId": "PLR003",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0109",
    "teamId": "TEAM019",
    "playerId": "PLR014",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0110",
    "teamId": "TEAM019",
    "playerId": "PLR013",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0111",
    "teamId": "TEAM019",
    "playerId": "PLR012",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0112",
    "teamId": "TEAM019",
    "playerId": "PLR011",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0113",
    "teamId": "TEAM019",
    "playerId": "PLR010",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0114",
    "teamId": "TEAM019",
    "playerId": "PLR009",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0115",
    "teamId": "TEAM020",
    "playerId": "PLR015",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0116",
    "teamId": "TEAM020",
    "playerId": "PLR020",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0117",
    "teamId": "TEAM020",
    "playerId": "PLR019",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0118",
    "teamId": "TEAM020",
    "playerId": "PLR018",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0119",
    "teamId": "TEAM020",
    "playerId": "PLR017",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0120",
    "teamId": "TEAM020",
    "playerId": "PLR016",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0121",
    "teamId": "TEAM021",
    "playerId": "PLR026",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0122",
    "teamId": "TEAM021",
    "playerId": "PLR025",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0123",
    "teamId": "TEAM021",
    "playerId": "PLR024",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0124",
    "teamId": "TEAM021",
    "playerId": "PLR023",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0125",
    "teamId": "TEAM021",
    "playerId": "PLR022",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0126",
    "teamId": "TEAM021",
    "playerId": "PLR021",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0127",
    "teamId": "TEAM022",
    "playerId": "PLR030",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0128",
    "teamId": "TEAM022",
    "playerId": "PLR029",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0129",
    "teamId": "TEAM022",
    "playerId": "PLR028",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0130",
    "teamId": "TEAM022",
    "playerId": "PLR027",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0131",
    "teamId": "TEAM022",
    "playerId": "PLR032",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0132",
    "teamId": "TEAM022",
    "playerId": "PLR031",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0133",
    "teamId": "TEAM023",
    "playerId": "PLR038",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0134",
    "teamId": "TEAM023",
    "playerId": "PLR037",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0135",
    "teamId": "TEAM023",
    "playerId": "PLR036",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0136",
    "teamId": "TEAM023",
    "playerId": "PLR035",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0137",
    "teamId": "TEAM023",
    "playerId": "PLR034",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0138",
    "teamId": "TEAM023",
    "playerId": "PLR033",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0139",
    "teamId": "TEAM024",
    "playerId": "PLR044",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0140",
    "teamId": "TEAM024",
    "playerId": "PLR043",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0141",
    "teamId": "TEAM024",
    "playerId": "PLR042",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0142",
    "teamId": "TEAM024",
    "playerId": "PLR041",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0143",
    "teamId": "TEAM024",
    "playerId": "PLR040",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0144",
    "teamId": "TEAM024",
    "playerId": "PLR039",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0145",
    "teamId": "TEAM025",
    "playerId": "PLR045",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0146",
    "teamId": "TEAM025",
    "playerId": "PLR050",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0147",
    "teamId": "TEAM025",
    "playerId": "PLR049",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0148",
    "teamId": "TEAM025",
    "playerId": "PLR048",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0149",
    "teamId": "TEAM025",
    "playerId": "PLR047",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0150",
    "teamId": "TEAM025",
    "playerId": "PLR046",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0151",
    "teamId": "TEAM026",
    "playerId": "PLR056",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0152",
    "teamId": "TEAM026",
    "playerId": "PLR055",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0153",
    "teamId": "TEAM026",
    "playerId": "PLR054",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0154",
    "teamId": "TEAM026",
    "playerId": "PLR053",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0155",
    "teamId": "TEAM026",
    "playerId": "PLR052",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0156",
    "teamId": "TEAM026",
    "playerId": "PLR051",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0157",
    "teamId": "TEAM027",
    "playerId": "PLR059",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0158",
    "teamId": "TEAM027",
    "playerId": "PLR058",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0159",
    "teamId": "TEAM027",
    "playerId": "PLR057",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0160",
    "teamId": "TEAM027",
    "playerId": "PLR062",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0161",
    "teamId": "TEAM027",
    "playerId": "PLR061",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0162",
    "teamId": "TEAM027",
    "playerId": "PLR060",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0163",
    "teamId": "TEAM028",
    "playerId": "PLR068",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0164",
    "teamId": "TEAM028",
    "playerId": "PLR067",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0165",
    "teamId": "TEAM028",
    "playerId": "PLR066",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0166",
    "teamId": "TEAM028",
    "playerId": "PLR065",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0167",
    "teamId": "TEAM028",
    "playerId": "PLR064",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0168",
    "teamId": "TEAM028",
    "playerId": "PLR063",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0169",
    "teamId": "TEAM029",
    "playerId": "PLR074",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0170",
    "teamId": "TEAM029",
    "playerId": "PLR073",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0171",
    "teamId": "TEAM029",
    "playerId": "PLR072",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0172",
    "teamId": "TEAM029",
    "playerId": "PLR071",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0173",
    "teamId": "TEAM029",
    "playerId": "PLR070",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0174",
    "teamId": "TEAM029",
    "playerId": "PLR069",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0175",
    "teamId": "TEAM030",
    "playerId": "PLR080",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0176",
    "teamId": "TEAM030",
    "playerId": "PLR079",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0177",
    "teamId": "TEAM030",
    "playerId": "PLR078",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0178",
    "teamId": "TEAM030",
    "playerId": "PLR077",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0179",
    "teamId": "TEAM030",
    "playerId": "PLR076",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0180",
    "teamId": "TEAM030",
    "playerId": "PLR075",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0181",
    "teamId": "TEAM031",
    "playerId": "PLR086",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0182",
    "teamId": "TEAM031",
    "playerId": "PLR085",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0183",
    "teamId": "TEAM031",
    "playerId": "PLR084",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0184",
    "teamId": "TEAM031",
    "playerId": "PLR083",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0185",
    "teamId": "TEAM031",
    "playerId": "PLR082",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0186",
    "teamId": "TEAM031",
    "playerId": "PLR081",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0187",
    "teamId": "TEAM032",
    "playerId": "PLR089",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0188",
    "teamId": "TEAM032",
    "playerId": "PLR088",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0189",
    "teamId": "TEAM032",
    "playerId": "PLR087",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0190",
    "teamId": "TEAM032",
    "playerId": "PLR092",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0191",
    "teamId": "TEAM032",
    "playerId": "PLR091",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0192",
    "teamId": "TEAM032",
    "playerId": "PLR090",
    "status": "ACTIVE",
    "registerAt": "2026-06-14T23:00:00Z"
  },
  {
    "id": "TP0193",
    "teamId": "TEAM033",
    "playerId": "PLR098",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0194",
    "teamId": "TEAM033",
    "playerId": "PLR097",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0195",
    "teamId": "TEAM033",
    "playerId": "PLR096",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0196",
    "teamId": "TEAM033",
    "playerId": "PLR095",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0197",
    "teamId": "TEAM033",
    "playerId": "PLR094",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0198",
    "teamId": "TEAM033",
    "playerId": "PLR093",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0199",
    "teamId": "TEAM034",
    "playerId": "PLR100",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0200",
    "teamId": "TEAM034",
    "playerId": "PLR099",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0201",
    "teamId": "TEAM034",
    "playerId": "PLR004",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0202",
    "teamId": "TEAM034",
    "playerId": "PLR003",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0203",
    "teamId": "TEAM034",
    "playerId": "PLR002",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0204",
    "teamId": "TEAM034",
    "playerId": "PLR001",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0205",
    "teamId": "TEAM035",
    "playerId": "PLR010",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0206",
    "teamId": "TEAM035",
    "playerId": "PLR009",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0207",
    "teamId": "TEAM035",
    "playerId": "PLR008",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0208",
    "teamId": "TEAM035",
    "playerId": "PLR007",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0209",
    "teamId": "TEAM035",
    "playerId": "PLR006",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0210",
    "teamId": "TEAM035",
    "playerId": "PLR005",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0211",
    "teamId": "TEAM036",
    "playerId": "PLR015",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0212",
    "teamId": "TEAM036",
    "playerId": "PLR014",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0213",
    "teamId": "TEAM036",
    "playerId": "PLR013",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0214",
    "teamId": "TEAM036",
    "playerId": "PLR012",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0215",
    "teamId": "TEAM036",
    "playerId": "PLR011",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0216",
    "teamId": "TEAM036",
    "playerId": "PLR016",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0217",
    "teamId": "TEAM037",
    "playerId": "PLR022",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0218",
    "teamId": "TEAM037",
    "playerId": "PLR021",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0219",
    "teamId": "TEAM037",
    "playerId": "PLR020",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0220",
    "teamId": "TEAM037",
    "playerId": "PLR019",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0221",
    "teamId": "TEAM037",
    "playerId": "PLR018",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0222",
    "teamId": "TEAM037",
    "playerId": "PLR017",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0223",
    "teamId": "TEAM038",
    "playerId": "PLR028",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0224",
    "teamId": "TEAM038",
    "playerId": "PLR027",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0225",
    "teamId": "TEAM038",
    "playerId": "PLR026",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0226",
    "teamId": "TEAM038",
    "playerId": "PLR025",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0227",
    "teamId": "TEAM038",
    "playerId": "PLR024",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0228",
    "teamId": "TEAM038",
    "playerId": "PLR023",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0229",
    "teamId": "TEAM039",
    "playerId": "PLR030",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0230",
    "teamId": "TEAM039",
    "playerId": "PLR029",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0231",
    "teamId": "TEAM039",
    "playerId": "PLR034",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0232",
    "teamId": "TEAM039",
    "playerId": "PLR033",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0233",
    "teamId": "TEAM039",
    "playerId": "PLR032",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0234",
    "teamId": "TEAM039",
    "playerId": "PLR031",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0235",
    "teamId": "TEAM040",
    "playerId": "PLR040",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0236",
    "teamId": "TEAM040",
    "playerId": "PLR039",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0237",
    "teamId": "TEAM040",
    "playerId": "PLR038",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0238",
    "teamId": "TEAM040",
    "playerId": "PLR037",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0239",
    "teamId": "TEAM040",
    "playerId": "PLR036",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  },
  {
    "id": "TP0240",
    "teamId": "TEAM040",
    "playerId": "PLR035",
    "status": "ACTIVE",
    "registerAt": "2026-01-13T22:00:00Z"
  }
];
