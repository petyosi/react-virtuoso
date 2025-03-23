---
id: virtuoso-message-list-smooth-scrolling
title: Virtuoso Message Custom Smooth Scrolling
sidebar_label: Custom Smooth Scrolling
sidebar_position: 8
slug: /virtuoso-message-list/smooth-scrolling
---

# Custom Smooth Scrolling

In addition to the default `'smooth'` and `'auto'` scroll behavior values, the component accepts a custom function that accepts the current scroll location, the target scroll location and returns a custom payload that describes a smooth scroll.

```tsx live
import { VirtuosoMessageList, VirtuosoMessageListProps, VirtuosoMessageListMethods, VirtuosoMessageListLicense } from '@virtuoso.dev/message-list'
import {useRef} from 'react'
import {randTextRange, randPhrase} from '@ngneat/falso'

/**
 * Bounce easing function - https://easings.net/#easeOutBounce. This is just an example, you can use any easing function.
 */
function easeOutBounce(x: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (x < 1 / d1) {
    return n1 * x * x;
  } else if (x < 2 / d1) {
    return n1 * (x -= 1.5 / d1) * x + 0.75;
  } else if (x < 2.5 / d1) {
    return n1 * (x -= 2.25 / d1) * x + 0.9375;
  } else {
    return n1 * (x -= 2.625 / d1) * x + 0.984375;
  }
}

/**
 * If the location is too far, you can return a different smooth scroll behavior
 */
function customSmoothScroll(currentTop: number, targetTop: number) {
  return {
    // increase the animation frame count to smoothen and slow down the scroll.
    animationFrameCount: 50,
    easing: easeOutBounce,
  };
}

export default function App() {
  const virtuoso = useRef<VirtuosoMessageListMethods<Message>>(null);

  return (
    <div
      className="wide-example full-code"
      style={{
        height: 500,
        display: "flex",
        flexDirection: "column",
        fontSize: "70%",
      }}
    >
      <VirtuosoMessageListLicense licenseKey="">
        <VirtuosoMessageList<Message, null>
          initialData={Array.from({ length: 100 }, (_, index) =>
            randomMessage(index % 2 === 0 ? "me" : "other"),
          )}
          ref={virtuoso}
          style={{ flex: 1 }}
          computeItemKey={({ data }) => data.key}
          initialLocation={{ index: "LAST", align: "end" }}
          ItemContent={ItemContent}
        />
      </VirtuosoMessageListLicense>

      <button
        style={{ marginTop: "1rem", fontSize: "1.1rem", padding: "1rem" }}
        onClick={(e) => {
          e.target.disabled = true;
          const myMessage = randomMessage("me");
          virtuoso.current?.data.append(
            [myMessage],
            ({ scrollInProgress, atBottom }) => {
              return {
                index: "LAST",
                align: "start",
                behavior:
                  atBottom || scrollInProgress ? customSmoothScroll : "auto",
              };
            },
          );

          setTimeout(() => {
            const botMessage = randomMessage("other");
            virtuoso.current?.data.append([botMessage]);

            let counter = 0;
            const interval = setInterval(() => {
              if (counter++ > 20) {
                clearInterval(interval);
                e.target.disabled = false;
              }
              virtuoso.current?.data.map((message) => {
                return message.key === botMessage.key
                  ? { ...message, text: message.text + " " + randPhrase() }
                  : message;
              }, "smooth");
            }, 150);
          }, 1000);
        }}
      >
        Ask the bot a question!
      </button>
    </div>
  );
}

interface Message {
  key: string;
  text: string;
  user: "me" | "other";
}

let idCounter = 0;

function randomMessage(user: Message["user"]): Message {
  return {
    user,
    key: `${idCounter++}`,
    text: randTextRange({ min: user === "me" ? 20 : 100, max: 200 }),
  };
}

const ItemContent: VirtuosoMessageListProps<Message, null>["ItemContent"] = ({
  data,
}) => {
  const ownMessage = data.user === "me";
  return (
    <div style={{ paddingBottom: "2rem", display: "flex" }}>
      <div
        style={{
          maxWidth: "60%",
          marginLeft: data.user === "me" ? "auto" : undefined,

          background: ownMessage
            ? "var(--background)"
            : "var(--alt-background)",
          border: '1px solid var(--border)',
          borderRadius: "1rem",
          padding: "1rem",
        }}
      >
        {data.text}
      </div>
    </div>
  );
};

 ;
```
