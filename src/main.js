import React from 'react'
import { Component } from 'react-subx'
import * as R from 'ramda'
import { Spin } from 'antd'

class App extends Component {
  render () {
    const store = this.props.store
    return store.ready ? <Main store={store} /> : <Spin size='large' />
  }
}

class Main extends Component {
  render () {
    const store = this.props.store
    return R.isNil(store.token) ? <Login store={store} /> : <Home store={store} />
  }
}

class Login extends Component {
  render () {
    const store = this.props.store
    return <a href={store.authorizeUri}>Login Glip</a>
  }
}

class Home extends Component {
  render () {
    const store = this.props.store
    return store.existingTeams.length > 0 ? <Teams store={store} /> : <CreateTeam store={store} />
  }
}

class Teams extends Component {
  render () {
    const store = this.props.store
    return `We have found teams matching keyword "${store.keyword}"`
  }
}

class CreateTeam extends Component {
  render () {
    const store = this.props.store
    return `There is no team matching keyword "${store.keyword}"`
  }
}

export default App
