interface PlaceholderPageProps {
  title: string
  description: string
  comingSoon?: boolean
}

export function PlaceholderPage({ title, description, comingSoon = true }: PlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground">
          {comingSoon ? `${title} ${comingSoon ? 'coming soon...' : ''}` : description}
        </p>
      </div>
    </div>
  )
}
