"use strict";(self.webpackChunkreact_virtuoso=self.webpackChunkreact_virtuoso||[]).push([[9285],{3576:(e,t,n)=>{n.d(t,{Zo:()=>d,kt:()=>g});var r=n(959);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function s(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?s(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):s(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function a(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},s=Object.keys(e);for(r=0;r<s.length;r++)n=s[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var s=Object.getOwnPropertySymbols(e);for(r=0;r<s.length;r++)n=s[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var p=r.createContext({}),u=function(e){var t=r.useContext(p),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},d=function(e){var t=u(e.components);return r.createElement(p.Provider,{value:t},e.children)},l="mdxType",c={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},m=r.forwardRef((function(e,t){var n=e.components,o=e.mdxType,s=e.originalType,p=e.parentName,d=a(e,["components","mdxType","originalType","parentName"]),l=u(n),m=o,g=l["".concat(p,".").concat(m)]||l[m]||c[m]||s;return n?r.createElement(g,i(i({ref:t},d),{},{components:n})):r.createElement(g,i({ref:t},d))}));function g(e,t){var n=arguments,o=t&&t.mdxType;if("string"==typeof e||o){var s=n.length,i=new Array(s);i[0]=m;var a={};for(var p in t)hasOwnProperty.call(t,p)&&(a[p]=t[p]);a.originalType=e,a[l]="string"==typeof e?e:o,i[1]=a;for(var u=2;u<s;u++)i[u]=n[u];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}m.displayName="MDXCreateElement"},5634:(e,t,n)=>{n.r(t),n.d(t,{assets:()=>d,contentTitle:()=>p,default:()=>g,frontMatter:()=>a,metadata:()=>u,toc:()=>l});var r=n(2564),o=n(3102),s=(n(959),n(3576)),i=["components"],a={id:"prepend-items",title:"Prepending Items",sidebar_label:"Prepending Items",slug:"/prepend-items/"},p=void 0,u={unversionedId:"scenarios/prepend-items",id:"scenarios/prepend-items",title:"Prepending Items",description:"Appending items to the list is straightforward - the items at the bottom do not displace the currently rendered ones.",source:"@site/docs/scenarios/prepend-items.md",sourceDirName:"scenarios",slug:"/prepend-items/",permalink:"/prepend-items/",draft:!1,editUrl:"https://github.com/petyosi/react-virtuoso/edit/master/docs/scenarios/prepend-items.md",tags:[],version:"current",frontMatter:{id:"prepend-items",title:"Prepending Items",sidebar_label:"Prepending Items",slug:"/prepend-items/"},sidebar:"defaultSidebar",previous:{title:"Mocking in tests",permalink:"/mocking-in-tests/"},next:{title:"Press to Load More",permalink:"/press-to-load-more/"}},d={},l=[],c={toc:l},m="wrapper";function g(e){var t=e.components,n=(0,o.Z)(e,i);return(0,s.kt)(m,(0,r.Z)({},c,n,{components:t,mdxType:"MDXLayout"}),(0,s.kt)("p",null,"Appending items to the list is straightforward - the items at the bottom do not displace the currently rendered ones.\nPrepending items is more complex because the current items should remain at their location, and their indexes should not be offset."),(0,s.kt)("p",null,"This example shows how to increase the item count and instruct the component that you are prepending items by decreasing the ",(0,s.kt)("inlineCode",{parentName:"p"},"firstItemIndex")," property\nvalue when the user scrolls to the top, creating ",(0,s.kt)("strong",{parentName:"p"},"reverse endless scrolling"),"."),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-jsx",metastring:"live include-data",live:!0,"include-data":!0},"import { Virtuoso } from 'react-virtuoso'\nimport { generateUsers } from './data'\nimport { useState, useMemo, useCallback, useEffect, useRef } from 'react'\n\nexport default function App() {\n  const START_INDEX = 10000\n  const INITIAL_ITEM_COUNT = 100\n\n  const [firstItemIndex, setFirstItemIndex] = useState(START_INDEX)\n  const [users, setUsers] = useState(() => generateUsers(INITIAL_ITEM_COUNT, START_INDEX))\n\n  const prependItems = useCallback(() => {\n    const usersToPrepend = 20\n    const nextFirstItemIndex = firstItemIndex - usersToPrepend\n\n    setTimeout(() => {\n      setFirstItemIndex(() => nextFirstItemIndex)\n      setUsers(() => [...generateUsers(usersToPrepend, nextFirstItemIndex), ...users])\n    }, 500)\n\n    return false\n  }, [firstItemIndex, users, setUsers])\n\n  return (\n    <Virtuoso\n      style={{ height: 400 }}\n      firstItemIndex={firstItemIndex}\n      initialTopMostItemIndex={INITIAL_ITEM_COUNT - 1}\n      data={users}\n      startReached={prependItems}\n      itemContent={(index, user) => {\n        return (\n          <div style={{ backgroundColor: user.bgColor, padding: '1rem 0.5rem' }}>\n            <h4>\n              {user.index}. {user.name}\n            </h4>\n            <div style={{ marginTop: '1rem' }}>{user.description}</div>\n          </div>\n        )\n      }}\n    />\n  )\n}\n")),(0,s.kt)("p",null,"Prepending items in grouped mode works in a similar fashion. You need to ensure that the ",(0,s.kt)("inlineCode",{parentName:"p"},"firstItemIndex")," is decreased with the amount of items ",(0,s.kt)("strong",{parentName:"p"},"exclding the groups themselves")," added to the ",(0,s.kt)("inlineCode",{parentName:"p"},"groupCounts")," property.\nFollow the example below for further details"),(0,s.kt)("pre",null,(0,s.kt)("code",{parentName:"pre",className:"language-jsx",metastring:"live include-data",live:!0,"include-data":!0},"import React from 'react'\nimport { GroupedVirtuoso } from 'react-virtuoso'\n\nfunction generateRandomString(length) {\n  let result = ''\n  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'\n  const charactersLength = characters.length\n  for (let i = 0; i < length; i++) {\n    result += characters.charAt(Math.floor(Math.random() * charactersLength))\n  }\n  return result\n}\n\nconst ITEMS_PER_GROUP = 10\nconst INITIAL_GROUP_COUNT = 21\nconst INITIAL_TOPMOST_ITEM_INDEX = ITEMS_PER_GROUP * INITIAL_GROUP_COUNT - 1\nconst FIRST_ITEM_INDEX = 20000\nconst ITEMS_PER_PREPEND = 100\n\nexport default function App() {\n  const [firstItemIndex, setFirstItemIndex] = React.useState(FIRST_ITEM_INDEX)\n\n  const [groupCounts, setGroupCounts] = React.useState(() => {\n    return Array.from({ length: INITIAL_GROUP_COUNT }, () => ITEMS_PER_GROUP)\n  })\n\n  // As items and groups get prepended, the groups change. We need to maintain an additional data structure to keep track of the group titles.\n  const [groupTitles, setGroupTitles] = React.useState(() => {\n    return Array.from({ length: INITIAL_GROUP_COUNT }, () => generateRandomString(5))\n  })\n\n  const prepend = React.useCallback(\n    (amount) => () => {\n      setFirstItemIndex((val) => val - amount)\n      setGroupCounts((prevGroups) => {\n        // this is just an example calculation so that the example validates the option to extend the first group\n        // in reality, you may don't need to do that.\n        const itemsToPrependToFirstGroup = amount % ITEMS_PER_GROUP\n\n        // we will extend the first group with the leftover unshift value,\n        // exact groups would also work, of course.\n        const firstGroupNewCount = [...prevGroups].shift() + itemsToPrependToFirstGroup\n\n        const newGroupCount = Math.floor(amount / ITEMS_PER_GROUP)\n        const newGroups = Array.from({ length: newGroupCount }, () => ITEMS_PER_GROUP)\n\n        const result = [...newGroups, firstGroupNewCount, ...prevGroups]\n\n        // prepend the group titles with new random strings based on how many new groups we added\n        setGroupTitles((prevTitles) => {\n          const newTitles = Array.from({ length: newGroupCount }, () => generateRandomString(5))\n          return [...newTitles, ...prevTitles]\n        })\n\n        return result\n      })\n    },\n    []\n  )\n\n  return (\n    <div>\n      <GroupedVirtuoso\n        firstItemIndex={firstItemIndex}\n        startReached={prepend(ITEMS_PER_PREPEND)}\n        initialTopMostItemIndex={INITIAL_TOPMOST_ITEM_INDEX}\n        context={{ groupTitles }}\n        groupCounts={groupCounts}\n        itemContent={(index) => <div style={{ height: '20px' }}>Item {index}</div>}\n        groupContent={(index, { groupTitles }) => <div style={{ height: '30px', backgroundColor: 'blue' }}>Group {groupTitles[index]}</div>}\n        style={{ height: '300px' }}\n      />\n    </div>\n  )\n}\n")))}g.isMDXComponent=!0}}]);