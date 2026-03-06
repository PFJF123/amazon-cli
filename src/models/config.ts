export interface Config {
  headless: boolean;
  timeout: number;
  debug: boolean;
  defaultAddress: string | null;
}

export const DEFAULT_CONFIG: Config = {
  headless: false,
  timeout: 30000,
  debug: false,
  defaultAddress: null,
};
