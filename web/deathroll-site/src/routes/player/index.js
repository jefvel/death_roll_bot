import { h, Component } from 'preact';
import style from './style';
import { Link } from 'preact-router/match';
import { getPlayerInfo } from '../../api';

import Footer from '../../components/footer';

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

    const items = !info.items ? null : (
      <p class="text-left mt-5">
        <h4>Items</h4>
        {info.items.map(i => <div class={style.item}>
          <img alt={`Preview image of ${i.name}`} src={i.avatarURL} />
          <div class={style.itemDescription}>
            <div>
              <strong>
                {i.name}
              </strong>
            </div>
            <div>
              {i.description}
            </div>
          </div>
        </div>
        )}
      </p>
    );

    const { town } = info;

    const townInfo = !town ? null : (
      <div>
        Is a member of the town <Link href={`/map?town=${town.id}`}>{town.name}</Link>
      </div>
    );

    return (
      <>
        <div class={`${style.profile} px-3`}>
          <small>Player</small>
          <h2 class={style.userName}>{info.username}</h2>
          <div>
            Owns <strong>{info.currency}</strong> Ägg
          </div>
          <div>
            Has won <strong>{info.wins}</strong> rolls, and lost <strong>{info.losses}</strong>
          </div>
          {townInfo}
          {items}
        </div>
      </>
    );
  }
}
