// Dungeon 2: 狼人殺 (Werewolf)
// Allowed counts: strictly 8, 9, 10, or 12 players.
// Rule introduction with animation & confirmation. Computer acts as Host/Moderator.
// Turn-based daytime speech sequence announced by Computer Moderator in right-side chat.
// Special rules: Idiot immunity, Wolf King retaliation, Knight duel, Witch self-save restrictions & same-protect-save death.

const Dungeon2 = {
  room: null,
  gameState: null,

  // Role tables strictly as specified in outline:
  // 8人：2名狼人、3名平民、1名預言家、1名守衛、1名女巫
  // 9人：3名狼人、3名平民、1名預言家、1名女巫、1名獵人
  // 10人：2名狼人、1名狼王、3名平民、1名預言家、1名女巫、1名獵人、1名白癡
  // 12人：3名小狼、1名狼王、4名平民、1名預言家、1名獵人、1名守衛、1名女巫
  roleConfigs: {
    8:  { werewolf: 2, wolf_king: 0, villager: 3, seer: 1, guard: 1, witch: 1, hunter: 0, idiot: 0, knight: 0 },
    9:  { werewolf: 3, wolf_king: 0, villager: 3, seer: 1, guard: 0, witch: 1, hunter: 1, idiot: 0, knight: 0 },
    10: { werewolf: 2, wolf_king: 1, villager: 3, seer: 1, guard: 0, witch: 1, hunter: 1, idiot: 1, knight: 0 },
    12: { werewolf: 3, wolf_king: 1, villager: 4, seer: 1, guard: 1, witch: 1, hunter: 1, idiot: 0, knight: 0 }
  },

  roleMeta: {
    werewolf:  { name: '狼人', camp: '狼人', isGod: false, icon: '🐺', desc: '黑夜與同伴見面殺人，可自刀或空刀；白天可自爆強制進入黑夜。' },
    wolf_king: { name: '狼王', camp: '狼人', isGod: false, icon: '👑🐺', desc: '被淘汰時可開槍帶走一人（不翻牌）。' },
    villager:  { name: '平民', camp: '好人', isGod: false, icon: '🧑', desc: '沒有特殊技能，依賴白天資訊與發言投票放逐狼人。' },
    seer:      { name: '預言家', camp: '好人', isGod: true,  icon: '🔮', desc: '每晚查驗一人陣營（好人為金水，狼人為查殺）。' },
    witch:     { name: '女巫', camp: '好人', isGod: true,  icon: '🧪', desc: '解藥僅首夜能自救；同守同救依然死亡；解藥毒藥同一夜不可併用。' },
    hunter:    { name: '獵人', camp: '好人', isGod: true,  icon: '🏹', desc: '除被毒殺外，淘汰時可開槍帶走一人，亦可壓槍。' },
    guard:     { name: '守衛', camp: '好人', isGod: true,  icon: '🛡️', desc: '每晚守護一人免受狼人殺害，不可連續兩晚守護同人。' },
    idiot:     { name: '白癡', camp: '好人', isGod: true,  icon: '🤪', desc: '若白天放逐公投被投出，翻牌免疫放逐，但之後失去投票權。' },
    knight:    { name: '騎士', camp: '好人', isGod: true,  icon: '⚔️', desc: '白天公投前可決鬥一人。決鬥狼人狼死進夜；決鬥好人騎士以死謝罪。' }
  },

  init() {
    Network.on('WEREWOLF_STATE_UPDATED', (data) => {
      if (this.room && this.room.id === data.roomId) {
        this.gameState = data.state;
        this.render();
      }
    });

    Network.on('WEREWOLF_CONFIRM_RULE', ({ roomId, playerId }) => {
      if (this.room && this.room.id === roomId && this.gameState) {
        const p = this.gameState.players.find(x => x.id === playerId);
        if (p) {
          p.confirmed = true;
          this.checkAllConfirmed();
          this.render();
        }
      }
    });

    Network.on('WEREWOLF_CHAT_MSG', ({ roomId, senderName, seat, text, isHost, isWolfChat }) => {
      if (this.room && this.room.id === roomId && this.gameState) {
        const myP = this.getMyPlayer();
        if (isWolfChat && (!myP || (myP.role !== 'werewolf' && myP.role !== 'wolf_king'))) {
          return;
        }
        this.gameState.chatLogs.push({
          senderName,
          seat,
          text,
          isHost,
          isWolfChat,
          time: new Date().toLocaleTimeString()
        });
        this.renderChatList();
      }
    });
  },

  setup(room) {
    this.room = room;
    if (!this.gameState || this.gameState.roomId !== room.id) {
      this.initPreGameState();
    }
    this.render();
  },

  initPreGameState() {
    this.gameState = {
      roomId: this.room.id,
      stage: 'RULE_CONFIRMATION', // 'RULE_CONFIRMATION' -> 'IN_GAME'
      dayCount: 1,
      phase: 'NIGHT', // 'NIGHT' | 'DAY_ANNOUNCE' | 'DAY_SPEECH' | 'DAY_VOTE' | 'GAME_OVER'
      nightStep: 'WEREWOLF', // 'WEREWOLF' | 'SEER' | 'WITCH' | 'GUARD' | 'NIGHT_END'
      currentSpeakerSeat: null, // For ordered speaking enforced by computer moderator
      players: this.room.players.map((p, idx) => ({
        id: p.id,
        name: p.name,
        seat: idx + 1,
        isBot: p.isBot,
        confirmed: p.isBot ? true : false,
        role: null,
        isAlive: true,
        idiotRevealed: false,
        hasVoted: false,
        poisoned: false
      })),
      witchAntidoteUsed: false,
      witchPoisonUsed: false,
      lastGuardedSeat: null,
      nightVictimSeat: null,
      poisonedSeat: null,
      guardedSeat: null,
      nightDeaths: [],
      votes: {}, // voterSeat -> targetSeat
      chatLogs: [],
      winner: null
    };
  },

  getMyPlayer() {
    if (!this.gameState || !this.gameState.players) return null;
    return this.gameState.players.find(p => p.id === Network.playerId);
  },

  confirmRules() {
    SoundFX.confirm();
    Network.broadcastAndSelf('WEREWOLF_CONFIRM_RULE', {
      roomId: this.room.id,
      playerId: Network.playerId
    });
  },

  checkAllConfirmed() {
    if (this.gameState.stage !== 'RULE_CONFIRMATION') return;
    const allConfirmed = this.gameState.players.every(p => p.confirmed);
    if (allConfirmed) {
      if (this.room.hostId === Network.playerId) {
        this.startInGame();
      }
    }
  },

  // Deal roles according to exact outline rules
  startInGame() {
    const pCount = this.gameState.players.length;
    const config = this.roleConfigs[pCount] || this.roleConfigs[8];

    const deck = [];
    for (let i = 0; i < config.werewolf; i++) deck.push('werewolf');
    for (let i = 0; i < config.wolf_king; i++) deck.push('wolf_king');
    for (let i = 0; i < config.seer; i++) deck.push('seer');
    for (let i = 0; i < config.guard; i++) deck.push('guard');
    for (let i = 0; i < config.witch; i++) deck.push('witch');
    for (let i = 0; i < config.hunter; i++) deck.push('hunter');
    for (let i = 0; i < config.idiot; i++) deck.push('idiot');
    for (let i = 0; i < config.knight; i++) deck.push('knight');
    while (deck.length < pCount) deck.push('villager');

    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    this.gameState.players.forEach((p, idx) => {
      p.role = deck[idx];
      p.isAlive = true;
      p.idiotRevealed = false;
      p.poisoned = false;
    });

    this.gameState.stage = 'IN_GAME';
    this.gameState.phase = 'NIGHT';
    this.gameState.nightStep = 'WEREWOLF';
    this.gameState.dayCount = 1;

    // Moderator Announcement
    this.moderatorSay(`🌙 天黑請閉眼！第 ${this.gameState.dayCount} 夜降臨，狼人請睜眼殺人。`);

    SoundFX.start();
    this.broadcastState();
  },

  broadcastState() {
    Network.broadcastAndSelf('WEREWOLF_STATE_UPDATED', {
      roomId: this.room.id,
      state: this.gameState
    });
  },

  moderatorSay(text) {
    this.gameState.chatLogs.push({
      senderName: '🤖 電腦主持人',
      seat: 0,
      text,
      isHost: true,
      isWolfChat: false,
      time: new Date().toLocaleTimeString()
    });
  },

  // Werewolf Kill Action
  werewolfKill(targetSeat) {
    if (this.gameState.nightStep !== 'WEREWOLF') return;
    this.gameState.nightVictimSeat = targetSeat;
    SoundFX.attack();
    this.moderatorSay(`🌙 狼人請閉眼。預言家請睜眼，選擇你要查驗的對象。`);
    this.gameState.nightStep = 'SEER';
    this.broadcastState();
  },

  werewolfEmptyKnife() {
    this.gameState.nightVictimSeat = null;
    this.moderatorSay(`🌙 狼人選擇空刀。預言家請睜眼。`);
    this.gameState.nightStep = 'SEER';
    this.broadcastState();
  },

  // Werewolf Self-destruct during Day
  werewolfSelfDestruct() {
    const myP = this.getMyPlayer();
    if (!myP || (myP.role !== 'werewolf' && myP.role !== 'wolf_king')) return;

    myP.isAlive = false;
    SoundFX.attack();
    this.moderatorSay(`💥 玩家 ${myP.seat} 號公布身分【狼人自爆】出局！白天發言與投票中斷，強制直接進入黑夜！`);
    alert("你選擇了自爆，強制進入黑夜階段！");

    if (this.checkWinCondition()) return;

    this.gameState.phase = 'NIGHT';
    this.gameState.nightStep = 'WEREWOLF';
    this.gameState.dayCount++;
    this.broadcastState();
  },

  // Seer Check Action
  seerCheck(targetSeat) {
    if (this.gameState.nightStep !== 'SEER') return;
    const target = this.gameState.players.find(p => p.seat === targetSeat);
    SoundFX.success();
    const isWolf = target.role === 'werewolf' || target.role === 'wolf_king';
    alert(`【查驗結果】：${targetSeat}號玩家的所屬陣營為：【${isWolf ? '查殺（狼人陣營）' : '金水（好人陣營）'}】！`);

    this.moderatorSay(`🌙 預言家請閉眼。女巫請睜眼。`);
    this.gameState.nightStep = 'WITCH';
    this.broadcastState();
  },

  // Witch Actions
  witchSave() {
    if (this.gameState.nightStep !== 'WITCH') return;
    // Rule: "解藥僅在首夜能自救"
    const myP = this.getMyPlayer();
    if (this.gameState.dayCount > 1 && this.gameState.nightVictimSeat === myP.seat) {
      alert("女巫解藥僅在首夜能夠自救！今夜無法自救。");
      return;
    }
    this.gameState.witchAntidoteUsed = true;
    this.gameState.nightVictimSaved = true;
    SoundFX.heal();
    alert("你使用了靈藥，救了今晚被狼人襲擊的玩家！");

    this.advanceWitch();
  },

  witchPoison(targetSeat) {
    if (this.gameState.nightStep !== 'WITCH') return;
    if (this.gameState.nightVictimSaved) {
      alert("解藥與毒藥不可在同一夜使用！");
      return;
    }
    this.gameState.witchPoisonUsed = true;
    this.gameState.poisonedSeat = targetSeat;
    const victim = this.gameState.players.find(p => p.seat === targetSeat);
    if (victim) victim.poisoned = true;

    SoundFX.attack();
    alert(`你使用了毒藥，毒殺了 ${targetSeat} 號玩家！`);
    this.advanceWitch();
  },

  advanceWitch() {
    this.moderatorSay(`🌙 女巫請閉眼。守衛請睜眼。`);
    this.gameState.nightStep = 'GUARD';
    this.broadcastState();
  },

  witchSkip() {
    this.advanceWitch();
  },

  // Guard Action
  guardProtect(targetSeat) {
    if (this.gameState.nightStep !== 'GUARD') return;
    if (targetSeat === this.gameState.lastGuardedSeat) {
      alert("守衛不可連續兩晚守護同一名玩家！");
      return;
    }
    this.gameState.guardedSeat = targetSeat;
    this.gameState.lastGuardedSeat = targetSeat;
    SoundFX.confirm();
    alert(`你今晚守護了 ${targetSeat} 號玩家！`);
    this.resolveNight();
  },

  guardSkip() {
    this.gameState.guardedSeat = null;
    this.resolveNight();
  },

  // Resolve Night Casualties
  resolveNight() {
    const deaths = [];
    const victimSeat = this.gameState.nightVictimSeat;
    const guardedSeat = this.gameState.guardedSeat;
    const saved = this.gameState.nightVictimSaved;
    const poisonedSeat = this.gameState.poisonedSeat;

    // Rule: "若一名玩家被狼人殺害，守衛和女巫同時對其守護和使用解藥（同守同救），該名玩家依然會死亡"
    if (victimSeat) {
      if (guardedSeat === victimSeat && saved) {
        // 同守同救 -> 依然死亡
        deaths.push(victimSeat);
        this.moderatorSay(`⚠️ 發生【同守同救】：守衛與女巫同時守救了 ${victimSeat} 號玩家，神力衝突導致該名玩家不幸身亡！`);
      } else if (guardedSeat === victimSeat) {
        // Guarded successfully!
      } else if (saved) {
        // Saved by witch!
      } else {
        deaths.push(victimSeat);
      }
    }

    // Witch poison ignores guard
    if (poisonedSeat && !deaths.includes(poisonedSeat)) {
      deaths.push(poisonedSeat);
    }

    // Mark dead
    deaths.forEach(s => {
      const p = this.gameState.players.find(x => x.seat === s);
      if (p) p.isAlive = false;
    });

    this.gameState.nightDeaths = deaths;
    this.gameState.nightVictimSaved = false;
    this.gameState.poisonedSeat = null;
    this.gameState.nightVictimSeat = null;

    // Check Rule 8: 若「好人」陣營中四位神職人物在第一天白日同時淘汰，則狼人陣營直接獲勝。
    if (this.gameState.dayCount === 1) {
      const deadGods = this.gameState.players.filter(p => !p.isAlive && this.roleMeta[p.role].isGod);
      if (deadGods.length >= 4) {
        this.gameState.phase = 'GAME_OVER';
        this.gameState.winner = '狼人陣營（好人陣營四位神職人物在首日全數淘汰，觸發規則八狼人直接獲勝！）';
        this.broadcastState();
        return;
      }
    }

    if (this.checkWinCondition()) return;

    // Enter Dawn Announcement
    this.gameState.phase = 'DAY_ANNOUNCE';
    SoundFX.alarm();

    if (deaths.length === 0) {
      this.moderatorSay(`☀️ 天亮了！昨夜是個平安夜，無人死亡。`);
    } else {
      this.moderatorSay(`☀️ 天亮了！昨夜死亡的玩家是：【${deaths.map(d => d + '號').join('、')}】！`);
    }

    // Check if dead player is Wolf King or Hunter
    this.checkDeathSkills(deaths);

    this.broadcastState();
  },

  checkDeathSkills(deadSeats) {
    deadSeats.forEach(s => {
      const p = this.gameState.players.find(x => x.seat === s);
      if (!p) return;

      // Hunter (unless poisoned)
      if (p.role === 'hunter' && !p.poisoned) {
        this.moderatorSay(`🏹 獵人 ${s} 號死亡，可發動技能開槍帶走一人！`);
      }
      // Wolf King (unless poisoned)
      if (p.role === 'wolf_king' && !p.poisoned) {
        this.moderatorSay(`👑 狼王 ${s} 號死亡，可發動技能開槍帶走一人（不翻牌）！`);
      }
    });
  },

  // Hunter or Wolf King shoot
  shootPlayer(targetSeat) {
    const target = this.gameState.players.find(p => p.seat === targetSeat);
    if (!target) return;
    target.isAlive = false;
    SoundFX.attack();
    this.moderatorSay(`💥 槍聲響起！${targetSeat} 號玩家被開槍帶走出局！`);
    if (this.checkWinCondition()) return;
    this.broadcastState();
  },

  // Computer Moderator orders daytime speech sequence
  // "白天階段發言可依照主持人說的順序來依次在右側的對話欄打字輸入"
  startDaySpeechSequence() {
    this.gameState.phase = 'DAY_SPEECH';
    const aliveSeats = this.gameState.players.filter(p => p.isAlive).map(p => p.seat);
    this.gameState.currentSpeakerSeat = aliveSeats[0];

    this.moderatorSay(`🗣️ 【主持人發言指令】：現在進入白天發言階段！發言順序依次為：[${aliveSeats.join(' ➔ ')}] 號玩家。`);
    this.moderatorSay(`📢 請【${this.gameState.currentSpeakerSeat} 號玩家】在右側對話欄打字輸入發言。`);
    this.broadcastState();
  },

  nextSpeaker() {
    const aliveSeats = this.gameState.players.filter(p => p.isAlive).map(p => p.seat);
    const curIdx = aliveSeats.indexOf(this.gameState.currentSpeakerSeat);
    if (curIdx < aliveSeats.length - 1) {
      this.gameState.currentSpeakerSeat = aliveSeats[curIdx + 1];
      this.moderatorSay(`📢 請【${this.gameState.currentSpeakerSeat} 號玩家】在右側對話欄打字輸入發言。`);
      this.broadcastState();
    } else {
      this.moderatorSay(`🔔 全員發言完畢！主持人開啟放逐公投階段，請存活玩家進行投票。`);
      this.enterDayVote();
    }
  },

  enterDayVote() {
    this.gameState.phase = 'DAY_VOTE';
    this.gameState.votes = {};
    this.gameState.players.forEach(p => p.hasVoted = false);
    this.broadcastState();
  },

  castVote(targetSeat) {
    const myP = this.getMyPlayer();
    if (!myP || !myP.isAlive) return;

    // Rule: "白痴若白天放逐公投中被投出，需公布角色牌以免疫該次放逐，但在之後的放逐公投中失去投票權利"
    if (myP.idiotRevealed) {
      alert("白痴已公布角色牌翻牌，在放逐公投中永久失去投票權利！");
      return;
    }

    this.gameState.votes[myP.seat] = targetSeat;
    myP.hasVoted = true;
    SoundFX.click();

    // Bots vote automatically
    this.gameState.players.filter(p => p.isBot && p.isAlive && !p.idiotRevealed).forEach(bot => {
      if (!this.gameState.votes[bot.seat]) {
        const alives = this.gameState.players.filter(x => x.isAlive && x.seat !== bot.seat);
        const pick = alives[Math.floor(Math.random() * alives.length)];
        if (pick) this.gameState.votes[bot.seat] = pick.seat;
      }
    });

    this.broadcastState();
  },

  tallyVotes() {
    const counts = {};
    for (const voter in this.gameState.votes) {
      const target = this.gameState.votes[voter];
      counts[target] = (counts[target] || 0) + 1;
    }

    let maxV = 0;
    let exiledSeat = null;
    let tie = false;

    for (const s in counts) {
      if (counts[s] > maxV) {
        maxV = counts[s];
        exiledSeat = parseInt(s);
        tie = false;
      } else if (counts[s] === maxV) {
        tie = true;
      }
    }

    if (tie || !exiledSeat) {
      this.moderatorSay(`⚖️ 投票平票或無人獲多數票，今天無人被放逐！天黑請閉眼……`);
    } else {
      const exiledPlayer = this.gameState.players.find(p => p.seat === exiledSeat);

      // Rule: "白痴若白天放逐公投中被投出，需公布角色牌以免疫該次放逐，但在之後的放逐公投中失去投票權利"
      if (exiledPlayer && exiledPlayer.role === 'idiot' && !exiledPlayer.idiotRevealed) {
        exiledPlayer.idiotRevealed = true;
        this.moderatorSay(`🤪 玩家 ${exiledSeat} 號翻開身分牌【白痴】！免疫本次放逐，但永久失去後續放逐投票權！`);
      } else if (exiledPlayer) {
        exiledPlayer.isAlive = false;
        this.moderatorSay(`⚖️ 投票結果：玩家 ${exiledSeat} 號獲得 ${maxV} 票，被公投放逐出局！`);
        this.checkDeathSkills([exiledSeat]);
      }
    }

    if (this.checkWinCondition()) return;

    // Proceed to next Night
    this.gameState.dayCount++;
    this.gameState.phase = 'NIGHT';
    this.gameState.nightStep = 'WEREWOLF';
    this.gameState.votes = {};
    this.moderatorSay(`🌙 天黑請閉眼！第 ${this.gameState.dayCount} 夜降臨，狼人請睜眼殺人。`);
    this.broadcastState();
  },

  checkWinCondition() {
    const alive = this.gameState.players.filter(p => p.isAlive);
    const aliveWolves = alive.filter(p => p.role === 'werewolf' || p.role === 'wolf_king');
    const aliveVillagers = alive.filter(p => p.role === 'villager');
    const aliveGods = alive.filter(p => this.roleMeta[p.role].isGod);

    if (aliveWolves.length === 0) {
      this.gameState.phase = 'GAME_OVER';
      this.gameState.winner = '好人陣營（驅逐了所有狼人，村莊迎來了光明！）';
      this.moderatorSay(`🎉【遊戲結束】${this.gameState.winner}`);
      SoundFX.success();
      this.broadcastState();
      return true;
    }

    // Rule: "狼人陣營需要淘汰所有平民或神職人員以獲取勝利" (屠邊/屠城)
    if (aliveVillagers.length === 0 || aliveGods.length === 0) {
      this.gameState.phase = 'GAME_OVER';
      this.gameState.winner = '狼人陣營（狼群成功屠殺了所有平民或神職人員！）';
      this.moderatorSay(`🐺【遊戲結束】${this.gameState.winner}`);
      SoundFX.attack();
      this.broadcastState();
      return true;
    }

    return false;
  },

  sendChat(text, isWolfChat = false) {
    if (!text || !text.trim()) return;
    const myP = this.getMyPlayer();

    Network.send('WEREWOLF_CHAT_MSG', {
      roomId: this.room.id,
      senderName: Network.playerName,
      seat: myP ? myP.seat : 0,
      text: text.trim(),
      isHost: false,
      isWolfChat
    });

    this.gameState.chatLogs.push({
      senderName: Network.playerName,
      seat: myP ? myP.seat : 0,
      text: text.trim(),
      isHost: false,
      isWolfChat,
      time: new Date().toLocaleTimeString()
    });

    this.renderChatList();
  },

  render() {
    const container = document.getElementById('dungeon2-container');
    if (!container || !this.room) return;

    if (!this.gameState || this.gameState.stage === 'RULE_CONFIRMATION') {
      this.renderRuleConfirmation(container);
    } else {
      this.renderInGame(container);
    }
  },

  renderRuleConfirmation(container) {
    const players = this.gameState ? this.gameState.players : this.room.players;
    const confirmedCount = players.filter(p => p.confirmed).length;
    const myP = players.find(p => p.id === Network.playerId);
    const hasConfirmed = myP ? myP.confirmed : false;
    const pCount = players.length;

    let html = `
      <div class="card rule-modal-card intro-slide-down">
        <div class="rule-header">
          <div class="animated-icon-bounce">🐺</div>
          <h2>【副本二：狼人殺】規則說明與電腦主持人</h2>
          <p class="rule-subtitle">本局限定人數模式：<strong>${pCount} 人局</strong>（主持人由電腦擔任，請全員確認後入局）</p>
        </div>

        <div class="rule-body-grid">
          <div class="rule-section">
            <h3>📜 遊戲核心進程與主持規範</h3>
            <ul>
              <li><strong>電腦主持人職責：</strong>電腦擔任公正主持人，負責角色身分隨機分發、技能結算、晝夜交替與白天發言順序指示。</li>
              <li><strong>白天順序發言：</strong>白天階段玩家依照主持人指令順序，依次在右側對話欄打字輸入發言。</li>
              <li><strong>神職首日極限規則：</strong>若「好人」陣營中四位神職人物在第一天白日同時淘汰，則狼人陣營直接獲勝。</li>
            </ul>
          </div>

          <div class="rule-section">
            <h3>👥 本局【${pCount} 人局】角色陣容配置</h3>
            <div class="role-cards-preview">
              ${this.renderConfigRolePills(pCount)}
            </div>
          </div>

          <div class="rule-section">
            <h3>⚖️ 特殊神職與狼人特質</h3>
            <p style="font-size:13px; line-height:1.7; color:#cbd5e1;">
              • <strong>女巫：</strong>解藥僅首夜能自救；同守同救依然死亡；毒殺對象無法開槍發動技能。<br>
              • <strong>獵人/狼王：</strong>淘汰時可開槍反擊（被毒殺除外，狼王開槍不翻牌）。<br>
              • <strong>白癡：</strong>放逐公投被投出時翻牌免疫該次放逐，但後續失去投票權。<br>
              • <strong>狼人自爆：</strong>白天發言時狼人可隨時翻牌自爆，強制直接進入黑夜！
            </p>
          </div>
        </div>

        <div class="rule-confirm-box">
          <div class="confirm-stat-text">
            全員確認進度：<strong>${confirmedCount} / ${players.length} 人已確認</strong>
          </div>
          <div class="progress-track" style="margin: 10px 0;">
            <div class="progress-fill" style="width: ${(confirmedCount / players.length) * 100}%;"></div>
          </div>
          <div class="players-confirm-badges">
            ${players.map(p => `
              <span class="player-badge ${p.confirmed ? 'confirmed' : 'pending'}">
                ${p.confirmed ? '✅' : '⏳'} ${p.name}
              </span>
            `).join('')}
          </div>

          <div class="confirm-btn-wrapper" style="margin-top:16px;">
            <button class="btn btn-primary btn-large btn-glow" onclick="Dungeon2.confirmRules()" ${hasConfirmed ? 'disabled' : ''}>
              ${hasConfirmed ? '✅ 你已確認了解規則（等待其他隊友確認…）' : '👉 我已了解遊戲規則，按下確認鍵'}
            </button>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  renderConfigRolePills(pCount) {
    const cfg = this.roleConfigs[pCount] || this.roleConfigs[8];
    const pills = [];
    for (const r in cfg) {
      if (cfg[r] > 0) {
        const meta = this.roleMeta[r];
        pills.push(`<div class="role-pill">${meta.icon} <strong>${meta.name}</strong> x ${cfg[r]}</div>`);
      }
    }
    return pills.join('');
  },

  renderInGame(container) {
    const myP = this.getMyPlayer();
    const isAlive = myP ? myP.isAlive : false;
    const isWolf = myP && (myP.role === 'werewolf' || myP.role === 'wolf_king');
    const roleInfo = myP && myP.role ? this.roleMeta[myP.role] : { name: '旁觀', camp: '旁觀', icon: '👀', desc: '旁觀中' };
    const isMyTurnToSpeak = this.gameState.phase === 'DAY_SPEECH' && myP && this.gameState.currentSpeakerSeat === myP.seat;

    let html = `
      <div class="dungeon-header-bar">
        <div class="dungeon-title-group">
          <span class="badge badge-multi">狼人殺・第 ${this.gameState.dayCount} 天</span>
          <h2>階段：${this.getPhaseLabel()}</h2>
          <span class="story-tag">${roleInfo.icon} 我的身分：${roleInfo.name} (${roleInfo.camp})</span>
        </div>
        <div class="dungeon-header-actions">
          <button class="btn btn-outline" onclick="App.showLobby()">返回大廳</button>
        </div>
      </div>

      <div class="werewolf-game-grid">
        <div class="werewolf-field-column">
          <!-- My Identity Card -->
          <div class="card my-identity-card fade-in-up">
            <div class="identity-badge">
              <span class="role-icon-large">${roleInfo.icon}</span>
              <div>
                <h3>你的角色：${roleInfo.name} 【${roleInfo.camp}陣營】</h3>
                <p>${roleInfo.desc}</p>
                <span class="status-pill ${isAlive ? 'alive' : 'dead'}">
                  ${isAlive ? '💚 存活狀態' : '💀 已出局'} ${myP && myP.idiotRevealed ? '（🤪 已翻牌白癡）' : ''}
                </span>
                ${isWolf && isAlive && this.gameState.phase !== 'NIGHT' ? `
                  <button class="btn btn-sm btn-danger" style="margin-left:12px;" onclick="Dungeon2.werewolfSelfDestruct()">💥 狼人自爆（強制進夜）</button>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Seats Grid -->
          <div class="card players-table-card">
            <div class="card-header">
              <span class="icon">👥</span>
              <h3>玩家號碼牌與座位列表</h3>
            </div>
            <div class="player-seats-grid">
              ${this.gameState.players.map(p => `
                <div class="player-seat-card ${p.isAlive ? 'seat-alive' : 'seat-dead'} ${p.id === Network.playerId ? 'my-seat' : ''} ${this.gameState.currentSpeakerSeat === p.seat ? 'seat-speaking' : ''}">
                  <div class="seat-num">${p.seat}號</div>
                  <div class="seat-name">${p.name}</div>
                  <div class="seat-status">${p.isAlive ? '🟢 存活' : '💀 陣亡'}</div>
                  ${isWolf && (p.role === 'werewolf' || p.role === 'wolf_king') ? '<div class="seat-wolf-tag">🐺 狼隊友</div>' : ''}
                  ${this.gameState.currentSpeakerSeat === p.seat ? '<div class="seat-speaker-indicator">📢 正在發言</div>' : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Interactive Action Panel depending on phase & role -->
          <div class="card interactive-action-card">
            ${this.renderActionControls(myP, isAlive)}
          </div>
        </div>

        <!-- Right Side: Turn-based Speech & Moderator Announcement Column -->
        <div class="werewolf-chat-column">
          <div class="card werewolf-chat-card">
            <div class="card-header highlight">
              <span class="icon">💬</span>
              <h3>右側對話欄（依主持人順序發言）</h3>
            </div>

            ${this.gameState.phase === 'DAY_SPEECH' ? `
              <div class="speaker-order-banner ${isMyTurnToSpeak ? 'my-turn' : ''}">
                ${isMyTurnToSpeak ? '👉 輪到你了！請在下方輸入你的發言' : `⏳ 目前由【${this.gameState.currentSpeakerSeat} 號玩家】發言中…`}
              </div>
            ` : ''}

            <div class="chat-messages-container" id="werewolf-chat-list"></div>

            <!-- Daytime Speech Input -->
            <div class="chat-input-row">
              <input type="text" id="werewolf-chat-input" placeholder="在對話欄打字發言..." onkeydown="if(event.key==='Enter') Dungeon2.handleChatSubmit()" />
              <button class="btn btn-primary" onclick="Dungeon2.handleChatSubmit()">發言</button>
            </div>

            <!-- Werewolf Secret Channel -->
            ${isWolf ? `
              <div class="wolf-chat-input-row">
                <input type="text" id="werewolf-wolf-chat-input" placeholder="🐺 狼人夜間密語（僅狼隊友可見）..." onkeydown="if(event.key==='Enter') Dungeon2.handleWolfChatSubmit()" />
                <button class="btn btn-danger" onclick="Dungeon2.handleWolfChatSubmit()">狼隊密報</button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.renderChatList();
  },

  getPhaseLabel() {
    switch (this.gameState.phase) {
      case 'NIGHT': return `黑夜降臨【${this.gameState.nightStep} 行動中】`;
      case 'DAY_ANNOUNCE': return '黎明破曉（公佈昨夜情況）';
      case 'DAY_SPEECH': return `白天發言中（目前順序：${this.gameState.currentSpeakerSeat}號）`;
      case 'DAY_VOTE': return '放逐公投階段';
      case 'GAME_OVER': return `遊戲結束`;
      default: return '';
    }
  },

  renderActionControls(myP, isAlive) {
    if (this.gameState.phase === 'GAME_OVER') {
      return `
        <div class="game-over-banner">
          <h2>🎉 ${this.gameState.winner}</h2>
          <button class="btn btn-primary" onclick="Dungeon2.setup(Dungeon2.room)">重新開啟一局</button>
          <button class="btn btn-outline" onclick="App.showLobby()">返回大廳</button>
        </div>
      `;
    }

    if (!isAlive) {
      // Check if hunter or wolf king can shoot
      if ((myP.role === 'hunter' || myP.role === 'wolf_king') && !myP.poisoned && !myP.hasShot) {
        const alives = this.gameState.players.filter(p => p.isAlive);
        return `
          <div class="action-box">
            <h4>🏹 技能觸發：開槍帶走一人！</h4>
            <div class="target-btn-group">
              ${alives.map(p => `
                <button class="btn btn-danger" onclick="Dungeon2.shootPlayer(${p.seat}); Dungeon2.getMyPlayer().hasShot=true;">
                  開槍射殺 ${p.seat}號 ${p.name}
                </button>
              `).join('')}
            </div>
          </div>
        `;
      }
      return `<div class="action-alert">你已出局，請安靜旁觀，觀看局勢推演。</div>`;
    }

    const alivePlayers = this.gameState.players.filter(p => p.isAlive);

    // Night Actions
    if (this.gameState.phase === 'NIGHT') {
      if (this.gameState.nightStep === 'WEREWOLF') {
        if (myP.role === 'werewolf' || myP.role === 'wolf_king') {
          return `
            <div class="action-box">
              <h4>🐺 狼人夜間獵殺：選擇今晚襲擊的目標</h4>
              <div class="target-btn-group">
                ${alivePlayers.map(p => `
                  <button class="btn btn-danger" onclick="Dungeon2.werewolfKill(${p.seat})">獵殺 ${p.seat}號 ${p.name}</button>
                `).join('')}
                <button class="btn btn-secondary" onclick="Dungeon2.werewolfEmptyKnife()">選擇空刀</button>
              </div>
            </div>
          `;
        } else {
          return `<div class="action-wait">🌙 夜深人靜，狼人正在密謀獵殺……（請閉眼等待）</div>`;
        }
      }

      if (this.gameState.nightStep === 'SEER') {
        if (myP.role === 'seer') {
          return `
            <div class="action-box">
              <h4>🔮 預言家查驗：選擇想查驗陣營的玩家</h4>
              <div class="target-btn-group">
                ${alivePlayers.filter(p => p.seat !== myP.seat).map(p => `
                  <button class="btn btn-info" onclick="Dungeon2.seerCheck(${p.seat})">查驗 ${p.seat}號 ${p.name}</button>
                `).join('')}
              </div>
            </div>
          `;
        } else {
          return `<div class="action-wait">🔮 預言家正在查驗水晶球……（請閉眼等待）</div>`;
        }
      }

      if (this.gameState.nightStep === 'WITCH') {
        if (myP.role === 'witch') {
          const victim = this.gameState.nightVictimSeat;
          return `
            <div class="action-box">
              <h4>🧪 女巫用藥回合</h4>
              <p>今晚被襲擊的玩家：<strong>${victim ? victim + '號玩家' : '今晚無人遇襲'}</strong></p>
              <div class="target-btn-group" style="margin-bottom:10px;">
                <button class="btn btn-success" onclick="Dungeon2.witchSave()" ${this.gameState.witchAntidoteUsed || !victim ? 'disabled' : ''}>
                  使用解藥救人 (剩餘 ${this.gameState.witchAntidoteUsed ? 0 : 1})
                </button>
                <button class="btn btn-secondary" onclick="Dungeon2.witchSkip()">跳過不用</button>
              </div>
              <p>使用毒藥毒殺一人：</p>
              <div class="target-btn-group">
                ${alivePlayers.map(p => `
                  <button class="btn btn-danger" onclick="Dungeon2.witchPoison(${p.seat})" ${this.gameState.witchPoisonUsed ? 'disabled' : ''}>
                    毒殺 ${p.seat}號
                  </button>
                `).join('')}
              </div>
            </div>
          `;
        } else {
          return `<div class="action-wait">🧪 女巫正在配製藥劑……（請閉眼等待）</div>`;
        }
      }

      if (this.gameState.nightStep === 'GUARD') {
        if (myP.role === 'guard') {
          return `
            <div class="action-box">
              <h4>🛡️ 守衛守護：選擇今晚守護的對象（不可連續兩晚守護同一人）</h4>
              <div class="target-btn-group">
                ${alivePlayers.filter(p => p.seat !== this.gameState.lastGuardedSeat).map(p => `
                  <button class="btn btn-primary" onclick="Dungeon2.guardProtect(${p.seat})">守護 ${p.seat}號 ${p.name}</button>
                `).join('')}
                <button class="btn btn-secondary" onclick="Dungeon2.guardSkip()">空守</button>
              </div>
            </div>
          `;
        } else {
          // If no guard in this player configuration
          if (this.room.hostId === Network.playerId) {
            setTimeout(() => this.resolveNight(), 1500);
          }
          return `<div class="action-wait">🛡️ 守衛正在巡夜……（請閉眼等待）</div>`;
        }
      }
    }

    // Day Dawn Announcement
    if (this.gameState.phase === 'DAY_ANNOUNCE') {
      return `
        <div class="action-box announce-box">
          <h4>☀️ 黎明晨報已宣讀完畢</h4>
          <button class="btn btn-primary btn-large" onclick="Dungeon2.startDaySpeechSequence()">
            🎙️ 由主持人發起白天順序發言
          </button>
        </div>
      `;
    }

    // Day Turn-based Speech
    if (this.gameState.phase === 'DAY_SPEECH') {
      const isMyTurn = myP.seat === this.gameState.currentSpeakerSeat;
      return `
        <div class="action-box">
          <h4>🗣️ 當前發言順序：【${this.gameState.currentSpeakerSeat} 號玩家】</h4>
          <p>請在右側對話欄打字輸入發言。當前發言玩家完成後可點擊下方按鈕交棒下一位。</p>
          <div style="margin-top:12px;">
            <button class="btn btn-primary" onclick="Dungeon2.nextSpeaker()" ${!isMyTurn && this.room.hostId !== Network.playerId ? 'disabled' : ''}>
              ${isMyTurn ? '👉 我的發言完畢，交給下一位' : '主持人推進至下一位發言'}
            </button>
            <button class="btn btn-warning" onclick="Dungeon2.enterDayVote()">提前結束討論進入投票</button>
          </div>
        </div>
      `;
    }

    // Day Vote
    if (this.gameState.phase === 'DAY_VOTE') {
      const myTarget = this.gameState.votes[myP.seat];
      return `
        <div class="action-box">
          <h4>🗳️ 放逐公投階段</h4>
          <p>請投票選出你認為是狼人的玩家：</p>
          <div class="target-btn-group">
            ${alivePlayers.filter(p => p.seat !== myP.seat).map(p => `
              <button class="btn ${myTarget === p.seat ? 'btn-danger' : 'btn-outline'}" onclick="Dungeon2.castVote(${p.seat})">
                投票給 ${p.seat}號 ${myTarget === p.seat ? '(已投)' : ''}
              </button>
            `).join('')}
          </div>
          <div style="margin-top:15px;">
            <button class="btn btn-danger btn-large" onclick="Dungeon2.tallyVotes()">結束投票並結算票數</button>
          </div>
        </div>
      `;
    }

    return '';
  },

  renderChatList() {
    const chatContainer = document.getElementById('werewolf-chat-list');
    if (!chatContainer || !this.gameState) return;

    chatContainer.innerHTML = this.gameState.chatLogs.map(log => `
      <div class="chat-message ${log.isHost ? 'host-msg' : (log.isWolfChat ? 'wolf-msg' : 'public-msg')}">
        <span class="chat-time">${log.time}</span>
        <strong class="chat-sender">${log.seat > 0 ? `[${log.seat}號]` : ''} ${log.senderName}:</strong>
        <span class="chat-content">${log.text}</span>
      </div>
    `).join('');

    chatContainer.scrollTop = chatContainer.scrollHeight;
  },

  handleChatSubmit() {
    const input = document.getElementById('werewolf-chat-input');
    if (input && input.value) {
      this.sendChat(input.value, false);
      input.value = '';
    }
  },

  handleWolfChatSubmit() {
    const input = document.getElementById('werewolf-wolf-chat-input');
    if (input && input.value) {
      this.sendChat(input.value, true);
      input.value = '';
    }
  }
};

window.Dungeon2 = Dungeon2;
