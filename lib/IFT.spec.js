require('babel-core/register');

define('test', () => {

  it('incr test', () => {
    chrome1.url('/index.html');
    chrome2.url('/index.html');

    // click button -> incr count
    chrome1.click('#incr');
    chrome2.click('#incr');

  });

});
