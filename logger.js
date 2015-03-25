/*
 * Copyright(c) 2013 Yuki Kurata <yuki.kurata@gmail.com>
 * MIT Licensed
 */
'use strict';

/*
 * ログファイルにメッセージを出力する
 */

/**
 * Module dependencies
 */
var path = require('path');
var moment = require('moment');
var fs = require('fs-extra');
var EOL = require('os').EOL;

/**
 * [exports]
 *
 * ログ書き込み
 * @method logger
 * @param {String|Error} message 
 * @param {String} file 書き込みファイル名のフォーマット 省略可能
 * @param {Object} options オプション。省略可能 
 *   time 日時追加
 *   bench ベンチマークを記録
 *   depth 呼び出し元の深度を指定。1は直前
 *   linefeed false時に改行を追加しない
 *   header ファイル作成時に１行目に追加する文字
 *   trace 呼び出し元のファイル名と行数追加
 *   caller trace時の呼び出し関数の指定
 * @return logger
 */
var logger = function logger (message, file, options) {

  // file省略、オプション指定時
  if (typeof file === 'object') {
    options = file;
    file = null;
  }

  options = options || {};

  var isErr = message instanceof Error;
  var now = moment();
  var time = isErr || options.time ? now.format('YYYY-MM-DD HH:mm:ss ') : '';
  var linefeed = options.linefeed === false ? '' : EOL;

  // ファイル
  file = now.format(file || '[log]-YYYY-MM-DD.[txt]');

  // エラーオブジェクトのスタックトレースをメッセージに設定
  if (isErr) {
    message = logger.stackShort(message);

  // 関数の読み出し元のファイル名と行数をメッセージの後に追加
  } else if (options.trace) {
    var trace = logger.getTrace(options.caller || logger, options.depth);
    var fileName = trace.name ? ':' + trace.name : '';
    message += ' file:/' + trace.file + ' (' + trace.line + fileName + ')';

  }

  messages.push({
    message: time + message + linefeed,
    file: file,
    header: options.header
  });

  if (!run) {
    task();
  }

  return logger;
};

logger.stackShort = function stackShort (err) {
  var line = err.stack.split(EOL);
  var cut = 'Module._compile';
  var val = [];
  line.some(function(l){
    if (~l.indexOf(cut)) {
      return true;
    }
    val.push(l);
  });
  return val.join(EOL);
};

/**
 * 呼び出し位置取得
 * @method getTrace
 * @param  {Function} caller
 * @return {Object}
 */
logger.getTrace = function getTrace (caller) {
  var error = {};
  Error.captureStackTrace(error, caller || getTrace);
  var info;
  error
    .stack.split(/[\r\n]+/)
    .some(function(x){
      var m = x.match(/at (.*) \((.+\.js):([0-9]+):([0-9]+)/);
      if (m) {
        info = {
          name: m[1] === 'Object.<anonymous>' ? null : m[1],
          file: m[2],
          line: m[3],
          column: m[4]
        };
        return true;
      } else {
        return false;
      }
    });
  return info;
};

/**
 * 書込み待ち行列
 * @property {Array} message
 */
var messages = [];
  // task関数実行中
var run = false;

/**
 * タスクの実行
 * @method task
 */
var task = function task () {
  run = true;
  var item = messages.shift();
  if (!item) {
    run = false;

  // 書き込み
  } else if ('message' in item) {
    if (output_) {
      write(item);
    } else {
      task();
    }

  // パスの変更
  } else if (item.path) {
    p_ = item.path;
    task();

  // ファイルフォーマット
  } else if (item.format) {
    format = item.format;
    task();

  // 出力のコントロール
  } else if ('output' in item) {
    output_ = item.output;
    task();

  } else {
    task();
  }
};

/*
 * 順次書き込み
 * @method write
 * @param  {Object} item
 */
var write = function write (item) {

  var filename = item.file;
  var message = item.message;
  var header = item.header;
  var file = path.join(p_, filename);

  fs.exists(file, function (exists) {
    if (exists) {
      fs.appendFile(file, message, function () {
        task();
      });

    } else {
      if (header) {
        message = header + EOL + message;
      }

      var dir = path.dirname(file);
      fs.exists(dir, function (exists) {
        if (exists) {
          fs.appendFile(file, message, function () {
            task();
          });

        } else {
          fs.mkdirs(dir, function (err) {
            if (err) {
              console.error(err);
              task();
            } else {
              fs.appendFile(file, message, function () {
                task();
              });
            }
          });
        }
      });
    }
  });
};

/**
 * ログ出力先
 * 既定では、カレントディレクトリ以下にlogsフォルダを作成し保存します
 * @property {String} logger.path
 */
var p_ = path.join(path.dirname(process.argv[1]), 'logs');
var current_p_ = p_;
Object.defineProperty (logger, 'path', {
  enumerable: true,
  set: function(val) {
    if (typeof val === 'string') {
      current_p_ = path.resolve(current_p_, val);
      messages.push({path: current_p_});
      if (!run) {
        task();
      }
    }
  },
  get: function () {
    return current_p_;
  }
});

/**
 * ファイルフォーマット
 * @property {String} logger.format
 */
var format = '[log]-YYYY-MM-DD.[txt]';
var current_format = format;
Object.defineProperty (logger, 'format', {
  enumerable: true,
  set: function(val) {
    if (typeof val === 'string') {
      current_format = val;
      messages.push({format: val});
      if (!run) {
        task();
      }
    }
  },
  get: function () {
    return current_format;
  }
});


/**
 * ログを出力するかどうか
 * 一時的に出力しない場合はfalseにする
 * @property {Boolean} logger.output
 */
var output_ = true;
var current_output_ = true;
Object.defineProperty (logger, 'output', {
  enumerable: true,
  set: function(val) {
    if (typeof val === 'boolean') {
      current_output_ = val;
      messages.push({output: val});
      if (!run) {
        task();
      }
    }
  },
  get: function () {
    return current_output_;
  }
});

/**
 * トレースと日付をメッセージに追加して書込みします
 * @method trace
 * @param {String} message
 * @return logger
 */
logger.trace = function trace (message) {
  logger(message, {time: true, trace: true, caller: logger.trace});
  return logger;
};

module.exports = exports = logger;