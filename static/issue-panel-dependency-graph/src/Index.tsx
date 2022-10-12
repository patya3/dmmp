import App from './App';
import { Provider } from './context/Context';
import './Index.css';

function Index() {
  return (
    <Provider>
      <App />
    </Provider>
  );
}

export default Index;
