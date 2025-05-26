// src/utilities/snippetPlacement.ts
import fs from 'fs';
import path from 'path';

export interface SnippetParams {

  [key: string]: any;
}


/**
 * Sucht in `params` den Wert zu `paramKey`, lädt das Snippet und ersetzt
 * den Platzhalter `placeholderRegex` in `content` durch den geladenen Block.
 * Wenn `params[paramKey]` nicht gesetzt oder nicht parsebar ist, bleibt `content` unverändert.
 */
export async function insertSnippet(
  content: string,
  params: SnippetParams,
  paramKey: string,
  type: string,
  placeholderRegex: RegExp
): Promise<string> {
  const raw = params[paramKey];
  if (raw == null) return content;
  const key = String(raw);               // als Text verwenden
  const snippet = await loadSnippet(type, key);
  return content.replace(placeholderRegex, snippet);
}

/**
 * Lädt den G-Code-Block für `type` und `key` (z.B. qr/2 → ./gcode/qr/2.gcode)
 */
export async function loadSnippet(
  type: string,
  key: string | number
): Promise<string> {
  const fileName = `${key}.gcode`;
  const fullPath = path.resolve(process.cwd(), 'gcode', type, fileName);
  try {
    const content = await fs.promises.readFile(fullPath, 'utf8');
    return content.trim();
  } catch (err) {
    throw new Error(`Failed to load snippet ${type}/${fileName}: ${err}`);
  }
}

