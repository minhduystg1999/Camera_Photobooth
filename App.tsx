import React from "react";
import { Provider } from "react-redux";
import { NativeRouter, Route} from "react-router-native";
import Camera__ from "./components/Camera";
import Ble from "./components/Ble";
import Store from "./Store";

export default function App() {
  return (
    <Provider store={Store}>
      <NativeRouter>
          <Route exact path="/" component={Camera__} />
          <Route exact path="/ble" component={Ble}/>
      </NativeRouter>
    </Provider>
  );
}
