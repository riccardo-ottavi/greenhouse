import argon2 from "argon2";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { db } from "../src/database/connection.js";

function askUsername(): Promise<string> {
  const readline = createInterface({ input: stdin, output: stdout });

  return readline.question("Username: ").finally(() => {
    readline.close();
  });
}

function askHiddenPassword(prompt: string): Promise<string> {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    return Promise.reject(
      new Error("La password deve essere inserita da un terminale interattivo.")
    );
  }

  return new Promise((resolve, reject) => {
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();

    let password = "";

    const cleanup = () => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdout.write("\n");
    };

    const onData = (data: Buffer) => {
      for (const character of data.toString("utf8")) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Operazione annullata."));
          return;
        }

        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(password);
          return;
        }

        if (character === "\u007f" || character === "\b") {
          if (password.length > 0) {
            password = password.slice(0, -1);
            stdout.write("\b \b");
          }
          continue;
        }

        if (character >= " " && character !== "\u007f") {
          password += character;
          stdout.write("*");
        }
      }
    };

    stdin.on("data", onData);
  });
}

async function main(): Promise<void> {
  try {
    const username = (await askUsername()).trim();

    if (!username || username.length > 100) {
      throw new Error("Lo username deve contenere da 1 a 100 caratteri.");
    }

    const password = await askHiddenPassword("Password: ");

    if (password.length < 12) {
      throw new Error("La password deve contenere almeno 12 caratteri.");
    }

    const confirmation = await askHiddenPassword("Conferma password: ");

    if (password !== confirmation) {
      throw new Error("Le password non coincidono.");
    }

    const passwordHash = await argon2.hash(password, {
      type: argon2.argon2id
    });

    await db.execute(
      `
        INSERT INTO users (username, password_hash)
        VALUES (?, ?)
      `,
      [username, passwordHash]
    );

    console.log(`Operatore "${username}" creato correttamente.`);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "ER_DUP_ENTRY"
    ) {
      console.error("Questo username esiste già.");
      process.exitCode = 1;
      return;
    }

    console.error(
      error instanceof Error
        ? error.message
        : "Errore durante la creazione dell'operatore."
    );

    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

main().catch((error: unknown) => {
  console.error("Errore imprevisto durante l'inizializzazione.");
  process.exitCode = 1;
});
