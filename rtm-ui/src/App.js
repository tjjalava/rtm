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

class LoginForm extends Component {
  constructor (props) {
    super(props);
    this.state = {
      username: "",
      password: ""
    }
  }

  onChange = event => {
    const {name, value} = event.target;
    this.setState({
      [name]: value
    });
  };

  onSubmit = event => {
    event.preventDefault();
    this.props.onSubmit(this.state.username, this.state.password);
  };

  render () {
    return (<form onSubmit={this.onSubmit}>
      <input type="text" name="username" placeholder="Suulin käyttäjätunnus" value={this.state.username} onChange={this.onChange}/><br/>
      <input type="password" name="password" placeholder="Suulin salasana" value={this.state.password} onChange={this.onChange}/><br/>
      <button type="submit">Kirjaudu sisään</button>
    </form>);
  }
}

class App extends Component {
  constructor (props) {
    super(props);
    this.state = {
      error: null
    }
  }

  handleError = error => {
    this.setState({error});
  };

  doLogin = async (username, password) => {
    fetch(new Request("/api/login", {
      method: "POST",
      headers: new Headers({
        "Content-type": "application/json"
      }),
      body: JSON.stringify({username, password}),
      mode: "same-origin",
      credentials: "include"
    })).then(res => {
      if (res.ok) {
        this.setState({error: null});
      } else {
        const err = new Error(res.statusText);
        err.state = res.state;
        throw err;
      }
    }).catch(err => {
      console.error(err);
    })
  };


  render() {
    const {error} = this.state;
    return (
      <Router>
        <div className="App">
          {error && error.status === 401 && <LoginForm onSubmit={this.doLogin}/>}
          {error && error.status !== 401 && <h3>Error: {error.message}</h3>}
          {!error &&
          <Switch>
            <Route path="/piermap.html" render={() => <PierMap errorHandler={this.handleError}/>}/>
            <Route path="/" component={Header}/>
          </Switch>
          }
        </div>
      </Router>
    );
  }
}

export default App;
