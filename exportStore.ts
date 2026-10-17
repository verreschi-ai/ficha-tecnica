// Persistência em Postgres (ex.: Neon) do snapshot que o app envia em POST /api/export/push e
// que GET /api/export/summary serve à Ana. Sem isso o snapshot vivia só na memória do processo
// e sumia sempre que o Render reiniciava (deploy ou hibernação do plano gratuito).

export interface PgLikePool {
  query: (text: string, params?: unknown[]) => Promise<{ rows: any[] }>;
}

export interface ExportStore {
  save: (email: string, payload: unknown) => Promise<void>;
  load: <T = unknown>(email: string) => Promise<T | null>;
}

const clean = (email: string) => (email || "").trim().toLowerCase();

export function createExportStore(pool: PgLikePool): ExportStore {
  let ready: Promise<unknown> | null = null;

  // Cria a tabela na primeira chamada. Se falhar (ex.: banco acordando), a próxima chamada tenta de novo.
  const ensureTable = () => {
    if (!ready) {
      ready = pool
        .query(
          `CREATE TABLE IF NOT EXISTS export_snapshots (
             email TEXT PRIMARY KEY,
             payload JSONB NOT NULL,
             updated_at TIMESTAMPTZ NOT NULL
           )`
        )
        .catch((err) => {
          ready = null;
          throw err;
        });
    }
    return ready;
  };

  return {
    async save(email, payload) {
      await ensureTable();
      await pool.query(
        `INSERT INTO export_snapshots (email, payload, updated_at)
         VALUES ($1, $2, now())
         ON CONFLICT (email) DO UPDATE SET payload = EXCLUDED.payload, updated_at = now()`,
        [clean(email), JSON.stringify(payload)]
      );
    },

    async load<T = unknown>(email: string): Promise<T | null> {
      await ensureTable();
      const res = await pool.query(`SELECT payload FROM export_snapshots WHERE email = $1`, [clean(email)]);
      if (!res.rows.length) return null;
      const payload = res.rows[0].payload;
      return (typeof payload === "string" ? JSON.parse(payload) : payload) as T;
    },
  };
}
