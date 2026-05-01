// ===== Word縦書きファイル生成 =====
// JSZipでOOXML(.docx)を直接構築する。
// 縦書き(tbRl)、縦中横（2桁以上の数字を横組み）に対応。

async function generateWordDocument(works) {
  const zip = new JSZip();

  zip.file('[Content_Types].xml', contentTypesXml());
  zip.file('_rels/.rels', relsXml());
  zip.file('word/document.xml', documentXml(works));
  zip.file('word/_rels/document.xml.rels', documentRelsXml());
  zip.file('word/settings.xml', settingsXml());
  zip.file('word/styles.xml', stylesXml());

  const blob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  downloadBlob(blob, '俳句シャッフル結果_縦書き.docx');
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 3000);
}

// ===== OOXML パーツ =====

function contentTypesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml"
    ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/settings.xml"
    ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/>
  <Override PartName="/word/styles.xml"
    ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>`;
}

function relsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument"
    Target="word/document.xml"/>
</Relationships>`;
}

function documentRelsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/settings"
    Target="settings.xml"/>
  <Relationship Id="rId2"
    Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles"
    Target="styles.xml"/>
</Relationships>`;
}

function settingsXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:settings xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:compat>
    <w:compatSetting w:name="compatibilityMode"
      w:uri="http://schemas.microsoft.com/office/word" w:val="15"/>
  </w:compat>
</w:settings>`;
}

function stylesXml() {
  // 明朝体を基本フォントとして定義
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="MS Mincho" w:eastAsia="MS Mincho" w:hAnsi="MS Mincho"/>
        <w:sz w:val="24"/>
        <w:szCs w:val="24"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="0"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>`;
}

// ===== document.xml 本体 =====

function documentXml(works) {
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"';
  const paragraphs = works.map((work, i) => workParagraph(work, i + 1)).join('\n');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document ${W}>
  <w:body>
${paragraphs}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16840"/>
      <w:pgMar w:top="1800" w:right="2200" w:bottom="1800" w:left="2200"
               w:header="851" w:footer="992" w:gutter="0"/>
      <w:textDirection w:val="tbRl"/>
    </w:sectPr>
  </w:body>
</w:document>`;
}

// 半角数字を全角数字に変換（例: "55" → "５５"）
// 全角数字は東アジア文字扱いのため、tbRl縦書きで自動的に正立する
function toFullWidth(str) {
  return str.replace(/[0-9]/g, c => String.fromCharCode(c.charCodeAt(0) + 0xFEE0));
}

/**
 * 1作品 = 1段落。
 * 作品番号（1桁=全角正立、2桁以上=全角＋縦中横横並び）＋全角スペース＋作品テキスト
 */
function workParagraph(work, tatechuId) {
  const numStr = String(work.workNumber);

  let numRun;
  if (numStr.length === 1) {
    // 1桁: sz を2桁と同じ36に揃えて視覚サイズを統一する
    numRun = `<w:r>
        <w:rPr>
          <w:rFonts w:hint="eastAsia"/>
          <w:sz w:val="36"/>
          <w:szCs w:val="36"/>
          <w:eastAsianLayout w:id="${tatechuId}" w:combine="1" w:combineBrackets="none"/>
        </w:rPr>
        <w:t>${toFullWidth(numStr)}</w:t>
      </w:r>`;
  } else {
    // 2桁以上: 全角数字 + 縦中横
    // tbRl縦書きでは combine 内の文字が右から左に並ぶため、
    // 逆順で書き込むことで表示上の桁順を正しくする（例: "10"→逆順"01"で書込→表示"10"）
    // combine による圧縮で視覚的に小さくなるため、sz を 1.5倍にして補正する
    const reversedFw = toFullWidth(numStr.split('').reverse().join(''));
    numRun = `<w:r>
        <w:rPr>
          <w:rFonts w:hint="eastAsia"/>
          <w:sz w:val="36"/>
          <w:szCs w:val="36"/>
          <w:eastAsianLayout w:id="${tatechuId}" w:combine="1" w:combineBrackets="none"/>
        </w:rPr>
        <w:t>${reversedFw}</w:t>
      </w:r>`;
  }

  return `    <w:p>
      <w:pPr>
        <w:spacing w:after="120" w:line="360" w:lineRule="auto"/>
        <w:textDirection w:val="tbRl"/>
      </w:pPr>
      ${numRun}
      <w:r><w:t xml:space="preserve">　</w:t></w:r>
      <w:r><w:t>${escXml(work.work)}</w:t></w:r>
    </w:p>`;
}

function escXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
