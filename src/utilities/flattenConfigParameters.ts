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
      result.FIRST_PRINTING_HEAD = Number(first_head.content[0].value);
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
    result.LAYERS = Number(height.content[0].value); //TODO: anpassen je nach Einheit (cm oder mm), ein Layer = 0.2mm
  }
  
  // 4) top-surface
  const top = params['top-surface'];
  if (top) {
    const logo = top.parameters['logo'];
    if (logo?.content.length) {
      result.LOGO = String(logo.content[0].value);
    }
    const second_head = top.parameters['logo-printing-head-no'];
    if (second_head?.content.length) {
      result.SECOND_PRINTING_HEAD = Number(second_head.content[0].value);
    }
    const second_mat = top.parameters['logo-material'];
    if (second_mat?.content.length) {
      result.SECOND_FILAMENT_TYPE = String(second_mat.content[0].value);
    }
  }

  // 5) bottom-surface: QR Code
  const bottom = params['bottom-surface'];
  if (bottom) {
    const qr = bottom.parameters['qr-code']; 
    if (qr?.content.length) {
      result.QR_CODE = Number(qr.content[0].value);
    }
  }

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
