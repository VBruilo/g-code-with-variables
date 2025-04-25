// src/transformer/gcodeTransformer.ts
import handlebars from 'handlebars';
import { registerHandlebarsHelpers } from '../helpers/handlebarsHelpers';
import defaultParams from '../utilities/defaultParameters.json';

interface GCodeParameters {
  [key: string]: string | number | Record<string, any>;
}

interface PlaceModelsOptions {
  count: number;
  columns: number;
  spacingX: number;
  spacingY: number;
}

export class GCodeTransformer {

  constructor() {
    registerHandlebarsHelpers();
  }

  public async transformGCode(
    gcodeContent: string, 
    params: Partial<GCodeParameters>
  ): Promise<string> {
    const mergedParams: GCodeParameters = {
      ...defaultParams,
      ...params
    };

    mergedParams.placeModels = this.calculatePlaceModels(mergedParams);
  
    return this.replacePlaceholders(gcodeContent, mergedParams);
  }

  private calculatePlaceModels(params: any): PlaceModelsOptions {
      // Annahme: params enthält z.B. NUMBER_OF_COINS, MODEL_SIZE und CENTER
      const numCoins = Number(params.NUMBER_OF_COINS);
    
      // CENTER wird als String "45 45" übermittelt – alternativ als Objekt { x: 45, y: 45 }
      // Für den Moment nehmen wir an, dass der Modellmittelpunkt innerhalb des Feldes bei (45,45) liegt.
      // Die Sicherheitszone (cell size) setzen wir fest auf 90.
      const spacingX = 90;
      const spacingY = 90;
      
      // Maximal 4 Spalten, da 360/90 = 4
      const maxColumns = 4;
      // Falls weniger Modelle gedruckt werden, kann die Spaltenzahl dynamisch angepasst werden:
      const columns = numCoins < maxColumns ? numCoins : maxColumns;
    
      return { count: numCoins, columns, spacingX, spacingY };
  }
 
  private replacePlaceholders(
    gcode: string, 
    params: GCodeParameters
  ): string {
    const template = handlebars.compile(gcode);
    return template(params);
  }
}
