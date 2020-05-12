import { h } from 'preact';
import { Link } from 'preact-router/match';
import style from './style.css';

const Header = () => (
  <header class="masthead p-3">
	<div class="container">
	  <h3 class="masthead-brand">
		<Link href="/">
		  <img height="37" alt="egg man" src="https://i.imgur.com/gkluCkN.png" style="position: relative; top: -4px; padding-right: 0.2em;" /> Death Roll
          <small class="text-muted"> alpha</small>
		</Link>
	  </h3>
	  <nav class="nav nav-masthead justify-content-center">
		<Link activeClassName="active" class="nav-link" path="/" href="/">Home</Link>
		<Link activeClassName="active" class="nav-link" path="/map" href="/map">Map</Link>
		<Link activeClassName="active" class="nav-link" path="/top" href="/top">Stats</Link>
	  </nav>
	</div>
  </header>
);

export default Header;
