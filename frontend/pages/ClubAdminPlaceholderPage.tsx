type ClubAdminPlaceholderPageProps = {
  title: string;
};

export default function ClubAdminPlaceholderPage({
  title,
}: ClubAdminPlaceholderPageProps) {
  return (
    <section className="text-[#1a3049]">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#526579]">
        Club administration / {title}
      </p>

      <h1 className="mt-6 text-[28px] font-bold leading-tight min-[768px]:text-[32px]">
        {title}
      </h1>

      <div className="mt-6 rounded-2xl bg-white p-6">
        <p className="text-sm leading-6 text-[#526579]">
          This page is under development.
        </p>
      </div>
    </section>
  );
}