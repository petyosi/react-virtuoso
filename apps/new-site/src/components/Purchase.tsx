import { type Environments, initializePaddle, type Paddle } from '@paddle/paddle-js'
import { PADDLE_ENVIRONMENT, PADDLE_PRO_PRICE_ID, PADDLE_STANDARD_PRICE_ID, PADDLE_TOKEN } from 'astro:env/client'
import { type JSX, useEffect, useState } from 'react'

import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card'

export default function Purchase(): JSX.Element {
  const [paddle, setPaddle] = useState<Paddle>()

  useEffect(() => {
    void initializePaddle({
      environment: PADDLE_ENVIRONMENT as Environments,
      token: PADDLE_TOKEN,
    }).then((paddleInstance: Paddle | undefined) => {
      if (paddleInstance) {
        setPaddle(paddleInstance)
      }
    })
  }, [])

  return (
    <div
      className={`
        not-content grid gap-6
        md:grid-cols-3
      `}
    >
      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle className="text-2xl">React Virtuoso</CardTitle>
          <CardDescription className="text-xs">MIT Licensed, free forever.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-4">
          <p className="text-sm text-muted-foreground">
            The <code className="rounded bg-muted px-1 py-0.5 text-sm">Virtuoso</code>,{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-sm">GroupedVirtuoso</code>,{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-sm">VirtuosoGrid</code>,{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-sm">VirtuosoTable</code>, and{' '}
            <code className="rounded bg-muted px-1 py-0.5 text-sm">Masonry</code> components.
          </p>
          <ul
            className={`
              list-inside list-disc space-y-1 text-sm text-muted-foreground
            `}
          >
            <li>Community support via GitHub.</li>
          </ul>
          <div className="mt-auto pt-4 text-center">
            <span className="text-4xl font-bold">$0</span>
          </div>
        </CardContent>
        <CardFooter>
          {/* eslint-disable-next-line better-tailwindcss/enforce-consistent-line-wrapping */}
          <code className={`w-full rounded bg-muted px-3 py-2 text-center text-sm`}>npm i react-virtuoso</code>
        </CardFooter>
      </Card>

      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle className="text-2xl">Message List</CardTitle>
          <CardDescription className="text-xs">Annual Commercial License</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-4">
          <p className="text-sm text-muted-foreground">
            The <code className="rounded bg-muted px-1 py-0.5 text-sm">VirtuosoMessageList</code> component.
          </p>
          <ul
            className={`
              list-inside list-disc space-y-1 text-sm text-muted-foreground
            `}
          >
            <li>One year access to updates.</li>
            <li>Email-based support.</li>
          </ul>
          <div className="mt-auto pt-4 text-center">
            <span className="text-4xl font-bold">$14</span>
            <span className="text-muted-foreground">/month/seat</span>
            <p className="mt-1 text-sm text-muted-foreground">Billed annually at $168/seat.</p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full cursor-pointer"
            onClick={() =>
              paddle?.Checkout.open({
                items: [
                  {
                    priceId: PADDLE_STANDARD_PRICE_ID,
                    quantity: 1,
                  },
                ],
              })
            }
          >
            Buy Now
          </Button>
        </CardFooter>
      </Card>

      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle className="text-2xl">Message List Pro</CardTitle>
          <CardDescription className="text-xs">Annual Commercial License</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col space-y-4">
          <p className="text-sm text-muted-foreground">
            The <code className="rounded bg-muted px-1 py-0.5 text-sm">VirtuosoMessageList</code> component.
          </p>
          <ul
            className={`
              list-inside list-disc space-y-1 text-sm text-muted-foreground
            `}
          >
            <li>One year access to updates.</li>
            <li>Email-based support, guaranteed response time.</li>
            <li>Priority feature requests.</li>
          </ul>
          <div className="mt-auto pt-4 text-center">
            <span className="text-4xl font-bold">$26</span>
            <span className="text-muted-foreground">/month/seat</span>
            <p className="mt-1 text-sm text-muted-foreground">
              Billed annually at <strong>$312</strong>/seat.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button
            className="w-full cursor-pointer"
            onClick={() =>
              paddle?.Checkout.open({
                items: [
                  {
                    priceId: PADDLE_PRO_PRICE_ID,
                    quantity: 1,
                  },
                ],
              })
            }
          >
            Buy Now
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
