// src/types/configServer.ts

/** Metadata about the config (name, version, license, …) */
export interface ConfigMetadata {
  name: string;

  /** additional fields may be added */
}

/** A single content entry from the config response */
export interface ConfigContent {
  /** optional label, description, … */
  value: string | number;
}

/** Definition of a parameter with optional sub-parameters */
export interface ConfigParamDef {
  content: ConfigContent[];
  parameters: Record<string, ConfigParamDef>;
}

/** Overall structure of the config server response */
export interface ConfigServerResponse {
  metadata: ConfigMetadata;                                
  parameters: Record<string, ConfigParamDef>;
}
