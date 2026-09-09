export type LocalSpeechAvailability =
  | "available"
  | "downloadable"
  | "downloading"
  | "unavailable"
  | "unsupported";

type SpeechAlternativeLike = { transcript: string };
type SpeechResultLike = {
  isFinal?: boolean;
  length: number;
  [index: number]: SpeechAlternativeLike;
};
type SpeechResultListLike = {
  length: number;
  [index: number]: SpeechResultLike;
};

export interface SpeechRecognitionResultEventLike extends Event {
  resultIndex: number;
  results: SpeechResultListLike;
}

export interface LocalSpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  processLocally: boolean;
  onresult: ((event: SpeechRecognitionResultEventLike) => void) | null;
  onerror: ((event: Event & { error?: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort?: () => void;
}

interface LocalSpeechOptions {
  langs: string[];
  processLocally: true;
  quality?: "command" | "dictation" | "conversation";
}

export interface LocalSpeechRecognitionConstructor {
  new (): LocalSpeechRecognitionLike;
  available?: (
    options: LocalSpeechOptions
  ) => Promise<"available" | "downloadable" | "downloading" | "unavailable">;
  install?: (options: LocalSpeechOptions) => Promise<boolean>;
}

export function getLocalSpeechRecognitionConstructor() {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { SpeechRecognition?: LocalSpeechRecognitionConstructor })
    .SpeechRecognition;
}

export async function localSpeechAvailability(
  lang = "fa-IR"
): Promise<LocalSpeechAvailability> {
  const Recognition = getLocalSpeechRecognitionConstructor();
  if (!Recognition?.available) return "unsupported";
  try {
    return await Recognition.available({
      langs: [lang],
      processLocally: true,
      quality: "dictation",
    });
  } catch {
    return "unavailable";
  }
}

export async function installLocalSpeechPack(lang = "fa-IR") {
  const Recognition = getLocalSpeechRecognitionConstructor();
  if (!Recognition?.install) return false;
  try {
    return await Recognition.install({
      langs: [lang],
      processLocally: true,
      quality: "dictation",
    });
  } catch {
    return false;
  }
}

export function createLocalSpeechRecognition(lang = "fa-IR") {
  const Recognition = getLocalSpeechRecognitionConstructor();
  if (!Recognition) return undefined;
  const recognition = new Recognition();
  recognition.lang = lang;
  recognition.continuous = false;
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.processLocally = true;
  return recognition;
}

export function transcriptFromSpeechEvent(event: SpeechRecognitionResultEventLike) {
  const chunks: string[] = [];
  for (let index = event.resultIndex; index < event.results.length; index += 1) {
    const transcript = event.results[index]?.[0]?.transcript?.trim();
    if (transcript) chunks.push(transcript);
  }
  return chunks.join(" ").trim();
}
