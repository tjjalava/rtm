import React, { Component } from "react";
import logo from "./logo.svg";
import "./App.css";
import {BrowserRouter as Router, Route, Link, Switch} from "react-router-dom";
import PierMap from "./piermap/PierMap";

const Header = () => (
  <div>
    <header className="App-header">
      <img src={logo} className="App-logo" alt="logo" />
      <h1 className="App-title">Welcome to React</h1>
    </header>
    <p className="App-intro">
      To get started, edit <code>src/App.js</code> and save to reload.
    </p>
    <Link to="/piermap.html">Laiturikartta</Link>
  </div>
);

class App extends Component {
  render() {
    return (
      <Router>
        <div className="App">
          <Switch>
            <Route path="/piermap.html" component={PierMap}/>
            <Route path="/" component={Header}/>
          </Switch>
        </div>
      </Router>
    );
  }
}

export default App;
