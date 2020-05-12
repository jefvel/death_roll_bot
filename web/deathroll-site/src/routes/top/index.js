import { h, render, Component } from 'preact';
import style from './style';

import { getEggInfo, getTop10Players } from '../../api';

import Footer from '../../components/footer';

class Top extends Component {
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
	  <>
		<main role="main" class="inner px-3">
		  <p class="mt-5">
		    <h4>Top Ägg Owners</h4>
          </p>
		  <section class="lead text-left">
			{topPlayers.map(p => <div>
			  <pre class={style.eggCounter}>{`${p.currency}`.padStart(9)}</pre> -&nbsp;
			  <a href={`/player/${p.id}`}>{p.username}</a>
			</div>)}
		  </section>
		</main>
		<Footer />
	  </>
	);
  }
}

export default Top;
