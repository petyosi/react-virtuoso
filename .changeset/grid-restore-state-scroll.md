---
'react-virtuoso': patch
---

Fix `VirtuosoGrid` `restoreStateFrom` leaving the grid empty and scrolled to the top. The restored scroll position is now applied once the list has its full height, and the intermediate state is no longer reported through `stateChanged`.
