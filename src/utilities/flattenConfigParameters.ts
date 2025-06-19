// src/utilities/flattenConfigParameters.ts

import { ConfigParamDef } from '../types/configServer';

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
      result.FIRST_PRINTING_HEAD = Number(first_head.content[0].value)-1;
    }
    const first_mat = coinColor.parameters['coin-material'];
    if (first_mat?.content.length) {
      result.FIRST_FILAMENT_TYPE = String(first_mat.content[0].value);
    }
  }

  // 2) width
  const width = params['width'];
  if (width?.content.length) {
    result.MODEL_SIZE = width.content.map(c => Number(c.value));
  }

  // 3) height
  const height = params['height'];
  if (height?.content.length) {
    // height is specified in centimeters
    const heightCm = Number(height.content[0].value);
    // convert to millimeters and cap to a maximum of 7 mm
    const heightMm = heightCm * 10;
    const cappedMm = Math.min(heightMm, 2);
    // each layer is 0.2 mm high
    const layers = Math.round(cappedMm / 0.2);
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
      result.SECOND_PRINTING_HEAD = Number(second_head.content[0].value)-1;
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
