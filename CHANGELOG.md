## Next

## 0.20.0 (15/08/2020)

### Changes
* **Breaking Change**: default height of the component from   `40rem` to `100%`, making it easier to control the height with parent element.
* Feature: `emptyComponent:ComponentType` optional property (#159)
* Feature: smooth scroll behavior for VirtuosoGrid (#164)
* Feature: scrollSeek ported to VirtuosoGrid (#165)
* Fix: `scrollToIndex` when called from `useEffect` while the component is invisible. The error is caused by the component not being visible yet. An ugly looking but effective workaround is to retry with a timeout. (#163)

### Chores
* Upgraded eslint config to stop complaining about HTML files
* yarn upgrade

