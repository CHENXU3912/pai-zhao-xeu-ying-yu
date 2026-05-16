import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type {
  AppMode,
  RecognitionCandidate,
  RecognitionResult,
  StoredLearningCard
} from "@/types/domain";

type LocalStore = {
  sessions: RecognitionResult[];
  cards: StoredLearningCard[];
};

const STORE_PATH = join(process.cwd(), ".local-data", "store.json");

async function readStore(): Promise<LocalStore> {
  try {
    const text = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(text) as Partial<LocalStore>;

    return {
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
      cards: Array.isArray(parsed.cards) ? parsed.cards : []
    };
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      (error as NodeJS.ErrnoException).code === "ENOENT"
    ) {
      return { sessions: [], cards: [] };
    }

    throw error;
  }
}

async function writeStore(store: LocalStore) {
  await mkdir(dirname(STORE_PATH), { recursive: true });
  const tempPath = `${STORE_PATH}.${process.pid}.tmp`;
  await writeFile(tempPath, JSON.stringify(store, null, 2), "utf8");
  await rename(tempPath, STORE_PATH);
}

export async function saveLocalRecognitionSession(result: RecognitionResult) {
  const store = await readStore();
  const sessions = store.sessions.filter(
    (session) => session.session_id !== result.session_id
  );
  sessions.push(result);
  await writeStore({ ...store, sessions });
  return result.session_id;
}

export async function getLocalRecognitionCandidate({
  sessionId,
  candidateId
}: {
  sessionId: string;
  candidateId: string;
}): Promise<RecognitionCandidate | undefined> {
  const store = await readStore();
  const session = store.sessions.find((item) => item.session_id === sessionId);
  return session?.candidates.find(
    (candidate) => candidate.candidate_id === candidateId
  );
}

export async function saveLocalLearningCard(card: StoredLearningCard) {
  const store = await readStore();
  const cards = store.cards.filter((item) => item.id !== card.id);
  cards.push(card);
  await writeStore({ ...store, cards });
  return card;
}

export async function listLocalLearningCards({
  anonUserId,
  mode,
  query
}: {
  anonUserId: string;
  mode?: AppMode;
  query?: string;
}) {
  const store = await readStore();

  return store.cards
    .filter((card) => card.anon_user_id === anonUserId)
    .filter((card) => !mode || card.mode === mode)
    .filter((card) => {
      if (!query) {
        return true;
      }

      const keyword = query.toLowerCase();
      return (
        card.phrase_en.toLowerCase().includes(keyword) ||
        card.meaning_zh.includes(query)
      );
    })
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function getLocalLearningCard({
  anonUserId,
  id
}: {
  anonUserId: string;
  id: string;
}) {
  const store = await readStore();
  const card = store.cards.find((item) => item.id === id);
  return card?.anon_user_id === anonUserId ? card : null;
}

export async function deleteLocalLearningCard({
  anonUserId,
  id
}: {
  anonUserId: string;
  id: string;
}) {
  const store = await readStore();
  const cards = store.cards.filter(
    (card) => !(card.id === id && card.anon_user_id === anonUserId)
  );
  await writeStore({ ...store, cards });
}
