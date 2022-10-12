import { useContext } from 'react';
import { Context, Provider } from './context/Context';
import { ActionKind } from './context/Reducer';

function Asd() {
  const { dispatch, state } = useContext(Context);
  const click = () => {
    console.log(state);
    dispatch({ type: ActionKind.SET_LOADING, payload: !state.loading });
  };
  return <button onClick={click}>kecske</button>;
}

export default Asd;
