CREATE TABLE IF NOT EXISTS job_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES eligibility_jobs(id) ON DELETE CASCADE,
  kind text NOT NULL,
  payload jsonb,
  occurred_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS job_events_job_occurred_idx ON job_events(job_id, occurred_at);

CREATE OR REPLACE FUNCTION notify_job_event() RETURNS TRIGGER AS $$
BEGIN
  PERFORM pg_notify('job_events:' || NEW.job_id::text, NEW.id::text);
  RETURN NEW;
END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS job_events_notify ON job_events;
CREATE TRIGGER job_events_notify
  AFTER INSERT ON job_events
  FOR EACH ROW EXECUTE FUNCTION notify_job_event();
