/**
 * ICE REALM ADVENTURE - Rubah & Penjaga Es
 * Adventure Platformer Game Engine (HTML5 Canvas + Web Audio API)
 * Built with pure JavaScript, zero external runtime dependencies.
 */

'use strict';

/* ==========================================================================
   1. SOUND & AUDIO SYNTHESIZER (WEB AUDIO API)
   ========================================================================== */
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.isBgmPlaying = false;
    this.bgmTimer = null;
  }

  init() {
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      // Audio fallback
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    if (this.muted) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return !this.muted;
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2, endFreq = null) {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      if (endFreq !== null) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), now + duration);
      }

      gain.gain.setValueAtTime(gainVal, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {}
  }

  jump() {
    this.playTone(260, 'sine', 0.18, 0.22, 620);
  }

  doubleJump() {
    this.playTone(420, 'triangle', 0.22, 0.25, 880);
  }

  fireball() {
    if (this.muted || !this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.18);
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = buffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(180, now + 0.18);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

      whiteNoise.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      whiteNoise.start(now);
    } catch (e) {}
  }

  crystal() {
    if (this.muted || !this.ctx) return;
    [1046, 1318, 1568].forEach((f, idx) => {
      setTimeout(() => {
        this.playTone(f, 'sine', 0.25, 0.18, f * 1.2);
      }, idx * 45);
    });
  }

  hit() {
    this.playTone(180, 'sawtooth', 0.16, 0.28, 60);
  }

  enemyDeath() {
    this.playTone(140, 'triangle', 0.25, 0.3, 40);
  }

  bossRoar() {
    if (this.muted || !this.ctx) return;
    this.playTone(110, 'sawtooth', 0.6, 0.35, 45);
    setTimeout(() => this.playTone(90, 'sawtooth', 0.7, 0.4, 35), 150);
  }

  bossPunch() {
    this.playTone(80, 'square', 0.3, 0.35, 30);
  }

  quizSuccess() {
    if (this.muted || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.3, 0.25), i * 90);
    });
  }

  quizWrong() {
    this.playTone(160, 'sawtooth', 0.35, 0.22, 110);
  }

  startBGM() {
    if (this.isBgmPlaying || this.muted) return;
    this.isBgmPlaying = true;
    const frostScale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
    let step = 0;

    const playFrostArp = () => {
      if (!this.isBgmPlaying || this.muted || !this.ctx) return;
      const note = frostScale[step % frostScale.length];
      const octaveNote = note * (step % 2 === 0 ? 1 : 1.5);
      this.playTone(octaveNote, 'sine', 0.45, 0.05);
      step = (step + 1) % 16;
      this.bgmTimer = setTimeout(playFrostArp, 380);
    };

    playFrostArp();
  }

  stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
  }
}

/* ==========================================================================
   2. ASSET MANAGER & SPRITE RENDERING
   ========================================================================== */
class AssetManager {
  constructor() {
    this.images = {};
    this.loaded = false;
    this.total = 0;
    this.loadedCount = 0;
  }

  loadAll(sources, onComplete) {
    const keys = Object.keys(sources);
    this.total = keys.length;
    if (this.total === 0) {
      this.loaded = true;
      if (onComplete) onComplete();
      return;
    }

    keys.forEach(key => {
      const img = new Image();
      img.onload = () => {
        this.loadedCount++;
        if (this.loadedCount >= this.total) {
          this.loaded = true;
          if (onComplete) onComplete();
        }
      };
      img.onerror = () => {
        this.loadedCount++;
        if (this.loadedCount >= this.total) {
          this.loaded = true;
          if (onComplete) onComplete();
        }
      };
      img.src = sources[key];
      this.images[key] = img;
    });
  }

  get(key) {
    const img = this.images[key];
    return (img && img.complete && img.naturalWidth !== 0) ? img : null;
  }
}

/* ==========================================================================
   3. PARTICLES SYSTEM
   ========================================================================== */
class ParticleSystem {
  constructor() {
    this.particles = [];
  }

  emit(x, y, count, type = 'snow', color = '#ffffff') {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.5 + 0.5;
      let vx = Math.cos(angle) * speed;
      let vy = Math.sin(angle) * speed;
      let life = Math.random() * 30 + 20;
      let size = Math.random() * 4 + 2;
      let gravity = 0.05;

      if (type === 'snow') {
        vx = (Math.random() - 0.5) * 1.5 - 0.5;
        vy = Math.random() * 1.5 + 0.8;
        size = Math.random() * 3 + 1.5;
        life = 200;
        gravity = 0.01;
      } else if (type === 'fire') {
        vy = -Math.abs(vy) * 1.2;
        size = Math.random() * 5 + 3;
        life = 25;
        gravity = -0.06;
      } else if (type === 'sparkle') {
        size = Math.random() * 3 + 2;
        life = 35;
        gravity = -0.02;
      } else if (type === 'ice') {
        size = Math.random() * 4 + 2;
        life = 30;
        gravity = 0.15;
      }

      this.particles.push({
        x, y, vx, vy, size, life, maxLife: life, type, color, gravity
      });
    }
  }

  update() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.life--;

      if (p.type === 'snow' && p.y > 750) {
        p.y = -10;
        p.x = Math.random() * 3000;
      } else if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx, cameraX) {
    ctx.save();
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const screenX = p.x - cameraX;
      if (screenX < -50 || screenX > ctx.canvas.width + 50) continue;

      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      if (p.type === 'sparkle') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fillRect(screenX - p.size / 2, p.y - p.size / 2, p.size, p.size);
      } else {
        ctx.beginPath();
        ctx.arc(screenX, p.y, p.size / 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }
}

/* ==========================================================================
   4. CHECKPOINT QUIZ QUESTIONS (KHUSUS ANAK USIA 3-4 TAHUN / PAUD)
   ========================================================================== */
function speakQuestion(text) {
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      // Bersihkan emoji agar pelafalan bahasa Indonesia ramah dan jelas
      const clean = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
      const u = new SpeechSynthesisUtterance(clean);
      u.lang = 'id-ID';
      u.rate = 0.88;
      u.pitch = 1.15;
      window.speechSynthesis.speak(u);
    }
  } catch (e) {}
}

const QUIZ_DATA = [
  {
    id: 1,
    title: "Warna Si Rubah Cilik 🦊",
    badge: "PINDAH KE MISI 2 · KUIS ANAK 3-4 TAHUN",
    gateName: "Gerbang Misi 2 (Kuil Es)",
    question: "Rubah kecil kita berbulu Oranye ceria 🦊. Buah apa yang warnanya sama seperti bulu rubah?",
    spokenText: "Halo adik pintar! Rubah kecil kita berbulu oranye. Buah apa yang warnanya oranye sama seperti rubah?",
    options: [
      { text: "🍊 Buah Jeruk Manis (Oranye)", correct: true },
      { text: "🍇 Buah Anggur (Ungu)", correct: false },
      { text: "🍏 Buah Apel (Hijau)", correct: false }
    ],
    explanation: "Hore! Hebat sekali! 🍊 Jeruk Manis dan 🦊 Rubah sama-sama berwarna oranye yang ceria! Gerbang Misi 2 terbuka lebar!"
  },
  {
    id: 2,
    title: "Ayo Berhitung Kristal Ungu 💎",
    badge: "PINDAH KE MISI 3 · KUIS ANAK 3-4 TAHUN",
    gateName: "Gerbang Misi 3 (Tahta Bos)",
    question: "Ayo hitung bersama rubah! Ada berapa kristal ungu di sini? 💎 💎 💎",
    spokenText: "Ayo berhitung bersama rubah! Ada berapa banyak kristal ungu di sini? Satu, dua, tiga!",
    options: [
      { text: "💎 3 (Tiga Kristal Ungu)", correct: true },
      { text: "💎 1 (Satu Kristal Saja)", correct: false },
      { text: "💎 5 (Lima Kristal)", correct: false }
    ],
    explanation: "Pintar sekali! Ada 3 kristal ungu yang cantik! Gerbang Tahta Es Penjaga kini terbuka! 💎💎💎"
  },
  {
    id: 3,
    title: "Teman Berbulu Putih 🐑",
    badge: "ALTAR KUIL ES · KUIS ANAK 3-4 TAHUN",
    gateName: "Altar Tahta Es Kuno",
    question: "Penjaga Es berbulu putih dan punya dua tanduk besar 🐏. Hewan apa yang berbulu putih dan bunyinya 'Mbee'? ",
    spokenText: "Penjaga Es berbulu putih dan bertanduk. Hewan apa yang berbulu putih dan bersuara mbee?",
    options: [
      { text: "🐑 Domba Putih yang Lucu", correct: true },
      { text: "🐱 Kucing Kecil yang Meong", correct: false },
      { text: "🐠 Ikan Berenang di Air", correct: false }
    ],
    explanation: "Wah luar biasa! Domba putih bertanduk yang berbunyi Mbee~ 🐑 Kuil es menjadi damai dan bersinar terang!"
  }
];

