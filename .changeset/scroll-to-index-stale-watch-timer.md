---
'react-virtuoso': patch
---

Fix a smooth `scrollToIndex` stopping short of its item when it starts within 150 ms of a previous `scrollToIndex`. The previous call's list-change watch timer kept running after it was superseded and cleaned up the new call's retry listener, so the new call never corrected its estimated position.
