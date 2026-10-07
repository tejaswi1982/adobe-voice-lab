export type Source = "demo" | "local" | "model";

/** Something the read flags. `quote` is a phrase lifted from the writer's copy. */
export interface Issue {
  quote?: string;
  note: string;
}

export interface VoiceCheck {
  rational: string;
  human: string;
  focused: string;
}

export type RouteId = "a" | "b";

export interface Route {
  id: RouteId;
  title: string;
  /** A suggested line. `null` when the reader can only name a direction. */
  draft: string | null;
  why: string;
}

export interface Reading {
  source: Source;
  working: string[];
  inTheWay: Issue[];
  voice: VoiceCheck;
  editorsNote: string;
  routes: Record<RouteId, Route>;
}

export type Choice = "original" | "a" | "b" | "own";

export const MAX_COPY_LENGTH = 600;
