import * as fs from 'fs'

const examples = fs
  .readdirSync('./e2e')
  .filter(name => name.match(/tsx$/))
  .filter(name => name !== 'server.tsx')

const code = `import React, { useEffect } from 'react'
import * as ReactDOM from 'react-dom'
import { BrowserRouter as Router, Switch, Route, Link } from 'react-router-dom'

export default function App() {
  const [exampleComponents, setExampleComponents] = React.useState([])
  useEffect(() => {
    Promise.all([
        ${examples
          .map(path => {
            const p = path.replace('.tsx', '')
            return `Promise.all([ import("./${p}") , "/${p}" ])\n`
          })
          .join(', ')}
      ]).then((components: any) => {
        setExampleComponents(() => {
          return components.map(([comp, name]) => {
            return { name, component: comp.default }
          })
        })
    })
  }, [])

  return (
    
    <Router>
      <div style={{ height: '100%', display: 'flex' }}>

        <div style={{ flex: 1, border: '1px solid blue', height: '100%'  }} id="test-root" >
        <Switch>
          {exampleComponents.map(({ name, component }, index) => (
            <Route key={index} path={name} component={component} />
          ))}
        </Switch>
      </div>

      <ul style={{ minWidth: 200 }}>
        { exampleComponents.map(({ name }, index) => <li key={index}><Link to={name}>{name}</Link></li> }
      </ul>

    </div>
    </Router>

  )
}

ReactDOM.render(<App />, document.getElementById('root'))
`

const htmlCode = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>RV Test Cases</title>
    <style type="text/css" media="screen">
      html, body, #root {
        height: 100%;
        padding: 0;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script src="./__examples.tsx"></script>
  </body>
</html>
`

fs.writeFileSync('e2e/__examples.tsx', code)
fs.writeFileSync('e2e/__examples.html', htmlCode)
