//import Debugger from './debugger/Debugger';
//import HeuristicDebugger from './debugger/HeuristicDebugger';
import 'primereact/resources/themes/md-light-indigo/theme.css';
import 'primeicons/primeicons.css';
import 'primeflex/primeflex.css';
import './app.css';
import GameUI from './game/GameUI';

function App() {

  const Title = () => {
    return <header className='header'>
    <h1 className='title'><span className='start'>gob</span><span className='mid'>b</span><span className='end'>let</span></h1>
    <h2 className='sub-title'>stack-toe</h2>
  </header>;
  }

  const Main = () => {
    return <GameUI/>;
  }

  return <div className='app'>
    <Title />
    <Main />
  </div>
}

export default App
