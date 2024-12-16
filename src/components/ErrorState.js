export default function ErrorState({ error }) {
  return (
    <div className="flex justify-center items-center min-h-[200px]">
      <div className="text-rose-600">
        Error: {error?.message || 'Algo salió mal'}
      </div>
    </div>
  )
}
