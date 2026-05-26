---
title: Tailwind Test
---

This is a test page to verify Tailwind CSS and shadcn components work in live code blocks.

## Plain Tailwind Classes

```tsx live
export default function App() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <h1 className="text-2xl font-bold text-blue-600">Hello Tailwind!</h1>
      <p className="text-gray-600">This text uses Tailwind utility classes.</p>
      <div className="flex gap-2">
        <button className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600">Primary</button>
        <button className="rounded-lg border border-gray-300 px-4 py-2 hover:bg-gray-50">Secondary</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-md bg-gradient-to-br from-purple-500 to-pink-500 p-4 text-center text-white">
            Card {i}
          </div>
        ))}
      </div>
    </div>
  )
}
```

## shadcn Button Component

```tsx live
import { Button } from '@/components/ui/button'

export default function App() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap gap-2">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Destructive</Button>
      </div>
    </div>
  )
}
```

## shadcn Card Component

```tsx live
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function App() {
  return (
    <div className="p-4">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>Virtuoso + shadcn</CardTitle>
          <CardDescription>Live code blocks with Tailwind and shadcn components.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This card is rendered using shadcn/ui components with Tailwind CSS utilities, all compiled in-browser.
          </p>
        </CardContent>
        <CardFooter>
          <Button className="w-full">Get Started</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
```
