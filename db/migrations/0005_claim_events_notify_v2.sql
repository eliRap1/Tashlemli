-- db/migrations/0005_claim_events_notify_v2.sql
-- Include the row ID in the pg_notify payload so the SSE listener can do a
-- targeted single-row lookup instead of fetching all rows and taking the last.
-- Two events inserted in rapid succession previously caused both SSE callbacks
-- to see the same (second) row, silently dropping the first event.
CREATE OR REPLACE FUNCTION notify_claim_event() RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('claim_events', NEW.claim_id::text || ':' || NEW.id::text);
  RETURN NEW;
END $$ LANGUAGE plpgsql;
