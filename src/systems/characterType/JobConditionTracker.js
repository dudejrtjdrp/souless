import SaveSlotManager from '../../utils/SaveSlotManager.js';
// 각 전직 조건을 추적하는 시스템

export default class JobConditionTracker {
  constructor(scene, player) {
    this.scene = scene;
    this.player = player;

    // 조건 추적 데이터
    this.conditions = {
      assassin: {
        type: 'survive_no_hit',
        duration: 15000, // 15초
        startTime: null,
        lastHitTime: null,
        isActive: false,
      },
      monk: {
        type: 'survive_no_attack',
        duration: 10000, // 10초
        startTime: null,
        lastAttackTime: null,
        isActive: false,
      },
      bladekeeper: {
        type: 'consecutive_hits',
        required: 5,
        current: 0,
        lastHitTime: null,
        comboTimeout: 2000, // 2초 안에 다음 공격
        isActive: false,
      },
      fireknight: {
        type: 'maintain_combat',
        duration: 10000, // 10초
        startTime: null,
        lastAttackTime: null,
        combatTimeout: 1500, // 1.5초 안에 공격해야 유지
        isActive: false,
      },
      mauler: {
        type: 'survive_low_hp',
        duration: 15000, // 15초
        hpThreshold: 0.3, // 30% 이하
        startTime: null,
        isActive: false,
      },
      princess: {
        type: 'no_damage',
        duration: 20000, // 20초
        startTime: null,
        lastDamageTime: null,
        isActive: false,
      },
    };

    this.setupEventListeners();
  }

  setupEventListeners() {
    // 플레이어 피격 이벤트
    this.scene.events.on('player-hit', () => {
      this.onPlayerHit();
    });

    // 플레이어 공격 이벤트
    this.scene.events.on('player-attack', () => {
      this.onPlayerAttack();
    });

    // 플레이어 데미지 받음 (트랩 포함)
    this.scene.events.on('player-damaged', () => {
      this.onPlayerDamaged();
    });
  }

  update(time) {
    // Assassin: 피격 없이 15초 생존
    this.updateAssassinCondition(time);

    // Monk: 공격하지 않고 10초 생존
    this.updateMonkCondition(time);

    // Bladekeeper: 기본 공격 5타 연속 적중
    this.updateBladekeeperCondition(time);

    // Fireknight: 10초 동안 전투 유지
    this.updateFireknightCondition(time);

    // Mauler: HP 30% 이하로 15초 생존
    this.updateMaulerCondition(time);

    // Princess: 20초 동안 데미지 0
    this.updatePrincessCondition(time);
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

    // Princess 조건도 리셋
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

    // Bladekeeper 조건 업데이트
    this.updateBladekeeperHit();

    // Fireknight 조건 업데이트
    this.updateFireknightAttack();
  }

  // === Bladekeeper 조건 ===
  updateBladekeeperCondition(time) {
    const cond = this.conditions.bladekeeper;

    if (!cond.isActive) {
      cond.isActive = true;
    }

    // 콤보 타임아웃 체크
    if (cond.lastHitTime && time - cond.lastHitTime > cond.comboTimeout) {
      cond.current = 0;
    }
  }

  updateBladekeeperHit() {
    const cond = this.conditions.bladekeeper;
    const time = this.scene.time.now;

    // 콤보 타임아웃 체크
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
    const cond = this.conditions.fireknight;

    if (!cond.isActive || !cond.startTime) return;

    // 전투가 끊겼는지 체크
    if (cond.lastAttackTime && time - cond.lastAttackTime > cond.combatTimeout) {
      cond.startTime = null;
      cond.isActive = false;
      return;
    }

    const elapsed = time - cond.startTime;

    if (elapsed >= cond.duration) {
      this.completeCondition('fireknight');
    }
  }

  updateFireknightAttack() {
    const cond = this.conditions.fireknight;
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
      // HP가 30% 이상이면 리셋
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

    // Assassin 조건도 리셋
    this.conditions.assassin.lastHitTime = this.scene.time.now;
  }

  // 조건 완료 처리
  async completeCondition(jobKey) {
    const cond = this.conditions[jobKey];
    cond.isActive = false;

    // SaveSlotManager를 통해 availableBoss에 추가
    await this.addToAvailableBoss(jobKey);

    // 이벤트 발생
    this.scene.events.emit('job-condition-completed', jobKey);
  }

  async addToAvailableBoss(jobKey) {
    const saveData = await SaveSlotManager.load();

    if (!saveData.availableBoss) {
      saveData.availableBoss = [];
    }

    // 중복 체크
    if (!saveData.availableBoss.includes(jobKey)) {
      saveData.availableBoss.push(jobKey);
      await SaveSlotManager.save(saveData);
    }
  }

  // 진행 상황 UI용 데이터 반환
  getProgress() {
    const progress = {};

    for (const [job, cond] of Object.entries(this.conditions)) {
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
          };
          break;

        case 'consecutive_hits':
          progress[job] = {
            current: cond.current,
            max: cond.required,
            percentage: (cond.current / cond.required) * 100,
          };
          break;

        case 'maintain_combat':
          if (cond.startTime) {
            const combatElapsed = this.scene.time.now - cond.startTime;
            progress[job] = {
              current: Math.min(combatElapsed, cond.duration),
              max: cond.duration,
              percentage: Math.min((combatElapsed / cond.duration) * 100, 100),
            };
          } else {
            progress[job] = { current: 0, max: cond.duration, percentage: 0 };
          }
          break;

        case 'survive_low_hp':
          if (cond.isActive) {
            const surviveElapsed = this.scene.time.now - cond.startTime;
            progress[job] = {
              current: Math.min(surviveElapsed, cond.duration),
              max: cond.duration,
              percentage: Math.min((surviveElapsed / cond.duration) * 100, 100),
            };
          } else {
            progress[job] = { current: 0, max: cond.duration, percentage: 0 };
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
