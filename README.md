### idris2-sample playground

ミニマルな Idris2 サンプルです。`TaskTypes.idr` で型とビジネスロジックを定義し、`BoardData.idr`（自動生成）で初期タスクを決め、`Main.idr` から実行します。

#### CLI の使い方

```
idris2 --build idris2-sample.ipkg
./build/exec/idris2-sample
```

実行すると初期ボード、更新後ボード、サマリが標準出力へ表示されます。

#### HTML UI との連携

1. `board-config.json` が現在のタスク定義です。
2. `scripts/generate-board.js` がこの JSON から `src/BoardData.idr` を生成します。
3. `ui/server.js` を起動するとブラウザ UI からタスクを編集し、JSON 保存→Idris2 再生成→ビルド→`idris2-cov` 実行までを行います。

```
node ui/server.js
# -> http://localhost:3338 にアクセス
```

UI で編集→「Apply changes」を押すと `board-config.json` が書き換わり、自動で

1. `node scripts/generate-board.js`
2. `idris2 --build idris2-sample.ipkg`
3. `./build/exec/idris2-sample`
4. `../idris2-coverage/build/exec/idris2-cov --json --top 5 .`

が実行されます。結果は UI の `CLI Output` と `Coverage Summary` に表示されます。タスク数や状態を変えるたびに Idris2 のソースが再生成されるので、`idris2-cov` の出力も合わせて変化します。
