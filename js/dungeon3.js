// Dungeon 3: 陣營對抗戰 (Faction PvP Battle)
// Restricted to 10, 12, or 14 players. Randomly split into 2 teams (Red vs Blue).
// Class Selection:
// - 【指揮】: exactly 1 per team
// - 【輔助】: <= 30% of team size (integer)
// - 【打手】: rest of team
// Character Selection (3 characters per class with distinct stats and skills)
// Familiarize & Press Enter to confirm (max 5 minutes).
// 3 Modes: 【拔旗戰】, 【生存戰】, 【據點戰】 (Randomly picked & rules announced with animation)
// Right-side Command Column for team-only communication.

const Dungeon3 = {
  room: null,
  gameState: null,
  enterTimerInterval: null,

  // Character definitions with exact base stats and skills from outline
  characters: {
    commander: [
      {
        id: 'sky',
        name: '斯蓋',
        class: 'commander',
        avatar: '🦅',
        hp: 8000, maxHp: 8000, spd: 600, atk: 100,
        skills: [
          { name: '護盾5秒', desc: '減少期間40％的攻擊傷害，冷卻12秒', cd: 12 },
          { name: '速度強化3秒', desc: '期間增加20％移動速度，冷卻8秒', cd: 8 },
          { name: '隱身4秒', desc: '在敵方視角中隱身，但無免疫傷害，冷卻20秒', cd: 20 }
        ]
      },
      {
        id: 'oshi',
        name: '歐希',
        class: 'commander',
        avatar: '🔮',
        hp: 10000, maxHp: 10000, spd: 500, atk: 70,
        skills: [
          { name: '定身敵人2秒', desc: '指定一名敵方成員進行定身，冷卻17秒', cd: 17 },
          { name: '速度強化2秒', desc: '期間增加30％移動速度，冷卻5秒', cd: 5 },
          { name: '虛無2秒', desc: '期間免疫所有傷害，冷卻50秒', cd: 50 }
        ]
      },
      {
        id: 'floris',
        name: '福瑞斯',
        class: 'commander',
        avatar: '⚡',
        hp: 6800, maxHp: 6800, spd: 650, atk: 200,
        skills: [
          { name: '護盾5秒', desc: '減少期間50％的攻擊傷害，冷卻15秒', cd: 15 },
          { name: '擊退控制', desc: '指定一名身旁敵方使其後退並中斷技能，冷卻10秒', cd: 10 },
          { name: '瞬移援護', desc: '指定一位己方成員瞬移至其身邊，冷卻52秒', cd: 52 }
        ]
      }
    ],
    support: [
      {
        id: 'sion',
        name: '塞恩',
        class: 'support',
        avatar: '💉',
        hp: 6000, maxHp: 6000, spd: 800, atk: 90,
        skills: [
          { name: '連鎖護盾3秒', desc: '為指定隊友與自己添加護盾免疫35％傷害，冷卻5秒', cd: 5 },
          { name: '生機治療', desc: '為指定隊員增加其滿血時的20％血量，冷卻9秒', cd: 9 },
          { name: '磁引控制', desc: '將附近敵方拉到身邊（被拉者獲1秒無敵），冷卻25秒', cd: 25 }
        ]
      },
      {
        id: 'kosaion',
        name: '科賽恩',
        class: 'support',
        avatar: '🌿',
        hp: 5300, maxHp: 5300, spd: 850, atk: 160,
        skills: [
          { name: '持續治療3秒', desc: '為自身附近友軍與自己持續增加滿血10％血量，冷卻20秒', cd: 20 },
          { name: '攻擊提升4秒', desc: '為指定隊友提升攻擊力30％，冷卻9秒', cd: 9 },
          { name: '消減增益', desc: '清空指定附近敵方當前所有輔助增益，冷卻25秒', cd: 25 }
        ]
      },
      {
        id: 'tanjun',
        name: '探菌',
        class: 'support',
        avatar: '🍄',
        hp: 11000, maxHp: 11000, spd: 450, atk: 250,
        skills: [
          { name: '速度增益3秒', desc: '為指定隊友提升25％速度，冷卻6秒', cd: 6 },
          { name: '免控守護2秒', desc: '為指定隊員附加免控狀態，冷卻18秒', cd: 18 },
          { name: '地刺定身1秒', desc: '將身邊敵方定身1秒，冷卻5秒', cd: 5 }
        ]
      }
    ],
    striker: [
      {
        id: 'alpha',
        name: '阿爾法',
        class: 'striker',
        avatar: '🗡️',
        hp: 5000, maxHp: 5000, spd: 1000, atk: 650,
        skills: [
          { name: '攻擊爆發', desc: '下次攻擊增益50％傷害，冷卻18秒', cd: 18 },
          { name: '生命燃燒3秒', desc: '每秒扣200血換取攻擊增益30%（845➔1098➔1428點），冷卻30秒', cd: 30 },
          { name: '疾風速增2秒', desc: '速度提升30％，冷卻5秒', cd: 5 }
        ]
      },
      {
        id: 'beta',
        name: '貝塔',
        class: 'striker',
        avatar: '🛡️',
        hp: 15000, maxHp: 15000, spd: 400, atk: 490,
        skills: [
          { name: '吸收反彈2秒', desc: '幫隊友吸收90％傷害並反彈20%傷害給指定敵方，冷卻20秒', cd: 20 },
          { name: '鎖定強攻3秒', desc: '指定敵方並提升攻擊30％造成持續傷害，冷卻9秒', cd: 9 },
          { name: '變換形態', desc: '切換至戰鬥形態（血量7000/速度670/攻擊500），冷卻50秒', cd: 50 }
        ]
      },
      {
        id: 'gamma',
        name: '伽瑪',
        class: 'striker',
        avatar: '🪓',
        hp: 9000, maxHp: 9000, spd: 650, atk: 570,
        skills: [
          { name: '裂地巨斬', desc: '以千鈞之力重創敵方，造成150%攻擊力打擊，冷卻10秒', cd: 10 },
          { name: '狂暴旋風刃', desc: '對身邊敵方造成旋風範圍傷害並減速20%，冷卻15秒', cd: 15 },
          { name: '嗜血戰吼', desc: '獲得生命值25%的吸收護盾並短暫霸體，冷卻25秒', cd: 25 }
        ]
      }
    ]
  },

  modes: [
    {
      id: 'ctf',
      name: '【拔旗戰】(Capture the Flag)',
      badge: '🚩 拔旗戰',
      ruleDesc: '地圖中央設有唯一的旗子（兩隊旗子在同一位置）。全場限時20分鐘，率先拔下旗子的隊伍獲勝；若時間結束仍未拔下，則距離旗子較近的隊伍獲勝！全域瀰漫毒氣，初始僅有5分鐘毒氣免疫，打手需獵殺隨機出沒的妖獸收集三種資源合成解藥免疫毒氣！'
    },
    {
      id: 'survival',
      name: '【生存戰】(Survival Battle)',
      badge: '⚔️ 生存戰',
      ruleDesc: '最終評判標準為全隊平均生存時長！全場限時24分鐘，每8分鐘切換晝夜。白天資源包為真並隨機刷新妖獸；黑夜部分資源包為妖獸偽裝，部分道具包為致死炸彈！若己方指揮淘汰，全隊定位暴露3分鐘且平均生存時長扣除1.5分鐘；若輔助淘汰，全隊定位暴露1分鐘！'
    },
    {
      id: 'domination',
      name: '【據點戰】(Control Point Domination)',
      badge: '🏰 據點戰',
      ruleDesc: '最終以隊伍標記的據點數量多者獲勝！隨機投放5～7個旗狀據點，每隔5分鐘變換位置。找到據點按下計時按鈕開始3分鐘倒數，期間若未被搶奪則標記成功。敵方可以武力搶奪（淘汰3名打手 / 殲滅守點人員 / 淘汰1名輔助或指揮），搶奪成功後重新倒計時3分鐘！'
    }
  ],

  init() {
    Network.on('PVP3_STATE_UPDATED', (data) => {
      if (this.room && this.room.id === data.roomId) {
        this.gameState = data.state;
        this.render();
      }
    });

    Network.on('PVP3_ENTER_CONFIRM', ({ roomId, playerId }) => {
      if (this.room && this.room.id === roomId && this.gameState) {
        const p = this.gameState.players.find(x => x.id === playerId);
        if (p) {
          p.enterConfirmed = true;
          this.checkAllEnterConfirmed();
          this.render();
        }
      }
    });

    Network.on('PVP3_RULE_CONFIRM', ({ roomId, playerId }) => {
      if (this.room && this.room.id === roomId && this.gameState) {
        const p = this.gameState.players.find(x => x.id === playerId);
        if (p) {
          p.modeRuleConfirmed = true;
          this.checkAllModeConfirmed();
          this.render();
        }
      }
    });

    Network.on('PVP3_TEAM_CHAT', ({ roomId, team, senderName, senderRole, text }) => {
      if (this.room && this.room.id === roomId && this.gameState) {
        const myP = this.getMyPlayer();
        if (myP && myP.team === team) {
          this.gameState.teamChats[team].push({
            senderName,
            senderRole,
            text,
            time: new Date().toLocaleTimeString()
          });
          this.renderTeamChat();
        }
      }
    });

    // Global Enter key listener for character confirmation
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        if (this.gameState && this.gameState.stage === 'ROLE_SELECTION') {
          // If not focusing on chat input, confirm
          const activeEl = document.activeElement;
          if (!activeEl || activeEl.tagName !== 'INPUT') {
            this.pressEnterConfirm();
          }
        }
      }
    });
  },

  setup(room) {
    this.room = room;
    if (!this.gameState || this.gameState.roomId !== room.id) {
      this.initGame();
    }
    this.render();
  },

  initGame() {
    const totalCount = this.room.players.length;
    const teamSize = Math.floor(totalCount / 2);
    const maxSupport = Math.floor(teamSize * 0.3); // 30% integer

    // Pick random game mode
    const pickedMode = this.modes[Math.floor(Math.random() * this.modes.length)];

    // Randomly assign to Red & Blue teams
    const shuffled = [...this.room.players].sort(() => Math.random() - 0.5);
    const assignedPlayers = shuffled.map((p, idx) => {
      const team = idx < teamSize ? 'red' : 'blue';
      return {
        id: p.id,
        name: p.name,
        team,
        classRole: null, // 'commander' | 'support' | 'striker'
        character: null, // chosen character object
        isBot: p.isBot,
        enterConfirmed: p.isBot ? true : false,
        modeRuleConfirmed: p.isBot ? true : false,
        hp: 10000,
        maxHp: 10000,
        spd: 500,
        atk: 200,
        shield: 0,
        poisonImmuneTime: 300, // 5 min initial immunity for CTF
        antidotes: 0,
        resources: { herb: 0, water: 0, crystal: 0 },
        isAlive: true,
        x: team === 'red' ? 15 : 85,
        y: 50
      };
    });

    // Auto-allocate valid bots
    ['red', 'blue'].forEach(t => {
      const tPlayers = assignedPlayers.filter(p => p.team === t);
      let cmdCount = 0;
      let supCount = 0;
      tPlayers.forEach(p => {
        if (p.isBot) {
          if (cmdCount < 1) {
            p.classRole = 'commander';
            p.character = this.characters.commander[0];
            cmdCount++;
          } else if (supCount < maxSupport) {
            p.classRole = 'support';
            p.character = this.characters.support[0];
            supCount++;
          } else {
            p.classRole = 'striker';
            p.character = this.characters.striker[0];
          }
          p.hp = p.character.hp;
          p.maxHp = p.character.maxHp;
          p.spd = p.character.spd;
          p.atk = p.character.atk;
        }
      });
    });

    this.gameState = {
      roomId: this.room.id,
      stage: 'ROLE_SELECTION', // 'ROLE_SELECTION' -> 'MODE_CONFIRMATION' -> 'IN_BATTLE'
      mode: pickedMode,
      totalPlayers: totalCount,
      teamSize,
      maxSupport,
      players: assignedPlayers,
      enterDeadline: Date.now() + 5 * 60 * 1000, // 5 minutes limit
      teamChats: { red: [], blue: [] },
      battleLogs: [],
      score: { red: 0, blue: 0 },
      flagLocation: { x: 50, y: 50, heldBy: null },
      dayNightPhase: 'DAY', // for survival
      survivalElapsedTime: 0,
      controlPoints: [
        { id: 'A', x: 30, y: 30, markingTeam: null, timer: 180, marked: false, markedBy: null },
        { id: 'B', x: 50, y: 50, markingTeam: null, timer: 180, marked: false, markedBy: null },
        { id: 'C', x: 70, y: 70, markingTeam: null, timer: 180, marked: false, markedBy: null },
        { id: 'D', x: 30, y: 70, markingTeam: null, timer: 180, marked: false, markedBy: null },
        { id: 'E', x: 70, y: 30, markingTeam: null, timer: 180, marked: false, markedBy: null }
      ],
      beasts: [
        { id: 'b1', name: '暗影毒蜥', hp: 3000, x: 40, y: 45, drops: 'herb' },
        { id: 'b2', name: '晶岩巨獸', hp: 5000, x: 60, y: 55, drops: 'crystal' },
        { id: 'b3', name: '寒潭巨蟒', hp: 4000, x: 50, y: 35, drops: 'water' }
      ],
      winner: null
    };

    this.broadcastState();
  },

  broadcastState() {
    Network.broadcastAndSelf('PVP3_STATE_UPDATED', {
      roomId: this.room.id,
      state: this.gameState
    });
  },

  getMyPlayer() {
    if (!this.gameState || !this.gameState.players) return null;
    return this.gameState.players.find(p => p.id === Network.playerId);
  },

  // Role limit validation
  canPickClass(team, classRole) {
    const tPlayers = this.gameState.players.filter(p => p.team === team);
    const cmdCount = tPlayers.filter(p => p.classRole === 'commander').length;
    const supCount = tPlayers.filter(p => p.classRole === 'support').length;

    if (classRole === 'commander') return cmdCount < 1;
    if (classRole === 'support') return supCount < this.gameState.maxSupport;
    return true; // Striker is for rest
  },

  pickClass(classRole) {
    const myP = this.getMyPlayer();
    if (!myP) return;

    if (!this.canPickClass(myP.team, classRole)) {
      alert(`該職業已額滿！（指揮限1人，輔助上限為${this.gameState.maxSupport}人）`);
      SoundFX.error();
      return;
    }

    myP.classRole = classRole;
    // Default pick first character
    myP.character = this.characters[classRole][0];
    myP.hp = myP.character.hp;
    myP.maxHp = myP.character.maxHp;
    myP.spd = myP.character.spd;
    myP.atk = myP.character.atk;

    SoundFX.click();
    this.broadcastState();
  },

  selectSpecificCharacter(charId) {
    const myP = this.getMyPlayer();
    if (!myP || !myP.classRole) return;

    const charList = this.characters[myP.classRole];
    const picked = charList.find(c => c.id === charId);
    if (picked) {
      myP.character = picked;
      myP.hp = picked.hp;
      myP.maxHp = picked.maxHp;
      myP.spd = picked.spd;
      myP.atk = picked.atk;
      SoundFX.click();
      this.broadcastState();
    }
  },

  // Press Enter Confirmation
  // "選完後可繼續熟悉角色，確認完後按下Enter，待所有玩家按下Enter後進入遊戲（確認時間不可超過5分鐘）"
  pressEnterConfirm() {
    const myP = this.getMyPlayer();
    if (!myP) return;

    if (!myP.classRole || !myP.character) {
      alert("請先選擇職業與英雄角色後，再按下 Enter 確認！");
      SoundFX.error();
      return;
    }

    SoundFX.confirm();
    Network.broadcastAndSelf('PVP3_ENTER_CONFIRM', {
      roomId: this.room.id,
      playerId: Network.playerId
    });
  },

  checkAllEnterConfirmed() {
    if (this.gameState.stage !== 'ROLE_SELECTION') return;

    const allHaveRole = this.gameState.players.every(p => p.classRole && p.character);
    const allConfirmed = this.gameState.players.every(p => p.enterConfirmed);

    if (allHaveRole && allConfirmed) {
      // Transition to Mode Rule Announcement with Animation
      this.gameState.stage = 'MODE_CONFIRMATION';
      SoundFX.start();
      this.broadcastState();
    }
  },

  // Mode Rule Confirmation
  confirmModeRules() {
    SoundFX.confirm();
    Network.broadcastAndSelf('PVP3_RULE_CONFIRM', {
      roomId: this.room.id,
      playerId: Network.playerId
    });
  },

  checkAllModeConfirmed() {
    if (this.gameState.stage !== 'MODE_CONFIRMATION') return;
    const allConfirmed = this.gameState.players.every(p => p.modeRuleConfirmed);

    if (allConfirmed) {
      if (this.room.hostId === Network.playerId) {
        this.startLiveBattle();
      }
    }
  },

  startLiveBattle() {
    this.gameState.stage = 'IN_BATTLE';
    this.addBattleLog(`🔥【${this.gameState.mode.name}】正式開戰！紅藍陣營已投入戰場！`);
    SoundFX.start();
    this.broadcastState();
  },

  addBattleLog(text) {
    this.gameState.battleLogs.unshift({
      time: new Date().toLocaleTimeString(),
      text
    });
  },

  // Skills
  castSkill(skillIdx) {
    const myP = this.getMyPlayer();
    if (!myP || !myP.character || !myP.isAlive) return;

    const skill = myP.character.skills[skillIdx];
    if (!skill) return;

    SoundFX.attack();
    const team = myP.team;
    const oppTeam = team === 'red' ? 'blue' : 'red';

    this.addBattleLog(`⚡ [${team.toUpperCase()}隊 ${myP.character.name}] 發動技能【${skill.name}】！(${skill.desc})`);

    // Effect handling
    if (myP.classRole === 'support' && skill.name.includes('治療')) {
      this.gameState.players.filter(p => p.team === team).forEach(p => {
        p.hp = Math.min(p.maxHp, p.hp + 1500);
      });
      SoundFX.heal();
    } else if (myP.classRole === 'striker' && (skill.name.includes('攻擊') || skill.name.includes('斬'))) {
      const opps = this.gameState.players.filter(p => p.team === oppTeam && p.isAlive);
      if (opps.length > 0) {
        const target = opps[Math.floor(Math.random() * opps.length)];
        target.hp = Math.max(0, target.hp - myP.atk * 3);
        this.addBattleLog(`💥 敵方 [${target.character.name} ${target.name}] 遭受重創，剩餘血量 ${target.hp}！`);
        if (target.hp === 0) {
          target.isAlive = false;
          this.addBattleLog(`💀 敵方隊員 [${target.name}] 陣亡出局！`);
          // Penalties for Survival mode
          if (this.gameState.mode.id === 'survival') {
            if (target.classRole === 'commander') {
              this.addBattleLog(`🚨 敵方指揮官陣亡！敵方全隊定位暴露3分鐘，平均生存時長扣除1.5分鐘！`);
            } else if (target.classRole === 'support') {
              this.addBattleLog(`🚨 敵方輔助陣亡！敵方全隊定位暴露1分鐘！`);
            }
          }
        }
      }
    }

    this.checkVictoryCondition();
    this.broadcastState();
  },

  // Fight Beasts for Resources in CTF
  fightBeast(beastId) {
    const myP = this.getMyPlayer();
    if (!myP || !myP.isAlive) return;

    const beast = this.gameState.beasts.find(b => b.id === beastId);
    if (!beast) return;

    SoundFX.attack();
    beast.hp = Math.max(0, beast.hp - myP.atk * 2);
    this.addBattleLog(`⚔️ [${myP.name}] 正在圍剿妖獸【${beast.name}】！(妖獸剩餘生命: ${beast.hp})`);

    if (beast.hp === 0) {
      myP.resources[beast.drops] = (myP.resources[beast.drops] || 0) + 1;
      this.addBattleLog(`💎 妖獸【${beast.name}】被討伐擊殺！掉落核心資源【${beast.drops}】由 [${myP.name}] 獲得！`);
      beast.hp = 4000; // respawn
    }

    this.broadcastState();
  },

  // Craft Antidote (3 resources craft 1 antidote)
  craftAntidote() {
    const myP = this.getMyPlayer();
    if (!myP) return;

    const res = myP.resources;
    if (res.herb >= 1 && res.water >= 1 && res.crystal >= 1) {
      res.herb--; res.water--; res.crystal--;
      myP.antidotes++;
      SoundFX.heal();
      alert("【合成成功！】消耗三種妖獸資源，合成出 1 顆毒氣解藥！");
      this.broadcastState();
    } else {
      alert("【資源不足】合成解藥需要草藥(herb)、靈水(water)與晶石(crystal)各1份！請討伐妖獸獲取！");
      SoundFX.error();
    }
  },

  useAntidote() {
    const myP = this.getMyPlayer();
    if (!myP || myP.antidotes <= 0) return;
    myP.antidotes--;
    myP.poisonImmuneTime += 300; // extend 5 min
    SoundFX.heal();
    alert("【解藥生效】服下解藥，免疫毒氣時間延長 5 分鐘！");
    this.broadcastState();
  },

  // Pull Flag in CTF
  pullFlag() {
    const myP = this.getMyPlayer();
    if (!myP || !myP.isAlive) return;

    SoundFX.confirm();
    this.gameState.flagLocation.heldBy = myP.team;
    this.gameState.score[myP.team]++;
    this.addBattleLog(`🚩 [${myP.team.toUpperCase()}隊] ${myP.name} 成功拔下了地圖中央的軍旗！`);

    if (this.gameState.score[myP.team] >= 1) {
      this.gameState.winner = `${myP.team === 'red' ? '紅方隊伍' : '藍方隊伍'}（率先拔下軍旗大獲全勝！）`;
      SoundFX.start();
    }
    this.broadcastState();
  },

  // Start Point Timer in Domination
  startPointMarking(ptId) {
    const myP = this.getMyPlayer();
    if (!myP || !myP.isAlive) return;

    const pt = this.gameState.controlPoints.find(p => p.id === ptId);
    if (!pt || pt.marked) return;

    pt.markingTeam = myP.team;
    pt.timer = 180;
    SoundFX.confirm();
    this.addBattleLog(`🏰 [${myP.team.toUpperCase()}隊] 正在標記據點【${pt.id}】！3分鐘倒計時開始！`);

    // Simulated quick finish for testing or live countdown
    setTimeout(() => {
      if (pt.markingTeam === myP.team && !pt.marked) {
        pt.marked = true;
        pt.markedBy = myP.team;
        this.gameState.score[myP.team]++;
        this.addBattleLog(`🏆 據點【${pt.id}】被 [${myP.team.toUpperCase()}隊] 成功標記！(當前標記數: ${this.gameState.score[myP.team]})`);
        this.checkVictoryCondition();
        this.broadcastState();
      }
    }, 5000); // Fast completion for responsive gameplay testing

    this.broadcastState();
  },

  // Contest / Steal Point (武力搶奪)
  contestPoint(ptId) {
    const myP = this.getMyPlayer();
    if (!myP || !myP.isAlive) return;

    const pt = this.gameState.controlPoints.find(p => p.id === ptId);
    if (!pt || pt.marked) return;

    SoundFX.attack();
    pt.markingTeam = myP.team;
    pt.timer = 180;
    this.addBattleLog(`⚔️ [${myP.team.toUpperCase()}隊] 成功武力搶奪了據點【${pt.id}】！重新開始3分鐘標記倒數！`);
    this.broadcastState();
  },

  checkVictoryCondition() {
    const mode = this.gameState.mode.id;
    if (mode === 'ctf') {
      if (this.gameState.score.red >= 1) this.gameState.winner = '紅方陣營（率先拔下軍旗獲勝！）';
      else if (this.gameState.score.blue >= 1) this.gameState.winner = '藍方陣營（率先拔下軍旗獲勝！）';
    } else if (mode === 'domination') {
      const redPts = this.gameState.controlPoints.filter(p => p.markedBy === 'red').length;
      const bluePts = this.gameState.controlPoints.filter(p => p.markedBy === 'blue').length;
      if (redPts >= 3) this.gameState.winner = '紅方陣營（成功標記多數據點獲勝！）';
      else if (bluePts >= 3) this.gameState.winner = '藍方陣營（成功標記多數據點獲勝！）';
    } else if (mode === 'survival') {
      const redAlive = this.gameState.players.filter(p => p.team === 'red' && p.isAlive).length;
      const blueAlive = this.gameState.players.filter(p => p.team === 'blue' && p.isAlive).length;
      if (redAlive === 0) this.gameState.winner = '藍方陣營（生存時長獲勝，紅方全體陣亡！）';
      else if (blueAlive === 0) this.gameState.winner = '紅方陣營（生存時長獲勝，藍方全體陣亡！）';
    }
  },

  sendTeamChat(text) {
    if (!text || !text.trim()) return;
    const myP = this.getMyPlayer();
    if (!myP) return;

    const team = myP.team;
    Network.send('PVP3_TEAM_CHAT', {
      roomId: this.room.id,
      team,
      senderName: Network.playerName,
      senderRole: myP.character ? myP.character.name : (myP.classRole || '隊員'),
      text: text.trim()
    });

    this.gameState.teamChats[team].push({
      senderName: Network.playerName,
      senderRole: myP.character ? myP.character.name : (myP.classRole || '隊員'),
      text: text.trim(),
      time: new Date().toLocaleTimeString()
    });

    this.renderTeamChat();
  },

  render() {
    const container = document.getElementById('dungeon3-container');
    if (!container || !this.room) return;

    if (!this.gameState || this.gameState.stage === 'ROLE_SELECTION') {
      this.renderRoleSelection(container);
    } else if (this.gameState.stage === 'MODE_CONFIRMATION') {
      this.renderModeConfirmation(container);
    } else {
      this.renderLiveBattle(container);
    }
  },

  // Step 1: Role & Character Selection with 5-minute timeout and Enter key
  renderRoleSelection(container) {
    const myP = this.getMyPlayer();
    const myTeam = myP ? myP.team : 'red';
    const myClass = myP ? myP.classRole : null;
    const myChar = myP ? myP.character : null;
    const hasEnterConfirmed = myP ? myP.enterConfirmed : false;
    const enterCount = this.gameState.players.filter(p => p.enterConfirmed).length;

    const timeLeftSec = Math.max(0, Math.floor((this.gameState.enterDeadline - Date.now()) / 1000));
    const minutes = Math.floor(timeLeftSec / 60);
    const seconds = timeLeftSec % 60;
    const timeStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    let html = `
      <div class="dungeon-header-bar">
        <div class="dungeon-title-group">
          <span class="badge badge-pvp">限${this.gameState.totalPlayers}人・${this.gameState.teamSize}v${this.gameState.teamSize}陣營對抗</span>
          <h2>副本三：職業與角色配置大廳</h2>
          <span class="story-tag">你被分配至：${myTeam === 'red' ? '🔴 紅方陣營' : '🔵 藍方陣營'}</span>
        </div>
        <div class="dungeon-header-actions">
          <div class="timeout-badge">⏱️ 確認剩餘時間：<strong>${timeStr}</strong>（超時不可超過5分鐘）</div>
          <button class="btn btn-outline" onclick="App.showLobby()">返回大廳</button>
        </div>
      </div>

      <div class="pvp-role-selection-grid">
        <div class="selection-left-col">
          <!-- Class Selection Area -->
          <div class="card">
            <div class="card-header highlight">
              <span class="icon">🛡️</span>
              <h3>步驟一：選擇你的隊伍職業編制（每隊${this.gameState.teamSize}人）</h3>
            </div>
            <div class="class-role-picker-row">
              <button class="btn ${myClass === 'commander' ? 'btn-danger' : 'btn-outline'}" onclick="Dungeon3.pickClass('commander')">
                🎖️ 【指揮】(限1人・戰略部署核心)
              </button>
              <button class="btn ${myClass === 'support' ? 'btn-success' : 'btn-outline'}" onclick="Dungeon3.pickClass('support')">
                💉 【輔助】(限${this.gameState.maxSupport}人・治療與利用資源)
              </button>
              <button class="btn ${myClass === 'striker' ? 'btn-warning' : 'btn-outline'}" onclick="Dungeon3.pickClass('striker')">
                ⚔️ 【打手】(武力保護指揮輔助爭取勝利)
              </button>
            </div>
          </div>

          <!-- Character Cards Display Area for selected Class -->
          ${myClass ? `
            <div class="card character-showcase-card fade-in-up">
              <div class="card-header highlight">
                <span class="icon">🎭</span>
                <h3>步驟二：選擇${myClass === 'commander' ? '指揮' : (myClass === 'support' ? '輔助' : '打手')}專屬角色（點擊切換並熟悉特質與技能）</h3>
              </div>
              <div class="char-cards-grid">
                ${this.characters[myClass].map(c => `
                  <div class="char-intro-card ${myChar && myChar.id === c.id ? 'active-char' : ''}" onclick="Dungeon3.selectSpecificCharacter('${c.id}')">
                    <div class="char-avatar">${c.avatar}</div>
                    <div class="char-name">${c.name}</div>
                    <div class="char-stats">
                      <span>❤️ 血量: ${c.hp}</span>
                      <span>⚡ 速度: ${c.spd}</span>
                      <span>🗡️ 攻擊: ${c.atk}</span>
                    </div>
                    <div class="char-skills-list">
                      <strong>✨ 專屬技能組：</strong>
                      ${c.skills.map((s, idx) => `
                        <div class="skill-mini-row">
                          <span class="skill-mini-name">技能${idx+1} [${s.name}]:</span>
                          <span class="skill-mini-desc">${s.desc}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : '<div class="card"><div class="action-alert">請先點選上方職業【指揮/輔助/打手】展開三個角色的詳細介紹。</div></div>'}

          <!-- Enter Confirmation Banner -->
          <div class="card enter-confirm-card">
            <div class="enter-confirm-flex">
              <div>
                <h3>熟悉角色完畢？請按下【Enter 鍵】確認！</h3>
                <p>全體玩家確認進度：<strong>${enterCount} / ${this.gameState.totalPlayers} 人已按 Enter</strong>（確認時間不可超過5分鐘）</p>
              </div>
              <div>
                <button class="btn btn-primary btn-large btn-glow" onclick="Dungeon3.pressEnterConfirm()" ${hasEnterConfirmed ? 'disabled' : ''}>
                  ${hasEnterConfirmed ? '✅ 已按 Enter 確認（等待其他玩家…）' : '⌨️ 按下 Enter 鎖定確認'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Right Side: Dedicated Team Chat for Class Allocation -->
        <div class="selection-right-col">
          <div class="card team-chat-card">
            <div class="card-header highlight">
              <span class="icon">💬</span>
              <h3>【己方隊伍聊天欄】職業分配溝通</h3>
            </div>
            <div class="team-chat-notice">
              🔒 僅限【${myTeam === 'red' ? '紅方' : '藍方'}】隊員可見。請在此溝通誰擔任指揮與輔助！
            </div>
            <div class="chat-messages-container" id="pvp-team-chat-list"></div>
            <div class="chat-input-row">
              <input type="text" id="pvp-team-chat-input" placeholder="與本隊溝通職業與戰術..." onkeydown="if(event.key==='Enter') Dungeon3.handleChatSubmit()" />
              <button class="btn btn-primary" onclick="Dungeon3.handleChatSubmit()">發送</button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.renderTeamChat();
  },

  // Step 2: Random Mode Announcement with Animated Rules & Confirmation
  renderModeConfirmation(container) {
    const myP = this.getMyPlayer();
    const mode = this.gameState.mode;
    const hasConfirmed = myP ? myP.modeRuleConfirmed : false;
    const confCount = this.gameState.players.filter(p => p.modeRuleConfirmed).length;

    container.innerHTML = `
      <div class="card rule-modal-card intro-slide-down">
        <div class="rule-header">
          <div class="animated-icon-bounce">⚔️</div>
          <h2>【副本三：隨機對抗模式公佈】</h2>
          <h1 class="highlight-mode-name">${mode.name}</h1>
          <p class="rule-subtitle">系統已隨機抽取本次陣營對抗戰模式，請仔細閱讀下方戰場機制並按下確認鍵！</p>
        </div>

        <div class="animated-rule-box">
          <div class="rule-bubble-item">
            <span class="bubble-num">🏆</span>
            <div>
              <strong>勝負評判標準：</strong>
              <p>${mode.ruleDesc}</p>
            </div>
          </div>

          <div class="rule-bubble-item">
            <span class="bubble-num">🗺️</span>
            <div>
              <strong>戰場邊際地圖與雷達定位：</strong>
              <p>進入遊戲後系統將發送邊際競賽地圖給所有成員，並實時顯示己方隊員定位雷達。</p>
            </div>
          </div>

          <div class="rule-bubble-item">
            <span class="bubble-num">📻</span>
            <div>
              <strong>右側指揮欄：</strong>
              <p>戰鬥中右側將常駐指揮欄，供本隊隊員打字交流戰況、發布集結與支援指令！</p>
            </div>
          </div>
        </div>

        <div class="rule-confirm-box">
          <div class="confirm-stat-text">
            全體模式確認進度：<strong>${confCount} / ${this.gameState.totalPlayers} 人已確認</strong>
          </div>
          <div class="confirm-btn-wrapper" style="margin-top:14px;">
            <button class="btn btn-primary btn-large btn-glow" onclick="Dungeon3.confirmModeRules()" ${hasConfirmed ? 'disabled' : ''}>
              ${hasConfirmed ? '✅ 你已確認模式規則（等待全員確認開戰…）' : '👉 我已了解模式規則，按下確認鍵進入遊戲'}
            </button>
          </div>
        </div>
      </div>
    `;
  },

  // Step 3: Live Battle Field with Radar Map, Skills, and Right-side Command Column
  renderLiveBattle(container) {
    const myP = this.getMyPlayer();
    const myTeam = myP ? myP.team : 'red';
    const myChar = myP ? myP.character : null;
    const mode = this.gameState.mode;

    let html = `
      <div class="dungeon-header-bar">
        <div class="dungeon-title-group">
          <span class="badge badge-pvp">${mode.badge}・激戰進行中</span>
          <h2>${mode.name} - 戰場即時交鋒</h2>
          <span class="story-tag">${myTeam === 'red' ? '🔴 紅方' : '🔵 藍方'} | ${myChar ? myChar.name : ''} (${myP.classRole})</span>
        </div>
        <div class="dungeon-header-actions">
          <button class="btn btn-outline" onclick="App.showLobby()">返回大廳</button>
        </div>
      </div>

      <!-- Mode Specific Objective Bar -->
      <div class="card mode-objective-card">
        ${this.renderModeHeaderStats(mode)}
      </div>

      <div class="pvp-battle-grid">
        <div class="pvp-field-column">
          <!-- 2D Tactical Battlefield Map with Allied Radar Positioning -->
          <div class="card tactical-map-card">
            <div class="card-header highlight">
              <span class="icon">🗺️</span>
              <h3>競賽地圖雷達（顯示己方成員與目標定位）</h3>
            </div>
            <div class="map-arena">
              <!-- Flag / Bases -->
              <div class="map-node flag-node" style="left:50%; top:50%;">
                🚩 ${mode.id === 'ctf' ? '中央軍旗' : '中央區域'}
              </div>

              <!-- Control Points if domination -->
              ${mode.id === 'domination' ? this.gameState.controlPoints.map(p => `
                <div class="map-node cp-node ${p.marked ? 'cp-marked-' + p.markedBy : ''}" style="left:${p.x}%; top:${p.y}%;">
                  🏰 據點${p.id} ${p.markingTeam ? `(${p.markingTeam}隊標記中)` : ''}
                </div>
              `).join('') : ''}

              <!-- Beasts -->
              ${this.gameState.beasts.map(b => `
                <div class="map-node beast-node" style="left:${b.x}%; top:${b.y}%;">
                  🐉 ${b.name} (${b.hp}HP)
                </div>
              `).join('')}

              <!-- Players Radar Dots -->
              ${this.gameState.players.filter(p => p.isAlive).map(p => `
                <div class="radar-dot ${p.team}-dot ${p.id === Network.playerId ? 'me-dot' : ''}" style="left:${p.x}%; top:${p.y}%;" title="${p.name} (${p.character ? p.character.name : ''})">
                  ${p.team === 'red' ? '🔴' : '🔵'}
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Hero Action & Skill Panel -->
          <div class="card hero-action-panel">
            <div class="card-header highlight">
              <span class="icon">⚡</span>
              <h3>【${myChar ? myChar.name : ''}】作戰技能與物資操作</h3>
            </div>
            <div class="action-panel-body">
              <div class="hero-stats-row">
                <span>❤️ 生命值: <strong>${myP.hp}</strong> / ${myP.maxHp}</span>
                <span>🗡️ 基礎攻擊: ${myP.atk}</span>
                <span>⚡ 移動速度: ${myP.spd}</span>
                ${mode.id === 'ctf' ? `<span>☣️ 毒氣免疫剩餘: ${myP.poisonImmuneTime}秒</span>` : ''}
              </div>

              <div class="skills-btn-row" style="margin: 12px 0;">
                ${myChar ? myChar.skills.map((s, idx) => `
                  <button class="btn btn-primary" onclick="Dungeon3.castSkill(${idx})">
                    ⚡ ${s.name} (${s.cd}s CD)
                  </button>
                `).join('') : ''}
              </div>

              <!-- Mode Specific Action Buttons -->
              <div class="mode-actions-row">
                ${mode.id === 'ctf' ? `
                  <button class="btn btn-warning" onclick="Dungeon3.pullFlag()">🚩 奪取/拔下中央軍旗！</button>
                  <button class="btn btn-success" onclick="Dungeon3.craftAntidote()">🧪 合成解藥 (需3種妖獸資源)</button>
                  <button class="btn btn-info" onclick="Dungeon3.useAntidote()" ${myP.antidotes <= 0 ? 'disabled' : ''}>
                    💊 服用解藥 (+5分鐘免疫，剩餘${myP.antidotes})
                  </button>
                  <button class="btn btn-danger" onclick="Dungeon3.fightBeast('b1')">🐉 攻擊妖獸【暗影毒蜥】</button>
                ` : ''}

                ${mode.id === 'domination' ? `
                  <button class="btn btn-warning" onclick="Dungeon3.startPointMarking('B')">⏱️ 標記中央據點B（啟動3分鐘計時）</button>
                  <button class="btn btn-danger" onclick="Dungeon3.contestPoint('B')">⚔️ 武力搶奪據點B（重置倒計時）</button>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Battle Live Logs -->
          <div class="card">
            <div class="card-header"><span class="icon">📜</span><h3>戰場即時交鋒日誌</h3></div>
            <div class="combat-logs-list">
              ${this.gameState.battleLogs.map(l => `
                <div class="combat-log-item"><span class="cl-time">${l.time}</span> ${l.text}</div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Right Side: Dedicated Command Chat Column ("右側指揮欄") -->
        <div class="pvp-command-column">
          <div class="card team-command-chat-card">
            <div class="card-header highlight">
              <span class="icon">📻</span>
              <h3>【右側指揮欄】本隊戰略頻道</h3>
            </div>
            <div class="command-channel-tip">
              🔒 僅限【${myTeam === 'red' ? '紅方' : '藍方'}】隊員通訊。指揮官可發布調遣與戰術呼叫！
            </div>
            <div class="chat-messages-container" id="pvp-team-chat-list"></div>
            <div class="chat-input-row">
              <input type="text" id="pvp-team-chat-input" placeholder="在指揮欄打字傳達情報..." onkeydown="if(event.key==='Enter') Dungeon3.handleChatSubmit()" />
              <button class="btn btn-primary" onclick="Dungeon3.handleChatSubmit()">發送</button>
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    this.renderTeamChat();
  },

  renderModeHeaderStats(mode) {
    if (mode.id === 'ctf') {
      return `
        <div class="objective-flex">
          <div>🚩 <strong>【拔旗戰】</strong>限時20分鐘 | 率先拔旗或倒計時結束最靠近旗子隊伍獲勝！</div>
          <div class="score-display">紅方軍旗: ${this.gameState.score.red} ｜ 藍方軍旗: ${this.gameState.score.blue}</div>
        </div>
      `;
    } else if (mode.id === 'survival') {
      return `
        <div class="objective-flex">
          <div>⚔️ <strong>【生存戰】</strong>每8分鐘換一次晝夜（總時長24分鐘） | 以平均生存時長判定勝負！</div>
          <div class="score-display">當前時段：☀️ 白天階段（資源為真）</div>
        </div>
      `;
    } else {
      const redPts = this.gameState.controlPoints.filter(p => p.markedBy === 'red').length;
      const bluePts = this.gameState.controlPoints.filter(p => p.markedBy === 'blue').length;
      return `
        <div class="objective-flex">
          <div>🏰 <strong>【據點戰】</strong>隨機5~7個據點 | 標記倒數3分鐘完成且未被搶奪即可成功標記！</div>
          <div class="score-display">已標記據點數 ➔ 紅方: ${redPts} ｜ 藍方: ${bluePts}</div>
        </div>
      `;
    }
  },

  renderTeamChat() {
    const container = document.getElementById('pvp-team-chat-list');
    if (!container || !this.gameState) return;

    const myP = this.getMyPlayer();
    const myTeam = myP ? myP.team : 'red';
    const chats = this.gameState.teamChats[myTeam] || [];

    container.innerHTML = chats.map(c => `
      <div class="chat-message team-cmd-msg">
        <span class="chat-time">${c.time}</span>
        <strong class="chat-sender">[${c.senderRole}] ${c.senderName}:</strong>
        <span class="chat-content">${c.text}</span>
      </div>
    `).join('');

    container.scrollTop = container.scrollHeight;
  },

  handleChatSubmit() {
    const input = document.getElementById('pvp-team-chat-input');
    if (input && input.value) {
      this.sendTeamChat(input.value);
      input.value = '';
    }
  }
};

window.Dungeon3 = Dungeon3;
