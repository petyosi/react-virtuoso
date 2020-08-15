## 0.20.0 (15/08/2020)

* Fix #163 `scrollToIndex` is called from `useEffect` while the component is invisible. The error is caused by the component not being visible yet. An ugly looking but effective workaround is to retry with a timeout. 
* `emptyComponent:ComponentType` optional property (#159)
* Upgraded eslint config to stop complaining about HTML files
* yarn upgrade

