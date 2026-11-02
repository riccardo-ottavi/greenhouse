
declare module "express-mysql-session" {
  import expressSession = require("express-session");
  import type { Pool } from "mysql2/promise";

  interface MySQLStoreOptions {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    createDatabaseTable?: boolean;
    clearExpired?: boolean;
    checkExpirationInterval?: number;
    expiration?: number;
  }

    class MySQLStore extends expressSession.Store {
    constructor(options?: MySQLStoreOptions, connection?: Pool);
    get(
      sid: string,
      callback: (
        error: unknown,
        session?: expressSession.SessionData | null
      ) => void
    ): void;
    close(): Promise<void>;
  }

  function MySQLStoreFactory(
    sessionModule: typeof expressSession
  ): typeof MySQLStore;

  export = MySQLStoreFactory;
}
