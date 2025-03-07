// src/helpers/handlebarsHelpers.ts
import handlebars from 'handlebars';

export function registerHandlebarsHelpers(): void {

   // Vergleich von beliebig vielen Werten
   handlebars.registerHelper('ifEquals', function (this: any, ...args: any[]) {
    const options = args.pop(); // Das letzte Argument ist immer options
    if (args.length === 0) {
      return options.inverse(this);
    }
    const first = args[0];
    const allEqual = args.every(arg => arg == first);
    return allEqual ? options.fn(this) : options.inverse(this);
  });

  // Switch-Helper: Speichert den Wert, der verglichen werden soll
  handlebars.registerHelper('switch', function(this: any, value, options) {
    this._switch_value_ = value;
    const html = options.fn(this);
    delete this._switch_value_;
    return html;
  });

  // Case-Helper: Vergleicht den Fall mit dem gespeicherten Wert
 handlebars.registerHelper('case', function(this: any, value, options) {
    if (value == this._switch_value_) {
      return options.fn(this);
    }
  });  

  //Case-Multiple-Helper: Vergleicht den Fall mit mehreren gespeicherten Werten
  handlebars.registerHelper('caseMultiple', function(this: any, values, options) {
    const valueArray = values.split(',').map((v: any) => v.trim());
    if (valueArray.indexOf(String(this._switch_value_)) !== -1) {
      return options.fn(this);
    }
  });

  // Default-Helper: Wird ausgeführt, wenn kein Case passt
  handlebars.registerHelper('default', function(this: any, options) {
    return options.fn(this);
  });
}
