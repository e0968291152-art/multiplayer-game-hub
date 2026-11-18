// Room Manager for Multi-Dungeon Platform (3 Dungeons Edition)
// Manages rooms for Dungeon 2 and 3 in shared storage & network

const RoomManager = {
  // Dungeon Configs according to project outline:
  // Dungeon 1: Solo (限1人)
  // Dungeon 2: Werewolf (限8人、9人、10人、12人)
  // Dungeon 3: Faction PvP Battle (限14人、12人、10人)
  configs: {
    1: { id: 1, name: '海龜湯', min: 1, max: 1, allowed: [1], isSolo: true },
    2: { id: 2, name: '狼人殺', min: 8, max: 12, allowed: [8, 9, 10, 12], isSolo: false },
    3: { id: 3, name: '陣營對抗戰', min: 10, max: 14, allowed: [10, 12, 14], isSolo: false }
  },

  rooms: {}, // roomId -> { id, dungeonId, instanceNumber, hostId, hostName, status: 'RECRUITING'|'RUNNING', players: [], createdAt }
  currentRoomId: null,

  init() {
    this.loadFromStorage();

    // Listen for room updates
    Network.on('ROOMS_SYNC', (data) => {
      this.rooms = data.rooms || {};
      this.saveToStorage();
      this.notifyUI();
    });

    Network.on('ROOM_UPDATED', (room) => {
      if (!room || !room.id) return;
      this.rooms[room.id] = room;
      this.saveToStorage();
      this.notifyUI();
    });

    Network.on('ROOM_REMOVED', ({ roomId }) => {
      delete this.rooms[roomId];
      this.saveToStorage();
      this.notifyUI();
    });

    setInterval(() => {
      this.cleanupOldRooms();
    }, 10000);

    // Initial broadcast to sync
    Network.send('REQUEST_ROOMS_SYNC', { requesterId: Network.playerId });
    Network.on('REQUEST_ROOMS_SYNC', () => {
      Network.send('ROOMS_SYNC', { rooms: this.rooms });
    });
  },

  loadFromStorage() {
    try {
      const saved = localStorage.getItem('mp_rooms_state_v2');
      if (saved) {
        this.rooms = JSON.parse(saved);
      }
    } catch(e) {
      this.rooms = {};
    }
  },

  saveToStorage() {
    try {
      localStorage.setItem('mp_rooms_state_v2', JSON.stringify(this.rooms));
    } catch(e) {}
  },

  cleanupOldRooms() {
    const now = Date.now();
    let changed = false;
    for (const rid in this.rooms) {
      const room = this.rooms[rid];
      if (now - room.createdAt > 6 * 3600 * 1000) {
        delete this.rooms[rid];
        changed = true;
      }
    }
    if (changed) {
      this.saveToStorage();
      this.notifyUI();
    }
  },

  // Rule 2 Status Display Requirement:
  // ex：副本二（尚未開啟）or 副本二（正在招募中，目前為__人）or 副本二（目前已有2－1副本進行中，可開啟2－2）
  getDungeonStatusText(dungeonId) {
    if (dungeonId === 1) {
      return "副本一（單人單機・先介紹規則後確認開局）";
    }

    const dRooms = Object.values(this.rooms).filter(r => r.dungeonId === dungeonId);

    if (dRooms.length === 0) {
      return `副本${this.getChineseNum(dungeonId)}（尚未開啟）`;
    }

    // Check if there is an active recruiting room
    const recruitingRoom = dRooms.find(r => r.status === 'RECRUITING');
    if (recruitingRoom) {
      return `副本${this.getChineseNum(dungeonId)}（正在招募中，目前為${recruitingRoom.players.length}人）`;
    }

    // Check running rooms
    const runningRooms = dRooms.filter(r => r.status === 'RUNNING');
    if (runningRooms.length > 0) {
      const highestInstance = Math.max(...dRooms.map(r => r.instanceNumber || 1));
      const nextInstance = highestInstance + 1;
      return `副本${this.getChineseNum(dungeonId)}（目前已有${dungeonId}－${highestInstance}副本進行中，可開啟${dungeonId}－${nextInstance}）`;
    }

    return `副本${this.getChineseNum(dungeonId)}（尚未開啟）`;
  },

  getChineseNum(n) {
    const map = { 1: '一', 2: '二', 3: '三' };
    return map[n] || n;
  },

  // Create a new instance
  createRoom(dungeonId) {
    const dRooms = Object.values(this.rooms).filter(r => r.dungeonId === dungeonId);
    const highestInstance = dRooms.reduce((max, r) => Math.max(max, r.instanceNumber || 1), 0);
    const nextInstance = highestInstance + 1;

    const roomId = `room_${dungeonId}_${nextInstance}_${Date.now().toString(36)}`;
    const newRoom = {
      id: roomId,
      dungeonId,
      instanceNumber: nextInstance,
      displayName: `副本${this.getChineseNum(dungeonId)} #${nextInstance}`,
      hostId: Network.playerId,
      hostName: Network.playerName,
      status: 'RECRUITING',
      players: [
        {
          id: Network.playerId,
          name: Network.playerName,
          isHost: true,
          isBot: false,
          confirmed: false,
          role: null
        }
      ],
      createdAt: Date.now()
    };

    this.rooms[roomId] = newRoom;
    this.currentRoomId = roomId;
    this.saveToStorage();
    Network.broadcastAndSelf('ROOM_UPDATED', newRoom);
    return newRoom;
  },

  joinRoom(roomId) {
    const room = this.rooms[roomId];
    if (!room) return { success: false, message: '房間不存在' };

    if (room.status !== 'RECRUITING') {
      return { success: false, message: '此副本已開始進行，為獨立遊戲不可中途加入，僅能開啟新副本！' };
    }

    const config = this.configs[room.dungeonId];
    if (room.players.length >= config.max) {
      return { success: false, message: '人數已達到上限，不可再有玩家進入！' };
    }

    const existing = room.players.find(p => p.id === Network.playerId);
    if (!existing) {
      room.players.push({
        id: Network.playerId,
        name: Network.playerName,
        isHost: false,
        isBot: false,
        confirmed: false,
        role: null
      });
    }

    this.currentRoomId = roomId;
    this.saveToStorage();
    Network.broadcastAndSelf('ROOM_UPDATED', room);
    return { success: true, room };
  },

  leaveRoom(roomId) {
    const room = this.rooms[roomId];
    if (!room) return;

    room.players = room.players.filter(p => p.id !== Network.playerId);

    if (room.players.length === 0) {
      delete this.rooms[roomId];
      this.saveToStorage();
      Network.broadcastAndSelf('ROOM_REMOVED', { roomId });
    } else {
      if (room.hostId === Network.playerId) {
        const nextHost = room.players.find(p => !p.isBot) || room.players[0];
        room.hostId = nextHost.id;
        room.hostName = nextHost.name;
        nextHost.isHost = true;
      }
      this.saveToStorage();
      Network.broadcastAndSelf('ROOM_UPDATED', room);
    }

    if (this.currentRoomId === roomId) {
      this.currentRoomId = null;
    }
  },

  // Add Bot players for rapid testing
  addBot(roomId) {
    const room = this.rooms[roomId];
    if (!room || room.status !== 'RECRUITING') return;
    const config = this.configs[room.dungeonId];
    if (room.players.length >= config.max) return;

    const botNames = [
      '戰術AI-斯蓋爾', '智能輔助-塞恩特', '鋼鐵打手-阿爾法', '虛擬探員-貝塔',
      '矩陣先鋒-伽瑪', '暗夜狼行者', '星際預言家', '神聖守護者',
      '奧術女巫', '百步獵手', '鐵骨白癡', '皇家騎士', '深淵狼王', '終端捍衛者'
    ];
    const botIndex = room.players.length;
    const botName = botNames[botIndex % botNames.length] + `[Bot]`;

    room.players.push({
      id: 'bot_' + Math.random().toString(36).substring(2, 9),
      name: botName,
      isHost: false,
      isBot: true,
      confirmed: true,
      role: null
    });

    this.saveToStorage();
    Network.broadcastAndSelf('ROOM_UPDATED', room);
  },

  removeBot(roomId) {
    const room = this.rooms[roomId];
    if (!room || room.status !== 'RECRUITING') return;
    const lastBotIdx = [...room.players].reverse().findIndex(p => p.isBot);
    if (lastBotIdx !== -1) {
      const realIdx = room.players.length - 1 - lastBotIdx;
      room.players.splice(realIdx, 1);
      this.saveToStorage();
      Network.broadcastAndSelf('ROOM_UPDATED', room);
    }
  },

  fillBotsTo(roomId, targetCount) {
    const room = this.rooms[roomId];
    if (!room || room.status !== 'RECRUITING') return;
    const config = this.configs[room.dungeonId];
    const limit = Math.min(targetCount, config.max);

    while (room.players.length < limit) {
      this.addBot(roomId);
    }
  },

  // Check if Start Button can be shown to host
  // "若正在組隊的隊伍人數已超過人數下限或是滿足隊伍人數則出現進入遊戲按鈕，由開副本的人決定是否進入遊戲"
  canStartGame(room) {
    if (!room) return false;
    const count = room.players.length;
    const config = this.configs[room.dungeonId];

    if (config.isSolo) return true;

    // Both Dungeon 2 and Dungeon 3 have strict allowed player lists:
    // Dungeon 2: [8, 9, 10, 12]
    // Dungeon 3: [10, 12, 14]
    if (config.allowed) {
      return config.allowed.includes(count);
    }

    return count >= config.min && count <= config.max;
  },

  // Host starts the game instance
  startGame(roomId) {
    const room = this.rooms[roomId];
    if (!room) return { success: false, message: '房間不存在' };

    if (room.hostId !== Network.playerId) {
      return { success: false, message: '只有開副本的隊長才能啟動遊戲！' };
    }

    if (!this.canStartGame(room)) {
      const config = this.configs[room.dungeonId];
      return { success: false, message: `目前人數（${room.players.length}人）未滿足人數要求！要求人數為：【${config.allowed.join('人、')}人】` };
    }

    // Switch to RUNNING (Independent game, no mid-game joins allowed)
    room.status = 'RUNNING';
    room.startedAt = Date.now();

    this.saveToStorage();
    Network.broadcastAndSelf('ROOM_UPDATED', room);
    Network.broadcastAndSelf('GAME_START_TRIGGERED', { roomId });

    return { success: true, room };
  },

  getCurrentRoom() {
    return this.currentRoomId ? this.rooms[this.currentRoomId] : null;
  },

  notifyUI() {
    if (window.App && typeof window.App.renderLobby === 'function') {
      window.App.renderLobby();
    }
    if (window.App && typeof window.App.renderRoomView === 'function') {
      window.App.renderRoomView();
    }
  }
};

window.RoomManager = RoomManager;
