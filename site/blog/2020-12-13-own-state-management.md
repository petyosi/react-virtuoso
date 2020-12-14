---
slug: why-i-wrote-my-own-state-management-for-react-virtuoso
title: Why I wrote my own state management for react virtuoso
author: Petyo Ivanov
author_url: https://github.com/petyosi
author_image_url: https://avatars0.githubusercontent.com/u/13347?s=400&u=9d34329f37c378cb3cd2647e301b2344ef534071&v=4
tags: [urx,state-management]
---

Almost 2 years after its first release, last Saturday I shipped `v1.0.0` of [React Virtuoso](https://virtuoso.dev/). 
With this release, the state management framework powering Virtuoso is now available as a separate package called urx, 
with its own documentation and examples available at [urx.virtuoso.dev](https://urx.virtuoso.dev/). 
This is the story on what brought the development of the project there.

## Virtuoso is not your Typical React App

The popular React state management are designed with the app in mind - a relatively large data tree with reducers rebuilding certain parts of it.
Managing the state of the Virtuoso component is a different kind of problem. 
In its case, a multitude of **continuously changing input values** from the DOM combine with the component properties 
into a relatively simple data structure - a list of items "windowed" to show the currently visible part of a large list. Here's a pseudo-code representation of what the state calculation looks like:

```js
// DOM input
top = dom.scrollTop
height = dom.viewportHeight
sizes = dom.itemSizes

// component properties
count = props.totalCount
overscan = props.overscan
data = props.data
groups = props.groups

// ... intermediate calculations
sizeTree = rebuildSizeTree(sizeTree, sizes, count)
listRange = rebuildWindow(top, height, overscan, listDimensions)
list = items(listRange, sizeTree)
listDimensions = dimensions(list)

// output of a list 
[paddingTop, paddingBottom] = dimensions(list)
items = buildItems(list, data, groups)
```

Here's the catch - none of the dom / props  above is a static value. They are **streams of changing values** which should be efficiently propagated through the list / item calculation logic. 
The change propagation cannot be described efficiently with procedural code - you need a topology of dependencies.

### Initial Prototype - the Redux-based Failure 

My initial prototype of the component was Redux based. 
The good news were that the idea of using [a binary tree structure](https://github.com/petyosi/react-virtuoso/blob/master/src/AATree.ts) for the item sizes worked. 
The bad news were that either I did not understand Redux or it was the incorrect tool for what I was doing. 
My code was a **pile of interdependent reducers** that were repeatedly called with various combinations of values from actions and the existing state. 

![](/img/blog/spaghetti.jpg)

<p><small>An artistic interpretation of Virtuoso's Redux implementation. <span>Photo by <a href="https://unsplash.com/@behy_studio?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Behnam Norouzi</a> on <a href="https://unsplash.com/s/photos/spaghetti?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Unsplash</a></span>.</small></p>

### Second Attempt - Hooks

Unsurprisingly, re-implementing the idea with hooks did not make it better. 
In fact, it look like a step in the wrong direction, because the Redux implementation was at least easily unit-testable outside of React. 
I threw the spaghetti away and took a short break from the idea.

### Third Pass - RxJS to the Rescue

Staring at the code, I noticed the stream pattern. The scroll container was continuously "emitting" `scrollTop` values. 
The viewport emitted its height when resizing. The list items emitted their sizes when rendering or when resizing. 
Squinting a little bit, even the values of the component properties looked like streams of changing values.
Can those values be wrapped [into RxJS Observables](https://www.learnrxjs.io/learn-rxjs/concepts/rxjs-primer#what-is-an-observable)? 

> An observable represents a stream, or source of data that can arrive over time.  

The next implementation of Virtuoso was a bag of **input observables** that got combined and transformed to produce **output observables**. 
The observables were put in a context, and wired up to "dumb" React components through `useInput(observable$)` / `useOutput(observable$)` 
pair of hooks that either pushed into the specified observable or re-rendered in response to a new value being emitted.

This approach was an enormous improvement. Handing updates through the `combineLatest` and `withLatestFrom` operators eliminated the duplication from the Redux actions. The observable combinatory logic was easily testable outside of React. 
Finally, rather than dealing with a state tree, I subscribe to the output observables I needed in the specific component, optimizing its rendering. 

![](/img/blog/pipes.jpg)

<p><small>Observables felt like a well organized, permanent piping and transformation system of the component state. <span>Photo by <a href="https://unsplash.com/@hooverpaul55?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Paul Teysen</a> on <a href="https://unsplash.com/s/photos/complex-pipes?utm_source=unsplash&amp;utm_medium=referral&amp;utm_content=creditCopyText">Unsplash</a></span>.</small></p>

Building Virtuoso was fun again. The version which I mustered the courage to announce to the world was built on top of RxJS - and it got a fairly positive response in [/r/reactjs](https://www.reddit.com/r/reactjs/comments/bp7ub6/react_virtuoso_a_virtual_scrolling_library_with/). 
A few redditors noticed the RxJS dependency, but nobody called me out on the state management blasphemy I have created. 
Instead, they complained about the bundle size. RxJS was too large for a small UI component. And they were right.

This problem was not unsolvable, because I used a very small part of RxJS. Over the weekend, I whipped a home-grown implementation of what I was using from RxJS and threw it in a cheekily named `tinyrx.ts`. 
The RxJS dependency was gone and the package was down to 7kB according to Bundlephobia.
In hindsight, doing that replacement back then was the right choice. Doing that at a later stage would not be that easy.

## Fast Forward One Year - Virtuoso is Used for Chats and Feeds

The problem solved by Virtuoso (easy virtualization of variably sized items) was hard enough for the project to attract and retain supportive (and smart!) early adopters - who endured my poor understanding of React 
and educated me on the finer arts of improving React performance (shoutout to [Federico Zivolo a.k.a. FezVrasta](https://github.com/FezVrasta)). 

I also understood a lot more about my users and their virtual lists. Many of them were building **chats and data feeds** - a use case which can be best described as a **reverse endless scrolling**. 
Reverse scrolling was a problem which I originally did not intend to address. And the business as usual new features overburdened my naive `VirtuosoStore` implementation, 
a single JS function which initiated and combined the entire set of observables used in the component. The project needed a rewrite to move forward.

![](/img/blog/subjects-are-signals.jpg)

<p><small>My fellow developers had more than enough of me explaining why observables made sense in React.</small></p> 

## urx was Born

As these things go, I fell in love with my pet reactive state management pattern, so I decided to give it its own name and proper documentation. 
It also grew up a bit and got some original looks. Rather than just being a poor man's RxJS, the urx library includes the [systems abstraction](https://urx.virtuoso.dev/docs/api/modules/_urx_src_system_) as a way to organize Observables into testable components. 
Subjects and Behavior Subjects (the names of which I find highly confusing) are renamed [to streams and stateful streams](https://urx.virtuoso.dev/docs/api/modules/_urx_src_streams_). 
The React abstraction got its own package, dedicated to the magical transformation of an [urx system into a React component](https://urx.virtuoso.dev/docs/api/modules/_react_urx_src_index_). 

## The Result 

React Virtuoso consists of 1550 lines of code in framework-agnostic urx systems, 
wrapped up in [~200 lines of dumb react components](https://github.com/petyosi/react-virtuoso/blob/master/src/List.tsx) wired up to the "master" List system. 
The react code is downright boring - the only unit tests against it are mostly checking the server-side-rendering specifics. 
The [rest of the test suite](https://github.com/petyosi/react-virtuoso/tree/master/test) is written against the various urx systems. 
As an example, here's how the `domIOSystem` looks: 

```ts
import { connect, pipe, scan, map, system, stream, statefulStream } from '@virtuoso.dev/urx'

export const UP = 'up' as const
export const DOWN = 'down' as const
export type ScrollDirection = typeof UP | typeof DOWN

export const domIOSystem = system(
  () => {
    const scrollTop = stream<number>()
    const deviation = statefulStream(0)
    const smoothScrollTargetReached = stream<true>()
    const statefulScrollTop = statefulStream(0)
    const viewportHeight = stream<number>()
    const scrollTo = stream<ScrollToOptions>()
    const scrollBy = stream<ScrollToOptions>()

    connect(scrollTop, statefulScrollTop)
    const scrollDirection = statefulStream<ScrollDirection>(DOWN)

    connect(
      pipe(
        scrollTop,
        scan(
          (acc, scrollTop) => {
            return { direction: scrollTop < acc.prevScrollTop ? UP : DOWN, prevScrollTop: scrollTop }
          },
          { direction: DOWN, prevScrollTop: 0 } as { direction: ScrollDirection; prevScrollTop: number }
        ),
        map(value => value.direction)
      ),
      scrollDirection
    )

    return {
      // input
      scrollTop,
      viewportHeight,
      smoothScrollTargetReached,

      // signals
      scrollTo,
      scrollBy,

      // state
      scrollDirection,
      statefulScrollTop,
      deviation,
    }
  },
  [],
  { singleton: true }
)
```

The component implementation is quite portable; when React goes out of fashion, the underlying stream system can be wrapped in a different UI framework. 

## It's not all Roses, but it's Worth it 

Reactive programming is not a silver bullet, nor magic fairly land where your code has no bugs. 
At some point, the [Reactive Programming Wikipedia Article Implementation Challenges](https://en.wikipedia.org/wiki/Reactive_programming#Implementation_challenges_in_reactive_programming) 
became a checklist of the errors and the subtle issues I encountered.  React, while perceptive to the approach, is also not explicitly designed to work with observable streams. 

Still, I am certain that I could not implement React Virtuoso with any other state management. 

## Should you try urx?

The short answer is probably "no" unless you are implementing something similar to React Virtuoso. The popular state management tools have enormous healthy ecosystems, documentation and tooling built for them. 

However, you can go [through the documentation](https://urx.virtuoso.dev/) even for the fun of it - it is a different take on UI state management. 
If you want to see a real-world example of how systems are built and organized, you can dig into [the source code of React Virtuoso itself](https://github.com/petyosi/react-virtuoso/tree/master/src). 