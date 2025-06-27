// src/utilities/flattenConfigParameters.ts

import { ConfigParamDef } from '../types/configServer';
import defaultParams from './defaultParameters.json';

/**
 * Available model sizes. Used to map width values to the nearest
 * supported one when flattening parameters.
 */
const MODEL_SIZES = [20, 23.25, 25.75, 30];

/** Base coin thickness in millimeters */
const BASE_HEIGHT_MM = 2.1;

/** Maximum supported coin thickness in millimeters */
const MAX_HEIGHT_MM = 5;

/**
 * Return the model size closest to the provided value.
 */
function nearestModelSize(value: number): number {
  return MODEL_SIZES.reduce((prev, curr) =>
    Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
  );
}

/**
 * Flatten the nested configuration returned by the config server into a simple key-value map.
 *
 * Expected keys include `coin-color`, `width`, `height`, `top-surface`, `bottom-surface` and `coordinates`.
 * Only present values are copied to the returned object.
 *
 * @param params Mapping of parameter names to definitions from the config server.
 * @returns Object containing primitive values consumed by the G-code generator.
 */
export function flattenConfigParameters(
  params: Record<string, ConfigParamDef>
): Record<string, string | number | number[]> {
  const result: Record<string, any> = {};

  // 1) coin-color
  const coinColor = params['coin-color'];
  if (coinColor) {
    const first_head = coinColor.parameters['coin-printing-head-no'];
    if (first_head?.content.length) {
      const val = Number(first_head.content[0].value);
      if (val >= 1 && val <= 5) {
        result.FIRST_PRINTING_HEAD = val - 1;
      } else {
        result.FIRST_PRINTING_HEAD = Number(defaultParams.FIRST_PRINTING_HEAD);
      }
    }
    const first_mat = coinColor.parameters['coin-material'];
    if (first_mat?.content.length) {
      result.FIRST_FILAMENT_TYPE = String(first_mat.content[0].value);
    }
  }

  // 2) width
  const width = params['width'];
  if (width?.content.length) {
    result.MODEL_SIZE = width.content.map(c => nearestModelSize(Number(c.value)));
  }

  // 3) height
  const height = params['height'];
  if (height?.content.length) {
    // height is specified in millimeters
    const heightMm = Number(height.content[0].value);
    // clamp to supported range
    const clampedMm = Math.min(Math.max(heightMm, BASE_HEIGHT_MM), MAX_HEIGHT_MM);
    // difference from base height in mm
    const additionalMm = clampedMm - BASE_HEIGHT_MM;
    // each layer is 0.2 mm high
    const layers = Math.round(additionalMm / 0.2 + 1e-6);
    result.LAYERS = layers;
  }
  
  // 4) top-surface
  const top = params['top-surface'];
  if (top) {
    const logo = top.parameters['logo'];
    if (logo?.content.length) {
      result.LOGO = String(logo.content[0].value);
    }
    const logo_color = top.parameters['logo-color'];
    const second_head = logo_color.parameters['coin-printing-head-no'];
    if (second_head?.content.length) {
      const val = Number(second_head.content[0].value);
      if (val >= 1 && val <= 5) {
        result.SECOND_PRINTING_HEAD = val - 1;
      } else {
        result.SECOND_PRINTING_HEAD = Number(defaultParams.SECOND_PRINTING_HEAD);
      }
    }
    const second_mat = top.parameters['logo-material'];
    if (second_mat?.content.length) {
      result.SECOND_FILAMENT_TYPE = String(second_mat.content[0].value);
    }
  }

  // 5) bottom-surface: QR Code
  /*const bottom = params['bottom-surface'];
  if (bottom) {
    const qr = bottom.parameters['qr-code']; 
    if (qr?.content.length) {
      result.QR_CODE = Number(qr.content[0].value);
    }
  }*/

  // 6) coordinates: X + Y
  const coords = params['coordinates'];
  if (coords) {
    const x = coords.parameters['x'];
    const y = coords.parameters['y'];
    if (x?.content.length) {
      result.POS_X = Number(x.content[0].value);
    }
    if (y?.content.length) {
      result.POS_Y = Number(y.content[0].value);
    } 
  }

  return result;
}
