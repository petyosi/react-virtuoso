import 'react-app-polyfill/ie11';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Virtuoso } from '../src/Virtuoso';

const App = () => {
  return (
    <div className="d-flex justify-content-center">
      <div style={{ height: '500px', width: '330px' }}>
        <Virtuoso
          totalCount={200}
          overscan={200}
          item={(index: number) => {
            return <div>Item {index}</div>;
          }}
        />
      </div>
    </div>
  );
};

ReactDOM.render(<App />, document.getElementById('root'));
