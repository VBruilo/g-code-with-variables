// src/types/configServer.ts

/** Metadaten zur Config (Name, Version, Lizenz…) */
export interface ConfigMetadata {
    name: string;
    version: string;
}

/** Definition eines Parameters mit optionalen Sub-Parametern */
export interface ConfigParamDef {
  content: ConfigContent[];
  parameters: Record<any, ConfigParamDef>;
}

/** Gesamte Struktur der Antwort des Config-Servers */
export interface ConfigServerResponse {
  metadata: ConfigMetadata;                                
  parameters: Record<any, ConfigParamDef>;
}