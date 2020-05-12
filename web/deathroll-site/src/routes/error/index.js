import { h, Component } from 'preact';
import style from './style';
import { getPlayerInfo } from '../../api';

import Footer from '../../components/footer';

export default class Error extends Component {
  state = {
    info: null,
  };

  // gets called when this route is navigated to
  componentDidMount() {
  }

  // gets called just before navigating away from the route
  componentWillUnmount() {
  }

  // Note: `user` comes from the URL, courtesy of our router
  render({ id }, { info }) {

    return (
      <div class={style.profile}>
        <h1>Page not found</h1>
        Oops
      </div>
    );
  }
}
