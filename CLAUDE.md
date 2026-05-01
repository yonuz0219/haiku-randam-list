# haiku-randam-list

俳句の作品をランダムに並び替えて出力するWebアプリ。

## 技術スタック

- **フロントエンド**: HTML / CSS / JavaScript
- **データストア**: Google ドキュメント（俳句データの管理）
- **バックエンド**: Google Apps Script (GAS)

## アーキテクチャ概要

```
Google ドキュメント（俳句データ）
        ↓ GAS (データ取得・ランダム並び替えロジック)
        ↓ JSON レスポンス
HTML/CSS/JavaScript フロントエンド（表示）
```

## ディレクトリ構成（予定）

```
haiku-randam-list/
├── CLAUDE.md
├── index.html        # メイン画面
├── style.css         # スタイル
├── script.js         # フロントエンドロジック（GAS呼び出し含む）
└── gas/
    └── Code.gs       # GAS スクリプト（データ取得・シャッフル）
```

## 開発ルール

- コメントは原則書かない。理由が自明でない場合のみ1行で記載する
- 返答・コミットメッセージは日本語で統一する
- GASのWeb APIはJSONPまたはCORSに対応した形式で実装する
- Google ドキュメントのデータ形式は1行1俳句（作者名を含む場合はタブ区切り）を基本とする

## GAS デプロイ

GASスクリプトは「ウェブアプリとしてデプロイ」し、アクセス権は「全員（匿名ユーザーを含む）」に設定する。
フロントエンドからは `fetch()` でエンドポイントURLを叩く。

## 注意事項

- GASのエンドポイントURLは公開リポジトリにコミットしない
- Google ドキュメントのIDも同様に直接コードに埋め込まない（GAS側で管理する）

## GitHubリポジトリ

https://github.com/yonuz0219/haiku-randam-list

## 公開URL（GitHub Pages）

https://yonuz0219.github.io/haiku-randam-list/
