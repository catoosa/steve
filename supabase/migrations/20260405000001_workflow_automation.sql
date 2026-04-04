-- =============================================================================
-- Workflow Automation Engine
-- Workflows, sequences, escalations, contact timeline
-- =============================================================================

-- =============================================================================
-- WORKFLOWS
-- =============================================================================
CREATE TABLE IF NOT EXISTS workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL CHECK (trigger_type IN (
    'call_completed', 'call_no_answer', 'call_voicemail'
  )),
  conditions JSONB DEFAULT '{"operator": "AND", "rules": []}',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflows_org ON workflows(org_id);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON workflows(org_id, trigger_type, enabled);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflows_select" ON workflows FOR SELECT USING (user_in_org(org_id));
CREATE POLICY "workflows_manage" ON workflows FOR ALL USING (user_in_org(org_id));

CREATE TRIGGER tr_workflows_updated BEFORE UPDATE ON workflows
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- WORKFLOW STEPS
-- =============================================================================
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 0,
  condition JSONB,
  action_type TEXT NOT NULL CHECK (action_type IN (
    'send_sms', 'schedule_callback', 'create_escalation', 'webhook',
    'update_contact', 'add_to_dnc', 'enroll_in_sequence'
  )),
  action_config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON workflow_steps(workflow_id, step_order);

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflow_steps_select" ON workflow_steps FOR SELECT
  USING (workflow_id IN (SELECT id FROM workflows WHERE user_in_org(org_id)));
CREATE POLICY "workflow_steps_manage" ON workflow_steps FOR ALL
  USING (workflow_id IN (SELECT id FROM workflows WHERE user_in_org(org_id)));

-- =============================================================================
-- WORKFLOW EXECUTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed')),
  error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_wf_exec_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_wf_exec_org ON workflow_executions(org_id, started_at DESC);

ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wf_exec_select" ON workflow_executions FOR SELECT USING (user_in_org(org_id));
CREATE POLICY "wf_exec_insert" ON workflow_executions FOR INSERT WITH CHECK (user_in_org(org_id));

-- =============================================================================
-- WORKFLOW STEP EXECUTIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS workflow_step_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  step_id UUID NOT NULL REFERENCES workflow_steps(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed', 'skipped')),
  result JSONB,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wf_step_exec ON workflow_step_executions(execution_id);

ALTER TABLE workflow_step_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wf_step_exec_select" ON workflow_step_executions FOR SELECT
  USING (execution_id IN (
    SELECT id FROM workflow_executions WHERE user_in_org(org_id)
  ));

-- =============================================================================
-- SEQUENCES
-- =============================================================================
CREATE TABLE IF NOT EXISTS sequences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sequences_org ON sequences(org_id);

ALTER TABLE sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sequences_select" ON sequences FOR SELECT USING (user_in_org(org_id));
CREATE POLICY "sequences_manage" ON sequences FOR ALL USING (user_in_org(org_id));

CREATE TRIGGER tr_sequences_updated BEFORE UPDATE ON sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================================================
-- SEQUENCE STEPS
-- =============================================================================
CREATE TABLE IF NOT EXISTS sequence_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL DEFAULT 0,
  step_type TEXT NOT NULL CHECK (step_type IN ('call', 'sms', 'wait', 'webhook')),
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_seq_steps ON sequence_steps(sequence_id, step_order);

ALTER TABLE sequence_steps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seq_steps_select" ON sequence_steps FOR SELECT
  USING (sequence_id IN (SELECT id FROM sequences WHERE user_in_org(org_id)));
CREATE POLICY "seq_steps_manage" ON sequence_steps FOR ALL
  USING (sequence_id IN (SELECT id FROM sequences WHERE user_in_org(org_id)));

-- =============================================================================
-- SEQUENCE ENROLLMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES sequences(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  current_step INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'failed', 'cancelled')),
  next_action_at TIMESTAMPTZ,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(sequence_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_seq_enroll_next ON sequence_enrollments(status, next_action_at)
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_seq_enroll_org ON sequence_enrollments(org_id);

ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "seq_enroll_select" ON sequence_enrollments FOR SELECT USING (user_in_org(org_id));
CREATE POLICY "seq_enroll_manage" ON sequence_enrollments FOR ALL USING (user_in_org(org_id));

-- =============================================================================
-- ESCALATIONS
-- =============================================================================
CREATE TABLE IF NOT EXISTS escalations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'dismissed')),
  assigned_to UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escalations_org ON escalations(org_id, status, priority);
CREATE INDEX IF NOT EXISTS idx_escalations_open ON escalations(org_id, created_at DESC)
  WHERE status = 'open';

ALTER TABLE escalations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escalations_select" ON escalations FOR SELECT USING (user_in_org(org_id));
CREATE POLICY "escalations_manage" ON escalations FOR ALL USING (user_in_org(org_id));

-- =============================================================================
-- CONTACT TIMELINE
-- =============================================================================
CREATE TABLE IF NOT EXISTS contact_timeline (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'call', 'sms', 'escalation', 'workflow_action', 'status_change',
    'sequence_enrolled', 'sequence_step', 'dnc_added'
  )),
  event_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_timeline_contact ON contact_timeline(contact_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_timeline_org ON contact_timeline(org_id, created_at DESC);

ALTER TABLE contact_timeline ENABLE ROW LEVEL SECURITY;
CREATE POLICY "timeline_select" ON contact_timeline FOR SELECT USING (user_in_org(org_id));
CREATE POLICY "timeline_insert" ON contact_timeline FOR INSERT WITH CHECK (user_in_org(org_id));

-- =============================================================================
-- EXPAND DNC SOURCE CONSTRAINT
-- =============================================================================
ALTER TABLE dnc_numbers DROP CONSTRAINT IF EXISTS dnc_numbers_source_check;
ALTER TABLE dnc_numbers ADD CONSTRAINT dnc_numbers_source_check
  CHECK (source IN ('manual', 'upload', 'opt_out', 'do_not_call_register', 'workflow'));
