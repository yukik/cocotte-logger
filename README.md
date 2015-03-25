cocotte-logger
======

# はじめに

ログファイルへの書き込みを行います
ファイルは自動的に作成され、同時書き込みによる不整合が起こらない工夫がされています

# 使用例

```
var logger = require('cocotte-logger');
logger('message');
```

logsディレクトリにlog-2014-01-01.txtが作成され、messageと書き込まれます。  
 (※日付の部分は現在の日時により変更されます。)


# ドキュメント

## logger(message, file, options)

通常書き込みを行う

 + @param {String|Error} message 書き込み文字列

    + エラーオブジェクトを渡した場合は、traceを書き込みします

 + @param {String} file ファイル名のフォーマット

    + 省略可能
    + `[log]-YYYY-MM-DD.[txt]`が既定値です
    + ファイルのフォーマットに付いては、momentのドキュメントを確認してください
    + `/`をフォーマットに含ませる事でサブディレクトリも自動的に作成することができます
    
 + @param {Object} options

    + 省略可能
    + time     {Boolean} 日時をメッセージの前に追加。既定値 false
    + linefeed {Boolean} messageの最後に改行を追加する。既定値 true
    + header   {String}  ログファイルを新たに作成した場合に一行目に追加する文字列。既定値 null
    + trace    {Boolean} 関数の呼び出し元のファイル、行数、関数をメッセージの後に追加。既定値 false

## logger.trace(message)

メッセージの前に日時を、後ろにファイル、行数、関数名を付加し書込みます。

## logger.path = {String}

ログファイル配置するパスを指定します
既定値は、実行時のディレクトリ下のlogsです。

## logger.output = {Boolean}

falseに設定されている場合はログファイルへの書き込みを行わなくなります
既定値はtrue

