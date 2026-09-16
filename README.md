# My Sites v0.8

v0.3をベースに、Safariなどの共有メニューからURLを受け取って登録画面へ渡す仕組み（Web Share Target）を追加しました。

## 使い方
1. GitHub Pages等で公開
2. iPhoneのSafariでMy Sitesを開く
3. 「ホーム画面に追加」してPWAとしてインストール
4. Safariで登録したいサイトを開く
5. 共有 → My Sites
6. My Sitesが開き、URLと共有されたタイトルを登録フォームに入れます
7. カテゴリ・タグ等を設定して保存

※ iOS/SafariのバージョンやPWAの状態によって、共有先として表示されない場合があります。その場合はMy Sitesを通常どおり開いて「＋登録」を使ってください。

## ChatGPT共有
「ChatGPTに変更分を共有」は前回同期以降に変更されたサイトだけをJSONにします。「全データを共有」は登録済みサイト全件をJSONにします。対応環境では共有シートを利用し、それ以外ではJSONファイルを保存します。

## 保存
サイトデータはIndexedDBに端末内保存します。クラウドDBや課金APIは使用していません。


## v0.7 ChatGPT連携
ChatGPT側で作成したサイト情報を `?add=` URLでMy Sitesへ渡せます。
My Sitesは起動時に登録内容を確認し、承認するとIndexedDBへ保存します。
同じURLが登録済みなら、既存データを更新できます。

PayloadはUTF-8 JSONをURL-safe Base64化しています。


## v0.7 追加
- Safari等の共有から `url/title/text` を受け取って登録フォームを開く処理を追加
- ChatGPT登録リンクとの併用に対応


## v0.7
- ChatGPTに全データを共有するファイル共有に加え、ChatGPTへ貼り付けるJSONをクリップボードへコピーできます。
- iPad/iPhoneでは「📋 ChatGPT用データをコピー」を押し、ChatGPTのチャットに貼り付けてください。
- データは引き続きブラウザ内のIndexedDBに保存されます。


## v0.8
- 「ChatGPT検索用プロンプトをコピー」を追加しました。
- My Sitesの全登録データと、質問を書き込むためのテンプレートを一度にコピーできます。
- ChatGPT側では貼り付けた登録データだけを使って、カテゴリ・タグ・説明・メモなどから検索できます。
- v0.7までのSafari共有、ChatGPTからの `?add=` 登録、JSON共有、IndexedDB保存は維持しています。
