// src/types/configServer.ts

/** Metadaten zur Config (Name, Version, Lizenz…) */
export interface ConfigMetadata {
  name: string;

  // ggf. noch weitere Felder
}

/** Ein einzelner Content-Eintrag aus dem Config-Response */
export interface ConfigContent {
  value: string | number;
  // ggf. label, description, …
}

/** Definition eines Parameters mit optionalen Sub-Parametern */
export interface ConfigParamDef {
  content: ConfigContent[];
  parameters: Record<string, ConfigParamDef>;
}

/** Gesamte Struktur der Antwort des Config-Servers */
export interface ConfigServerResponse {
  metadata: ConfigMetadata;                                
  parameters: Record<string, ConfigParamDef>;
}
