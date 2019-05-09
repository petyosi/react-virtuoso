import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/Virtuoso'
import { LoremIpsum } from 'lorem-ipsum'

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4,
  },
  wordsPerSentence: {
    max: 16,
    min: 4,
  },
})

const generated: { [key: number]: string } = {}

const lipsum = (index: number) => {
  if (!generated[index]) {
    generated[index] = lorem.generateSentences(3)
  }
  return generated[index]
}

const App = () => {
  return (
    <div className="d-flex justify-content-center">
      <div style={{ height: '500px', width: '100%' }}>
        <Virtuoso
          totalCount={1000000}
          overscan={200}
          item={(index: number) => {
            return (
              <div>
                Item {index} {lipsum(index)}
              </div>
            )
          }}
        />
      </div>
    </div>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
