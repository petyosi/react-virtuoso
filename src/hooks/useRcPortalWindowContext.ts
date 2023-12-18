import { createContext, useContext } from 'react';

type RcPortalWindowContextValue = {
  externalWindow?: Window;
  document: Document;
};

const RcPortalWindowContext = createContext<RcPortalWindowContextValue>({
  document:
  // directly access `document` will cause error in next.js
    typeof globalThis !== 'undefined' ? globalThis.document : window.document,
});

const useRcPortalWindowContext = () => useContext(RcPortalWindowContext);

export { RcPortalWindowContext, useRcPortalWindowContext };
