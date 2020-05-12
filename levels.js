const levelExp = [
  10,
  54,
  93,
  137,
  156,
  200,
  292,
  320,
  426,
  621,
  906,
  999,
  1322,
  1500,
  1930,
  2817,
  3333,
  3800,
  4112,
  5300,
  6003,
  7463,
  8764,
  9000,
  9950,
  11111,
  12795,
  14000,
  18680,
  27272,
  31202,
  39817,
  58132,
  66499,
  84872,
  123913,
  180912,
  264131,
  385631,
  563021,
  822010,
  1200134,
  1752195,
  2558204,
  3734977,
  5453066,
  7961476,
  11623754,
  16970680,
  24777192,
  36174700,
];

const levelAvatars = [
  {
    level: 0,
    title: 'Newborn',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709788589529235538/unknown.png',
  },
  {
    level: 1,
    title: 'Hatchling',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709789014835855460/unknown.png',
  },
  {
    level: 2,
    title: 'Ägg Collector',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709789419284201502/unknown.png',
  },
  {
    level: 3,
    title: 'Apprentice',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709789665636646932/unknown.png',
  },
  {
    level: 4,
    title: 'Apprenticer',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709789798684164126/unknown.png',
  },
  {
    level: 5,
    title: 'Apprenticerest',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709790016938836018/unknown.png',
  },
  {
    level: 6,
    title: 'Almost Recruit',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709790240994492426/unknown.png',
  },
  {
    level: 7,
    title: 'Failed Recruit',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709790470380716042/unknown.png',
  },
  {
    level: 8,
    title: 'Retrier of Recruit School',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/677232220900950046/unknown.png',
  },
  {
    level: 9,
    title: 'Actual Recruit',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709790971818147860/unknown.png',
  },
  {
    level: 10,
    title: 'Ten outta Tenner',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709791476925857803/unknown.png',
  },
  {
    level: 11,
    title: 'Extreme Elevener',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709791894506438726/unknown.png',
  },
  {
    level: 12,
    title: 'Angry Man',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709792420052729857/unknown.png',
  },
  {
    level: 13,
    title: 'Unlucky',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709793497825149008/unknown.png',
  },
  {
    level: 14,
    title: 'Cool Guy',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709794022218268762/unknown.png',
  },
  {
    level: 15,
    title: 'Voter',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709794903911170138/unknown.png',
  },
  {
    level: 16,
    title: 'Experienced Egg Collector',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709795602686279770/unknown.png',
  },
  {
    level: 17,
    title: 'Egg Detective',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709796224936575127/unknown.png',
  },
  {
    level: 18,
    title: 'Cholesterol Controller',
    avatarUrl:'https://cdn.discordapp.com/attachments/668497531742978100/709797253514002553/unknown.png',
  },
];

class Level {
  exp = 0;
  nextLevelExp = 0;
  level = 0;
  title = '';
  totalExp = 0;

  constructor(totalExp) {
    this.totalExp = totalExp;
    let t = totalExp;
    while (t > levelExp[this.level]) {
      if (this.level > levelExp.length) {
        break;
      }

      t -= levelExp[this.level];
      this.level ++;
    }

    const level = this.level;

    let titleInfo = levelAvatars[level];
    if (!titleInfo) {
      titleInfo = levelAvatars[levelAvatars.length - 1];
    }

    this.title = titleInfo.title;
    this.avatarUrl = titleInfo.avatarUrl;

    this.exp = parseInt(t);
    this.nextLevelExp = levelExp[this.level];
  }
}

class Levels {
  constructor(game) {
    this.game = game;
  }

  async getPlayerLevelInfo(playerId) {
    const player = await this.game.db.getUser(playerId);
    return new Level(player.experience);
  }
}

module.exports = Levels;

