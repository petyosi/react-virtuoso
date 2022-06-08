import * as React from 'react'
import { Virtuoso } from '../src'

export default function App() {
  const [customScrollParent, setCustomScrollParent] = React.useState(null)
  return (
    <div style={{ overflow: 'auto', background: 'lightgreen', height: '80vh' }}>
      <div ref={setCustomScrollParent} style={{ overflow: 'auto', marginTop: 400, background: 'lightgrey', height: '50vh', padding: '50px' }}>
        <ol>
          <li>Scroll down manually, new items should appear.</li>
          <li>Scroll halfway down manually, then scroll the outer green container down, new items should appear.</li>
          <li>
            Scroll outer green container all the way down, then scroll items down, then scroll outer green container up and down, new items
            should appear.
          </li>
          <li>Click on foo, then scroll upwards. the paragraphs should stay correctly.</li>
        </ol>
        <a href="#foo">Go to foo</a>
        <Virtuoso
          customScrollParent={customScrollParent}
          totalCount={100}
          itemContent={(index) => <div style={{ height: index % 2 ? 50 : 20 }}>Item {index}</div>}
          style={{ border: '1px solid red' }}
        />
        <div>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris rhoncus magna nec interdum consectetur. Suspendisse consectetur
            quis tortor at scelerisque. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Curabitur
            ultrices imperdiet quam vitae gravida. Aenean aliquam porttitor arcu. Ut volutpat velit at risus ultrices vulputate. Nulla
            semper tortor ac purus rhoncus, ut fermentum orci feugiat. Quisque venenatis suscipit consectetur. Cras sed risus enim. Sed non
            ex ultricies, malesuada neque quis, volutpat massa. Sed sit amet orci non ex feugiat porttitor vel quis magna. Nullam accumsan
            justo nec ipsum maximus placerat. Integer et dui ut metus mattis vestibulum. Aliquam pretium mollis magna, nec rhoncus mi
            tristique non. Sed vitae ligula augue. Donec rutrum, mi efficitur maximus volutpat, diam neque condimentum risus, vel fringilla
            tortor lorem vel risus. Cras venenatis ipsum ac suscipit faucibus. Donec at arcu nec leo sagittis vulputate vitae sed massa. Nam
            ullamcorper hendrerit nunc eu vestibulum. Sed et feugiat sem. Sed iaculis, augue non porta cursus, tortor ante venenatis ipsum,
            nec sodales leo lectus et nunc. Nunc pharetra ipsum sit amet felis viverra, et egestas felis suscipit. Etiam bibendum lacinia
            nisi semper finibus. Aliquam feugiat ultrices est eu viverra. Quisque luctus aliquet lacus. In hac habitasse platea dictumst.
            Fusce volutpat tincidunt finibus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Ut
            ac mattis nunc. Integer lorem dui, facilisis eget lacus id, tempus euismod tortor. Duis facilisis eu quam ac bibendum. Morbi
            pulvinar feugiat tortor id imperdiet. Fusce nec odio ut lorem accumsan dignissim. Fusce vestibulum condimentum eros, in ornare
            augue sodales nec. Pellentesque ut lorem nibh. Nunc suscipit interdum purus quis mattis. Nulla mollis ac diam id sagittis.
            Maecenas non nibh non arcu aliquet ultrices eget et diam. Quisque interdum nulla sed arcu eleifend posuere. Donec hendrerit
            tincidunt placerat. Maecenas pulvinar ligula eu scelerisque maximus. Nullam a magna ex. Aliquam elementum augue id malesuada
            scelerisque. Curabitur quis lectus augue. Morbi id blandit nunc. Donec tellus justo, volutpat ac enim non, tincidunt porttitor
            dui. Nam ac sodales purus. Sed rhoncus auctor urna, non consectetur lorem condimentum sed. Suspendisse vel posuere erat.
            Maecenas viverra iaculis commodo. Maecenas et tellus quis sem congue consequat. Sed eget feugiat eros. Suspendisse viverra augue
            et risus aliquam feugiat. Quisque consectetur vel dolor quis auctor. Pellentesque commodo et nunc eu elementum. Nullam vitae
            vulputate augue.
          </p>
          <p id="foo">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris rhoncus magna nec interdum consectetur. Suspendisse consectetur
            quis tortor at scelerisque. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Curabitur
            ultrices imperdiet quam vitae gravida. Aenean aliquam porttitor arcu. Ut volutpat velit at risus ultrices vulputate. Nulla
            semper tortor ac purus rhoncus, ut fermentum orci feugiat. Quisque venenatis suscipit consectetur. Cras sed risus enim. Sed non
            ex ultricies, malesuada neque quis, volutpat massa. Sed sit amet orci non ex feugiat porttitor vel quis magna. Nullam accumsan
            justo nec ipsum maximus placerat. Integer et dui ut metus mattis vestibulum. Aliquam pretium mollis magna, nec rhoncus mi
            tristique non. Sed vitae ligula augue. Donec rutrum, mi efficitur maximus volutpat, diam neque condimentum risus, vel fringilla
            tortor lorem vel risus. Cras venenatis ipsum ac suscipit faucibus. Donec at arcu nec leo sagittis vulputate vitae sed massa. Nam
            ullamcorper hendrerit nunc eu vestibulum. Sed et feugiat sem. Sed iaculis, augue non porta cursus, tortor ante venenatis ipsum,
            nec sodales leo lectus et nunc. Nunc pharetra ipsum sit amet felis viverra, et egestas felis suscipit. Etiam bibendum lacinia
            nisi semper finibus. Aliquam feugiat ultrices est eu viverra. Quisque luctus aliquet lacus. In hac habitasse platea dictumst.
            Fusce volutpat tincidunt finibus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Ut
            ac mattis nunc. Integer lorem dui, facilisis eget lacus id, tempus euismod tortor. Duis facilisis eu quam ac bibendum. Morbi
            pulvinar feugiat tortor id imperdiet. Fusce nec odio ut lorem accumsan dignissim. Fusce vestibulum condimentum eros, in ornare
            augue sodales nec. Pellentesque ut lorem nibh. Nunc suscipit interdum purus quis mattis. Nulla mollis ac diam id sagittis.
            Maecenas non nibh non arcu aliquet ultrices eget et diam. Quisque interdum nulla sed arcu eleifend posuere. Donec hendrerit
            tincidunt placerat. Maecenas pulvinar ligula eu scelerisque maximus. Nullam a magna ex. Aliquam elementum augue id malesuada
            scelerisque. Curabitur quis lectus augue. Morbi id blandit nunc. Donec tellus justo, volutpat ac enim non, tincidunt porttitor
            dui. Nam ac sodales purus. Sed rhoncus auctor urna, non consectetur lorem condimentum sed. Suspendisse vel posuere erat.
            Maecenas viverra iaculis commodo. Maecenas et tellus quis sem congue consequat. Sed eget feugiat eros. Suspendisse viverra augue
            et risus aliquam feugiat. Quisque consectetur vel dolor quis auctor. Pellentesque commodo et nunc eu elementum. Nullam vitae
            vulputate augue.
          </p>
          <p>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris rhoncus magna nec interdum consectetur. Suspendisse consectetur
            quis tortor at scelerisque. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Curabitur
            ultrices imperdiet quam vitae gravida. Aenean aliquam porttitor arcu. Ut volutpat velit at risus ultrices vulputate. Nulla
            semper tortor ac purus rhoncus, ut fermentum orci feugiat. Quisque venenatis suscipit consectetur. Cras sed risus enim. Sed non
            ex ultricies, malesuada neque quis, volutpat massa. Sed sit amet orci non ex feugiat porttitor vel quis magna. Nullam accumsan
            justo nec ipsum maximus placerat. Integer et dui ut metus mattis vestibulum. Aliquam pretium mollis magna, nec rhoncus mi
            tristique non. Sed vitae ligula augue. Donec rutrum, mi efficitur maximus volutpat, diam neque condimentum risus, vel fringilla
            tortor lorem vel risus. Cras venenatis ipsum ac suscipit faucibus. Donec at arcu nec leo sagittis vulputate vitae sed massa. Nam
            ullamcorper hendrerit nunc eu vestibulum. Sed et feugiat sem. Sed iaculis, augue non porta cursus, tortor ante venenatis ipsum,
            nec sodales leo lectus et nunc. Nunc pharetra ipsum sit amet felis viverra, et egestas felis suscipit. Etiam bibendum lacinia
            nisi semper finibus. Aliquam feugiat ultrices est eu viverra. Quisque luctus aliquet lacus. In hac habitasse platea dictumst.
            Fusce volutpat tincidunt finibus. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Ut
            ac mattis nunc. Integer lorem dui, facilisis eget lacus id, tempus euismod tortor. Duis facilisis eu quam ac bibendum. Morbi
            pulvinar feugiat tortor id imperdiet. Fusce nec odio ut lorem accumsan dignissim. Fusce vestibulum condimentum eros, in ornare
            augue sodales nec. Pellentesque ut lorem nibh. Nunc suscipit interdum purus quis mattis. Nulla mollis ac diam id sagittis.
            Maecenas non nibh non arcu aliquet ultrices eget et diam. Quisque interdum nulla sed arcu eleifend posuere. Donec hendrerit
            tincidunt placerat. Maecenas pulvinar ligula eu scelerisque maximus. Nullam a magna ex. Aliquam elementum augue id malesuada
            scelerisque. Curabitur quis lectus augue. Morbi id blandit nunc. Donec tellus justo, volutpat ac enim non, tincidunt porttitor
            dui. Nam ac sodales purus. Sed rhoncus auctor urna, non consectetur lorem condimentum sed. Suspendisse vel posuere erat.
            Maecenas viverra iaculis commodo. Maecenas et tellus quis sem congue consequat. Sed eget feugiat eros. Suspendisse viverra augue
            et risus aliquam feugiat. Quisque consectetur vel dolor quis auctor. Pellentesque commodo et nunc eu elementum. Nullam vitae
            vulputate augue.
          </p>
        </div>
      </div>
    </div>
  )
}