/* ==========================================================================
   5. GAME ENTITIES & ACTORS
   ========================================================================== */

/**
 * Player (Rubah Oranye Adventurer)
 */
class Player {
  constructor(x, y) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.w = 52;
    this.h = 56;
    this.vx = 0;
    this.vy = 0;
    this.facing = 1; // 1 = right, -1 = left
    this.grounded = false;
    this.onIce = false;
    this.jumpCount = 0;
    this.maxJumps = 2;

    // Attributes
    this.maxHealth = 3;
    this.health = 3;
    this.mana = 100;
    this.maxMana = 100;
    this.invulnerableTimer = 0;
    this.attackCooldown = 0;

    // Animation states
    this.animTime = 0;
    this.state = 'idle';
  }

  reset(x = this.startX, y = this.startY) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.health = this.maxHealth;
    this.mana = this.maxMana;
    this.invulnerableTimer = 0;
    this.jumpCount = 0;
    this.grounded = false;
  }

  takeDamage(amount, soundEngine) {
    if (this.invulnerableTimer > 0) return false;
    this.health -= amount;
    this.invulnerableTimer = 60; // 1 second iframe
    this.vy = -6;
    this.vx = -this.facing * 4;
    if (soundEngine && soundEngine.hit) soundEngine.hit();
    return true;
  }

  shootFireball(soundEngine, projectiles) {
    if (this.mana < 25 || this.attackCooldown > 0) return false;
    this.mana -= 25;
    this.attackCooldown = 18;
    if (soundEngine && soundEngine.fireball) soundEngine.fireball();

    const spawnX = this.facing === 1 ? this.x + this.w + 4 : this.x - 14;
    const spawnY = this.y + this.h * 0.45;
    projectiles.push(new Fireball(spawnX, spawnY, this.facing));
    return true;
  }

  update(keys, platforms, soundEngine, projectiles, particleSystem) {
    this.animTime++;
    if (this.invulnerableTimer > 0) this.invulnerableTimer--;
    if (this.attackCooldown > 0) this.attackCooldown--;

    // Mana passive slow regen
    if (this.mana < this.maxMana) {
      this.mana = Math.min(this.maxMana, this.mana + 0.15);
    }

    // Horizontal Movement
    const speed = 5.2;
    // Responsive air control: don't lose all momentum when jumping
    const accel = this.grounded ? (this.onIce ? 0.35 : 0.85) : 0.65;
    const friction = this.grounded ? (this.onIce ? 0.94 : 0.78) : 0.96;

    let moveDir = 0;
    if (keys['ArrowLeft'] || keys['KeyA'] || keys['a'] || keys['A'] || keys['touch_left']) moveDir -= 1;
    if (keys['ArrowRight'] || keys['KeyD'] || keys['d'] || keys['D'] || keys['touch_right']) moveDir += 1;

    if (moveDir !== 0) {
      this.vx += moveDir * accel;
      this.facing = moveDir > 0 ? 1 : -1;
      if (Math.abs(this.vx) > speed) {
        this.vx = Math.sign(this.vx) * speed;
      }
      if (this.grounded && this.animTime % 8 === 0) {
        particleSystem.emit(this.x + this.w / 2, this.y + this.h, 2, 'snow', '#e0f2fe');
      }
    } else {
      this.vx *= friction;
      if (Math.abs(this.vx) < 0.1) this.vx = 0;
    }

    // Attack Action
    if ((keys['KeyJ'] || keys['KeyZ'] || keys['KeyF'] || keys['KeyX'] || keys['j'] || keys['z'] || keys['f'] || keys['x'] || keys['touch_attack'])) {
      this.shootFireball(soundEngine, projectiles);
    }

    // Jump Action
    if (keys['jump_pressed']) {
      keys['jump_pressed'] = false;
      if (this.grounded || this.jumpCount < this.maxJumps) {
        if (this.jumpCount === 0 && !this.grounded) {
          this.jumpCount = 1;
        }
        this.vy = -11.5;
        this.grounded = false;
        this.jumpCount++;
        if (this.jumpCount === 1) {
          if (soundEngine && soundEngine.jump) soundEngine.jump();
          particleSystem.emit(this.x + this.w / 2, this.y + this.h, 5, 'snow', '#ffffff');
        } else {
          if (soundEngine && soundEngine.doubleJump) soundEngine.doubleJump();
          particleSystem.emit(this.x + this.w / 2, this.y + this.h, 8, 'sparkle', '#38bdf8');
        }
      }
    }

    // Gravity
    this.vy += 0.52;
    if (this.vy > 14) this.vy = 14;

    // Movement integration
    this.x += this.vx;
    this.resolveHorizontalCollisions(platforms);

    this.y += this.vy;
    this.grounded = false;
    this.onIce = false;
    this.resolveVerticalCollisions(platforms);

    // Update state for animation
    if (this.invulnerableTimer > 35) {
      this.state = 'hurt';
    } else if (!this.grounded) {
      this.state = this.vy < 0 ? 'jump' : 'fall';
    } else if (Math.abs(this.vx) > 0.4) {
      this.state = 'run';
    } else {
      this.state = 'idle';
    }
  }

  resolveHorizontalCollisions(platforms) {
    for (let p of platforms) {
      if (p.oneWay || p.hazard) continue;
      // Only push horizontally if player body is actually inside the vertical slab of the platform
      if (this.x < p.x + p.w && this.x + this.w > p.x &&
          this.y < p.y + p.h - 6 && this.y + this.h > p.y + 6) {
        if (this.vx > 0 && (this.x + this.w - this.vx) <= p.x + 8) {
          this.x = p.x - this.w;
          this.vx = 0;
        } else if (this.vx < 0 && (this.x - this.vx) >= p.x + p.w - 8) {
          this.x = p.x + p.w;
          this.vx = 0;
        }
      }
    }
  }

  resolveVerticalCollisions(platforms) {
    for (let p of platforms) {
      if (p.hazard) continue;
      if (this.checkOverlap(this, p)) {
        if (p.oneWay) {
          // One-way platform: only land if feet were above platform top before movement
          if (this.vy > 0 && (this.y + this.h - this.vy) <= p.y + 14) {
            this.y = p.y - this.h;
            this.vy = 0;
            this.grounded = true;
            this.jumpCount = 0;
            if (p.isIce) this.onIce = true;
            if (p.vx) this.x += p.vx;
          }
        } else {
          // Solid ground: only land from above if feet were near top
          if (this.vy > 0 && (this.y + this.h - this.vy) <= p.y + 18) {
            this.y = p.y - this.h;
            this.vy = 0;
            this.grounded = true;
            this.jumpCount = 0;
            if (p.isIce) this.onIce = true;
            if (p.vx) this.x += p.vx;
          } else if (this.vy < 0 && (this.y - this.vy) >= p.y + p.h - 18) {
            // Hit ceiling from below ONLY if head was below ceiling before movement
            this.y = p.y + p.h;
            this.vy = 0;
          }
        }
      }
    }
  }

  checkOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  draw(ctx, cameraX, assetManager) {
    if (this.invulnerableTimer > 0 && Math.floor(this.animTime / 4) % 2 === 0) {
      return;
    }

    ctx.save();
    const screenX = this.x - cameraX;

    ctx.translate(screenX + this.w / 2, this.y + this.h / 2);
    ctx.scale(this.facing, 1);

    const foxImg = assetManager.get('fox');
    if (foxImg) {
      let scaleX = 1;
      let scaleY = 1;
      let bobY = 0;

      if (this.state === 'run') {
        bobY = Math.sin(this.animTime * 0.4) * 3;
        scaleX = 1 + Math.sin(this.animTime * 0.4) * 0.08;
      } else if (this.state === 'jump') {
        scaleX = 0.88;
        scaleY = 1.12;
      } else if (this.state === 'fall') {
        scaleX = 1.08;
        scaleY = 0.92;
      } else if (this.state === 'idle') {
        bobY = Math.sin(this.animTime * 0.08) * 1.5;
        scaleY = 1 + Math.sin(this.animTime * 0.08) * 0.02;
      }

      ctx.scale(scaleX, scaleY);

      const drawW = 74;
      const drawH = 74;
      ctx.drawImage(foxImg, -drawW / 2, -drawH / 2 + bobY - 4, drawW, drawH);

      // Blue scarf dynamic flutter
      const scarfFlutter = Math.sin(this.animTime * 0.3) * 6 * -this.facing;
      ctx.fillStyle = '#0284c7';
      ctx.beginPath();
      ctx.moveTo(-drawW * 0.15, -drawH * 0.05 + bobY);
      ctx.lineTo(-drawW * 0.45 + scarfFlutter, drawH * 0.05 + bobY);
      ctx.lineTo(-drawW * 0.2, drawH * 0.15 + bobY);
      ctx.closePath();
      ctx.fill();

    } else {
      ctx.fillStyle = '#f97316';
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
      ctx.fillStyle = '#ea580c';
      ctx.beginPath();
      ctx.moveTo(-15, -this.h / 2);
      ctx.lineTo(-5, -this.h / 2 - 16);
      ctx.lineTo(5, -this.h / 2);
      ctx.fill();
    }

    ctx.restore();
  }
}

