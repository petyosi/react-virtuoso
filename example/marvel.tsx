import 'bootstrap/dist/css/bootstrap.min.css'
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { Virtuoso } from '../src/Virtuoso'
import axios from 'axios'
import { useState, useRef } from 'react'

const pageSize = 80

const App = () => {
  const [copyright, setCopyright] = useState('')
  const [total, setTotal] = useState(0)
  const items = useRef([])
  const loading = useRef(false)
  const offset = useRef(0)
  const max = useRef(0)

  const loadMore = () => {
    if (loading.current) {
      return
    }

    loading.current = true
    axios
      .get('https://gateway.marvel.com:443/v1/public/characters', {
        params: { apikey: '0d9bdf461dad375a07ec37abec330ce9', offset: offset.current, limit: pageSize },
      })
      .then(({ data }) => {
        const newItems = items.current.concat(data.data.results)
        setCopyright(data.attributionHTML)
        max.current = data.data.total
        loading.current = false
        offset.current += pageSize
        items.current = newItems
        setTotal(newItems.length - 1)
      })
  }

  React.useEffect(loadMore, [])
  return (
    <>
      <div style={{ height: '100%', width: '100%' }}>
        <Virtuoso
          totalCount={total}
          overscan={200}
          maxIndex={index => {
            if (index < max.current - 1) {
              loadMore()
            }
          }}
          item={(index: number) => {
            const item = items.current[index]
            const imageUrl = item.thumbnail.path + '.' + item.thumbnail.extension
            return (
              <div className="media p-3">
                <img src={imageUrl} className="align-self-start mr-3" alt="..." width="160" />
                <div className="media-body">
                  <h5 className="mt-0">{item.name}</h5>
                  <p className="mb-0">{item.description}</p>
                  <ul style={{ fontSize: 'smaller' }}>
                    {item.series.items.map((sery, i) => (
                      <li key={i}>{sery.name}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          }}
        />
      </div>

      <p dangerouslySetInnerHTML={{ __html: copyright }} />
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('root'))
