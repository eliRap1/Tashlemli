import "dotenv/config";
import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION notify_claim_event() RETURNS TRIGGER AS $$
    BEGIN
      PERFORM pg_notify('claim_events', NEW.claim_id::text);
      RETURN NEW;
    END $$ LANGUAGE plpgsql;
  `);
  await sql.unsafe(`DROP TRIGGER IF EXISTS claim_events_notify ON claim_events;`);
  await sql.unsafe(`
    CREATE TRIGGER claim_events_notify
      AFTER INSERT ON claim_events
      FOR EACH ROW EXECUTE FUNCTION notify_claim_event();
  `);

  await sql.unsafe(`
    CREATE OR REPLACE FUNCTION notify_job_event() RETURNS TRIGGER AS $$
    BEGIN
      PERFORM pg_notify('job_events:' || NEW.job_id::text, NEW.id::text);
      RETURN NEW;
    END $$ LANGUAGE plpgsql;
  `);
  await sql.unsafe(`DROP TRIGGER IF EXISTS job_events_notify ON job_events;`);
  await sql.unsafe(`
    CREATE TRIGGER job_events_notify
      AFTER INSERT ON job_events
      FOR EACH ROW EXECUTE FUNCTION notify_job_event();
  `);

  const tr = await sql`SELECT tgname FROM pg_trigger WHERE tgname IN ('claim_events_notify','job_events_notify')`;
  console.log("triggers installed:", tr.map((r) => r.tgname).join(", "));

  await sql.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