/**
 * Purple Crystal (Kristal Ungu Collectible)
 */
class PurpleCrystal {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 32;
    this.h = 42;
    this.collected = false;
    this.floatOffset = Math.random() * Math.PI * 2;
  }

  update(time, player, soundEngine, particleSystem, onCollect) {
    if (this.collected) return;

    const currentY = this.y + Math.sin(time * 0.06 + this.floatOffset) * 6;
    if (
      player.x < this.x + this.w &&
      player.x + player.w > this.x &&
      player.y < currentY + this.h &&
      player.y + player.h > currentY
    ) {
      this.collected = true;
      if (soundEngine && soundEngine.crystal) soundEngine.crystal();
      particleSystem.emit(this.x + this.w / 2, currentY + this.h / 2, 16, 'sparkle', '#c084fc');
      if (onCollect) onCollect();
    }
  }

  draw(ctx, cameraX, assetManager, time) {
    if (this.collected) return;
    const screenX = this.x - cameraX;
    if (screenX < -60 || screenX > ctx.canvas.width + 60) return;

    const currentY = this.y + Math.sin(time * 0.06 + this.floatOffset) * 6;
    const crystalImg = assetManager.get('crystal');

    ctx.save();
    ctx.shadowColor = '#c084fc';
    ctx.shadowBlur = 14 + Math.sin(time * 0.1) * 6;

    if (crystalImg) {
      const dw = 40;
      const dh = 48;
      ctx.drawImage(crystalImg, screenX - (dw - this.w) / 2, currentY - (dh - this.h) / 2, dw, dh);
    } else {
      ctx.fillStyle = '#9333ea';
      ctx.beginPath();
      ctx.moveTo(screenX + this.w / 2, currentY);
      ctx.lineTo(screenX + this.w, currentY + this.h * 0.5);
      ctx.lineTo(screenX + this.w / 2, currentY + this.h);
      ctx.lineTo(screenX, currentY + this.h * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Stone Golem (Musuh Batu Berlumut)
 */
class StoneGolem {
  constructor(x, y, patrolDist = 180) {
    this.startX = x;
    this.x = x;
    this.y = y;
    this.w = 64;
    this.h = 60;
    this.minX = x - patrolDist / 2;
    this.maxX = x + patrolDist / 2;
    this.speed = 1.1;
    this.facing = 1;
    this.hp = 60;
    this.dead = false;
    this.attackTimer = 0;
    this.animTime = 0;
  }

  update(player, platforms, soundEngine, projectiles, particleSystem) {
    if (this.dead) return;
    this.animTime++;

    this.x += this.speed * this.facing;
    if (this.x > this.maxX) {
      this.facing = -1;
      this.x = this.maxX;
    } else if (this.x < this.minX) {
      this.facing = 1;
      this.x = this.minX;
    }

    if (this.animTime % 45 === 0) {
      particleSystem.emit(this.x + this.w / 2, this.y + this.h, 2, 'snow', '#94a3b8');
    }

    this.attackTimer++;
    const distToPlayer = Math.abs(player.x - this.x);
    if (distToPlayer < 350 && this.attackTimer > 180) {
      this.attackTimer = 0;
      const throwDir = player.x < this.x ? -1 : 1;
      projectiles.push(new StoneBoulder(this.x + (throwDir > 0 ? this.w : 0), this.y + 20, throwDir));
    }

    // Check hit by Fox Jump Stomp
    if (
      player.vy > 0 &&
      player.x + player.w > this.x + 8 &&
      player.x < this.x + this.w - 8 &&
      player.y + player.h >= this.y &&
      player.y + player.h <= this.y + 24
    ) {
      player.vy = -10;
      this.takeDamage(30, soundEngine, particleSystem);
    } else if (this.checkOverlap(player, this)) {
      player.takeDamage(1, soundEngine);
    }
  }

  takeDamage(amount, soundEngine, particleSystem) {
    this.hp -= amount;
    particleSystem.emit(this.x + this.w / 2, this.y + this.h / 2, 8, 'ice', '#a3e635');
    if (soundEngine && soundEngine.hit) soundEngine.hit();
    if (this.hp <= 0) {
      this.dead = true;
      if (soundEngine && soundEngine.enemyDeath) soundEngine.enemyDeath();
      particleSystem.emit(this.x + this.w / 2, this.y + this.h / 2, 20, 'ice', '#64748b');
    }
  }

  checkOverlap(a, b) {
    return (
      a.x < b.x + b.w &&
      a.x + a.w > b.x &&
      a.y < b.y + b.h &&
      a.y + a.h > b.y
    );
  }

  draw(ctx, cameraX, assetManager) {
    if (this.dead) return;
    const screenX = this.x - cameraX;
    if (screenX < -80 || screenX > ctx.canvas.width + 80) return;

    ctx.save();
    ctx.translate(screenX + this.w / 2, this.y + this.h / 2);
    ctx.scale(this.facing, 1);

    const golemImg = assetManager.get('golem');
    if (golemImg) {
      const dw = 80;
      const dh = 72;
      const stompY = Math.abs(Math.sin(this.animTime * 0.15)) * 3;
      ctx.drawImage(golemImg, -dw / 2, -dh / 2 - stompY, dw, dh);
    } else {
      ctx.fillStyle = '#475569';
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
      ctx.fillStyle = '#84cc16';
      ctx.fillRect(8, -12, 6, 6);
    }
    ctx.restore();
  }
}

/**
 * Ice Elemental (Roh Es Melayang)
 */
class IceElemental {
  constructor(x, y, rangeY = 40) {
    this.x = x;
    this.baseY = y;
    this.y = y;
    this.w = 54;
    this.h = 58;
    this.rangeY = rangeY;
    this.hp = 40;
    this.dead = false;
    this.animTime = Math.random() * 100;
    this.shootTimer = 0;
  }

  update(player, soundEngine, projectiles, particleSystem) {
    if (this.dead) return;
    this.animTime++;

    this.y = this.baseY + Math.sin(this.animTime * 0.05) * this.rangeY;

    if (this.animTime % 12 === 0) {
      particleSystem.emit(this.x + this.w / 2, this.y + this.h * 0.8, 1, 'ice', '#38bdf8');
    }

    this.shootTimer++;
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    if (dist < 420 && this.shootTimer > 150) {
      this.shootTimer = 0;
      const angle = Math.atan2((player.y + player.h / 2) - (this.y + this.h / 2), (player.x + player.w / 2) - (this.x + this.w / 2));
      projectiles.push(new IceBolt(this.x + this.w / 2, this.y + this.h / 2, angle));
    }

    if (
      player.x < this.x + this.w &&
      player.x + player.w > this.x &&
      player.y < this.y + this.h &&
      player.y + player.h > this.y
    ) {
      player.takeDamage(1, soundEngine);
    }
  }

  takeDamage(amount, soundEngine, particleSystem) {
    this.hp -= amount;
    if (soundEngine && soundEngine.hit) soundEngine.hit();
    particleSystem.emit(this.x + this.w / 2, this.y + this.h / 2, 10, 'ice', '#7dd3fc');
    if (this.hp <= 0) {
      this.dead = true;
      if (soundEngine && soundEngine.enemyDeath) soundEngine.enemyDeath();
      particleSystem.emit(this.x + this.w / 2, this.y + this.h / 2, 24, 'ice', '#38bdf8');
    }
  }

  draw(ctx, cameraX, assetManager) {
    if (this.dead) return;
    const screenX = this.x - cameraX;
    if (screenX < -80 || screenX > ctx.canvas.width + 80) return;

    ctx.save();
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 12 + Math.sin(this.animTime * 0.1) * 6;

    const elImg = assetManager.get('elemental');
    if (elImg) {
      const dw = 70;
      const dh = 72;
      ctx.drawImage(elImg, screenX - (dw - this.w) / 2, this.y - (dh - this.h) / 2, dw, dh);
    } else {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(screenX + this.w / 2, this.y + this.h / 2, this.w / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Ice Guardian (Sang Penjaga Es Kuno - BOSS)
 */
class IceGuardian {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.w = 110;
    this.h = 135;
    this.maxHp = 300;
    this.hp = 300;
    this.facing = -1;
    this.animTime = 0;
    this.state = 'idle';
    this.stateTimer = 0;
    this.active = false;
    this.defeated = false;
    this.vx = 0;
    this.vy = 0;
  }

  update(player, soundEngine, projectiles, particleSystem) {
    if (this.defeated || !this.active) return;
    this.animTime++;
    this.stateTimer++;

    this.facing = player.x < this.x + this.w / 2 ? -1 : 1;

    if (this.state === 'idle') {
      if (this.stateTimer > 90) {
        this.stateTimer = 0;
        const rand = Math.random();
        if (rand < 0.35) {
          this.state = 'cast';
          if (soundEngine && soundEngine.bossRoar) soundEngine.bossRoar();
        } else if (rand < 0.70) {
          this.state = 'slam';
          if (soundEngine && soundEngine.bossPunch) soundEngine.bossPunch();
        } else {
          this.state = 'charge';
          if (soundEngine && soundEngine.bossRoar) soundEngine.bossRoar();
          this.vx = this.facing * 7;
        }
      }
    } else if (this.state === 'cast') {
      if (this.stateTimer === 30) {
        for (let i = -1; i <= 1; i++) {
          const angle = (this.facing === -1 ? Math.PI : 0) + i * 0.25;
          projectiles.push(new IceBolt(this.x + (this.facing === -1 ? 0 : this.w), this.y + 50, angle, 5.5));
        }
      }
      if (this.stateTimer > 60) {
        this.state = 'idle';
        this.stateTimer = 0;
      }
    } else if (this.state === 'slam') {
      if (this.stateTimer === 25) {
        if (soundEngine && soundEngine.bossPunch) soundEngine.bossPunch();
        particleSystem.emit(this.x + this.w / 2, this.y + this.h, 15, 'ice', '#38bdf8');
        for (let s = 1; s <= 3; s++) {
          const spikeX = this.x + this.facing * (s * 85);
          projectiles.push(new GroundIceSpike(spikeX, this.y + this.h - 40, s * 10));
        }
      }
      if (this.stateTimer > 65) {
        this.state = 'idle';
        this.stateTimer = 0;
      }
    } else if (this.state === 'charge') {
      this.x += this.vx;
      if (this.animTime % 5 === 0) {
        particleSystem.emit(this.x + this.w / 2, this.y + this.h, 4, 'snow', '#ffffff');
      }
      if (this.stateTimer > 40) {
        this.vx = 0;
        this.state = 'idle';
        this.stateTimer = 0;
      }
    }

    if (
      player.x < this.x + this.w &&
      player.x + player.w > this.x &&
      player.y < this.y + this.h &&
      player.y + player.h > this.y
    ) {
      player.takeDamage(1, soundEngine);
    }
  }

  takeDamage(amount, soundEngine, particleSystem) {
    if (this.defeated || !this.active) return;
    this.hp -= amount;
    if (soundEngine && soundEngine.hit) soundEngine.hit();
    particleSystem.emit(this.x + this.w / 2, this.y + this.h * 0.4, 12, 'ice', '#38bdf8');

    if (this.hp <= 0) {
      this.hp = 0;
      this.defeated = true;
      if (soundEngine && soundEngine.bossRoar) soundEngine.bossRoar();
      particleSystem.emit(this.x + this.w / 2, this.y + this.h / 2, 40, 'sparkle', '#a855f7');
    }
  }

  draw(ctx, cameraX, assetManager) {
    if (this.defeated) return;
    const screenX = this.x - cameraX;
    if (screenX < -150 || screenX > ctx.canvas.width + 150) return;

    ctx.save();
    ctx.translate(screenX + this.w / 2, this.y + this.h / 2);
    ctx.scale(this.facing, 1);

    const guardImg = assetManager.get('guardian');
    if (guardImg) {
      const dw = 140;
      const dh = 150;
      const breathe = Math.sin(this.animTime * 0.08) * 3;
      ctx.drawImage(guardImg, -dw / 2, -dh / 2 + breathe, dw, dh);
    } else {
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-this.w / 2, -this.h / 2, this.w, this.h);
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.arc(0, -this.h / 2, 20, Math.PI, 0);
      ctx.fill();
    }
    ctx.restore();
  }
}

/**
 * Checkpoint Altar Kuno (Shrine with Glowing Runes)
 */
class CheckpointShrine {
  constructor(x, y, quizIndex) {
    this.x = x;
    this.y = y;
    this.w = 56;
    this.h = 76;
    this.quizIndex = quizIndex;
    this.activated = false;
    this.glowTimer = 0;
  }

  update(player) {
    this.glowTimer++;
    const dist = Math.abs((player.x + player.w / 2) - (this.x + this.w / 2));
    if (dist < 55 && Math.abs(player.y - this.y) < 60) {
      return true;
    }
    return false;
  }

  draw(ctx, cameraX, isPlayerNear) {
    const screenX = this.x - cameraX;
    if (screenX < -100 || screenX > ctx.canvas.width + 100) return;

    ctx.save();
    ctx.fillStyle = '#334155';
    ctx.fillRect(screenX + 6, this.y + 12, this.w - 12, this.h - 12);
    ctx.fillStyle = '#475569';
    ctx.fillRect(screenX, this.y + 4, this.w, 14);
    ctx.fillRect(screenX - 4, this.y + this.h - 12, this.w + 8, 12);

    const runeGlow = this.activated ? '#10b981' : (isPlayerNear ? '#38bdf8' : '#a855f7');
    ctx.shadowColor = runeGlow;
    ctx.shadowBlur = 12 + Math.sin(this.glowTimer * 0.1) * 6;
    ctx.fillStyle = runeGlow;

    ctx.font = '24px Orbitron, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🌀', screenX + this.w / 2, this.y + this.h * 0.48);

    if (isPlayerNear && !this.activated) {
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('[E] AKTIFKAN', screenX + this.w / 2, this.y - 12);
    } else if (this.activated) {
      ctx.fillStyle = '#34d399';
      ctx.font = 'bold 11px Orbitron, monospace';
      ctx.fillText('SELESAI', screenX + this.w / 2, this.y - 12);
    }

    ctx.restore();
  }
}

/**
 * Mission Gate (Pintu Gerbang Pindah Misi untuk Anak Usia 3-4 Tahun)
 */
class MissionGate {
  constructor(x, y, w, h, missionTo, quizIndex, name) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.missionTo = missionTo;
    this.quizIndex = quizIndex;
    this.name = name;
    this.unlocked = false;
    this.activated = false;
    this.animTime = 0;
  }

  update(player) {
    this.animTime++;
    if (!this.unlocked) {
      const vertOverlap = (player.y + player.h >= this.y && player.y <= this.y + this.h);
      // Hard physical barrier: cannot cross gate
      if (vertOverlap && player.x + player.w >= this.x && player.x <= this.x + this.w) {
        player.x = this.x - player.w - 1;
        player.vx = 0;
        return true;
      }
      // Near gate trigger: within 50px
      if (vertOverlap && (player.x + player.w >= this.x - 50) && (player.x <= this.x + this.w + 20)) {
        return true;
      }
    }
    return false;
  }

  draw(ctx, cameraX) {
    const screenX = this.x - cameraX;
    if (screenX < -100 || screenX > ctx.canvas.width + 100) return;

    ctx.save();
    if (!this.unlocked) {
      // Magical ice barrier
      const glow = Math.sin(this.animTime * 0.1) * 8 + 16;
      ctx.shadowColor = '#38bdf8';
      ctx.shadowBlur = glow;

      // Two Ice Pillars
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(screenX - 8, this.y, 16, this.h);
      ctx.fillRect(screenX + this.w - 8, this.y, 16, this.h);

      // Shimmering Energy Curtain
      const beamGrad = ctx.createLinearGradient(screenX, this.y, screenX, this.y + this.h);
      beamGrad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
      beamGrad.addColorStop(0.5, 'rgba(168, 85, 247, 0.85)');
      beamGrad.addColorStop(1, 'rgba(56, 189, 248, 0.7)');
      ctx.fillStyle = beamGrad;
      ctx.fillRect(screenX, this.y, this.w, this.h);

      // Big Floating Lock & Child-friendly Prompt
      ctx.fillStyle = '#facc15';
      ctx.font = '36px sans-serif';
      ctx.textAlign = 'center';
      const bob = Math.sin(this.animTime * 0.08) * 8;
      ctx.fillText('🔒', screenX + this.w / 2, this.y + this.h * 0.45 + bob);

      ctx.font = 'bold 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`GERBANG MISI ${this.missionTo}`, screenX + this.w / 2, this.y - 14);
      ctx.font = 'bold 12px Orbitron, monospace';
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('[JAWAB SOAL DULU]', screenX + this.w / 2, this.y + 6);
    } else {
      // Open Gate
      ctx.fillStyle = '#10b981';
      ctx.fillRect(screenX - 6, this.y, 12, this.h);
      ctx.fillRect(screenX + this.w - 6, this.y, 12, this.h);

      ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.fillRect(screenX, this.y, this.w, this.h);

      ctx.fillStyle = '#34d399';
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✨ 🔓 ✨', screenX + this.w / 2, this.y + this.h * 0.45);

      ctx.font = 'bold 13px Orbitron, monospace';
      ctx.fillText(`MISI ${this.missionTo} TERBUKA`, screenX + this.w / 2, this.y - 12);
    }
    ctx.restore();
  }
}

/* ==========================================================================
   6. PROJECTILES
   ========================================================================== */
class Fireball {
  constructor(x, y, dir) {
    this.x = x;
    this.y = y;
    this.w = 26;
    this.h = 18;
    this.vx = dir * 9.5;
    this.dead = false;
    this.life = 70;
  }

  update(enemies, boss, soundEngine, particleSystem) {
    this.x += this.vx;
    this.life--;
    if (this.life <= 0) this.dead = true;

    particleSystem.emit(this.x, this.y + this.h / 2, 2, 'fire', '#ea580c');

    for (let e of enemies) {
      if (e.dead) continue;
      if (
        this.x < e.x + e.w &&
        this.x + this.w > e.x &&
        this.y < e.y + e.h &&
        this.y + this.h > e.y
      ) {
        e.takeDamage(35, soundEngine, particleSystem);
        this.dead = true;
        particleSystem.emit(this.x, this.y, 8, 'fire', '#f97316');
        break;
      }
    }

    if (!this.dead && boss && boss.active && !boss.defeated) {
      if (
        this.x < boss.x + boss.w &&
        this.x + this.w > boss.x &&
        this.y < boss.y + boss.h &&
        this.y + this.h > boss.y
      ) {
        boss.takeDamage(20, soundEngine, particleSystem);
        this.dead = true;
        particleSystem.emit(this.x, this.y, 12, 'fire', '#f97316');
      }
    }
  }

  draw(ctx, cameraX) {
    const screenX = this.x - cameraX;
    ctx.save();
    ctx.shadowColor = '#fb923c';
    ctx.shadowBlur = 14;
    ctx.fillStyle = '#f97316';
    ctx.beginPath();
    ctx.arc(screenX + this.w / 2, this.y + this.h / 2, 10, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(screenX + this.w / 2, this.y + this.h / 2, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class IceBolt {
  constructor(x, y, angle, speed = 4.5) {
    this.x = x;
    this.y = y;
    this.w = 18;
    this.h = 18;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.dead = false;
    this.life = 120;
  }

  update(player, soundEngine, particleSystem) {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    if (this.life <= 0) this.dead = true;

    if (this.life % 4 === 0) {
      particleSystem.emit(this.x, this.y, 1, 'ice', '#38bdf8');
    }

    if (
      player.x < this.x + this.w &&
      player.x + player.w > this.x &&
      player.y < this.y + this.h &&
      player.y + player.h > this.y
    ) {
      player.takeDamage(1, soundEngine);
      this.dead = true;
      particleSystem.emit(this.x, this.y, 8, 'ice', '#7dd3fc');
    }
  }

  draw(ctx, cameraX) {
    const screenX = this.x - cameraX;
    ctx.save();
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(screenX + this.w / 2, this.y + this.h / 2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

class StoneBoulder {
  constructor(x, y, dir) {
    this.x = x;
    this.y = y;
    this.w = 34;
    this.h = 34;
    this.vx = dir * 4.2;
    this.vy = 0;
    this.rot = 0;
    this.hp = 2;
    this.dead = false;
  }

  update(player, platforms, soundEngine, particleSystem) {
    this.x += this.vx;
    this.vy += 0.45;
    this.y += this.vy;
    this.rot += this.vx * 0.1;

    for (let p of platforms) {
      if (
        this.x < p.x + p.w &&
        this.x + this.w > p.x &&
        this.y < p.y + p.h &&
        this.y + this.h > p.y
      ) {
        if (this.vy > 0) {
          this.y = p.y - this.h;
          this.vy = -3;
        }
      }
    }

    if (
      player.x < this.x + this.w &&
      player.x + player.w > this.x &&
      player.y < this.y + this.h &&
      player.y + player.h > this.y
    ) {
      player.takeDamage(1, soundEngine);
      this.dead = true;
      particleSystem.emit(this.x + this.w / 2, this.y + this.h / 2, 10, 'ice', '#64748b');
    }

    if (this.y > 800) this.dead = true;
  }

  takeDamage(amount, soundEngine, particleSystem) {
    this.hp -= amount;
    if (soundEngine && soundEngine.hit) soundEngine.hit();
    if (this.hp <= 0) {
      this.dead = true;
      if (soundEngine && soundEngine.enemyDeath) soundEngine.enemyDeath();
      particleSystem.emit(this.x + this.w / 2, this.y + this.h / 2, 12, 'ice', '#78716c');
    }
  }

  draw(ctx, cameraX) {
    const screenX = this.x - cameraX;
    ctx.save();
    ctx.translate(screenX + this.w / 2, this.y + this.h / 2);
    ctx.rotate(this.rot);
    ctx.fillStyle = '#44403c';
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#65a30d';
    ctx.fillRect(-8, -12, 10, 6);
    ctx.fillRect(2, 4, 8, 8);
    ctx.restore();
  }
}

class GroundIceSpike {
  constructor(x, y, delay = 0) {
    this.x = x;
    this.y = y;
    this.w = 32;
    this.h = 48;
    this.delay = delay;
    this.life = 60;
    this.dead = false;
    this.currentH = 0;
  }

  update(player, soundEngine, particleSystem) {
    if (this.delay > 0) {
      this.delay--;
      return;
    }
    this.life--;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }

    if (this.currentH < this.h) {
      this.currentH += 6;
      particleSystem.emit(this.x + this.w / 2, this.y + this.h, 1, 'ice', '#38bdf8');
    }

    if (
      player.x < this.x + this.w &&
      player.x + player.w > this.x &&
      player.y < this.y + this.h &&
      player.y + player.h > this.y + (this.h - this.currentH)
    ) {
      player.takeDamage(1, soundEngine);
    }
  }

  draw(ctx, cameraX) {
    if (this.delay > 0 || this.dead) return;
    const screenX = this.x - cameraX;
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 8;
    ctx.fillStyle = '#7dd3fc';
    ctx.beginPath();
    ctx.moveTo(screenX + this.w / 2, this.y + this.h - this.currentH);
    ctx.lineTo(screenX + this.w, this.y + this.h);
    ctx.lineTo(screenX, this.y + this.h);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

/* ==========================================================================
   7. MAIN GAME CONTROLLER & LEVEL BUILDER
   ========================================================================== */
class Game {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.ctx = this.canvas.getContext('2d');
    this.sound = new SoundEngine();
    this.assets = new AssetManager();
    this.particles = new ParticleSystem();

    this.V_WIDTH = 1280;
    this.V_HEIGHT = 720;
    this.canvas.width = this.V_WIDTH;
    this.canvas.height = this.V_HEIGHT;

    this.state = 'MENU';
    this.score = 0;
    this.collectedCrystals = 0;
    this.totalCrystals = 15;
    this.currentCheckpoint = null;
    this.respawnX = 120;
    this.respawnY = 480;
    this.cameraX = 0;

    this.keys = {};

    this.player = new Player(120, 480);
    this.platforms = [];
    this.crystals = [];
    this.enemies = [];
    this.boss = new IceGuardian(2650, 425);
    this.projectiles = [];
    this.shrines = [];
    this.gates = [];

    // Build the level IMMEDIATELY so collision platforms exist from frame 0
    this.buildLevel();

    this.initEventListeners();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    this.loadAssets();
  }

  loadAssets() {
    this.assets.loadAll({
      fox: 'assets/fox.png',
      guardian: 'assets/guardian.png',
      crystal: 'assets/crystal.png',
      golem: 'assets/golem.png',
      elemental: 'assets/elemental.png',
      environment: 'assets/environment.jpg'
    }, () => {
      // Assets loaded callback
    });
  }

  resizeCanvas() {
    const wrapW = window.innerWidth;
    const wrapH = window.innerHeight;
    const scale = Math.min(wrapW / this.V_WIDTH, wrapH / this.V_HEIGHT);

    this.canvas.style.width = `${Math.floor(this.V_WIDTH * scale)}px`;
    this.canvas.style.height = `${Math.floor(this.V_HEIGHT * scale)}px`;
  }

  buildLevel() {
    this.platforms = [];
    this.crystals = [];
    this.enemies = [];
    this.shrines = [];
    this.gates = [];
    this.projectiles = [];

    // Stage 1: Lembah Es (x: 0 -> 900)
    this.platforms.push({ x: -100, y: 560, w: 900, h: 200, isIce: true, color: '#1e293b' });
    this.platforms.push({ x: 220, y: 440, w: 140, h: 24, oneWay: true, color: '#334155' });
    this.platforms.push({ x: 420, y: 350, w: 160, h: 24, oneWay: true, color: '#334155' });
    this.platforms.push({ x: 650, y: 430, w: 140, h: 24, oneWay: true, color: '#334155' });

    // Moving ice platform
    this.platforms.push({
      x: 820, y: 380, w: 130, h: 22, oneWay: true, isIce: true, color: '#38bdf8',
      baseX: 820, rangeX: 140, speedX: 1.5, vx: 1.5,
      update: function() {
        this.x += this.vx;
        if (this.x > this.baseX + this.rangeX || this.x < this.baseX) this.vx = -this.vx;
      }
    });

    // Stage 2: Reruntuhan Kuil Es (x: 1020 -> 2100)
    this.platforms.push({ x: 1020, y: 560, w: 1050, h: 200, isIce: false, color: '#1e293b' });
    this.platforms.push({ x: 1160, y: 440, w: 140, h: 24, oneWay: true, color: '#334155' });
    this.platforms.push({ x: 1360, y: 330, w: 160, h: 24, oneWay: true, color: '#334155' });
    this.platforms.push({ x: 1580, y: 420, w: 140, h: 24, oneWay: true, color: '#334155' });
    this.platforms.push({ x: 1780, y: 320, w: 180, h: 24, oneWay: true, color: '#334155' });

    // Stage 3: Ruang Tahta Ice Guardian (x: 2150 -> 3100)
    this.platforms.push({ x: 2150, y: 560, w: 950, h: 200, isIce: true, color: '#0f172a' });
    this.platforms.push({ x: 2320, y: 340, w: 620, h: 32, oneWay: true, isIce: true, color: '#38bdf8' });
    this.platforms.push({ x: 2880, y: 420, w: 150, h: 24, oneWay: true, color: '#334155' });

    // Chasm hazard
    this.platforms.push({ x: 900, y: 680, w: 120, h: 60, hazard: true });

    // 15 Purple Crystals
    const crystalCoords = [
      [260, 390], [300, 390], [480, 290], [520, 290], [700, 370],
      [900, 310], [1200, 380], [1420, 270], [1480, 270], [1620, 360],
      [1850, 260], [2360, 280], [2440, 280], [2800, 280], [2940, 360]
    ];
    crystalCoords.forEach(c => this.crystals.push(new PurpleCrystal(c[0], c[1])));
    this.totalCrystals = this.crystals.length;

    // Enemies
    this.enemies.push(new StoneGolem(480, 500, 200));
    this.enemies.push(new IceElemental(700, 260, 35));
    this.enemies.push(new StoneGolem(1280, 500, 240));
    this.enemies.push(new IceElemental(1480, 240, 45));
    this.enemies.push(new StoneGolem(1750, 500, 220));
    this.enemies.push(new IceElemental(1880, 220, 40));

    // Boss
    this.boss = new IceGuardian(2650, 425);

    // Gerbang Transisi Antar Misi (Soal Interaktif untuk Anak Usia 3-4 Tahun)
    // 1. Pindah dari Misi 1 (Lembah Es) ke Misi 2 (Kuil Es)
    this.gates.push(new MissionGate(760, 180, 40, 380, 2, 0, 'Gerbang Menuju Misi 2'));

    // 2. Pindah dari Misi 2 (Kuil Es) ke Misi 3 (Tahta Bos Ice Guardian)
    this.gates.push(new MissionGate(2020, 180, 40, 380, 3, 1, 'Gerbang Menuju Misi 3'));

    // Altar Suci di Tahta Bos (Soal 3)
    this.shrines.push(new CheckpointShrine(2580, 264, 2));

    // Reset Player to respawn
    this.player.reset(this.respawnX, this.respawnY);
    this.score = 0;
    this.collectedCrystals = 0;
    this.updateHUD();
  }

  initEventListeners() {
    window.addEventListener('keydown', e => {
      // Prevent browser default actions (scrolling on Space, Arrows)
      const gameKeys = ['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyJ', 'KeyZ', 'KeyF', 'KeyX', 'KeyE', 'KeyP'];
      if (gameKeys.includes(e.code) || e.key === ' ' || e.key === 'Spacebar') {
        if (e.cancelable) e.preventDefault();
      }

      this.sound.init();

      // Ensure no active HTML button steals Space/Enter key presses
      if (document.activeElement && document.activeElement !== document.body && document.activeElement.blur) {
        document.activeElement.blur();
      }

      // Start game on keypress from menu
      if (this.state === 'MENU' && (e.code === 'Enter' || e.code === 'Space' || e.code === 'KeyW' || e.key === ' ')) {
        this.closeModal('modal-start');
        this.sound.startBGM();
        this.state = 'PLAYING';
        return;
      }

      const isJumpKey = (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' || e.key === 'Up' || e.key === 'Spacebar');
      if (isJumpKey) {
        if (!this.keys['jump_held']) {
          this.keys['jump_pressed'] = true;
          this.keys['jump_held'] = true;
        }
      }
      if (e.code === 'KeyE' || e.key === 'e' || e.key === 'E') {
        this.tryTriggerCheckpoint();
      }
      if (e.code === 'KeyP' || e.code === 'Escape' || e.key === 'p' || e.key === 'P') {
        this.togglePause();
      }

      this.keys[e.code] = true;
      if (e.key) {
        this.keys[e.key] = true;
        this.keys[e.key.toLowerCase()] = true;
      }
    }, { passive: false });

    window.addEventListener('keyup', e => {
      const isJumpKey = (e.code === 'Space' || e.code === 'KeyW' || e.code === 'ArrowUp' || e.key === ' ' || e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp' || e.key === 'Up' || e.key === 'Spacebar');
      if (isJumpKey) {
        this.keys['jump_held'] = false;
      }
      this.keys[e.code] = false;
      if (e.key) {
        this.keys[e.key] = false;
        this.keys[e.key.toLowerCase()] = false;
      }
    });

    // Touch controls on mobile & desktop mouse
    const bindTouch = (id, keyName, isJump = false) => {
      const el = document.getElementById(id);
      if (!el) return;

      const press = (e) => {
        if (e && e.cancelable) e.preventDefault();
        this.sound.init();
        if (isJump) {
          this.keys['jump_pressed'] = true;
        }
        this.keys[keyName] = true;
        el.classList.add('active');
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      };

      const release = (e) => {
        if (e && e.cancelable) e.preventDefault();
        this.keys[keyName] = false;
        el.classList.remove('active');
      };

      el.addEventListener('touchstart', press, { passive: false });
      el.addEventListener('touchend', release, { passive: false });
      el.addEventListener('touchcancel', release);

      el.addEventListener('mousedown', press);
      el.addEventListener('mouseup', release);
      el.addEventListener('mouseleave', release);
    };

    bindTouch('touch-left', 'touch_left');
    bindTouch('touch-right', 'touch_right');
    bindTouch('touch-jump', 'touch_jump', true);
    bindTouch('touch-attack', 'touch_attack');

    // Auto-reveal virtual touch buttons when user touches screen on mobile/tablet
    window.addEventListener('touchstart', () => {
      const tc = document.getElementById('touch-controls');
      if (tc) tc.style.display = 'flex';
    }, { passive: true });

    const interactBtn = document.getElementById('touch-interact');
    if (interactBtn) {
      const triggerInteract = (e) => {
        if (e && e.cancelable) e.preventDefault();
        this.sound.init();
        this.tryTriggerCheckpoint();
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      };
      interactBtn.addEventListener('touchstart', triggerInteract, { passive: false });
      interactBtn.addEventListener('click', triggerInteract);
    }

    // HUD buttons
    document.getElementById('btn-audio-toggle')?.addEventListener('click', () => {
      this.sound.init();
      const unmuted = this.sound.toggleMute();
      document.getElementById('btn-audio-toggle').textContent = unmuted ? '🔊' : '🔇';
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });

    document.getElementById('btn-pause-toggle')?.addEventListener('click', () => {
      this.togglePause();
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });

    document.getElementById('btn-help-toggle')?.addEventListener('click', () => {
      this.showModal('modal-help');
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });

    document.getElementById('btn-close-help')?.addEventListener('click', () => {
      this.closeModal('modal-help');
      if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    });

    // Helper for multi-event clicks
    const bindBtn = (id, action) => {
      const el = document.getElementById(id);
      if (!el) return;
      const handler = (e) => {
        if (e && e.cancelable) e.preventDefault();
        this.sound.init();
        action();
        if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
      };
      el.addEventListener('click', handler);
      el.addEventListener('touchend', handler);
    };

    // Menu modal buttons
    bindBtn('btn-start-game', () => {
      this.sound.startBGM();
      this.closeModal('modal-start');
      this.state = 'PLAYING';
    });

    bindBtn('btn-show-help', () => {
      this.showModal('modal-help');
    });

    bindBtn('btn-resume-game', () => {
      this.togglePause();
    });

    bindBtn('btn-restart-from-pause', () => {
      this.closeModal('modal-pause');
      this.respawnX = 120;
      this.respawnY = 480;
      this.buildLevel();
      this.state = 'PLAYING';
    });

    bindBtn('btn-retry-game', () => {
      this.closeModal('modal-gameover');
      this.buildLevel();
      this.state = 'PLAYING';
    });

    bindBtn('btn-menu-from-go', () => {
      this.closeModal('modal-gameover');
      this.showModal('modal-start');
      this.state = 'MENU';
    });

    bindBtn('btn-play-again', () => {
      this.closeModal('modal-victory');
      this.respawnX = 120;
      this.respawnY = 480;
      this.buildLevel();
      this.state = 'PLAYING';
    });

    bindBtn('btn-menu-from-vic', () => {
      this.closeModal('modal-victory');
      this.showModal('modal-start');
      this.state = 'MENU';
    });
  }

  showModal(id) {
    document.getElementById(id)?.classList.add('active');
  }

  closeModal(id) {
    document.getElementById(id)?.classList.remove('active');
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.showModal('modal-pause');
    } else if (this.state === 'PAUSED') {
      this.closeModal('modal-pause');
      this.state = 'PLAYING';
    }
  }

  tryTriggerCheckpoint() {
    for (let gate of this.gates) {
      const isNear = gate.update(this.player);
      if (isNear && !gate.unlocked) {
        this.openQuizModal(gate);
        return;
      }
    }
    for (let shrine of this.shrines) {
      const isNear = shrine.update(this.player);
      if (isNear && !shrine.activated) {
        this.openQuizModal(shrine);
        return;
      }
    }
  }

  openQuizModal(targetObj) {
    this.currentCheckpoint = targetObj;
    this.state = 'QUIZ';
    const quizIdx = targetObj.quizIndex !== undefined ? targetObj.quizIndex : 0;
    const quiz = QUIZ_DATA[quizIdx] || QUIZ_DATA[0];

    document.getElementById('quiz-level-tag').textContent = quiz.badge;
    document.getElementById('quiz-title').textContent = quiz.title;
    document.getElementById('quiz-q-text').textContent = quiz.question;

    // Narasi Suara Ramah Anak (Web Speech API)
    speakQuestion(quiz.spokenText || quiz.question);

    const speakBtn = document.getElementById('btn-speak-question');
    if (speakBtn) {
      speakBtn.onclick = () => {
        speakQuestion(quiz.spokenText || quiz.question);
      };
    }

    const optList = document.getElementById('quiz-options-list');
    optList.innerHTML = '';

    const letters = ['A', 'B', 'C', 'D'];
    quiz.options.forEach((opt, idx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<span class="opt-badge">${letters[idx]}</span> <span>${opt.text}</span>`;
      btn.onclick = () => this.handleQuizAnswer(btn, opt.correct, quiz.explanation);
      optList.appendChild(btn);
    });

    const fBox = document.getElementById('quiz-feedback-box');
    fBox.className = 'quiz-feedback';
    fBox.style.display = 'none';

    document.getElementById('btn-quiz-continue').style.display = 'none';
    this.showModal('modal-quiz');
  }

  handleQuizAnswer(selectedBtn, isCorrect, explanation) {
    const fBox = document.getElementById('quiz-feedback-box');
    const continueBtn = document.getElementById('btn-quiz-continue');

    if (isCorrect) {
      // Non-punitive: Matikan semua tombol karena jawaban sudah benar!
      const allBtns = document.querySelectorAll('.quiz-opt-btn');
      allBtns.forEach(b => b.disabled = true);

      selectedBtn.classList.add('correct');
      fBox.className = 'quiz-feedback show-correct';
      fBox.innerHTML = `<strong>✨ HORE JAWABAN TEPAT! ✨</strong><br>${explanation}`;
      fBox.style.display = 'block';

      if (this.sound && this.sound.quizSuccess) this.sound.quizSuccess();
      speakQuestion("Hore! Hebat sekali! Jawaban adik pintar benar!");

      this.score += 500;
      this.player.health = this.player.maxHealth;
      this.player.mana = this.player.maxMana;
      this.particles.emit(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, 25, 'sparkle', '#34d399');

      if (this.currentCheckpoint) {
        this.currentCheckpoint.unlocked = true;
        this.currentCheckpoint.activated = true;
        this.respawnX = this.currentCheckpoint.x;
        this.respawnY = Math.min(480, this.currentCheckpoint.y);
      }

      continueBtn.style.display = 'inline-flex';
      continueBtn.textContent = 'LANJUTKAN MISI ➔';
      continueBtn.onclick = () => {
        this.closeModal('modal-quiz');
        this.state = 'PLAYING';
        this.updateHUD();
      };
    } else {
      // Format ramah anak usia 3-4 tahun:
      // Hanya matikan tombol salah yang disentuh, beri dorongan suara manis,
      // dan biarkan anak mencoba pilihan yang lain sampai benar!
      selectedBtn.classList.add('wrong');
      selectedBtn.disabled = true;

      fBox.className = 'quiz-feedback show-wrong';
      fBox.innerHTML = `<strong>🌱 AYO COBA LAGI SAYANG:</strong><br>Pilihan ini belum pas. Yuk sentuh pilihan lain yang bergambar sesuai!`;
      fBox.style.display = 'block';

      if (this.sound && this.sound.quizWrong) this.sound.quizWrong();
      speakQuestion("Ayo coba lagi sayang! Sentuh pilihan yang lain ya!");
    }
  }

  updateHUD() {
    const heartsContainer = document.getElementById('hud-hearts');
    if (heartsContainer) {
      heartsContainer.innerHTML = '';
      for (let i = 0; i < this.player.maxHealth; i++) {
        const span = document.createElement('span');
        span.className = `heart ${i < this.player.health ? '' : 'lost'}`;
        span.textContent = '❤️';
        heartsContainer.appendChild(span);
      }
    }

    const manaFill = document.getElementById('hud-mana-fill');
    if (manaFill) {
      const pct = Math.max(0, Math.min(100, (this.player.mana / this.player.maxMana) * 100));
      manaFill.style.width = `${pct}%`;
    }

    const scoreVal = document.getElementById('hud-score-val');
    if (scoreVal) scoreVal.textContent = this.score;

    const crysCount = document.getElementById('hud-crystals-count');
    if (crysCount) crysCount.textContent = `${this.collectedCrystals}/${this.totalCrystals}`;

    const bossHud = document.getElementById('boss-hud');
    if (bossHud) {
      if (this.boss && this.boss.active && !this.boss.defeated) {
        bossHud.style.display = 'flex';
        const bossPct = Math.max(0, Math.round((this.boss.hp / this.boss.maxHp) * 100));
        document.getElementById('boss-hp-text').textContent = `${bossPct}%`;
        document.getElementById('boss-hp-fill').style.width = `${bossPct}%`;
      } else {
        bossHud.style.display = 'none';
      }
    }
  }

  triggerGameOver() {
    this.state = 'GAMEOVER';
    document.getElementById('go-score').textContent = this.score;
    document.getElementById('go-crystals').textContent = `${this.collectedCrystals}/${this.totalCrystals}`;
    this.showModal('modal-gameover');
  }

  triggerVictory() {
    this.state = 'VICTORY';
    if (this.sound && this.sound.quizSuccess) this.sound.quizSuccess();
    document.getElementById('vic-score').textContent = this.score + 1000;
    document.getElementById('vic-crystals').textContent = `${this.collectedCrystals}/${this.totalCrystals}`;
    
    let stars = '⭐⭐';
    if (this.collectedCrystals >= 12 && this.player.health === 3) stars = '⭐⭐⭐';
    else if (this.collectedCrystals < 8) stars = '⭐';
    document.getElementById('vic-stars').textContent = stars;

    this.showModal('modal-victory');
  }

  update() {
    if (this.state !== 'PLAYING') return;

    for (let p of this.platforms) {
      if (p.update) p.update();
    }

    // Gerbang Transisi Antar Misi
    for (let gate of this.gates) {
      const isTouching = gate.update(this.player);
      if (isTouching && !gate.unlocked && this.state === 'PLAYING') {
        this.openQuizModal(gate);
        break;
      }
    }

    this.player.update(this.keys, this.platforms, this.sound, this.projectiles, this.particles);

    if (this.player.y > 700) {
      this.player.health = 0;
    }

    if (this.player.health <= 0) {
      this.triggerGameOver();
      return;
    }

    if (this.player.x > 2180 && !this.boss.active && !this.boss.defeated) {
      this.boss.active = true;
      if (this.sound && this.sound.bossRoar) this.sound.bossRoar();
    }

    if (this.boss && this.boss.active) {
      this.boss.update(this.player, this.sound, this.projectiles, this.particles);
      if (this.boss.defeated) {
        this.triggerVictory();
        return;
      }
    }

    for (let e of this.enemies) {
      e.update(this.player, this.platforms, this.sound, this.projectiles, this.particles);
    }

    const time = performance.now() * 0.05;
    for (let c of this.crystals) {
      c.update(time, this.player, this.sound, this.particles, () => {
        this.collectedCrystals++;
        this.score += 150;
        this.player.mana = Math.min(this.player.maxMana, this.player.mana + 35);
        this.updateHUD();
      });
    }

    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const proj = this.projectiles[i];
      if (proj instanceof Fireball) {
        proj.update(this.enemies, this.boss, this.sound, this.particles);
      } else if (proj instanceof IceBolt || proj instanceof GroundIceSpike) {
        proj.update(this.player, this.sound, this.particles);
      } else if (proj instanceof StoneBoulder) {
        proj.update(this.player, this.platforms, this.sound, this.particles);
      }
      if (proj.dead) {
        this.projectiles.splice(i, 1);
      }
    }

    if (Math.random() < 0.25) {
      this.particles.emit(this.cameraX + Math.random() * this.V_WIDTH, -10, 1, 'snow', '#ffffff');
    }
    this.particles.update();

    const targetCamX = this.player.x - this.V_WIDTH * 0.38;
    this.cameraX += (targetCamX - this.cameraX) * 0.08;
    this.cameraX = Math.max(0, Math.min(3100 - this.V_WIDTH, this.cameraX));

    this.updateHUD();
  }

  draw() {
    this.ctx.clearRect(0, 0, this.V_WIDTH, this.V_HEIGHT);

    // 1. Background
    const envImg = this.assets.get('environment');
    if (envImg) {
      const paraX = (this.cameraX * 0.35) % this.V_WIDTH;
      this.ctx.drawImage(envImg, -paraX, 0, this.V_WIDTH, this.V_HEIGHT);
      this.ctx.drawImage(envImg, this.V_WIDTH - paraX, 0, this.V_WIDTH, this.V_HEIGHT);
    } else {
      const grad = this.ctx.createLinearGradient(0, 0, 0, this.V_HEIGHT);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(0.6, '#0f172a');
      grad.addColorStop(1, '#0284c7');
      this.ctx.fillStyle = grad;
      this.ctx.fillRect(0, 0, this.V_WIDTH, this.V_HEIGHT);
    }

    // 2. Platforms
    for (let p of this.platforms) {
      const screenX = p.x - this.cameraX;
      if (screenX + p.w < -100 || screenX > this.V_WIDTH + 100) continue;

      this.ctx.save();
      if (p.isIce) {
        const iceGrad = this.ctx.createLinearGradient(screenX, p.y, screenX, p.y + p.h);
        iceGrad.addColorStop(0, '#7dd3fc');
        iceGrad.addColorStop(0.3, '#0284c7');
        iceGrad.addColorStop(1, '#0c4a6e');
        this.ctx.fillStyle = iceGrad;
        this.ctx.fillRect(screenX, p.y, p.w, p.h);

        this.ctx.fillStyle = '#f0f9ff';
        this.ctx.fillRect(screenX, p.y, p.w, 6);

        this.ctx.fillStyle = '#bae6fd';
        for (let ix = screenX + 12; ix < screenX + p.w - 12; ix += 24) {
          this.ctx.beginPath();
          this.ctx.moveTo(ix - 5, p.y + p.h);
          this.ctx.lineTo(ix + 5, p.y + p.h);
          this.ctx.lineTo(ix, p.y + p.h + 14);
          this.ctx.closePath();
          this.ctx.fill();
        }
      } else {
        this.ctx.fillStyle = p.color || '#334155';
        this.ctx.fillRect(screenX, p.y, p.w, p.h);

        this.ctx.fillStyle = '#e2e8f0';
        this.ctx.fillRect(screenX, p.y, p.w, 5);
      }
      this.ctx.restore();
    }

    // 2.5 Gerbang Transisi Misi
    for (let gate of this.gates) {
      gate.draw(this.ctx, this.cameraX);
    }

    // 3. Checkpoint Shrines
    for (let shrine of this.shrines) {
      const isNear = shrine.update(this.player);
      shrine.draw(this.ctx, this.cameraX, isNear);
    }

    // 4. Collectibles
    const time = performance.now() * 0.05;
    for (let c of this.crystals) {
      c.draw(this.ctx, this.cameraX, this.assets, time);
    }

    // 5. Enemies
    for (let e of this.enemies) {
      e.draw(this.ctx, this.cameraX, this.assets);
    }

    // 6. Boss
    if (this.boss && this.boss.active) {
      this.boss.draw(this.ctx, this.cameraX, this.assets);
    }

    // 7. Projectiles
    for (let proj of this.projectiles) {
      proj.draw(this.ctx, this.cameraX);
    }

    // 8. Player
    this.player.draw(this.ctx, this.cameraX, this.assets);

    // 9. Particles
    this.particles.draw(this.ctx, this.cameraX);
  }

  loop() {
    try {
      this.update();
      this.draw();
    } catch (err) {
      console.error("Game loop exception caught safely:", err);
    }
    requestAnimationFrame(() => this.loop());
  }
}

// Robust bootstrap: works even if DOMContentLoaded already fired!
function initGame() {
  if (!window.game) {
    window.game = new Game();
    window.game.loop();
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}
