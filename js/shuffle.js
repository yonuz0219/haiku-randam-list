// ===== シャッフルアルゴリズム =====
// ルール:
//  1. 作品1〜5の列ごとにグループ化し、グループ内20作品をシャッフル
//  2. 作品番号は全100作品で連続（グループ1: 1-20, グループ2: 21-40 ...）
//  3. 同一作者の間隔を3作品以上空ける（グループ境界またぎも含む）
//  4. 作者番号5（重要人物）は各グループの中央付近（9〜12番目）に配置

const IMPORTANT_AUTHOR_NUMBER = 5;
const GROUP_SIZE = 20; // 1グループの作品数
const NUM_GROUPS = 5;
const MAX_RETRY = 500; // 制約違反時の最大リトライ数

/**
 * @param {Array} authors readExcelFile() が返す配列
 * @returns {Array<{workNumber, groupNumber, authorNumber, name, penName, work}>}
 */
function shuffleWorks(authors) {
  let result = [];

  for (let g = 0; g < NUM_GROUPS; g++) {
    const groupWorks = buildGroupWorks(authors, g);
    const prevAuthors = result.slice(-3).map(w => w.authorNumber);

    const shuffled = shuffleGroupWithConstraints(groupWorks, prevAuthors);

    const startNum = g * GROUP_SIZE + 1;
    shuffled.forEach((w, i) => {
      w.workNumber = startNum + i;
      w.groupNumber = g + 1;
    });

    result = result.concat(shuffled);
  }

  return result;
}

// 指定グループのworkオブジェクト配列を生成
function buildGroupWorks(authors, groupIndex) {
  return authors.map(a => ({
    authorNumber: a.authorNumber,
    name:         a.name,
    penName:      a.penName,
    work:         a.works[groupIndex],
  }));
}

// 制約付きシャッフル（重要人物の中央配置 + 同一作者間隔）
function shuffleGroupWithConstraints(works, prevAuthors) {
  for (let attempt = 0; attempt < MAX_RETRY; attempt++) {
    const candidate = tryShuffleOnce(works);
    if (isValid(candidate, prevAuthors)) return candidate;
  }
  // MAX_RETRY超過時: 最後の試行結果を返す（ほぼ起きないが保護）
  return tryShuffleOnce(works);
}

function tryShuffleOnce(works) {
  // 重要人物を分離
  const importantIdx = works.findIndex(w => w.authorNumber === IMPORTANT_AUTHOR_NUMBER);
  const importantWork = works[importantIdx];
  const others = works.filter((_, i) => i !== importantIdx);

  // 残り19名をFisher-Yatesでシャッフル
  fisherYates(others);

  // 重要人物を中央付近（インデックス8〜11 = 9〜12番目）に挿入
  // 20人中の中央: 8,9,10,11 のいずれかをランダムに選ぶ
  const insertPos = 8 + Math.floor(Math.random() * 4);
  others.splice(insertPos, 0, importantWork);

  return others;
}

// Fisher-Yatesシャッフル（破壊的）
function fisherYates(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

// 制約チェック: 同一作者が3作品以内に連続していないか
function isValid(works, prevAuthors) {
  // グループ冒頭: 前グループ末尾3作品との重複チェック
  for (let i = 0; i < Math.min(3, works.length); i++) {
    for (let j = 0; j < prevAuthors.length; j++) {
      if (works[i].authorNumber === prevAuthors[j]) {
        const gap = i + (prevAuthors.length - j); // 境界をまたいだ距離
        if (gap <= 3) return false;
      }
    }
  }

  // グループ内チェック
  for (let i = 1; i < works.length; i++) {
    if (works[i].authorNumber === works[i - 1].authorNumber) return false;
    if (i >= 2 && works[i].authorNumber === works[i - 2].authorNumber) return false;
    if (i >= 3 && works[i].authorNumber === works[i - 3].authorNumber) return false;
  }

  return true;
}
