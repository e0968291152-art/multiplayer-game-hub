// Main Application Controller (3 Dungeons Edition)
const App = {
  currentView: 'LOBBY', // 'LOBBY' | 'ROOM' | 'DUNGEON_1' | 'DUNGEON_2' | 'DUNGEON_3'

  init() {
    Network.init();
    RoomManager.init();

    const nameInput = document.getElementById('my-player-name-input');
    if (nameInput) {
      nameInput.value = Network.playerName;
      nameInput.addEventListener('change', () => {
        Network.setPlayerName(nameInput.value);
        this.renderRoomView();
      });
    }

    Network.on('GAME_START_TRIGGERED', ({ roomId }) => {
      const room = RoomManager.rooms[roomId];
      if (room && room.players.some(p => p.id === Network.playerId)) {
        this.enterDungeonGame(room);
      }
    });

    this.showLobby();
  },

  showLobby() {
    this.currentView = 'LOBBY';
    this.hideAllViews();
    const lobbyEl = document.getElementById('view-lobby');
    if (lobbyEl) lobbyEl.style.display = 'block';
    this.renderLobby();
  },

  renderLobby() {
    // Update Dungeon status badges & texts for Dungeon 2 and Dungeon 3
    for (let d = 2; d <= 3; d++) {
      const statusText = RoomManager.getDungeonStatusText(d);
      const textEl = document.getElementById(`dungeon-${d}-status-text`);
      if (textEl) {
        textEl.textContent = statusText;
      }

      const dRooms = Object.values(RoomManager.rooms).filter(r => r.dungeonId === d);
      const recruitingRoom = dRooms.find(r => r.status === 'RECRUITING');
      const actionBtn = document.getElementById(`dungeon-${d}-action-btn`);
      const createNewBtn = document.getElementById(`dungeon-${d}-new-btn`);

      if (actionBtn) {
        if (recruitingRoom) {
          const config = RoomManager.configs[d];
          const isFull = recruitingRoom.players.length >= config.max;
          actionBtn.textContent = isFull ? '隊伍已滿員' : `加入招募中隊伍 (${recruitingRoom.players.length}/${config.max}人)`;
          actionBtn.disabled = isFull;
          actionBtn.onclick = () => this.joinRecruitingRoom(recruitingRoom.id);
        } else {
          actionBtn.textContent = '開啟新副本組隊';
          actionBtn.disabled = false;
          actionBtn.onclick = () => this.openNewRoom(d);
        }
      }

      if (createNewBtn) {
        const hasRunning = dRooms.some(r => r.status === 'RUNNING');
        createNewBtn.style.display = hasRunning ? 'inline-block' : 'none';
        createNewBtn.onclick = () => this.openNewRoom(d);
      }
    }
  },

  startDungeon1() {
    this.currentView = 'DUNGEON_1';
    this.hideAllViews();
    const d1El = document.getElementById('view-dungeon1');
    if (d1El) d1El.style.display = 'block';
    Dungeon1.startNewGame();
  },

  openNewRoom(dungeonId) {
    SoundFX.confirm();
    const room = RoomManager.createRoom(dungeonId);
    this.showRoomView(room.id);
  },

  joinRecruitingRoom(roomId) {
    SoundFX.click();
    const res = RoomManager.joinRoom(roomId);
    if (res.success) {
      this.showRoomView(roomId);
    } else {
      alert(res.message);
      this.renderLobby();
    }
  },

  showRoomView(roomId) {
    RoomManager.currentRoomId = roomId;
    this.currentView = 'ROOM';
    this.hideAllViews();
    const roomEl = document.getElementById('view-room');
    if (roomEl) roomEl.style.display = 'block';
    this.renderRoomView();
  },

  renderRoomView() {
    if (this.currentView !== 'ROOM') return;
    const room = RoomManager.getCurrentRoom();
    if (!room) {
      this.showLobby();
      return;
    }

    const config = RoomManager.configs[room.dungeonId];
    const isHost = room.hostId === Network.playerId;
    const count = room.players.length;
    const canStart = RoomManager.canStartGame(room);
    const isFull = count >= config.max;

    const titleEl = document.getElementById('room-title');
    if (titleEl) {
      titleEl.textContent = `${room.displayName} 招募組隊大廳`;
    }

    const statusEl = document.getElementById('room-capacity-desc');
    if (statusEl) {
      let requirementText = '';
      if (room.dungeonId === 2) requirementText = '【限定人數：8人、9人、10人或12人】';
      else if (room.dungeonId === 3) requirementText = '【限定人數：10人、12人或14人（紅藍對抗）】';

      statusEl.innerHTML = `
        <span class="room-req-tag">${requirementText}</span>
        <span class="room-count-text">目前人數：<strong>${count}</strong> / ${config.max} 人</span>
        ${isFull ? '<span class="room-full-badge">⚠️ 已達人數上限，不可再有玩家進入</span>' : '<span class="room-open-badge">🟢 招募加入中</span>'}
      `;
    }

    const playerListEl = document.getElementById('room-player-grid');
    if (playerListEl) {
      playerListEl.innerHTML = room.players.map(p => `
        <div class="room-player-card ${p.id === Network.playerId ? 'me' : ''}">
          <div class="player-avatar">${p.isBot ? '🤖' : '👤'}</div>
          <div class="player-name">${p.name} ${p.id === Network.playerId ? '（我）' : ''}</div>
          <div class="player-role-badge">${p.isHost ? '👑 開副本隊長' : (p.isBot ? 'AI 測試玩家' : '在線玩家')}</div>
        </div>
      `).join('');
    }

    // Host Start Button
    const startBtnContainer = document.getElementById('room-start-btn-container');
    if (startBtnContainer) {
      if (isHost) {
        if (canStart) {
          startBtnContainer.innerHTML = `
            <button class="btn btn-primary btn-large btn-glow" onclick="App.hostTriggerStart('${room.id}')">
              🚀 滿足隊伍人數條件，進入遊戲！ (隊長啟動獨立副本)
            </button>
            <p class="host-tip">你是開副本隊長，點擊上方按鈕將鎖定隊伍並開啟遊戲！遊戲開啟後為獨立對局，不可中途加入。</p>
          `;
        } else {
          startBtnContainer.innerHTML = `
            <button class="btn btn-secondary btn-large" disabled>
              ⏳ 人數尚未滿足條件 (目前 ${count} 人，需要為：${config.allowed.join('、')} 人)
            </button>
            <p class="host-tip">請等待更多玩家在線加入，或使用下方測試按鈕添加 AI 玩家至指定人數開局。</p>
          `;
        }
      } else {
        startBtnContainer.innerHTML = `
          <div class="member-waiting-box">
            <span class="spinner-icon">🔄</span>
            <span>等待開副本隊長（${room.hostName}）啟動遊戲…</span>
          </div>
        `;
      }
    }

    // Bot Fill Tools
    const botControls = document.getElementById('room-bot-controls');
    if (botControls) {
      botControls.innerHTML = `
        <div class="bot-helper-panel">
          <span class="bot-panel-title">🤖 快速測試輔助工具（單人測試時可一鍵補足精確人數）：</span>
          <div class="bot-btn-group">
            ${config.allowed.map(target => `
              <button class="btn btn-sm btn-outline" onclick="RoomManager.fillBotsTo('${room.id}', ${target})">
                一鍵補至 ${target} 人
              </button>
            `).join('')}
            <button class="btn btn-sm btn-outline" onclick="RoomManager.addBot('${room.id}')" ${isFull ? 'disabled' : ''}>
              ➕ 增補 1 人
            </button>
            <button class="btn btn-sm btn-outline" onclick="RoomManager.removeBot('${room.id}')">
              ➖ 減少 1 人
            </button>
          </div>
        </div>
      `;
    }
  },

  hostTriggerStart(roomId) {
    const res = RoomManager.startGame(roomId);
    if (!res.success) {
      alert(res.message);
    }
  },

  enterDungeonGame(room) {
    this.hideAllViews();

    if (room.dungeonId === 2) {
      this.currentView = 'DUNGEON_2';
      const el = document.getElementById('view-dungeon2');
      if (el) el.style.display = 'block';
      Dungeon2.setup(room);
    } else if (room.dungeonId === 3) {
      this.currentView = 'DUNGEON_3';
      const el = document.getElementById('view-dungeon3');
      if (el) el.style.display = 'block';
      Dungeon3.setup(room);
    }
  },

  leaveCurrentRoom() {
    const room = RoomManager.getCurrentRoom();
    if (room) {
      RoomManager.leaveRoom(room.id);
    }
    this.showLobby();
  },

  hideAllViews() {
    const views = ['view-lobby', 'view-room', 'view-dungeon1', 'view-dungeon2', 'view-dungeon3'];
    views.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.display = 'none';
    });
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  Dungeon1.init();
  Dungeon2.init();
  Dungeon3.init();
  App.init();
});
