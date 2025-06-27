import handlebars from 'handlebars';
import { registerHandlebarsHelpers } from '../src/helpers/handlebarsHelpers';

describe('handlebars helpers', () => {
  beforeAll(() => {
    registerHandlebarsHelpers();
  });

  it('getData returns element at index', () => {
    const tpl = handlebars.compile('{{getData "sizes" params 1}}');
    const out = tpl({ params: { sizes: [10, 20, 30] } });
    expect(out).toBe('20');
  });

  it('repeat provides index variable', () => {
    const tpl = handlebars.compile('{{#repeat 3}}{{index}}{{/repeat}}');
    expect(tpl({})).toBe('012');
  });

  it('calcZ and shiftZ compute values', () => {
    const tpl = handlebars.compile('{{calcZ 2 "0.2" "0.1"}} {{shiftZ "0.8" 3 "0.2"}}');
    expect(tpl({})).toBe('0.400 1.200');
  });

  it('insertValues inserts numbers at positions', () => {
    const tpl = handlebars.compile('{{insertValues 0 1.1 2 2.2}}');
    expect(tpl({})).toBe('1.1, 0.00, 2.2, 0.00, 0.00');
  });

  it('offHeaters generates commands', () => {
    const tpl = handlebars.compile('{{offHeaters 0 2}}');
    expect(tpl({})).toBe('M104 T1 S0\nM104 T3 S0\nM104 T4 S0\n');
  });
});
