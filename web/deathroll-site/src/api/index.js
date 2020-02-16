import axios from 'axios';

const apiUrl = '/api';

export async function getEggInfo() {
  const res = await axios.get(`${apiUrl}/eggs/total`);
  return res.data;
}

export async function getTop10Players() {
  const res = await axios.get(`${apiUrl}/top/topegg`);
  return res.data;
}

export async function getPlayerInfo(id) {
  const res = await axios.get(`${apiUrl}/player/${id}`);
  return res.data;
}

