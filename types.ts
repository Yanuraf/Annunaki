export interface Choice {
  text: string;
  action: string;
}

export interface GameResponse {
  story: string;
  choices: Choice[];
  imagePrompt?: string;
}

export interface GameState {
  story: string;
  choices: Choice[];
  isLoading: boolean;
  error: string | null;
}