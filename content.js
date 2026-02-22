// 翻訳（和訳英訳）ポップアップ
// ポップアップ用の <div> を作成
const popup = document.createElement('div');
// CSSクラスを付与する
popup.className = 'ja-en-translation-popup';
// resultContainerとして、翻訳した文章を格納する場所を作成
const resultContainer = document.createElement('div');
// CSSクラスを付与する
resultContainer.className = 'ja-en-result';
// 作成した箱を、親であるpopupの中に配置する
popup.appendChild(resultContainer);

// コピーボタンの作成
const copyBtn = document.createElement('button');
// CSSクラスを付与する
copyBtn.className = 'ja-en-copy-btn';
// コピーボタンのテキスト
copyBtn.textContent = 'コピー';
// 選択されていない時は非表示状態にする
copyBtn.style.display = 'none';
// 作成した箱を、親であるpopupの中に配置する
popup.appendChild(copyBtn);


// 文章が選択されるまでは非表示状態
popup.style.display = 'none';
// 作成したポップアップ要素を、実際にWebページ(DOM)へ追加する
document.body.appendChild(popup);

// コピーボタンをクリックしたときの処理
copyBtn.addEventListener('mousedown', (e) => {
    e.stopPropagation(); // ボタンをクリックした時にポップアップがズレるのを防ぐ
    e.preventDefault();  // ポップアップが表示されている時のブラウザの標準動作を禁止する
    
    // 翻訳された文章を選択する
    const textToCopy = resultContainer.textContent;
    // 「中身がnullではない」かつ「翻訳中...ではない」時に処理を行う
    if (textToCopy && textToCopy !== "翻訳中...") {
        // ブラウザに対して翻訳した文章をクリップボードに保存するよう指示する命令 → コピーが完了したら次の処理を行う
        navigator.clipboard.writeText(textToCopy).then(() => {
            // ここからはコピーが完了したことをユーザーに伝えるための処理
            // コピーというボタン上のテキストを保存
            const originalText = copyBtn.textContent;
            // コピーボタンのテキストを完了！に変更
            copyBtn.textContent = '完了！';
            // CSSクラスを適用する
            copyBtn.classList.add('success');
            // 1秒後に完了からコピーのテキストに戻す処理
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.classList.remove('success');
            }, 1000);   // 1000ミリ秒　=1秒
        });
    }
});

/* 翻訳を実行する関数
 * 選択されたテキストをGoogle翻訳APIに送り、
 * 翻訳結果を取得して返す関数
 * ・言語は自動判定（sl=auto）
 * ・日本語が含まれていれば英語へ翻訳
 * ・それ以外は日本語へ翻訳
 */
// async を関数の前につけることで、translateTextが非同期であることを示す
async function translateText(text) {
    // 日本語かどうかを ひらがな、カタカナ、漢字 をしようして判定している(正規表現)
    // 条件に一致すればtrue、一致すればfalse
    const isJapanese = /[ぁ-んァ-ヶー一-龠]/.test(text);
    // trueの場合は選択した文章を英訳、falseの場合は和訳
    let targetLang = isJapanese ? 'en' : 'ja'; 

    // Google翻訳の非公式APIを使用
    const url =
        `https://translate.googleapis.com/translate_a/single` +
        `?client=gtx` +
        `&sl=auto` +                 // 入力言語は自動判別
        `&tl=${targetLang}` +        // 翻訳先言語
        `&dt=t` +
        `&q=${encodeURIComponent(text)}`; // テキストをURLエンコード → 文章中に含まれるスペース、記号、日本語をURL用に安全な形にする関数

    try {
        // awaitを使用しているため、通信が終了するまで次の処理に進むことはない
        const response = await fetch(url);
        // サーバーから返ってきたデータをJSON形式として読み取り、JavaScriptのオブジェクトに変換する
        // responseにはサーバーからの「生のレスポンス情報」が入っている。
        // 生のデータを.json()がオブジェクトに変換する
        const data = await response.json();
        // 翻訳文だけを取り出して、1つの文章にまとめる処理
        return data[0].map(item => item[0]).join('');
    // 通信失敗、APIエラー、ネットワーク切断などのエラーハンティング
    } catch (error) {
        console.error("翻訳エラー:", error);
        return "翻訳に失敗しました";
    }
}
// 文章の選択が完了した瞬間に翻訳する動作
// asyncを使用し、awaitを使用可能にする。(e)にはマウスの位置情報が入る
document.addEventListener('mouseup', async (e) => {
    // コピーボタン上でのmouseupなら無視する
    if (popup.contains(e.target)) {
        return;
    }

    // 現在選択されているテキストを取得　→　選択オブジェクトを文字列に変換　→　前後の空白や改行を削除する
    const selectedText = window.getSelection().toString().trim(); 
    // 何か選択されている場合のみ処理を行う
    if (selectedText.length > 0) {

        resultContainer.textContent = "翻訳中..."; // ユーザーに処理状態であることを伝える
        copyBtn.style.display = 'none'; // 翻訳中はボタンを隠す
        popup.style.left = `${e.pageX}px`; // マウスの横座標
        popup.style.top = `${e.pageY + 10}px`; // マウスの縦座標　+10することで、マウスカーソルと重なるのを防ぐ
        popup.style.display = 'block'; // 画面上に表示する
        // 翻訳が終わるまで待つ。翻訳を終えると「翻訳中...」の文字と置き換わる
        const translated = await translateText(selectedText);
        // 翻訳結果を表示する
        resultContainer.textContent = translated;
        // 翻訳完了後にコピーボタンを表示する
        if (translated !== "翻訳に失敗しました") {
            copyBtn.style.display = 'block';
        }
    }
});

// 画面をクリックしたらポップアップを閉じる動作
document.addEventListener('mousedown', (e) => {
    // ポップアップ自体をクリックしたときはポップアップを消す処理を行わない
    if (!popup.contains(e.target)) {
        // ポップアップを隠す
        popup.style.display = 'none';
    }
});