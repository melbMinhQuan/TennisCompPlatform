import { describe, expect, test, vi } from "vitest";
import { dayMonthYear, formatDateChange, formatRound, formatTopPercent, timeAgo } from "../utils/formatters";
import {
  dateParts, formatFixtureDate, formatFixtureDateWithYear, formatResultDate, formatTime, melbourneDate, todayInMelbourne,
} from "../utils/date-helpers";

const NOW = Date.parse("2026-09-28T12:00:00Z");

describe("FE-001: round labels", () => {
  test("a numbered round, a finals label, and an unknown round", () => {
    expect(formatRound({ round: 13 })).toBe("Round 13");
    expect(formatRound({ round: null, roundLabel: "Grand Final" })).toBe("Grand Final");
    expect(formatRound({ round: null })).toBe("Round to be confirmed");
  });
});

describe("FE-002: time since a notification", () => {
  test("minutes, hours and days ago", () => {
    expect(timeAgo("2026-09-28T11:59:30Z", NOW)).toBe("Just now");
    expect(timeAgo("2026-09-28T11:50:00Z", NOW)).toBe("10m ago");
    expect(timeAgo("2026-09-28T09:00:00Z", NOW)).toBe("3h ago");
    expect(timeAgo("2026-09-20T12:00:00Z", NOW)).toBe("8d ago");
  });

  test("older than a month shows the date, and a future time never goes negative", () => {
    expect(timeAgo("2026-07-01T00:00:00Z", NOW)).toBe("1 Jul 2026");
    // 20:00 UTC on 31 Jul is already 1 Aug in Melbourne.
    expect(timeAgo("2026-07-31T20:00:00Z", NOW)).toBe("1 Aug 2026");
    expect(timeAgo("2026-09-29T00:00:00Z", NOW)).toBe("Just now");
  });
});

describe("FE-003: rescheduled-match date line", () => {
  test("old → new date, postponed without a new date, and no dates at all", () => {
    expect(formatDateChange({ previousDate: "2026-09-26", newDate: "2026-09-27" })).toBe("Sep 26 → Sep 27, 2026");
    expect(formatDateChange({ previousDate: "2026-09-19", newDate: null })).toBe("Sep 19 → Date to be confirmed");
    expect(formatDateChange({ scheduledDate: "2026-09-27" })).toBeNull();
    expect(formatDateChange(null)).toBeNull();
  });
});

describe("FE-004: fixture and result dates", () => {
  test("calendar dates never shift through a time zone", () => {
    expect(dateParts("2026-09-27")).toEqual({ weekday: "SUN", day: "27", month: "SEP", year: "2026" });
    expect(formatFixtureDate("2026-09-27")).toBe("SUN 27 SEP");
    expect(formatResultDate("2026-08-01")).toBe("01 AUG 2026");
  });

  test("12-hour times, and placeholders for missing values", () => {
    expect(formatTime("13:00")).toBe("1:00 PM");
    expect(formatTime("00:05")).toBe("12:05 AM");
    expect(formatTime(null)).toBe("Time to be confirmed");
    expect(formatFixtureDate(null)).toBe("Date to be confirmed");
  });
});

describe("FE-007: UTR best rank as a top percentage", () => {
  test("percentile 88 is the top 12%, and the best player is never the top 0%", () => {
    expect(formatTopPercent(88)).toBe("Top 12%");
    expect(formatTopPercent(28)).toBe("Top 72%");
    expect(formatTopPercent(87.6)).toBe("Top 12%");
    expect(formatTopPercent(100)).toBe("Top 1%");
  });
});

describe("FE-012: dates in Melbourne for the club administrator pages", () => {
  test("a fixture date can carry its year; a postponed one says so", () => {
    expect(formatFixtureDateWithYear("2026-09-26")).toBe("SAT 26 SEP 2026");
    expect(formatFixtureDateWithYear(null)).toBe("Date to be confirmed");
  });

  test("a moment is dated by Melbourne's calendar, across daylight saving too", () => {
    expect(melbourneDate("2026-05-31T13:30:00Z")).toBe("2026-05-31"); // 23:30 on 31 May (AEST)
    expect(melbourneDate("2026-05-31T15:30:00Z")).toBe("2026-06-01"); // 01:30 on 1 June
    expect(melbourneDate(new Date("2026-12-31T13:30:00Z"))).toBe("2027-01-01"); // 00:30 on New Year's Day (AEDT)
  });

  test("today is Melbourne's today, not the computer's", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-31T15:30:00Z"));
    try {
      expect(todayInMelbourne()).toBe("2026-06-01");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("FE-014: calendar dates in full", () => {
  test("months are named the same on every machine, and the day never shifts", () => {
    // Intl's en-AU names June "June" but November "Nov"; the page must not mix the two.
    expect([dayMonthYear("2013-06-11"), dayMonthYear("2009-11-14"), dayMonthYear("2026-09-01")]).toEqual(["11 Jun 2013", "14 Nov 2009", "1 Sep 2026"]);
  });
});
