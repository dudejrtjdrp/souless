import SaveSlotManager from '../../utils/SaveSlotManager.js';

export default class JobConditionTracker {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    // 초기화 완료 플래그
    this.isInitialized = false;

    // 조건 추적 데이터
    this.conditions = {
      assassin: {
        type: 'survive_no_hit',
        duration: 15000,
        startTime: null,
        lastHitTime: null,
        isActive: false,
      },
      monk: {
        type: 'survive_no_attack',
        duration: 10000,
        startTime: null,
        lastAttackTime: null,
        isActive: false,
      },
      bladekeeper: {
        type: 'consecutive_hits',
        required: 5,
        current: 0,
        lastHitTime: null,
        comboTimeout: 2000,
        isActive: false,
      },
      fire_knight: {
        type: 'maintain_combat',
        duration: 10000,
        startTime: null,
        lastAttackTime: null,
        combatTimeout: 1500,
        isActive: false,
      },
      mauler: {
        type: 'survive_low_hp',
        duration: 15000,
        hpThreshold: 0.3,
        startTime: null,
        isActive: false,
      },
      princess: {
        type: 'no_damage',
        duration: 20000,
        startTime: null,
        lastDamageTime: null,
        isActive: false,
      },
    };

    // 이미 처치한 보스들만 트래킹 제외 (clearedBosses만 사용)
    this.completedConditions = new Set();

