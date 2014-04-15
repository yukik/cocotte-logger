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
var path = require('path')
  , moment = require('moment')
  , fs = require('fs-extra')
  , is = require('cocotte-is')
  , EOL = require('os').EOL;

/**
 * [exports]
 *
 * ログ書き込み
 * @method logger
 * @param {String|Error} message 
 * @param {String} file 書き込みファイル名のフォーマット 省略可能
 * @param {Object} options オプション。省略可能 
 *   time 日時追加
 *   trace 呼び出し元のファイル名と行数追加
 *   depth 呼び出し元の深度を指定。1は直前
 *   linefeed false時に改行を追加しない
 *   header ファイル作成時に１行目に追加する文字
 * @return logger
 */
var logger = function logger (message, file, options) {

	// file省略、オプション指定時
	if (is(Object, file)) {
		options = file;
		file = null;
	}

	if (message === void 0) {
		message = '';
	}

	options = options || {};

	var isErr = message instanceof Error
	  , time = isErr || options.time ? moment().format('YYYY-MM-DD HH:mm:ss ') : ''
	  , depth = options.depth || 1
	  , linefeed = options.linefeed === false ? '' : EOL;

	/*
	 * ファイル
	 */
	if (typeof file !== 'string') {
		file = (isErr ? '[error]-' : '[log]-') + 'YYYY-MM-DD.[txt]';
	}
	file = moment().format(file);


	// エラーオブジェクトのスタックトレースをメッセージに設定
	if (isErr) {
		message = EOL + message.stack + EOL;

	// 関数の読み出し元のファイル名と行数をメッセージの後に追加
	} else if (options.trace) {
		var f = new Error('').stack
				 .split(/[\r\n]+/)
				 .map(function(s){return s.match(/(\/.+\.js):([0-9]+):([0-9]+)/);})
				 .filter(function(s) {return !!s;});
		if (depth < f.length) {
			message += ' file:/' + f[depth][1] + ' (' + f[depth][2] + ')';
		}
	}

	messages.push({
		message: time + message + linefeed
	  , file   : file
	  , header : options.header
	});

	if (!run) {
		task();
	}

	return logger;
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
		p_ = path.resolve(p_, item.path);
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

	var filename = item.file
	  , message = item.message
	  , header = item.header
	  , file = path.join(p_, filename);

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
Object.defineProperty (logger, 'path', {
	enumerable: true,
	set: function(val) {
		if (typeof val === 'string') {
			messages.push({path: val});
		}
	},
	get: function () {
		return p_;
	}
});

/**
 * ログを出力するかどうか
 * 一時的に出力しない場合はfalseにする
 * @property {Boolean} logger.output
 */
var output_ = true;
Object.defineProperty (logger, 'output', {
	enumerable: true,
	set: function(val) {
		if (typeof val === 'boolean') {
			messages.push({output: val});
		}
	},
	get: function () {
		return output_;
	}
});

/**
 * トレースと日付をメッセージに追加して書込みします
 * @method trace
 * @param {String} message
 * @return logger
 */
logger.trace = function trace (message) {
	logger(message, {depth: 2, time: true, trace: true});
	return logger;
};

module.exports = exports = logger;
