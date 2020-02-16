import { h, render, Component } from 'preact';
import style from './style';

import { getEggInfo, getTop10Players } from '../../api';

class Home extends Component {
  state = { totalEggs: null, topPlayers: [] };

  componentWillMount() {
    getEggInfo().then(res => {
      this.setState({
        totalEggs: res.totalCurrency,
      });
    });

    getTop10Players().then(res => {
      this.setState({
        topPlayers: res.players,
      });
    });
  }

  render(props, state) {
    const { totalEggs, topPlayers } = state;
    return (
      <main role="main" class="inner cover">
        <h1 class="cover-heading" id="heading">
          <img alt="egg man" src="https://i.imgur.com/gkluCkN.png" />
        </h1>
        {totalEggs && <div class="lead my-5">
          We currently have <pre class={style.totalEgg}>{totalEggs}</pre> Ägg in circulation
        </div>
        }
        {!totalEggs && <div class="lead my-5">🥚</div>}
        <h4>Top Ägg Owners</h4>
        <section class="lead text-left">
          {topPlayers.map(p => <div>
            <pre class={style.eggCounter}>{`${p.currency}`.padStart(9)}</pre> -
            <a href={`/player/${p.id}`}>{p.username}</a>
          </div>)}
        </section>
      </main>
    );
  }
}

export default Home;
