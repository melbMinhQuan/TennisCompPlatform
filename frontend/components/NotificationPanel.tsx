export default function NotificationPanel() {
  return (
    <section
      className="min-w-0 min-h-[360px] rounded-2xl bg-white p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-ink">
          Notifications
        </h2>


      </div>

      <div
        className="flex min-h-[260px] items-center justify-center text-center"
      >
        <div>
          <p className="text-base font-medium text-slate-500">
            Notifications are currently unavailable
          </p>

          <p className="mt-2 text-sm text-slate-500">
            Please check back later for updates.
          </p>
        </div>
      </div>
    </section>
  );
}