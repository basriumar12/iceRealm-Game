# ❄️ Ice Realm Adventure: Petualangan Rubah & Penjaga Es

Game **Adventure Platformer** edukatif 2D yang dikembangkan menggunakan **HTML5 Canvas**, **CSS3**, dan **JavaScript Vanilla** (murni tanpa dependensi eksternal). Game ini dirancang secara khusus responsif untuk dimainkan di perangkat **Laptop (Desktop)** maupun **Smartphone / HP (Touchscreen)**.

---

## 🦊 Sinopsis & Karakter Permainan
Kuil kuno di puncak dunia es yang membeku telah kehilangan keseimbangan energi kristalnya. Kamu mengendalikan **Rubah Oranye Pemberani** (Fox Hero) yang berbekal syal biru penahan dingin, tas petualang, dan kemampuan sihir bola api untuk menembus rintangan es:

1. **Rubah Oranye (Fox Adventurer)**: Karakter utama protagonis yang lincah, memiliki kemampuan lari, melompat (*Jump*), *Double Jump* di udara, serta menembakkan bola api untuk melelehkan es dan mengalahkan musuh.
2. **Ice Guardian (Bos Kuil Es Kuno)**: Penjaga raksasa berbulu putih dengan tanduk melengkung dan rune bercahaya cyan. Menguasai 3 jenis serangan mematikan: *Frost Wave*, *Ice Spikes Slam*, dan *Horn Charge*.
3. **Kristal Ungu (Purple Rune Crystals)**: Kristal magis melayang yang tersebar di sepanjang platform. Berfungsi menambah skor (+150) dan mengisi ulang energi mana bola api rubah (+35 mana).
4. **Stone Golem**: Monster batu kuno berlumut hijau yang berpatroli di lantai batu. Memiliki langkah berat dan mampu melemparkan batu bergulir ke arah rubah. Dapat dikalahkan dengan 2 tembakan bola api atau diinjak kepalanya!
5. **Ice Elemental**: Roh es melayang dengan gerakan meliuk (*sinusoidal wave*). Menembakkan proyektil duri es dingin ke arah pemain.

---

## 🎮 Panduan Kontrol

### 💻 Laptop & Komputer (Keyboard):
| Tombol | Aksi |
|---|---|
| **A / D** atau **Panah Kiri / Kanan** | Bergerak ke kiri / kanan |
| **W / Spasi / Panah Atas** | Melompat (*Jump*) & Tekan 2x untuk *Double Jump* |
| **S / Panah Bawah** | Menunduk / Turun dari platform tembus |
| **J / Z / F / X** | Menembak Bola Api (Menghabiskan 25 Mana) |
| **E** | Berinteraksi dengan Altar Checkpoint (Membuka Kuis) |
| **P / ESC** | Jeda Permainan (*Pause*) |

### 📱 Smartphone / HP / Tablet (Layar Sentuh):
- **◀ ▶ (D-Pad Kiri)**: Mengarahkan rubah ke kiri dan kanan.
- **▲ (Tombol Biru Kanan)**: Melompat dan *Double Jump*.
- **🔥 (Tombol Oranye Kanan)**: Menembakkan bola api rubah.
- **📜 (Tombol Ungu Kanan)**: Membaca dan mengaktifkan Altar Checkpoint Kuno.

---

## 📚 Sistem Pembelajaran (Educational Checkpoints)
Di sepanjang perjalanan terdapat **3 Altar Kuno Batu Bertuliskan Rune**:
- **Checkpoint 1 (Lembah Es)**: Sains Perubahan Wujud Zat & Termodinamika (Anomali air, mengapa es terapung di danau beku dan massa jenis es).
- **Checkpoint 2 (Kuil Rune Kuno)**: Logika Pemrograman & Algoritma Game (Logika kondisional `if-else`, variabel counter pada *Double Jump*, dan simulasi gravitasi).
- **Checkpoint 3 (Gerbang Tahta Es)**: Ekologi & Sains Iklim Kutub (Efek Albedo pada gletser dan pencegahan pemanasan global).

> **Hadiah Menjawab Benar**: Memulihkan seluruh hati nyawa rubah (100% HP), mengisi penuh mana, memberikan bonus +500 skor, dan menyimpan titik respawn checkpoint!

---

## ⚙️ Fitur Teknis & Arsitektur Kode
- **HTML5 Canvas 60 FPS**: Render dinamis beresolusi virtual 1280x720 dengan auto-scaling responsif ke rasio layar apapun.
- **Synthesizer Web Audio API**: Efek suara sintetis prosedural murni tanpa file audio eksternal (lompat, double jump, crystal chime, bola api, ledakan, raungan bos, buzzer kuis, dan ambient BGM es).
- **Physics Engine**:
  - *AABB (Axis-Aligned Bounding Box)* collision detection.
  - Platform es licin dengan inersia luncur (*slippery ice friction*).
  - Platform tembus (*one-way platforms*).
  - Platform bergerak (*moving platforms*) yang membawa momentum karakter.
- **Particle System**: Salju melayang lembut, percikan api, kilau ungu kristal, dan serpihan es saat musuh hancur.
- **Boss Fight Multi-Phase**: Status bos lengkap dengan *Boss Health Bar* di bagian atas layar.

---

## 🚀 Cara Menjalankan Proyek

### Cara 1: Langsung Buka di Browser (Paling Mudah)
Cukup klik ganda (*double click*) file **`index.html`** di dalam folder `iceRealm/` menggunakan browser modern apa saja (Google Chrome, Mozilla Firefox, Safari, Microsoft Edge).

### Cara 2: Menjalankan dengan Local Web Server (Direkomendasikan)
Gunakan terminal / command prompt di folder `gameHtml`:
```bash
# Menggunakan Python 3:
python3 -m http.server 8080

# Kemudian buka di browser:
http://localhost:8080/iceRealm/index.html
# atau halaman portal utama:
http://localhost:8080/index.html
```

