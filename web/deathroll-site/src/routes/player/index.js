import { h, Component } from 'preact';
import style from './style';
import { getPlayerInfo } from '../../api';

export default class Player extends Component {
  state = {
    info: null,
  };

  // gets called when this route is navigated to
  componentDidMount() {
    getPlayerInfo(this.props.id).then(info => {
      this.setState({
        info
      });
    });
  }

  // gets called just before navigating away from the route
  componentWillUnmount() {
  }

  // Note: `user` comes from the URL, courtesy of our router
  render({ id }, { info }) {
    if (info === null) {
      return null;
    }

    console.log(info);

    const items = !info.items ? null : (
      <p>
        <h4>Items</h4>
        {info.items.map(i => <div>
          <img alt={`Preview image of ${i.name}`} src={i.avatarURL} />
          {i.name}
          {i.description}
        </div>
        )}
      </p>
    );

    return (
      <div class={style.profile}>
        <h1>{info.username}</h1>
        {items}
      </div>
    );
  }
}
