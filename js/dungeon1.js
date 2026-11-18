// Dungeon 1: 海龜湯 (Turtle Soup - Lateral Thinking Mystery)
// Single-player (限1人). Rule introduction with animation & confirmation.
// Computer acts as Questioner/Responder, answering strictly with:
// 「是（對）」、「不是（不對）」、「沒有關係（無關）」
// Phased story reveal, side help button with 3 hints.

const Dungeon1 = {
  stories: [
    {
      id: 'turtle_soup',
      title: '《海龜湯的真相》',
      category: '經典懸疑・感人悲劇',
      surface: '一名男子走進海邊一家餐館，點了一碗海龜湯。他喝了一口後，神色大變，詢問服務員這是否真的是海龜肉。得到確認後，他默默走出餐館，不久後投海自盡。',
      totalSections: 3,
      hints: [
        '提示 1：男子過去曾遭遇過一場海難，並在荒島上與好友及妻子掙扎求生。',
        '提示 2：在荒島上時，他重病雙目失明，全靠好友每天餵他喝一種特製「肉湯」活了下來。',
        '提示 3：好友當時告訴他那是抓到的海龜熬的湯，但這座荒島根本沒有海龜……'
      ],
      // Question evaluation dataset for Computer Responder
      knowledgeBase: {
        affirmative: ['海難', '荒島', '不是海龜', '味道不同', '不一樣', '妻子', '人肉', '吃了妻子', '好友', '失明', '生病', '自責', '贖罪', '自殺', '隱瞞', '犧牲'],
        negative: ['有毒', '謀殺', '難喝', '過期', '服務生害他', '遇到仇人', '沒錢付帳', '精神失常', '幻覺', '外星人', '穿越'],
        irrelevant: ['天氣', '衣服顏色', '餐館名字', '廚師年齡', '湯的溫度', '筷子', '盤子', '幾點鐘', '星期幾']
      },
      sections: [
        {
          id: 1,
          sectionTitle: '第一小節：荒難往事與味覺衝擊',
          question: '核心問題：男子喝下這碗湯後，為何強烈懷疑這並非真正的海龜？他在回憶什麼？',
          breakthroughKeywords: ['海難', '荒島', '味道', '不一樣', '不同', '生病', '失明', '以前喝過'],
          revealedStory: '【劇情碎片解鎖 1/3】：幾年前，男子與妻子及摯友遭遇海難，漂流至荒島。男子因重傷高燒失明。飢寒交迫之際，好友端來一碗滾燙的肉湯，告訴他：「島上捉到了海龜，喝了湯你才能活下去。」',
          presetQuestions: [
            { q: '這碗湯裡面有毒嗎？', ans: '不是（不對）', type: 'no' },
            { q: '男子以前是不是在荒島上遭遇過海難？', ans: '是（對）', type: 'yes', isKey: true },
            { q: '今天餐館的海龜湯味道和他記憶中的一樣嗎？', ans: '不是（不對）', type: 'no', isKey: true },
            { q: '服務員的態度和男子的自盡有關係嗎？', ans: '沒有關係（無關）', type: 'irr' }
          ]
        },
        {
          id: 2,
          sectionTitle: '第二小節：消失的同行妻子',
          question: '核心問題：當年荒島上海難生還者究竟有幾人？他的妻子最後去了哪裡？',
          breakthroughKeywords: ['妻子', '死了', '人肉', '吃了', '犧牲', '好友', '肉', '屍體'],
          revealedStory: '【劇情碎片解鎖 2/3】：在男子喝下肉湯身體好轉後，他問起妻子。好友痛苦地告訴他妻子傷重不治已海葬。隨後搜救隊抵達，男子與好友獲救。但他從未親眼見過妻子的遺體。',
          presetQuestions: [
            { q: '島上真的抓得到野生海龜嗎？', ans: '不是（不對）', type: 'no', isKey: true },
            { q: '男子的妻子在獲救前就已經過世了嗎？', ans: '是（對）', type: 'yes', isKey: true },
            { q: '好友是在故意謀害男子的妻子嗎？', ans: '不是（不對）', type: 'no' },
            { q: '搜救隊的船隻大小與案件有關嗎？', ans: '沒有關係（無關）', type: 'irr' }
          ]
        },
        {
          id: 3,
          sectionTitle: '第三小節：殘酷的終極真相',
          question: '核心問題：在餐館確認了真正海龜的味道後，男子突然意識到了什麼殘酷事實？',
          breakthroughKeywords: ['妻子', '人肉', '吃了妻子', '是妻子的肉', '不是海龜', '自殺贖罪'],
          revealedStory: '【全線劇情還原】：在餐館喝到真正海龜湯的瞬間，男子發現真正的海龜根本不是那種味道！他瞬間崩潰明白——當年荒島上好友餵給他喝的，根本不是海龜肉，而是他摯愛妻子的肉！好友為了讓他活命，忍痛隱瞞了真相。得知自己竟然吃了妻子才苟活至今，男子在無盡自責中投海自盡，追隨妻子而去。',
          presetQuestions: [
            { q: '男子在荒島上喝的肉湯其實是人肉嗎？', ans: '是（對）', type: 'yes', isKey: true },
            { q: '那碗肉湯是來自他病逝的妻子嗎？', ans: '是（對）', type: 'yes', isKey: true },
            { q: '男子自殺是因為無法承受吃了妻子的罪惡感嗎？', ans: '是（對）', type: 'yes', isKey: true },
            { q: '這家餐館的裝潢風格與他的死因有關嗎？', ans: '沒有關係（無關）', type: 'irr' }
          ]
        }
      ]
    },
    {
      id: 'half_match',
      title: '《半根火柴》',
      category: '極限逃生・殘酷抉擇',
      surface: '廣袤無垠的沙漠中央，發現了一具全身赤裸的男性屍體。他的手裡緊緊攥著半根被折斷的火柴。周圍沒有車印或搏鬥痕跡，只有他墜落砸出的沙坑。',
      totalSections: 3,
      hints: [
        '提示 1：他不是在地面遇害的，他是從高空某種飛行載具墜落的。',
        '提示 2：他是主動脫光衣服並跳下來的，目的是為了減輕載具重量救大家。',
        '提示 3：半根折斷的火柴是抽籤的道具，抽中短籤的人必須……'
      ],
      knowledgeBase: {
        affirmative: ['熱氣球', '飛機', '掉下來', '墜落', '高空', '天上', '減重', '太重', '拋棄', '衣服', '抽籤', '短籤', '犧牲', '跳下去', '折斷'],
        negative: ['被謀殺', '搶劫', '被蛇咬', '渴死', '曬死', '自殺殉情', '外星人', '流沙'],
        irrelevant: ['天氣溫度', '沙漠名字', '死者年齡', '火柴品牌', '衣服顏色']
      },
      sections: [
        {
          id: 1,
          sectionTitle: '第一小節：從天而降的死者',
          question: '核心問題：男子為何全身粉碎性骨折出現在沙漠中央？他是搭乘什麼抵達的？',
          breakthroughKeywords: ['熱氣球', '飛機', '掉下來', '墜落', '高空', '天上下來'],
          revealedStory: '【劇情碎片解鎖 1/3】：男子與數名同伴搭乘熱氣球穿越沙漠，途中突遭強烈氣流導致氣囊破損漏氣，熱氣球急劇向地面墜落！',
          presetQuestions: [
            { q: '男子是從天上掉下來的嗎？', ans: '是（對）', type: 'yes', isKey: true },
            { q: '男子乘坐的交通工具是熱氣球嗎？', ans: '是（對）', type: 'yes', isKey: true },
            { q: '當時地面上有其他人在追殺他嗎？', ans: '不是（不對）', type: 'no' },
            { q: '沙漠中的沙子顏色有特殊關係嗎？', ans: '沒有關係（無關）', type: 'irr' }
          ]
        },
        {
          id: 2,
          sectionTitle: '第二小節：赤裸的減重行動',
          question: '核心問題：男子的屍體為何赤身裸體？衣服去哪了？',
          breakthroughKeywords: ['扔掉', '減重', '減輕重量', '丟棄', '太重', '脫光'],
          revealedStory: '【劇情碎片解鎖 2/3】：熱氣球急速墜向地面，乘客們扔掉了沙袋、食物、水，甚至把身上的衣服全部脫光扔出吊籃以求減輕重量，但熱氣球依然止不住下墜！',
          presetQuestions: [
            { q: '脫光衣服是為了減輕熱氣球的重量嗎？', ans: '是（對）', type: 'yes', isKey: true },
            { q: '衣服是被強風吹走的嗎？', ans: '不是（不對）', type: 'no' },
            { q: '吊籃裡的行李和物資都被扔掉了嗎？', ans: '是（對）', type: 'yes' },
            { q: '男子的手錶品牌有關聯嗎？', ans: '沒有關係（無關）', type: 'irr' }
          ]
        },
        {
          id: 3,
          sectionTitle: '第三小節：半根火柴的死籤',
          question: '核心問題：他手中緊握的半根折斷火柴，究竟代表了什麼？',
          breakthroughKeywords: ['抽籤', '短籤', '犧牲', '跳下去', '折斷火柴', '換取生還'],
          revealedStory: '【全線劇情還原】：物資拋光後熱氣球仍將墜毀，唯一的生路就是跳下去一個人！眾人折斷一根火柴握在掌心抽籤，約定抽中半根短火柴的人必須跳下吊籃犧牲。男子不幸抽中短籤，他從容縱身躍下，用自己的生命換取了同伴們的安全著陸。',
          presetQuestions: [
            { q: '半根折斷的火柴是抽籤用的籤嗎？', ans: '是（對）', type: 'yes', isKey: true },
            { q: '抽到短火柴的人必須跳下熱氣球犧牲自己嗎？', ans: '是（對）', type: 'yes', isKey: true },
            { q: '其他同伴最後成功生還了嗎？', ans: '是（對）', type: 'yes' },
            { q: '火柴盒的存放位置有特殊含義嗎？', ans: '沒有關係（無關）', type: 'irr' }
          ]
        }
      ]
    }
  ],

  currentStory: null,
  currentSectionIndex: 0,
  hintsLeft: 3,
  hintsUsed: [],
  logs: [],
  hasConfirmedRules: false,

  init() {
    this.reset();
  },

  reset() {
    const randIdx = Math.floor(Math.random() * this.stories.length);
    this.currentStory = JSON.parse(JSON.stringify(this.stories[randIdx]));
    this.currentSectionIndex = 0;
    this.hintsLeft = 3;
    this.hintsUsed = [];
    this.logs = [];
    this.hasConfirmedRules = false;
  },

  startNewGame() {
    this.reset();
    this.render();
  },

  confirmRulesAndPlay() {
    SoundFX.confirm();
    this.hasConfirmedRules = true;
    SoundFX.start();
    this.render();
  },

  getCurrentSection() {
    if (!this.currentStory) return null;
    return this.currentStory.sections[this.currentSectionIndex];
  },

  // Player asks a question to the Computer Questioner
  askQuestion(questionText) {
    if (!questionText || !questionText.trim()) return;
    const cleanQ = questionText.trim();
    const section = this.getCurrentSection();
    if (!section) return;

    SoundFX.click();

    // Computer acts as Questioner/Responder, responding strictly with:
    // 「是（對）」、「不是（不對）」、「沒有關係（無關）」
    let answerText = '沒有關係（無關）';
    let isBreakthrough = false;

    // Check if it matches presets
    const matchedPreset = section.presetQuestions.find(p => p.q === cleanQ || cleanQ.includes(p.q.substring(0, 5)));
    if (matchedPreset) {
      answerText = matchedPreset.ans;
      if (matchedPreset.isKey) isBreakthrough = true;
    } else {
      // Natural language evaluation against story knowledgebase
      const kb = this.currentStory.knowledgeBase;
      const lowerQ = cleanQ.toLowerCase();

      const isAffirmative = kb.affirmative.some(k => lowerQ.includes(k.toLowerCase()));
      const isNegative = kb.negative.some(k => lowerQ.includes(k.toLowerCase()));
      const isKey = section.breakthroughKeywords.some(k => lowerQ.includes(k.toLowerCase()));

      if (isKey || isAffirmative) {
        answerText = '是（對）';
        if (isKey) isBreakthrough = true;
      } else if (isNegative) {
        answerText = '不是（不對）';
      } else {
        answerText = '沒有關係（無關）';
      }
    }

    this.logs.unshift({
      question: cleanQ,
      answer: answerText,
      isBreakthrough,
      time: new Date().toLocaleTimeString()
    });

    if (isBreakthrough) {
      SoundFX.success();
      setTimeout(() => {
        this.advanceSection();
      }, 700);
    } else {
      this.render();
    }
  },

  advanceSection() {
    this.currentSectionIndex++;
    if (this.currentSectionIndex >= this.currentStory.sections.length) {
      SoundFX.confirm();
    }
    this.render();
  },

  useHint() {
    if (this.hintsLeft <= 0) {
      alert("三次求助提示已全部用完！請運用智慧繼續推理。");
      SoundFX.error();
      return;
    }

    const hintIdx = 3 - this.hintsLeft;
    const hintText = this.currentStory.hints[hintIdx] || '提示：多關注反常的細節。';
    this.hintsLeft--;
    this.hintsUsed.push(hintText);
    SoundFX.hint();

    this.logs.unshift({
      question: `【使用求助按鍵第 ${3 - this.hintsLeft} 次】`,
      answer: `電腦提示：${hintText}`,
      isHint: true,
      time: new Date().toLocaleTimeString()
    });

    this.render();
  },

  render() {
    const container = document.getElementById('dungeon1-container');
    if (!container) return;

    if (!this.hasConfirmedRules) {
      this.renderRuleIntro(container);
    } else {
      this.renderGamePlay(container);
    }
  },

  // Rule intro screen with animation & confirm button as requested
  renderRuleIntro(container) {
    container.innerHTML = `
      <div class="card rule-animated-card intro-slide-down">
        <div class="rule-header">
          <div class="animated-icon-bounce">🐢</div>
          <h2>【副本一：海龜湯】遊戲規則說明</h2>
          <p class="rule-subtitle">本副本為限 1 人個人單機推理遊戲，出題者由電腦擔當。</p>
        </div>

        <div class="animated-rule-box">
          <div class="rule-bubble-item">
            <span class="bubble-num">1</span>
            <div>
              <strong>出題者出題與提問規則：</strong>
              <p>由電腦出題者提出一個難以理解的事件（表面謎團），猜題者可以提出任何問題以試圖縮小範圍並找出事件背後真正的原因。</p>
            </div>
          </div>

          <div class="rule-bubble-item">
            <span class="bubble-num">2</span>
            <div>
              <strong>出題者限定回答規範：</strong>
              <p>電腦出題者僅能以<strong class="highlight-rule">「是（對）」</strong>、<strong class="highlight-rule">「不是（不對）」</strong>或<strong class="highlight-rule">「沒有關係（無關）」</strong>來回答玩家提出的問題。</p>
            </div>
          </div>

          <div class="rule-bubble-item">
            <span class="bubble-num">3</span>
            <div>
              <strong>分小節還原故事線與求助機會：</strong>
              <p>每推理完一小節就播放下一段劇情片段直至還原所有故事線。旁邊設有求助按鍵，遇到瓶頸時可拿取提示，總共 <strong>3 次求助機會</strong>！</p>
            </div>
          </div>
        </div>

        <div class="confirm-btn-area">
          <button class="btn btn-primary btn-large btn-glow" onclick="Dungeon1.confirmRulesAndPlay()">
            👉 我已詳細閱讀並了解海龜湯規則，按下確認鍵進入遊戲
          </button>
        </div>
      </div>
    `;
  },

  renderGamePlay(container) {
    const story = this.currentStory;
    const isFinished = this.currentSectionIndex >= story.sections.length;
    const currentSection = this.getCurrentSection();
    const progressPercent = Math.round((this.currentSectionIndex / story.sections.length) * 100);

    let html = `
      <div class="dungeon-header-bar">
        <div class="dungeon-title-group">
          <span class="badge badge-solo">限1人・單機海龜湯</span>
          <h2>副本一：海龜湯推理室</h2>
          <span class="story-tag">${story.title} (${story.category})</span>
        </div>
        <div class="dungeon-header-actions">
          <button class="btn btn-secondary" onclick="Dungeon1.startNewGame()">換一題海龜湯</button>
          <button class="btn btn-warning hint-btn" onclick="Dungeon1.useHint()" ${this.hintsLeft <= 0 || isFinished ? 'disabled' : ''}>
            💡 求助提示 (剩餘 ${this.hintsLeft} 次)
          </button>
          <button class="btn btn-outline" onclick="App.showLobby()">返回大廳</button>
        </div>
      </div>

      <div class="dungeon-body-grid">
        <div class="soup-main-column">
          <!-- Starting Snippet Presentation with animation -->
          <div class="card soup-surface-card fade-in-up">
            <div class="card-header highlight">
              <span class="icon">📜</span>
              <h3>初始劇情片段（表面謎團・由電腦出題者播放）</h3>
            </div>
            <div class="surface-content">
              <p class="surface-text">${story.surface}</p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="progress-box">
            <div class="progress-label">
              <span>故事線完整還原進度</span>
              <span class="progress-text">${this.currentSectionIndex} / ${story.sections.length} 小節 (${progressPercent}%)</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${progressPercent}%;"></div>
            </div>
          </div>

          <!-- Unfolded Storyline Sections -->
          <div class="card revealed-story-card">
            <div class="card-header">
              <span class="icon">🔍</span>
              <h3>已還原故事線片段</h3>
            </div>
            <div class="revealed-list">
    `;

    for (let i = 0; i < this.currentSectionIndex; i++) {
      html += `
        <div class="revealed-item unlocked fade-in-up">
          <div class="revealed-badge">第 ${i + 1} 節已還原</div>
          <div class="revealed-text">${story.sections[i].revealedStory}</div>
        </div>
      `;
    }

    if (this.currentSectionIndex === 0) {
      html += `<div class="empty-state">尚未推理出故事線碎片，請展開第一小節的發問與探索……</div>`;
    }

    html += `
            </div>
          </div>
    `;

    if (!isFinished && currentSection) {
      html += `
          <!-- Active Section Deduction Area -->
          <div class="card deduction-active-card fade-in-up">
            <div class="card-header highlight">
              <span class="icon">🧩</span>
              <h3>正在推理：${currentSection.sectionTitle}</h3>
            </div>
            <div class="deduction-body">
              <p class="section-question">${currentSection.question}</p>

              <!-- Computer Responder Rule Prompt -->
              <div class="responder-note">
                🤖 <strong>電腦出題者回答規則：</strong>僅能回答「是（對）」、「不是（不對）」或「沒有關係（無關）」。
              </div>

              <!-- Quick Presets -->
              <div class="interactive-clues-section">
                <span class="section-sublabel">常用提問方向（點擊向電腦發問）：</span>
                <div class="clue-btn-group">
                  ${currentSection.presetQuestions.map(p => `
                    <button class="clue-choice-btn" onclick="Dungeon1.askQuestion('${p.q.replace(/'/g, "\\'")}')">
                      ❓ ${p.q}
                    </button>
                  `).join('')}
                </div>
              </div>

              <!-- Free text input question -->
              <div class="reasoning-input-box">
                <label>自己輸入任何問題向電腦提問（或輸入你的推理結論）：</label>
                <div class="input-with-button">
                  <input type="text" id="soup-ask-input" placeholder="例如輸入：他是盲人嗎？／這碗湯味道不對嗎？／他吃了妻子嗎？" onkeydown="if(event.key==='Enter') Dungeon1.handleInputSubmit()" />
                  <button class="btn btn-primary" onclick="Dungeon1.handleInputSubmit()">向電腦發問</button>
                </div>
              </div>
            </div>
          </div>
      `;
    } else {
      // Victory Screen
      html += `
          <div class="card victory-card fade-in-up">
            <div class="victory-header">
              <div class="trophy-icon">🏆</div>
              <h2>恭喜！全線故事真相已徹底還原！</h2>
              <p>你透過嚴密的邏輯推理與提問，成功還原了整個海龜湯故事背後的真相！</p>
            </div>
            <div class="victory-actions">
              <button class="btn btn-primary btn-large" onclick="Dungeon1.startNewGame()">再來一題海龜湯</button>
              <button class="btn btn-outline btn-large" onclick="App.showLobby()">返回大廳</button>
            </div>
          </div>
      `;
    }

    html += `
        </div>

        <!-- Right Side: Hints & Computer Question-Answer Logs -->
        <div class="soup-side-column">
          <div class="card side-hints-card">
            <div class="card-header">
              <span class="icon">💡</span>
              <h3>求助提示記錄 (${this.hintsUsed.length}/3)</h3>
            </div>
            <div class="hints-list">
              ${this.hintsUsed.length === 0 ? '<div class="empty-state">尚未消耗求助提示</div>' : ''}
              ${this.hintsUsed.map((h, i) => `
                <div class="hint-item">
                  <span class="hint-tag">第 ${i+1} 次提示</span>
                  <p>${h}</p>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card side-logs-card">
            <div class="card-header">
              <span class="icon">🤖</span>
              <h3>電腦出題者回答記錄</h3>
            </div>
            <div class="logs-list">
              ${this.logs.length === 0 ? '<div class="empty-state">提出問題後，電腦出題者的回答將記錄在此</div>' : ''}
              ${this.logs.map(log => `
                <div class="log-item ${log.isBreakthrough ? 'success' : (log.isHint ? 'hint' : '')}">
                  <div class="log-time">${log.time}</div>
                  <div class="log-question"><strong>問：</strong>${log.question}</div>
                  <div class="log-answer ${log.answer.includes('是') ? 'ans-yes' : (log.answer.includes('不是') ? 'ans-no' : 'ans-irr')}">
                    <strong>電腦答：</strong>${log.answer}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  handleInputSubmit() {
    const inputEl = document.getElementById('soup-ask-input');
    if (inputEl) {
      const val = inputEl.value;
      inputEl.value = '';
      this.askQuestion(val);
    }
  }
};

window.Dungeon1 = Dungeon1;
