var logger = require('../logger.js');

logger('message1', {header:'header-line1'}); // ヘッダー書き込まれる
logger('message2', {header:'header-line2'}); // ヘッダー書き込まれない
logger('message3');

logger();


logger('message4', 'YYYY/MM/DD/[log.txt]'); // 年月日のディレクトリを作成し書き込み
logger('message5', {time: true});      // 時間を追加
logger('message6', {linefeed: false}); // 改行を含まない
logger('message7');

logger.path = './subdir'; // ログファイルのパス変更

logger('message8');
logger('message9');

logger.path = '..'; // 元のパスに変更

logger.trace('message10'); // 日付とファイル名および行数を付加
logger(new Error('エラーだよ')); // エラーログファイルに書き込み

logger('message11');    // 書き込まれる
logger.output = false;
logger('message12');    // 書き込まれない
logger.output = true;
logger('message13');    // 書き込まれる