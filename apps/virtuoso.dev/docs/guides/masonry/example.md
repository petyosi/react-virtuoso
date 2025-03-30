---
id: masonry
title: Masonry
sidebar_label: Basic Example
slug: /hello-masonry/
position: 1
---

# Masonry

```tsx live 
import { VirtuosoMasonry } from "@virtuoso.dev/masonry";
import { useEffect, useMemo, useState } from "react";

function useWindowWidth() {
  const [width, setWidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  return width;
}

const ItemContent: React.FC<{ data: number }> = ({ data }) => {
  const height =
    data % 10 === 0 ? 200 : data % 5 === 0 ? 180 : data % 7 ? 150 : 120;
  return (
    <div style={{ padding: "5px" }}>
      <div style={{ height, border: "1px solid black" }}>Item {data}</div>
    </div>
  );
};

export default function App() {
  const data = useMemo(() => {
    return Array.from({ length: 1000 }, (_, index) => index);
  }, []);

  const width = useWindowWidth();

  const columnCount = useMemo(() => {
    if (width < 500) {
      return 2;
    }
    if (width < 800) {
      return 3;
    }
    return 4;
  }, [width]);

  return (
    <div>
      <h1>Masonry with window scroll and SSR</h1>
      <VirtuosoMasonry
        columnCount={columnCount}
        data={data}
        useWindowScroll={true}
        initialItemCount={50}
        ItemContent={ItemContent}
        style={{
          border: "1px solid black",
        }}
      />
    </div>
  );
}
 
```
