/**
 * データ定義
 * 将来のAI連携・拡張を想定した構造
 */
const dishes = [
    {
        id: "D001",
        name: "豚こまのスタミナ炒め",
        moods: ["tired"],
        cookTime: 10
    },
    {
        id: "D002",
        name: "冷凍うどんの釜玉",
        moods: ["tired"],
        cookTime: 5
    },
    {
        id: "D003",
        name: "サバ缶のトマト煮",
        moods: ["tired", "energetic"],
        cookTime: 15
    },
    {
        id: "D004",
        name: "手作りハンバーグ",
        moods: ["energetic"],
        cookTime: 40
    },
    {
        id: "D005",
        name: "具だくさん筑前煮",
        moods: ["energetic"],
        cookTime: 50
    },
    {
        id: "D006",
        name: "親子丼",
        moods: ["tired"],
        cookTime: 15
    },
    {
        id: "D007",
        name: "ロールキャベツ",
        moods: ["energetic"],
        cookTime: 60
    },
    {
        id: "D008",
        name: "豚汁と焼き魚",
        moods: ["energetic"],
        cookTime: 30
    }
];

// 状態管理
let currentMood = null;
let currentDish = null;

// DOM要素の取得
const screenHome = document.getElementById('home-screen');
const screenResult = document.getElementById('result-screen');
const displayDish = document.getElementById('dish-display');

// ボタン要素
const btnTired = document.getElementById('btn-tired');
const btnEnergetic = document.getElementById('btn-energetic');
const btnRetry = document.getElementById('btn-retry');
const btnRecipe = document.getElementById('btn-recipe');
const linkBack = document.getElementById('link-back');

/**
 * 初期化処理
 */
function init() {
    // 気分選択ボタン
    btnTired.addEventListener('click', () => startRoulette('tired'));
    btnEnergetic.addEventListener('click', () => startRoulette('energetic'));

    // 結果画面のアクション
    btnRetry.addEventListener('click', () => spinRoulette());
    btnRecipe.addEventListener('click', openRecipeSearch);
    linkBack.addEventListener('click', (e) => {
        e.preventDefault();
        resetApp();
    });
}

/**
 * ルーレット開始フロー
 * @param {string} mood - 'tired' or 'energetic'
 */
function startRoulette(mood) {
    currentMood = mood;
    
    // 画面切り替え
    screenHome.classList.add('hidden');
    screenResult.classList.remove('hidden');
    
    // 抽選実行
    spinRoulette();
}

/**
 * 抽選ロジック
 */
function spinRoulette() {
    if (!currentMood) return;

    // 気分に合致する献立をフィルタリング
    const candidates = dishes.filter(dish => dish.moods.includes(currentMood));

    if (candidates.length === 0) {
        displayDish.textContent = "該当する献立がありません";
        currentDish = null;
        return;
    }

    // ランダム選択
    const randomIndex = Math.floor(Math.random() * candidates.length);
    currentDish = candidates[randomIndex];

    // 表示更新
    displayDish.textContent = currentDish.name;
}

/**
 * レシピ検索（Google検索を別タブで開く）
 */
function openRecipeSearch() {
    if (!currentDish) return;
    
    const query = `${currentDish.name} レシピ`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    
    window.open(url, '_blank');
}

/**
 * アプリを初期状態に戻す
 */
function resetApp() {
    currentMood = null;
    currentDish = null;
    screenResult.classList.add('hidden');
    screenHome.classList.remove('hidden');
}

// アプリ起動
init();