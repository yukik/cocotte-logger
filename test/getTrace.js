var logger = require('..');

function fn1 () {
  console.log(logger.getTrace());
  console.log(logger.getTrace(fn1));
}

fn1();
