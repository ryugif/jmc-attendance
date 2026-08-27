export default function GlobalHeader({ title, description }: { title: string; description?: string }) {
    return (
        <div>
            <h2 className="text-2xl font-semibold text-zinc-900">{title}</h2>
            {description && (
                <p className="mt-1 text-sm text-zinc-600">
                    {description}
                </p>
            )}
        </div>
    )
}