var origin = location.origin ? location.origin :
  location.protocol + '//' + location.hostname +
  (location.port ? ':' + location.port : '');

module.exports = {
  IFT_ORIGIN: origin,
  IFT_PATH: location.pathname + '?child' + +new Date
};