    this.initializeCompletedConditions();
    this.setupEventListeners();
  }

  // 보스를 이미 처치한 것들만 로드 (clearedBosses)
  async initializeCompletedConditions() {
    const saveData = await SaveSlotManager.load();

    // clearedBosses만 확인 (보스 처치 완료)
    // availableBoss는 포함하지 않음 (조건 달성했지만 아직 도전 가능)
    if (saveData.clearedBosses && Array.isArray(saveData.clearedBosses)) {
      saveData.clearedBosses.forEach((job) => this.completedConditions.add(job));
    }

    // 초기화 완료 표시
    this.isInitialized = true;
  }

  setupEventListeners() {
    this.scene.events.on('player-hit', () => this.onPlayerHit());
    this.scene.events.on('player-attack', () => this.onPlayerAttack());
    this.scene.events.on('player-damaged', () => this.onPlayerDamaged());
  }

  update(time) {
    // 초기화가 완료될 때까지 대기
    if (!this.isInitialized) {
      return;
    }

    // 보스를 처치한 조건만 제외
    if (!this.completedConditions.has('assassin')) {
      this.updateAssassinCondition(time);
    }

    if (!this.completedConditions.has('monk')) {
      this.updateMonkCondition(time);
    }

    if (!this.completedConditions.has('bladekeeper')) {
      this.updateBladekeeperCondition(time);
    }

    if (!this.completedConditions.has('fire_knight')) {
      this.updateFireknightCondition(time);
    }

    if (!this.completedConditions.has('mauler')) {
      this.updateMaulerCondition(time);
    }

    if (!this.completedConditions.has('princess')) {
      this.updatePrincessCondition(time);
    }
  }

  // === Assassin 조건 ===
  updateAssassinCondition(time) {
    const cond = this.conditions.assassin;

    if (!cond.isActive) {
      cond.startTime = time;
      cond.isActive = true;
    }

    const elapsed = time - (cond.lastHitTime || cond.startTime);

    if (elapsed >= cond.duration) {
      this.completeCondition('assassin');
    }
  }

  onPlayerHit() {
    const cond = this.conditions.assassin;
    cond.lastHitTime = this.scene.time.now;
    this.conditions.princess.lastDamageTime = this.scene.time.now;
  }

  // === Monk 조건 ===
  updateMonkCondition(time) {
    const cond = this.conditions.monk;

    if (!cond.isActive) {
      cond.startTime = time;
      cond.isActive = true;
    }

    const elapsed = time - (cond.lastAttackTime || cond.startTime);

    if (elapsed >= cond.duration) {
      this.completeCondition('monk');
    }
  }

  onPlayerAttack() {
    const cond = this.conditions.monk;
    cond.lastAttackTime = this.scene.time.now;

    this.updateBladekeeperHit();
    this.updateFireknightAttack();
  }

  // === Bladekeeper 조건 ===
  updateBladekeeperCondition(time) {
    const cond = this.conditions.bladekeeper;

    if (!cond.isActive) {
      cond.isActive = true;
    }

    if (cond.lastHitTime && time - cond.lastHitTime > cond.comboTimeout) {
      cond.current = 0;
    }
  }

  updateBladekeeperHit() {
    const cond = this.conditions.bladekeeper;
    const time = this.scene.time.now;

    if (cond.lastHitTime && time - cond.lastHitTime > cond.comboTimeout) {
      cond.current = 0;
    }

    cond.current++;
    cond.lastHitTime = time;

    if (cond.current >= cond.required) {
      this.completeCondition('bladekeeper');
    }
  }

  // === Fireknight 조건 ===
  updateFireknightCondition(time) {
    const cond = this.conditions.fire_knight;

    if (!cond.isActive || !cond.startTime) return;

    if (cond.lastAttackTime && time - cond.lastAttackTime > cond.combatTimeout) {
      cond.startTime = null;
      cond.isActive = false;
      return;
    }

    const elapsed = time - cond.startTime;

    if (elapsed >= cond.duration) {
      this.completeCondition('fire_knight');
    }
  }

  updateFireknightAttack() {
    const cond = this.conditions.fire_knight;
    const time = this.scene.time.now;

    if (!cond.startTime) {
      cond.startTime = time;
      cond.isActive = true;
    }

    cond.lastAttackTime = time;
  }

  // === Mauler 조건 ===
  updateMaulerCondition(time) {
    const cond = this.conditions.mauler;
    const hpRatio = this.player.health / this.player.maxHealth;

    if (hpRatio <= cond.hpThreshold) {
      if (!cond.isActive) {
        cond.startTime = time;
        cond.isActive = true;
      }

      const elapsed = time - cond.startTime;

      if (elapsed >= cond.duration) {
        this.completeCondition('mauler');
      }
    } else {
      cond.startTime = null;
      cond.isActive = false;
    }
  }

  // === Princess 조건 ===
  updatePrincessCondition(time) {
    const cond = this.conditions.princess;

    if (!cond.isActive) {
      cond.startTime = time;
      cond.isActive = true;
    }

    const elapsed = time - (cond.lastDamageTime || cond.startTime);

    if (elapsed >= cond.duration) {
      this.completeCondition('princess');
    }
  }

  onPlayerDamaged() {
    const cond = this.conditions.princess;
    cond.lastDamageTime = this.scene.time.now;
    this.conditions.assassin.lastHitTime = this.scene.time.now;
  }

  // 조건 완료 처리
  async completeCondition(jobKey) {
    // 이미 완료된 조건이면 무시
    if (this.completedConditions.has(jobKey)) {
      return;
    }

    const cond = this.conditions[jobKey];
    cond.isActive = false;

    // completedConditions에 추가하여 더 이상 트래킹하지 않도록 설정
    this.completedConditions.add(jobKey);

    // availableBoss에 추가 (보스 도전 가능)
    await this.addToAvailableBoss(jobKey);

    // 이벤트 발생
    this.scene.events.emit('job-condition-completed', jobKey);
  }

  async addToAvailableBoss(jobKey) {
    const saveData = await SaveSlotManager.load();

    if (!saveData.availableBoss) {
      saveData.availableBoss = [];
    }

    // 중복 체크 + 순서 유지
    if (!saveData.availableBoss.includes(jobKey)) {
      saveData.availableBoss.push(jobKey);
      await SaveSlotManager.save(saveData);
    }
  }

  // 진행 상황 UI용 데이터 반환
  getProgress() {
    const progress = {};

    for (const [job, cond] of Object.entries(this.conditions)) {
      // 보스를 처치한 조건만 100% 표시
      if (this.completedConditions.has(job)) {
        progress[job] = {
          current: cond.duration || cond.required || 100,
          max: cond.duration || cond.required || 100,
          percentage: 100,
          completed: true,
        };
        continue;
      }

      switch (cond.type) {
        case 'survive_no_hit':
        case 'survive_no_attack':
        case 'no_damage':
          const elapsed =
            this.scene.time.now -
            (cond.lastHitTime || cond.lastAttackTime || cond.lastDamageTime || cond.startTime);
          progress[job] = {
            current: Math.min(elapsed, cond.duration),
            max: cond.duration,
            percentage: Math.min((elapsed / cond.duration) * 100, 100),
            completed: false,
          };
          break;

        case 'consecutive_hits':
          progress[job] = {
            current: cond.current,
            max: cond.required,
            percentage: (cond.current / cond.required) * 100,
            completed: false,
          };
          break;

        case 'maintain_combat':
          if (cond.startTime) {
            const combatElapsed = this.scene.time.now - cond.startTime;
            progress[job] = {
              current: Math.min(combatElapsed, cond.duration),
              max: cond.duration,
              percentage: Math.min((combatElapsed / cond.duration) * 100, 100),
              completed: false,
            };
          } else {
            progress[job] = { current: 0, max: cond.duration, percentage: 0, completed: false };
          }
          break;

        case 'survive_low_hp':
          if (cond.isActive) {
            const surviveElapsed = this.scene.time.now - cond.startTime;
            progress[job] = {
              current: Math.min(surviveElapsed, cond.duration),
              max: cond.duration,
              percentage: Math.min((surviveElapsed / cond.duration) * 100, 100),
              completed: false,
            };
          } else {
            progress[job] = { current: 0, max: cond.duration, percentage: 0, completed: false };
          }
          break;
      }
    }

    return progress;
  }

  destroy() {
    this.scene.events.off('player-hit');
    this.scene.events.off('player-attack');
    this.scene.events.off('player-damaged');
  }
}
