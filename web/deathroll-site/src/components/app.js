import { h, Component } from 'preact';
import { Router } from 'preact-router';

import Header from './header';

// Code-splitting is automated for routes
import Home from '../routes/home';
import Top from '../routes/top';
import Player from '../routes/player';
import MapRoute from '../routes/maproute';
import Error from '../routes/error';

export default class App extends Component {

  /** Gets fired when the route changes.
   *	@param {Object} event		"change" event from [preact-router](http://git.io/preact-router)
   *	@param {string} event.url	The newly routed URL
   */
  handleRoute = e => {
    this.currentUrl = e.url;
  };

  render() {
    return (
      <div class="d-flex w-100 mx-auto flex-column">
		<Header />
		<section class="container">
		  <Router onChange={this.handleRoute}>
			<Home path="/" />
			<Player path="/player/:id" />
			<MapRoute path="/map" />
			<Top path="/top" />
			<Error type="404" default />
		  </Router>
		</section>
      </div>
    );
  }
}
