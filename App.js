import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { createBottomTabNavigator, createAppContainer } from 'react-navigation';
import store from './store';

import initial from './screens/Initial';

const RootStack = createBottomTabNavigator({
  Home: { screen: initial }
});

const Navigation = createAppContainer(RootStack);

class App extends Component {
  render() {
    return (
      <Provider store={store}>
        <Navigation />
      </Provider>
    );
  }
}

export default App;
