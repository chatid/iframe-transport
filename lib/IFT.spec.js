import IFT from './IFT';

describe('IFT load', () => {

  it('loaded event received at construction time', (done) => {
    const iftInstance = new IFT();
    iftInstance.on('loaded', () => {
      expect(iftInstance.iframe_loaded).toBe(true);
      done();
    });
  });


  it('not loaded by default', () => {
    const iftInstance = new IFT();
    expect(iftInstance.iframe_loaded).toBe(false);
  });

});
