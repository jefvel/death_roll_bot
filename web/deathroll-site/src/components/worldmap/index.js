import { h } from 'preact';
import { Link } from 'preact-router/match';
import style from './style.css';

const WorldMap = () => (
  <header class="masthead mb-auto">
    <h3 class="masthead-brand"><Link href="/">Death Roll</Link></h3>
    <nav class="nav nav-masthead justify-content-center">
      <Link activeClassName="active" class="nav-link" href="/">Home</Link>
      <Link activeClassName="active" class="nav-link" href="/map">Map</Link>
      <Link activeClassName="active" class="nav-link" href="/about">About</Link>
    </nav>
  </header>
);

export default Header;
