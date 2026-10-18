import { useState, type FormEvent } from "react";
import type { NewPlayerDetails } from "../../../api/club-admin-players";
import { matchButtonClass, matchCardClass, matchLightButtonClass } from "../../MatchesUI";

type Props = {
  initialFirstName: string;
  initialLastName: string;
  /** DD/MM/YYYY, as typed in the search step. */
  initialDateOfBirth: string;
  /** Converts DD/MM/YYYY to YYYY-MM-DD, or "" when the date is not valid. */
  toISODate: (value: string) => string;
  /** Saves the checked details; the page shows what happened next. */
  onCreate: (details: NewPlayerDetails) => void;
  /** True while the details are being saved. */
  busy: boolean;
  /** Why the backend refused the details (e.g. a possible duplicate); "" when it did not. */
  error: string;
  onCancel: () => void;
};

const inputClass =
  "mt-1 min-h-11 w-full rounded-lg border border-[#c8d8e9] bg-white px-4 text-[#1a3049] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]";

/**
 * Details for a brand new player record. Date of birth and gender are required by the database.
 * Email is not collected: it belongs to a login account, which this step does not create.
 */
export default function CreatePlayerForm(props: Props) {
  const [firstName, setFirstName] = useState(props.initialFirstName);
  const [lastName, setLastName] = useState(props.initialLastName);
  const [dateOfBirth, setDateOfBirth] = useState(props.initialDateOfBirth);
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const isoDate = props.toISODate(dateOfBirth);
    if (!firstName.trim() || !lastName.trim()) return setError("Please enter a first name and a last name.");
    if (!isoDate) return setError("Please enter a valid date of birth in DD/MM/YYYY format.");
    if (isoDate > new Date().toISOString().slice(0, 10)) return setError("Date of birth cannot be in the future.");
    if (!gender) return setError("Please choose a gender.");
    setError("");
    props.onCreate({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      dateOfBirth: isoDate,
      gender: gender as NewPlayerDetails["gender"],
    });
  }

  return (
    <form onSubmit={submit} noValidate className={`mt-5 text-[#1a3049] ${matchCardClass}`}>
      <h2 className="text-lg font-bold">New player details</h2>
      <p className="mt-1 text-sm text-muted">All fields are required. The player is added to your club as a member from today.</p>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-semibold">
          First name *
          <input className={inputClass} value={firstName} onChange={(event) => setFirstName(event.target.value)} required />
        </label>
        <label className="text-sm font-semibold">
          Last name *
          <input className={inputClass} value={lastName} onChange={(event) => setLastName(event.target.value)} required />
        </label>
        <label className="text-sm font-semibold">
          Date of birth *
          <input
            className={inputClass}
            inputMode="numeric"
            placeholder="DD/MM/YYYY"
            maxLength={10}
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
            required
          />
        </label>
        <label className="text-sm font-semibold">
          Gender *
          <select className={inputClass} value={gender} onChange={(event) => setGender(event.target.value)} required>
            <option value="">Choose</option>
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
            <option value="OTHER">Other</option>
          </select>
        </label>
      </div>

      <p className="mt-4 text-sm text-muted">
        An email address is not saved here. The player’s email belongs to their login account, which is set up
        separately.
      </p>
      {(error || props.error) && (
        <p role="alert" className="mt-3 text-sm text-red-700">
          {error || props.error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3 md:flex-row">
        <button type="submit" disabled={props.busy} className={matchButtonClass}>
          {props.busy ? "Creating…" : "Create player"}
        </button>
        <button type="button" onClick={props.onCancel} className={matchLightButtonClass}>
          Back to results
        </button>
      </div>
    </form>
  );
}
