import { h, render, Component } from 'preact';
import style from './style';

import { getEggInfo, getTop10Players } from '../../api';

import Footer from '../../components/footer';

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
	  <>
		<main role="main" class="inner px-3">
		  <p class="mt-5">
			<h4>Be Prepared</h4>
			You have arrived to the <strong>number 1</strong> ranked
			egg based gambling game in the world!
		  </p>
		  {totalEggs && <div class="lead my-3">
			The current economy has <pre class={style.totalEgg}>{totalEggs}</pre> Ägg in circulation
		  </div>}
          <div class="lead my-5 text-center">
            <a class="btn btn-lg btn-success" href="https://discord.gg/r9QchhH" target="blank">
              Join The Discord
            </a>
            <small class="text-muted px-5">
                or
            </small>
            <a
              target="blank"
              href="https://discord.com/oauth2/authorize?client_id=668497383629389844&scope=bot&permissions=93248"
              class="btn btn-link">
              Add The Bot To Your Server
            </a>
          </div>
          <div class={`${style.alert} alert alert-warning`} role="alert">
            This is an alpha version. <strong>stats might reset</strong>, and there will be bugs.
          </div>
          <Footer />
          <div class="my-5">
            <iframe src="https://discordapp.com/widget?id=672191920755179541&theme=dark" width="100%" height="500" allowtransparency="true" frameborder="0"></iframe>
          </div>
		  {!totalEggs && <div class="lead my-5">🥚</div>}
		</main>
	  </>
	);
  }
}

export default Home;
