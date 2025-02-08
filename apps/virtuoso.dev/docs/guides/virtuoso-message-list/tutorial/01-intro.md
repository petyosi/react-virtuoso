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

We're going to start the tutorial from scratch, using Next.js for the initial setup. The message list component works with any of the modern React stacks, so you can use it in your existing project as well. 

:::info
If you want to play around with the final result or if you get stuck at a certain step, you can refer to the [virtuoso-message-list-tutorial repository](https://github.com/virtuoso-dev/virtuoso-message-list-tutorial), where each step of the tutorial is available as a separate commit.
:::

With a few exceptions, the tutorial will not cover the styling of the components. You can use any UI/CSS framework or write your own styles. 

## Project Setup

Bootstrap your project by running the following command - this will create a new Next.js project in the `virtuoso-message-list-tutorial` directory.

```bash
npx create-next-app@latest virtuoso-message-list-tutorial
```

Accept the default suggestions of the Next.js wizard - TypeScript, App router, and no Tailwind CSS. 

## The Chat Channel Client Class

Our tutorial will not connect to a real backend server. Instead, we are going to simulate the server-client communication by using a client class that generates messages and sends them to the message list component. To make things a bit more realistic, we are going to use the `@ngneat/falso` package to generate random avatars and phrases. First, add the dependency to your project:

```bash
npm install @ngneat/falso
```

Let's create a stateful `ChatChannel` class that will act as a "proxy" to the server. The class exposes an API for loading the initial messages, loading older messages, etc. The implementation also includes `User` and `Message` data structures - most likely, you will have similar implementations in your real-world project.

For now, you don't need to understand the implementation details of the `ChatChannel` class. We are going to use it as a black box in the tutorial. 

Add the following code to a file named `lib/ChatChannel.ts`:

```tsx
import { rand, randFullName, randNumber, randSentence } from '@ngneat/falso'

type GetMessageParams = { limit?: number } | { before: number; limit?: number }

export class ChatChannel {
  public users: ChatUser[]
  private localIdCounter = 0
  public messages: ChatMessage[] = []

  public onNewMessages = (messages: ChatMessage[]) => {
    void messages
  }
  public currentUser: ChatUser
  private otherUser: ChatUser
  private loading = false
  public loaded = false

  constructor(
    public name: string,
    private totalMessages: number
  ) {
    this.users = Array.from({ length: 2 }, (_, i) => new ChatUser(i))
    this.currentUser = this.users[0]
    this.otherUser = this.users[1]
    if (this.totalMessages === 0) {
      this.loaded = true
    }
  }

  async getMessages(params: GetMessageParams) {
    if (this.loading) {
      return null
    }

    this.loading = true

    await new Promise((r) => setTimeout(r, 1000))
    const { limit = 10 } = params
    this.loading = false

    if (!this.loaded) {
      this.loaded = true
    }

    if (this.messages.length >= this.totalMessages) {
      return []
    }

    // prepending messages, simplified for the sake of the example
    if ('before' in params) {
      if (this.messages.length >= this.totalMessages) {
        return []
      }

      const offset = this.totalMessages - this.messages.length - limit

      const newMessages = Array.from({ length: limit }, (_, i) => {
        const id = offset + i
        return new ChatMessage(id, rand(this.users))
      })
      this.messages = newMessages.concat(this.messages)
      return newMessages
    } else {
      // initial load
      this.messages = Array.from({ length: limit }, (_, i) => {
        const id = this.totalMessages - limit + i
        return new ChatMessage(id, rand(this.users))
      })
      return this.messages
    }
  }

  createNewMessageFromAnotherUser() {
    const newMessage = new ChatMessage(this.messages.length, this.otherUser)
    this.messages.push(newMessage)
    this.onNewMessages([newMessage])
  }

  sendOwnMessage() {
    const tempMessage = new ChatMessage(null, this.currentUser)
    tempMessage.localId = ++this.localIdCounter
    tempMessage.delivered = false

    setTimeout(() => {
      const deliveredMessage = new ChatMessage(this.messages.length, this.currentUser, tempMessage.message)
      deliveredMessage.localId = tempMessage.localId
      this.messages.push(deliveredMessage)
      this.onNewMessages([deliveredMessage])
    }, 1000)

    return tempMessage
  }
}

export class ChatUser {
  constructor(
    public id: number | null,
    public name = randFullName(),
    public avatar = `https://i.pravatar.cc/30?u=${encodeURIComponent(name)}`
  ) {}
}

// a ChatMessage class with a random message
export class ChatMessage {
  public delivered = true
  public localId: number | null = null
  constructor(
    public id: number | null,
    public user: ChatUser,
    public message = randSentence({
      length: randNumber({ min: 1, max: 5 }),
    }).join(' ')
  ) {}
}
```

In the next step, we will add the message list itself and bind it to the `ChatChannel` class. 
