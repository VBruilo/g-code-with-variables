// src/helpers/handlebarsHelpers.ts
import handlebars from 'handlebars';

/**
 * Registers all custom Handlebars helpers that are used when transforming
 * G-code templates. The helpers provide small utility functions for the
 * templates and this function should be called once at application start.
 */
export function registerHandlebarsHelpers(): void {

  /**
   * Returns the element at `index` from the array stored under `keyValue` in
   * `dataObject`. Example usage in a template:
   * `{{getData "sizes" params index}}`.
   */
  handlebars.registerHelper('getData', (
    keyValue: any,
    dataObject: any,
    index: number,
    options: Handlebars.HelperOptions
  ): any => {
    // keyValue in einen String umwandeln, da die Keys in deinem JSON als Strings vorliegen
    const key: string = String(keyValue);
  
    if (!dataObject || typeof dataObject !== 'object') {
      throw new Error('Das zweite Argument muss ein Objekt sein.');
    }
  
    if (!(key in dataObject)) {
      throw new Error(`Der Schlüssel "${key}" existiert nicht im Datenobjekt.`);
    }
  
    const arr = dataObject[key];
    if (!Array.isArray(arr)) {
      throw new Error(`Der Wert für den Schlüssel "${key}" ist kein Array.`);
    }
  
    return arr[index];
  });

  /**
   * Repeats the wrapped block `count` times and exposes the iteration index via
   * `{{index}}` within the block.
   */
  handlebars.registerHelper('repeat', function (count, options) {
    let out = '';
    for (let i = 0; i < count; i++) {
      // "options.fn(...)" rendert, was zwischen {{#repeat ...}} und {{/repeat}} steht
      // Die Variable index = i übergeben wir in den Kontext
      out += options.fn({
        index: i,
      });
    }
    return out;
  });
  
  /**
   * Calculates a Z value by adding `index * offset` to `baseZ` and returns the
   * result formatted with three decimal places.
   */
  handlebars.registerHelper('calcZ', function (index, baseZ, offset) {
    // baseZ und offset werden als Strings übergeben => parseFloat
    const zValue = parseFloat(baseZ) + (index * parseFloat(offset));
    return zValue.toFixed(3);  // 3 Nachkommastellen
  });

  /**
   * Shifts `originalZ` by `(repeatCount - 1) * layerHeight` to account for
   * repeated layers.
   */
  handlebars.registerHelper('shiftZ', function (originalZ, repeatCount, layerHeight) {
    // originalZ: Ursprünglicher Z-Wert (z.B. "0.8")
    // repeatCount: Anzahl der Wiederholungen (z.B. "3")
    // layerHeight: Höhe einer Schicht (z.B. "0.2")
  
    // Stelle sicher, dass wir mit Zahlen arbeiten
    const zVal = parseFloat(originalZ);
    const rc = parseInt(repeatCount, 10);
    const lh = parseFloat(layerHeight);
  
    // Die Verschiebung entspricht (repeatCount - 1) * layerHeight
    const shift = (rc - 1) * lh;
    
    // Neues Z = originalZ + shift
    const result = zVal + shift;
  
    return result.toFixed(3); // z. B. auf drei Nachkommastellen formatieren
  });

  /**
   * Inserts multiple `value` entries at their corresponding positions and
   * returns the full list as a comma separated string. Arguments are expected as
   * alternating position/value pairs, e.g. `{{insertValues 0 611.69 2 83.92}}`.
   */
  handlebars.registerHelper('insertValues', (...args: any[]): string => {
    const options = args.pop();
    const arr: string[] = ['0.00', '0.00', '0.00', '0.00', '0.00'];

    for (let i = 0; i < args.length; i += 2) {
      const pos = Number(args[i]);
      const val = args[i + 1];
      if (!Number.isNaN(pos) && pos >= 0 && pos < arr.length) {
        arr[pos] = String(val);
      }
    }

    return arr.join(', ');
  });

  /**
  * Generates commands to switch off all heater heads except the first and
   * second printing head. The active printing head is ignored, allowing two
   * heaters to stay on while the remaining three are turned off.
   * 
   * Usage in templates: `{{offHeaters FIRST_PRINTING_HEAD SECOND_PRINTING_HEAD}}`
   */
  handlebars.registerHelper('offHeaters', (firstHead: number, secondHead: number): string => {
    // Der aktive Druckkopf als Zahl
    const first: number = firstHead;
    const second: number = secondHead;
    const heads: number[] = [0, 1, 2, 3, 4];
  
    // Remove heads that should stay on
      const toTurnOff: number[] = heads.filter(
        head => head !== Number(firstHead) && head !== Number(secondHead)
      );
  

    // Emit commands in ascending order
      return toTurnOff
        .map((head: number) => `M104 T${head} S0\n`)
        .join('');
  });

}
