(window.webpackJsonp=window.webpackJsonp||[]).push([[66],{124:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return a})),n.d(t,"metadata",(function(){return l})),n.d(t,"rightToc",(function(){return c})),n.d(t,"default",(function(){return u}));var r=n(2),i=n(6),o=(n(0),n(153)),a={id:"table-fixed-columns",title:"Table Virtuoso Example with Fixed Columns",sidebar_label:"Fixed Columns",slug:"/table-fixed-columns/"},l={unversionedId:"table-fixed-columns",id:"table-fixed-columns",isDocsHomePage:!1,title:"Table Virtuoso Example with Fixed Columns",description:"Setting sticky columns is done entirely through styling.",source:"@site/docs/table-fixed-headers.md",slug:"/table-fixed-columns/",permalink:"/table-fixed-columns/",editUrl:"https://github.com/petyosi/react-virtuoso/edit/master/site/docs/table-fixed-headers.md",version:"current",sidebar_label:"Fixed Columns",sidebar:"someSidebar",previous:{title:"Table Virtuoso with mui table",permalink:"/mui-table-virtual-scroll/"},next:{title:"Table Virtuoso integrated with React Table",permalink:"/react-table-integration/"}},c=[{value:"Table with fixed first column",id:"table-with-fixed-first-column",children:[]}],s={rightToc:c};function u(e){var t=e.components,n=Object(i.a)(e,["components"]);return Object(o.b)("wrapper",Object(r.a)({},s,n,{components:t,mdxType:"MDXLayout"}),Object(o.b)("p",null,"Setting sticky columns is done entirely through styling."),Object(o.b)("h2",{id:"table-with-fixed-first-column"},"Table with fixed first column"),Object(o.b)("pre",null,Object(o.b)("code",Object(r.a)({parentName:"pre"},{className:"language-jsx",metastring:"live",live:!0}),"<TableVirtuoso\n  data={generateUsers(1000)}\n  components={{ Table: ({ style, ...props }) => <table {...props} style={{...style, width: 700}} /> }}\n  fixedHeaderContent={() => ( \n    <tr>\n      <th style={{ width: 150, background: 'blue', position: 'sticky', left: 0, zIndex: 1 }}>Name</th>\n      <th style={{ background: 'blue' }}>Description</th>\n      <th style={{ background: 'blue' }}>Description</th>\n      <th style={{ background: 'blue' }}>Description</th>\n      <th style={{ background: 'blue' }}>Description</th>\n      <th style={{ background: 'blue' }}>Description</th>\n    </tr>\n  )}\n  itemContent={(index, user) => (\n    <>\n      <td style={{ width: 150, background: 'var(--ifm-background-color)', position: 'sticky', left: 0 }}>{user.name}</td>\n      <td>{user.description}</td>\n      <td>{user.description}</td>\n      <td>{user.description}</td>\n      <td>{user.description}</td>\n      <td>{user.description}</td>\n    </>\n  )}\n/>\n")))}u.isMDXComponent=!0},153:function(e,t,n){"use strict";n.d(t,"a",(function(){return d})),n.d(t,"b",(function(){return f}));var r=n(0),i=n.n(r);function o(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function a(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function l(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?a(Object(n),!0).forEach((function(t){o(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function c(e,t){if(null==e)return{};var n,r,i=function(e,t){if(null==e)return{};var n,r,i={},o=Object.keys(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||(i[n]=e[n]);return i}(e,t);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(e);for(r=0;r<o.length;r++)n=o[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(i[n]=e[n])}return i}var s=i.a.createContext({}),u=function(e){var t=i.a.useContext(s),n=t;return e&&(n="function"==typeof e?e(t):l(l({},t),e)),n},d=function(e){var t=u(e.components);return i.a.createElement(s.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return i.a.createElement(i.a.Fragment,{},t)}},b=i.a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,o=e.originalType,a=e.parentName,s=c(e,["components","mdxType","originalType","parentName"]),d=u(n),b=r,f=d["".concat(a,".").concat(b)]||d[b]||p[b]||o;return n?i.a.createElement(f,l(l({ref:t},s),{},{components:n})):i.a.createElement(f,l({ref:t},s))}));function f(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var o=n.length,a=new Array(o);a[0]=b;var l={};for(var c in t)hasOwnProperty.call(t,c)&&(l[c]=t[c]);l.originalType=e,l.mdxType="string"==typeof e?e:r,a[1]=l;for(var s=2;s<o;s++)a[s]=n[s];return i.a.createElement.apply(null,a)}return i.a.createElement.apply(null,n)}b.displayName="MDXCreateElement"}}]);