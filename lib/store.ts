import { promises as fs } from "fs";
import path from "path";
import { Lead } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

interface DbShape {
  version: number;
  leads: Lead[];
}

let writeChain: Promise<void> = Promise.resolve();

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

export async function readDb(): Promise<DbShape> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    const parsed = JSON.parse(raw) as DbShape;
    if (!parsed.leads) parsed.leads = [];
    return parsed;
  } catch {
    return { version: 1, leads: [] };
  }
}

async function writeDb(db: DbShape): Promise<void> {
  await ensureDir();
  const tmp = DB_FILE + ".tmp";
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE);
}

function enqueue<T>(fn: () => Promise<T>): Promise<T> {
  const result = writeChain.then(fn, fn);
  writeChain = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

export async function listLeads(): Promise<Lead[]> {
  const db = await readDb();
  return db.leads.sort((a, b) => b.score - a.score || b.updatedAt - a.updatedAt);
}

export async function getLead(id: string): Promise<Lead | undefined> {
  const db = await readDb();
  return db.leads.find((l) => l.id === id);
}

function dedupKey(l: { osmType: string; osmId: number }): string {
  return `${l.osmType}/${l.osmId}`;
}

export async function addLeads(incoming: Lead[]): Promise<{ added: number; skipped: number }> {
  return enqueue(async () => {
    const db = await readDb();
    const existing = new Set(db.leads.map(dedupKey));
    let added = 0;
    let skipped = 0;
    for (const lead of incoming) {
      const key = dedupKey(lead);
      if (existing.has(key)) {
        skipped++;
        continue;
      }
      existing.add(key);
      db.leads.push(lead);
      added++;
    }
    await writeDb(db);
    return { added, skipped };
  });
}

export async function updateLead(
  id: string,
  patch: Partial<Lead>,
): Promise<Lead | undefined> {
  return enqueue(async () => {
    const db = await readDb();
    const idx = db.leads.findIndex((l) => l.id === id);
    if (idx === -1) return undefined;
    const updated: Lead = {
      ...db.leads[idx],
      ...patch,
      id: db.leads[idx].id,
      updatedAt: Date.now(),
    };
    if (patch.stage && patch.stage !== db.leads[idx].stage) {
      if (patch.stage === "contatado" || patch.stage === "negociacao") {
        updated.contactedAt = updated.contactedAt ?? Date.now();
      }
    }
    db.leads[idx] = updated;
    await writeDb(db);
    return updated;
  });
}

export async function deleteLead(id: string): Promise<boolean> {
  return enqueue(async () => {
    const db = await readDb();
    const before = db.leads.length;
    db.leads = db.leads.filter((l) => l.id !== id);
    if (db.leads.length === before) return false;
    await writeDb(db);
    return true;
  });
}

export async function deleteLeads(ids: string[]): Promise<number> {
  return enqueue(async () => {
    const db = await readDb();
    const set = new Set(ids);
    const before = db.leads.length;
    db.leads = db.leads.filter((l) => !set.has(l.id));
    await writeDb(db);
    return before - db.leads.length;
  });
}
