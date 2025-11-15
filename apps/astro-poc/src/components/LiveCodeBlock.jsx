import { useEffect, useState } from 'react'

export default function LiveCodeBlock({ value }) {
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  return (
    <div suppressHydrationWarning>
      {isHydrated && <div>Client-side LiveCodeBlock</div>}
      <pre>{value}</pre>
    </div>
  )
}
