mocha.ui('bdd');
mocha.timeout(10000);

var origin = location.origin ? location.origin :
  location.protocol + '//' + location.hostname +
  (location.port ? ':' + location.port : '');

module.exports = {
  IFT_ORIGIN: origin,
  IFT_CHILD_PATH: location.pathname + '?route=child&stamp=' + +new Date
};
