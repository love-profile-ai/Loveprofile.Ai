import type { AnalysisPath } from "@/types/questionnaire";
import type { EnginePath } from "@/types/adaptive-engine";

const TO_ENGINE: Record<AnalysisPath, EnginePath> = {
  i_like_someone: "do_i_love_someone",
  someone_likes_me: "does_someone_love_me",
};

const FROM_ENGINE: Record<EnginePath, AnalysisPath> = {
  do_i_love_someone: "i_like_someone",
  does_someone_love_me: "someone_likes_me",
};

export function toEnginePath(path: AnalysisPath): EnginePath {
  return TO_ENGINE[path];
}

export function fromEnginePath(path: EnginePath): AnalysisPath {
  return FROM_ENGINE[path];
}

export function isEnginePath(value: string): value is EnginePath {
  return value === "do_i_love_someone" || value === "does_someone_love_me";
}

export function isAnalysisPath(value: string): value is AnalysisPath {
  return value === "i_like_someone" || value === "someone_likes_me";
}

export function resolveEnginePath(value: string): EnginePath | null {
  if (isEnginePath(value)) return value;
  if (isAnalysisPath(value)) return toEnginePath(value);
  return null;
}
