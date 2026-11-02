import fs from "fs/promises";
import path from "path";
import { DATA_DIR } from "../config/dataDirectory.js";


const JOURNAL_PATH = path.join(
    DATA_DIR,
    "processed-commands.json"
);

async function ensureJournalExists() {
    try {
        await fs.access(JOURNAL_PATH);
    } catch {
        await fs.mkdir(path.dirname(JOURNAL_PATH), { recursive: true });
        await fs.writeFile(JOURNAL_PATH, JSON.stringify({}, null, 4));
    }
}

async function readJournal() {
    await ensureJournalExists();

    const content = await fs.readFile(JOURNAL_PATH, "utf-8");

    return JSON.parse(content);
}

async function writeJournal(journal) {
    await fs.writeFile(
        JOURNAL_PATH,
        JSON.stringify(journal, null, 4)
    );
}

export async function hasProcessedCommand(commandId) {
    const journal = await readJournal();

    return Object.prototype.hasOwnProperty.call(
        journal,
        String(commandId)
    );
}

export async function getProcessedCommand(commandId) {
    const journal = await readJournal();

    return journal[String(commandId)] ?? null;
}

export async function saveProcessedCommand(commandId, result) {
    const journal = await readJournal();

    journal[String(commandId)] = {
        success: result.success
    };

    await writeJournal(journal);
}