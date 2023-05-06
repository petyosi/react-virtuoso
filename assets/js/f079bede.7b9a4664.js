"use strict";(self.webpackChunkreact_virtuoso=self.webpackChunkreact_virtuoso||[]).push([[7048],{3576:(e,r,t)=>{t.d(r,{Zo:()=>d,kt:()=>g});var n=t(959);function o(e,r,t){return r in e?Object.defineProperty(e,r,{value:t,enumerable:!0,configurable:!0,writable:!0}):e[r]=t,e}function u(e,r){var t=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);r&&(n=n.filter((function(r){return Object.getOwnPropertyDescriptor(e,r).enumerable}))),t.push.apply(t,n)}return t}function i(e){for(var r=1;r<arguments.length;r++){var t=null!=arguments[r]?arguments[r]:{};r%2?u(Object(t),!0).forEach((function(r){o(e,r,t[r])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(t)):u(Object(t)).forEach((function(r){Object.defineProperty(e,r,Object.getOwnPropertyDescriptor(t,r))}))}return e}function p(e,r){if(null==e)return{};var t,n,o=function(e,r){if(null==e)return{};var t,n,o={},u=Object.keys(e);for(n=0;n<u.length;n++)t=u[n],r.indexOf(t)>=0||(o[t]=e[t]);return o}(e,r);if(Object.getOwnPropertySymbols){var u=Object.getOwnPropertySymbols(e);for(n=0;n<u.length;n++)t=u[n],r.indexOf(t)>=0||Object.prototype.propertyIsEnumerable.call(e,t)&&(o[t]=e[t])}return o}var s=n.createContext({}),a=function(e){var r=n.useContext(s),t=r;return e&&(t="function"==typeof e?e(r):i(i({},r),e)),t},d=function(e){var r=a(e.components);return n.createElement(s.Provider,{value:r},e.children)},l="mdxType",c={inlineCode:"code",wrapper:function(e){var r=e.children;return n.createElement(n.Fragment,{},r)}},m=n.forwardRef((function(e,r){var t=e.components,o=e.mdxType,u=e.originalType,s=e.parentName,d=p(e,["components","mdxType","originalType","parentName"]),l=a(t),m=o,g=l["".concat(s,".").concat(m)]||l[m]||c[m]||u;return t?n.createElement(g,i(i({ref:r},d),{},{components:t})):n.createElement(g,i({ref:r},d))}));function g(e,r){var t=arguments,o=r&&r.mdxType;if("string"==typeof e||o){var u=t.length,i=new Array(u);i[0]=m;var p={};for(var s in r)hasOwnProperty.call(r,s)&&(p[s]=r[s]);p.originalType=e,p[l]="string"==typeof e?e:o,i[1]=p;for(var a=2;a<u;a++)i[a]=t[a];return n.createElement.apply(null,i)}return n.createElement.apply(null,t)}m.displayName="MDXCreateElement"},6930:(e,r,t)=>{t.r(r),t.d(r,{assets:()=>d,contentTitle:()=>s,default:()=>g,frontMatter:()=>p,metadata:()=>a,toc:()=>l});var n=t(2564),o=t(3102),u=(t(959),t(3576)),i=["components"],p={id:"grouped-numbers",title:"Grouped 10,000 numbers",sidebar_label:"Grouped Numbers",slug:"/grouped-numbers/",sidebar_position:1},s=void 0,a={unversionedId:"grouped-mode/grouped-numbers",id:"grouped-mode/grouped-numbers",title:"Grouped 10,000 numbers",description:"The example below shows a simple grouping mode - 10,000 items in groups of 10.",source:"@site/docs/grouped-mode/grouped-numbers.md",sourceDirName:"grouped-mode",slug:"/grouped-numbers/",permalink:"/grouped-numbers/",draft:!1,editUrl:"https://github.com/petyosi/react-virtuoso/edit/master/docs/grouped-mode/grouped-numbers.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{id:"grouped-numbers",title:"Grouped 10,000 numbers",sidebar_label:"Grouped Numbers",slug:"/grouped-numbers/",sidebar_position:1},sidebar:"defaultSidebar",previous:{title:"Top Items",permalink:"/top-items/"},next:{title:"Grouped by First Letter",permalink:"/grouped-by-first-letter/"}},d={},l=[],c={toc:l},m="wrapper";function g(e){var r=e.components,t=(0,o.Z)(e,i);return(0,u.kt)(m,(0,n.Z)({},c,t,{components:r,mdxType:"MDXLayout"}),(0,u.kt)("p",null,"The example below shows a simple grouping mode - 10,000 items in groups of 10."),(0,u.kt)("pre",null,(0,u.kt)("code",{parentName:"pre",className:"language-jsx",metastring:"live",live:!0},"import { GroupedVirtuoso } from 'react-virtuoso'\nimport { useMemo } from 'react'\n\nexport default function App() {\n  const groupCounts = useMemo(() => { \n    return Array(1000).fill(10)\n  }, [])\n\n\n  return (\n    <GroupedVirtuoso\n      style={{ height: 400 }}\n      groupCounts={groupCounts}\n      groupContent={index => {\n        return (\n            <div style={{ backgroundColor: 'white' }}>Group {index * 10} &ndash; {index * 10 + 10}</div>\n        )\n      }}\n      itemContent={(index, groupIndex) => {\n        return (\n              <div>{index} (group {groupIndex})</div>\n        )\n      }}\n    />\n  )\n}\n")))}g.isMDXComponent=!0}}]);