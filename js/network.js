// Network & Real-Time Sync Engine (Firebase Realtime Database + BroadcastChannel + LocalStorage)
const Network = {
  channel: null,
  playerId: null,
  playerName: null,
  listeners: {},
  firebaseApp: null,
  db: null,
  isOnlineFirebase: false,

  init() {
    let storedId = sessionStorage.getItem('mp_player_id');
    let storedName = sessionStorage.getItem('mp_player_name');

    if (!storedId) {
      storedId = 'player_' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('mp_player_id', storedId);
    }
    if (!storedName) {
      const names = ['夜行獵手', '銀翼戰將', '幻影術士', '深藍星辰', '赤焰劍神', '破曉之光', '暴風騎士', '黑桃王牌', '暗夜幽靈', '天際遊俠'];
      storedName = names[Math.floor(Math.random() * names.length)] + '_' + Math.floor(100 + Math.random() * 900);
      sessionStorage.setItem('mp_player_name', storedName);
    }

    this.playerId = storedId;
    this.playerName = storedName;

    // 1. Try Firebase Realtime Database
    this.initFirebase();

    // 2. Setup BroadcastChannel for local cross-tab sync
    try {
      this.channel = new BroadcastChannel('multiplayer_game_network_bus');
      this.channel.onmessage = (event) => {
        const { action, payload, senderId } = event.data || {};
        if (senderId !== this.playerId) {
          this.dispatch(action, payload, senderId);
        }
      };
    } catch (e) {
      console.warn("BroadcastChannel not supported, falling back to storage events", e);
    }

    // 3. LocalStorage fallback
    window.addEventListener('storage', (e) => {
      if (e.key === 'mp_network_event' && e.newValue) {
        try {
          const data = JSON.parse(e.newValue);
          if (data.senderId !== this.playerId) {
            this.dispatch(data.action, data.payload, data.senderId);
          }
        } catch(err){}
      }
    });

    console.log(`[Network] Initialized as ${this.playerName} (${this.playerId}) - Mode: ${this.isOnlineFirebase ? 'Firebase Realtime Cloud' : 'Local Broadcast'}`);
  },

  initFirebase() {
    try {
      if (window.firebase && window.firebaseConfig && window.firebaseConfig.apiKey && window.firebaseConfig.databaseURL) {
        if (!firebase.apps.length) {
          this.firebaseApp = firebase.initializeApp(window.firebaseConfig);
        } else {
          this.firebaseApp = firebase.app();
        }
        this.db = firebase.database();
        this.isOnlineFirebase = true;

        // Listen for global game events from cloud
        const eventsRef = this.db.ref('game_events');
        eventsRef.limitToLast(1).on('child_added', (snapshot) => {
          const data = snapshot.val();
          if (data && data.senderId !== this.playerId && (Date.now() - data.timestamp < 10000)) {
            this.dispatch(data.action, data.payload, data.senderId);
          }
        });

        // Listen for room updates
        const roomsRef = this.db.ref('game_rooms');
        roomsRef.on('value', (snapshot) => {
          const cloudRooms = snapshot.val();
          if (cloudRooms && window.RoomManager) {
            window.RoomManager.rooms = cloudRooms;
            window.RoomManager.notifyUI();
          }
        });

        console.log("☁️ Firebase Realtime Database connected successfully!");
      }
    } catch (e) {
      console.warn("Firebase init skipped or failed:", e);
      this.isOnlineFirebase = false;
    }
  },

  setPlayerName(newName) {
    if (newName && newName.trim()) {
      this.playerName = newName.trim();
      sessionStorage.setItem('mp_player_name', this.playerName);
      this.send('PLAYER_NAME_CHANGED', { playerId: this.playerId, newName: this.playerName });
    }
  },

  send(action, payload = {}) {
    const packet = {
      action,
      payload,
      senderId: this.playerId,
      senderName: this.playerName,
      timestamp: Date.now()
    };

    // Broadcast locally across tabs
    if (this.channel) {
      this.channel.postMessage(packet);
    }

    try {
      localStorage.setItem('mp_network_event', JSON.stringify({ ...packet, _ts: Math.random() }));
    } catch(e){}

    // If Firebase DB is connected, push to cloud
    if (this.isOnlineFirebase && this.db) {
      try {
        const newEventRef = this.db.ref('game_events').push();
        newEventRef.set(packet);
        // Also sync rooms if action relates to room update
        if (action === 'ROOM_UPDATED' || action === 'ROOM_REMOVED' || action === 'ROOMS_SYNC') {
          if (window.RoomManager && window.RoomManager.rooms) {
            this.db.ref('game_rooms').set(window.RoomManager.rooms);
          }
        }
      } catch (err) {
        console.warn("Cloud push error:", err);
      }
    }
  },

  broadcastAndSelf(action, payload = {}) {
    this.send(action, payload);
    this.dispatch(action, payload, this.playerId);
  },

  on(action, handler) {
    if (!this.listeners[action]) {
      this.listeners[action] = [];
    }
    this.listeners[action].push(handler);
  },

  off(action, handler) {
    if (!this.listeners[action]) return;
    this.listeners[action] = this.listeners[action].filter(h => h !== handler);
  },

  dispatch(action, payload, senderId) {
    if (this.listeners[action]) {
      this.listeners[action].forEach(handler => {
        try {
          handler(payload, senderId);
        } catch (e) {
          console.error(`Error in listener for ${action}:`, e);
        }
      });
    }
  }
};

window.Network = Network;
