---
id: virtuoso-message-list-tutorial-intro
title: Virtuoso Message List Tutorial - Intro
sidebar_label: Intro
sidebar_position: 1
slug: /virtuoso-message-list/tutorial/intro
---

# Part 1 - Intro

This is the first part of the tutorial series on how to use the `VirtuosoMessageList` component. The final goal is to build a messenger-like interface that simulates sending and receiving messages, while supporting multiple channels.

The tutorial assumes that you have working knowledge of React and TypeScript and you are familiar with setting up and running a React project through the command line. The snippets use TypeScript, but you can easily adapt them to JavaScript. You won't need an active [license](/virtuoso-message-list/licensing) to complete the tutorial, but you will need one if you want to deploy the app in a production environment.

We're going to start the tutorial from scratch, using Vite for the initial setup. The message list component works with all modern React stacks, so you can use it in your existing project as well.

:::info
If you want to play around with the final result or if you get stuck at a certain step, you can refer to the [virtuoso-message-list-tutorial repository](https://github.com/virtuoso-dev/virtuoso-message-list-tutorial), where each step of the tutorial is available as a separate commit.
:::

With a few exceptions, the tutorial will not cover the styling of the components. You can use any UI/CSS framework or write your own styles.

## Project Setup

Bootstrap your project by running the following command - this will create a new Next.js project in the `virtuoso-message-list-tutorial` directory.

```bash
npm create vite@latest virtuoso-message-list-tutorial -- --template react-ts
```

## The message and the user data shapes

Our tutorial will not connect to a real backend server. Instead, we are going to simulate the server-client communication by using a client class that generates messages and sends them to the message list component. To make things a bit more realistic, we are going to use the `@ngneat/falso` package to generate random messages, avatars and phrases. First, add the dependency to your project:

```bash
npm install @ngneat/falso
```

Let's define a few utilities that will let us generate random messages and users. Create a new file `src/chat.ts` and add the following code:

```ts
import { randFullName, randNumber, randSentence } from '@ngneat/falso'

export interface ChatUser {
  id: number
  name: string
  avatar: string
}

export interface ChatMessage {
  delivered: boolean
  localId?: number | null
  id: number | null
  user: ChatUser
  message: string
}

export function createUser(id: number): ChatUser {
  const name = randFullName()
  return {
    id,
    name,
    avatar: `https://i.pravatar.cc/30?u=${encodeURIComponent(name)}`,
  }
}

let remoteIdCounter = 0

export function nextRemoteId(): number {
  return ++remoteIdCounter
}

export function createMessage(user: ChatUser): ChatMessage {
  const message = randSentence({
    length: randNumber({ min: 1, max: 5 }),
  }).join(' ')
  return {
    id: nextRemoteId(),
    user,
    message,
    delivered: true,
  }
}

let localIdCounter = 0

export function createLocalMessage(user: ChatUser): ChatMessage {
  const message = randSentence({
    length: randNumber({ min: 1, max: 5 }),
  }).join(' ')
  return {
    id: null,
    localId: ++localIdCounter,
    user,
    message,
    delivered: false,
  }
}
```

In the next step, we will add the message list itself and connect it to the data we just created.
