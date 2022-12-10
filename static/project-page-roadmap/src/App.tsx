import { useEffect } from 'react';
import './App.css';
import Header from './components/header/Header';
import Roadmap from './components/roadmap/Roadmap';
import SVGColors from './components/svg/colors';
import useJiraStore from './store/jira.store';

function App() {
  const fetchContext = useJiraStore((state) => state.fetchContext);
  const fetchIssueFields = useJiraStore((state) => state.fetchIssueFields);

  useEffect(() => {
    fetchContext();
    fetchIssueFields();
  }, []);

  return (
    <div className="App">
      <SVGColors />
      <Header />
      <Roadmap />
    </div>
  );
}

export default App;
