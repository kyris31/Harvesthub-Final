export default function RemindersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reminders</h1>
        <p className="text-muted-foreground">Tasks and notifications</p>
      </div>

      <div className="bg-card rounded-lg border p-6">
        <p className="text-muted-foreground">
          No reminders yet. Add your first reminder to stay organized.
        </p>
      </div>
    </div>
  )
}
