-- db/migrations/0001_claim_events_notify.sql
CREATE OR REPLACE FUNCTION notify_claim_event() RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('claim_events', NEW.claim_id::text);
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS claim_events_notify ON claim_events;
CREATE TRIGGER claim_events_notify
  AFTER INSERT ON claim_events
  FOR EACH ROW EXECUTE FUNCTION notify_claim_event();

CREATE EXTENSION IF NOT EXISTS citext;
