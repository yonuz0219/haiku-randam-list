// ===== シャッフルアルゴリズム（オプション版・人数・作品数可変）=====
// ルール:
//  1. 作品列ごとにグループ化し、グループ内をシャッフル
//  2. 作品番号は全作品で連続（グループ1: 1〜N, グループ2: N+1〜2N ...）
//  3. 同一作者の間隔を minGap = min(3, floor(人数/2)) 以上空ける（グループ境界またぎも含む）
//  4. 最終行の作者（重要人物）は各グループの中央付近（40%〜60%の位置）に配置
//  5. 前グループの先頭と次グループの先頭が同一作者にならないようにする

const OPTION_MAX_RETRY = 500;

/**
 * @param {Array} authors readExcelFile() が返す配列（最終要素の isImportant が true）
 * @param {number} worksPerAuthor 1人あたりの作品数（グループ数）
 * @returns {Array<{workNumber, groupNumber, authorNumber, name, penName, work}>}
 */
function shuffleWorks(authors, worksPerAuthor) {
  const numAuthors = authors.length;
  const minGap = Math.min(3, Math.floor(numAuthors / 2));
  let result = [];
  let prevGroupFirstAuthor = null;

  for (let g = 0; g < worksPerAuthor; g++) {
    const groupWorks = buildGroupWorks(authors, g);
    const prevAuthors = result.slice(-minGap).map(w => w.authorNumber);
    const shuffled = shuffleGroupWithConstraints(groupWorks, prevAuthors, numAuthors, minGap, prevGroupFirstAuthor);

    const startNum = g * numAuthors + 1;
    shuffled.forEach((w, i) => {
      w.workNumber = startNum + i;
      w.groupNumber = g + 1;
    });

    prevGroupFirstAuthor = shuffled[0].authorNumber;
    result = result.concat(shuffled);
  }

  return result;
}

function buildGroupWorks(authors, groupIndex) {
  return authors.map(a => ({
    authorNumber: a.authorNumber,
    name:         a.name,
    penName:      a.penName,
    work:         a.works[groupIndex],
    isImportant:  a.isImportant,
  }));
}

function shuffleGroupWithConstraints(works, prevAuthors, groupSize, minGap, prevGroupFirstAuthor) {
  for (let attempt = 0; attempt < OPTION_MAX_RETRY; attempt++) {
    const candidate = tryShuffleOnce(works, groupSize);
    if (isValidOption(candidate, prevAuthors, minGap, prevGroupFirstAuthor)) return candidate;
  }
  return tryShuffleOnce(works, groupSize);
}

function tryShuffleOnce(works, groupSize) {
  const importantIdx = works.findIndex(w => w.isImportant);
  const importantWork = works[importantIdx];
  const others = works.filter((_, i) => i !== importantIdx);

  fisherYatesOption(others);

  // 中央付近（40%〜60%）にランダム挿入
  const centerStart = Math.floor(groupSize * 0.4);
  const centerEnd = Math.ceil(groupSize * 0.6);
  const range = Math.max(1, centerEnd - centerStart);
  const insertPos = centerStart + Math.floor(Math.random() * range);
  others.splice(insertPos, 0, importantWork);

  return others;
}

function fisherYatesOption(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function isValidOption(works, prevAuthors, minGap, prevGroupFirstAuthor) {
  // グループ先頭が前グループの先頭と同一作者にならないチェック
  if (prevGroupFirstAuthor !== null && works[0].authorNumber === prevGroupFirstAuthor) {
    return false;
  }

  // グループ境界またぎの間隔チェック
  for (let i = 0; i < Math.min(minGap, works.length); i++) {
    for (let j = 0; j < prevAuthors.length; j++) {
      if (works[i].authorNumber === prevAuthors[j]) {
        const gap = i + (prevAuthors.length - j);
        if (gap <= minGap) return false;
      }
    }
  }

  // グループ内の間隔チェック
  for (let i = 1; i < works.length; i++) {
    for (let k = 1; k <= minGap; k++) {
      if (i >= k && works[i].authorNumber === works[i - k].authorNumber) return false;
    }
  }

  return true;
}
