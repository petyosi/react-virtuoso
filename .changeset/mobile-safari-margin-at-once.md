---
'react-virtuoso': patch
---

Fix the list jumping for a frame in mobile Safari when scrolling up stops: the list's margin is now taken off in the same task as the scroll that replaces it, as `TableVirtuoso` already does.
