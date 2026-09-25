export default function NotificationPanel() {
  return (
    <section
      className="min-w-0 min-h-[360px] rounded-[32px] bg-white p-6"
    >
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-black">
          Notification
        </h2>

        <button
          type="button"
          className="text-sm font-medium text-cyan-600 hover:underline"
        >
          View All
        </button>
      </div>

      <div
        className="flex min-h-[260px] items-center justify-center text-center"
      >
        <div>
          <p className="text-base font-medium text-slate-500">
            Notifications are currently unavailable
          </p>

          <p className="mt-2 text-sm text-slate-400">
            Please check back later for updates.
          </p>
        </div>
      </div>
    </section>
  );
}