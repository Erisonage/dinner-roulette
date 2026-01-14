// ==========================================
// 1. Firebase設定 (自分のものに書き換える！)
// ==========================================
const firebaseConfig = {
    apiKey: "AIzaSyAH0qUgnG2StDLum0nyfzFxoo90B_sriOY",
  authDomain: "dinner-roulette-f7546.firebaseapp.com",
  projectId: "dinner-roulette-f7546",
  storageBucket: "dinner-roulette-f7546.firebasestorage.app",
  messagingSenderId: "245857154378",
  appId: "1:245857154378:web:7bfbc4db2c7f86bfe8fdb3",
  measurementId: "G-QFMKL39WR5"
};

// Firebase初期化
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ==========================================
// 2. データ管理（ローカルキャッシュ）
// ==========================================
let dishesCache = []; // DBから取得した全データをここに保持

/**
 * 初期データ投入用（初回のみ手動で呼ぶか、DBが空の時に使用）
 */
const initialDishes = [
    { name: "豚こまのスタミナ炒め", moods: ["tired"], likes: 0 },
    { name: "冷凍うどんの釜玉", moods: ["tired"], likes: 0 },
    { name: "サバ缶のトマト煮", moods: ["tired", "energetic"], likes: 0 },
    { name: "手作りハンバーグ", moods: ["energetic"], likes: 0 },
    { name: "具だくさん筑前煮", moods: ["energetic"], likes: 0 }
];

// DBからリアルタイムでデータを取得（onSnapshot）
// これで「誰かが追加したら即座に全員に反映」されます
db.collection("dishes").onSnapshot((snapshot) => {
    dishesCache = [];
    snapshot.forEach((doc) => {
        dishesCache.push({
            id: doc.id,
            ...doc.data()
        });
    });
    console.log("データ更新完了:", dishesCache.length + "件");
});

// ==========================================
// 3. アプリロジック
// ==========================================
let currentMood = null;
let currentDish = null;
let isSpinning = false; // ルーレット回転中フラグ

// DOM要素
const screenHome = document.getElementById('home-screen');
const screenResult = document.getElementById('result-screen');
const displayDish = document.getElementById('dish-display');
const btnLike = document.getElementById('btn-like');
const likeCount = document.getElementById('like-count');

// ボタンイベント設定
document.getElementById('btn-tired').addEventListener('click', () => startRoulette('tired'));
document.getElementById('btn-energetic').addEventListener('click', () => startRoulette('energetic'));
document.getElementById('btn-retry').addEventListener('click', () => spinRoulette());
document.getElementById('btn-recipe').addEventListener('click', openRecipeSearch);
document.getElementById('link-back').addEventListener('click', (e) => { e.preventDefault(); resetApp(); });
document.getElementById('btn-submit').addEventListener('click', addNewDish);
btnLike.addEventListener('click', addLike);

/**
 * ルーレット開始フロー
 */
function startRoulette(mood) {
    if (dishesCache.length === 0) {
        alert("データを読み込み中です。少々お待ちください...");
        return;
    }
    currentMood = mood;
    screenHome.classList.add('hidden');
    screenResult.classList.remove('hidden');
    spinRoulette();
}

/**
 * ① 演出：パラパラ漫画アニメーション付き抽選
 */
function spinRoulette() {
    if (isSpinning) return;
    isSpinning = true;

    // 気分に合う候補を抽出
    const candidates = dishesCache.filter(dish => dish.moods.includes(currentMood));
    if (candidates.length === 0) {
        displayDish.textContent = "候補がありません";
        isSpinning = false;
        return;
    }

    // UIリセット
    displayDish.classList.add('shuffling'); // ブルブルさせるクラス
    btnLike.disabled = true; // 抽選中はいいね不可
    likeCount.textContent = "-";

    // パラパラアニメーション (100msごとに書き換え)
    let count = 0;
    const intervalId = setInterval(() => {
        const tempIndex = Math.floor(Math.random() * candidates.length);
        displayDish.textContent = candidates[tempIndex].name;
        count++;
    }, 80);

    // 1.5秒後にストップ
    setTimeout(() => {
        clearInterval(intervalId);
        
        // 最終決定
        const finalIndex = Math.floor(Math.random() * candidates.length);
        currentDish = candidates[finalIndex];
        
        // 表示更新
        displayDish.textContent = currentDish.name;
        displayDish.classList.remove('shuffling');
        
        // いいね数の表示
        likeCount.textContent = currentDish.likes || 0;
        btnLike.disabled = false;
        
        isSpinning = false;
    }, 1500);
}

/**
 * ② 人気投票：いいね機能（バックグラウンド集計）
 */
function addLike() {
    if (!currentDish || !currentDish.id) return;

    // UI上の即時反映（UX向上）
    const currentCount = parseInt(likeCount.textContent) || 0;
    likeCount.textContent = currentCount + 1;
    btnLike.disabled = true; // 連打防止

    // DB更新 (incrementを使うと安全にカウントアップできる)
    const dishRef = db.collection("dishes").doc(currentDish.id);
    dishRef.update({
        likes: firebase.firestore.FieldValue.increment(1)
    }).catch(error => {
        console.error("Like failed:", error);
        alert("いいねに失敗しました");
        btnLike.disabled = false;
    });
}

/**
 * ③ 投稿・即時反映・フィルタリング
 */
function addNewDish() {
    const inputName = document.getElementById('input-dish');
    const inputMood = document.getElementById('input-mood');
    const name = inputName.value.trim();
    const mood = inputMood.value;

    // フィルタリングロジック（ふざけた入力対策）
    if (!name) {
        alert("料理名を入力してください");
        return;
    }
    if (name.length > 20) {
        alert("料理名は20文字以内でお願いします");
        return;
    }
    
    // NGワード簡易チェック（必要に応じて増やしてください）
    const ngWords = ["うんこ", "死", "馬鹿", "殺", "test"];
    if (ngWords.some(word => name.includes(word))) {
        alert("不適切な言葉が含まれています。まじめにやってください！");
        return;
    }

    // DBに追加
    db.collection("dishes").add({
        name: name,
        moods: [mood],
        likes: 0,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert(`「${name}」を追加しました！ルーレット候補に入ります。`);
        inputName.value = ""; // 入力欄クリア
    }).catch((error) => {
        console.error("Error adding document: ", error);
        alert("追加に失敗しました。");
    });
}

/**
 * その他ユーティリティ
 */
function openRecipeSearch() {
    if (!currentDish) return;
    window.open(`https://www.google.com/search?q=${encodeURIComponent(currentDish.name + " レシピ")}`, '_blank');
}

function resetApp() {
    currentMood = null;
    currentDish = null;
    screenResult.classList.add('hidden');
    screenHome.classList.remove('hidden');
}