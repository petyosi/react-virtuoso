(window.webpackJsonp=window.webpackJsonp||[]).push([[76],{134:function(e,t,n){"use strict";n.r(t),n.d(t,"frontMatter",(function(){return s})),n.d(t,"metadata",(function(){return i})),n.d(t,"rightToc",(function(){return l})),n.d(t,"default",(function(){return u}));var r=n(2),o=n(6),a=(n(0),n(153)),s={id:"press-to-load-more",title:"Press to Load More",sidebar_label:"Press to Load More",slug:"/press-to-load-more/"},i={unversionedId:"press-to-load-more",id:"press-to-load-more",isDocsHomePage:!1,title:"Press to Load More",description:'The components.Footer property can be used to place a "load more" button that appends more items to the list.',source:"@site/docs/press-to-load-more.md",slug:"/press-to-load-more/",permalink:"/press-to-load-more/",editUrl:"https://github.com/petyosi/react-virtuoso/edit/master/site/docs/press-to-load-more.md",version:"current",sidebar_label:"Press to Load More",sidebar:"someSidebar",previous:{title:"Grid with Responsive Columns",permalink:"/grid-responsive-columns/"},next:{title:"Endless Scrolling",permalink:"/endless-scrolling/"}},l=[],c={rightToc:l};function u(e){var t=e.components,n=Object(o.a)(e,["components"]);return Object(a.b)("wrapper",Object(r.a)({},c,n,{components:t,mdxType:"MDXLayout"}),Object(a.b)("p",null,"The ",Object(a.b)("inlineCode",{parentName:"p"},"components.Footer"),' property can be used to place a "load more" button that appends more items to the list.'),Object(a.b)("p",null,"Scroll to the bottom of the list and press the button to load 100 more items. The ",Object(a.b)("inlineCode",{parentName:"p"},"setTimeout")," simulates a network request; in the real world, you can fetch data from a service."),Object(a.b)("pre",null,Object(a.b)("code",Object(r.a)({parentName:"pre"},{className:"language-jsx",metastring:"live",live:!0}),"() => {\n  const [users, setUsers] = useState(() => [])\n  const [loading, setLoading] = useState(false)\n\n  const loadMore = useCallback(() => {\n    setLoading(true)\n    return setTimeout(() => {\n      setUsers((users) =>  ([...users, ...generateUsers(100, users.length)]) )\n      setLoading(() => false)\n    }, 500)\n  }, [setUsers, setLoading])\n\n  useEffect(() => {\n    const timeout = loadMore()\n    return () => clearTimeout(timeout)\n  }, [])\n\n  return (\n    <Virtuoso\n      style={{height: 300}}\n      data={users}\n      itemContent={(index, user) => { return (<div style={{ backgroundColor: user.bgColor }}>{user.name}</div>) }}\n      components={{\n        Footer: () => {\n          return (\n            <div\n              style={{\n                padding: '2rem',\n                display: 'flex',\n                justifyContent: 'center',\n              }}\n            >\n              <button disabled={loading} onClick={loadMore}>\n                {loading ? 'Loading...' : 'Press to load more'}\n              </button>\n            </div>\n          )\n        }\n      }}\n    />\n  )\n}\n")))}u.isMDXComponent=!0},153:function(e,t,n){"use strict";n.d(t,"a",(function(){return p})),n.d(t,"b",(function(){return b}));var r=n(0),o=n.n(r);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function s(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function i(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?s(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):s(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function l(e,t){if(null==e)return{};var n,r,o=function(e,t){if(null==e)return{};var n,r,o={},a=Object.keys(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||(o[n]=e[n]);return o}(e,t);if(Object.getOwnPropertySymbols){var a=Object.getOwnPropertySymbols(e);for(r=0;r<a.length;r++)n=a[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(o[n]=e[n])}return o}var c=o.a.createContext({}),u=function(e){var t=o.a.useContext(c),n=t;return e&&(n="function"==typeof e?e(t):i(i({},t),e)),n},p=function(e){var t=u(e.components);return o.a.createElement(c.Provider,{value:t},e.children)},d={inlineCode:"code",wrapper:function(e){var t=e.children;return o.a.createElement(o.a.Fragment,{},t)}},m=o.a.forwardRef((function(e,t){var n=e.components,r=e.mdxType,a=e.originalType,s=e.parentName,c=l(e,["components","mdxType","originalType","parentName"]),p=u(n),m=r,b=p["".concat(s,".").concat(m)]||p[m]||d[m]||a;return n?o.a.createElement(b,i(i({ref:t},c),{},{components:n})):o.a.createElement(b,i({ref:t},c))}));function b(e,t){var n=arguments,r=t&&t.mdxType;if("string"==typeof e||r){var a=n.length,s=new Array(a);s[0]=m;var i={};for(var l in t)hasOwnProperty.call(t,l)&&(i[l]=t[l]);i.originalType=e,i.mdxType="string"==typeof e?e:r,s[1]=i;for(var c=2;c<a;c++)s[c]=n[c];return o.a.createElement.apply(null,s)}return o.a.createElement.apply(null,n)}m.displayName="MDXCreateElement"}}]);