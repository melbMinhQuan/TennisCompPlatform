import { Link } from "react-router";

type Props = { topic: string; label: string };

/** One line at the bottom of a page that opens Help & Support on the matching topic. */
export default function HelpTopicLink({ topic, label }: Props) {
  return (
    <p className="mt-5 text-sm text-white/85 md:text-muted">
      Need help?{" "}
      <Link
        to={`/club-admin/support?topic=${topic}`}
        className="rounded font-medium underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3f72af]"
      >
        {label} ›
      </Link>
    </p>
  );
}
