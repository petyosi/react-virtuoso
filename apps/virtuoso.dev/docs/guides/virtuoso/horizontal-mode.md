---
id: horizontal-mode
title: Horizontal Mode
sidebar_title: Horizontal Mode
slug: /horizontal-mode/
sidebar_position: 90
---


Setting the `horizontalDirection` property to `true` will render the Virtuoso component horizontally. The items are positioned using `display: inline-block`.


## Horizontal mode list

```tsx live
function App() {
  const users = useMemo(() => {
    return Array.from({ length: 1000 }, (_, index) => ({
      name: `User ${index}`,
      bgColor: `hsl(${Math.random() * 360}, 70%, 80%)`,
      size: Math.floor(Math.random() * 40) + 100,
      description: `Description for user ${index}`,
    }));
  }, []);

  return (
    <Virtuoso
      style={{ height: 120 }}
      data={users}
      horizontalDirection
      itemContent={(_, user) => (
        <div
          style={{
            backgroundColor: user.bgColor,
            padding: "0.5rem",
          }}
        >
          <p>
            <strong>{user.name}</strong>
          </p>
          <div>{user.description}</div>
        </div>
      )}
    />
  );
}
```