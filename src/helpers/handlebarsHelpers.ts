// src/helpers/handlebarsHelpers.ts
import handlebars from 'handlebars';

export function registerHandlebarsHelpers(): void {

  // Vergleich von zwei Werten
  handlebars.registerHelper('ifEquals', function (this: any, arg1, arg2, options) {
    return arg1 == arg2 ? options.fn(this) : options.inverse(this);
  });

}
