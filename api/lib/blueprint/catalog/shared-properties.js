import { createSharedProperty } from '../schema.js'

// Reusable property definitions applied across multiple unit types.
// When a unit implements an interface, these come along automatically.
export const SHARED_PROPERTIES = {
  status:           createSharedProperty({ key: 'status',           label: 'Status',          type: 'enum',   enumValues: ['active', 'inactive', 'at_risk', 'churned', 'closed', 'pending'], description: 'Lifecycle status of this object' }),
  health_score:     createSharedProperty({ key: 'health_score',     label: 'Health score',    type: 'number', description: 'Computed health signal 0–100' }),
  owner_id:         createSharedProperty({ key: 'owner_id',         label: 'Owner',           type: 'string', description: 'Person responsible for this object' }),
  created_at:       createSharedProperty({ key: 'created_at',       label: 'Created',         type: 'date',   description: 'When this object was created' }),
  updated_at:       createSharedProperty({ key: 'updated_at',       label: 'Last updated',    type: 'date',   description: 'When this object was last modified' }),
  source_system:    createSharedProperty({ key: 'source_system',    label: 'Source system',   type: 'string', description: 'Integration this object came from' }),
  source_record_id: createSharedProperty({ key: 'source_record_id', label: 'Source ID',       type: 'string', description: 'ID in the originating system' }),
  sync_timestamp:   createSharedProperty({ key: 'sync_timestamp',   label: 'Synced at',       type: 'date',   description: 'When this record was last synced from source' }),
  confidence:       createSharedProperty({ key: 'confidence',       label: 'Confidence',      type: 'number', description: 'Data quality score 0–1' }),
  tags:             createSharedProperty({ key: 'tags',             label: 'Tags',            type: 'string', description: 'Comma-separated classification tags' }),
  notes:            createSharedProperty({ key: 'notes',            label: 'Notes',           type: 'string', description: 'Free-form operational notes' }),
  value_amount:     createSharedProperty({ key: 'value_amount',     label: 'Value',           type: 'currency', description: 'Monetary value of this object' }),
  priority:         createSharedProperty({ key: 'priority',         label: 'Priority',        type: 'enum',   enumValues: ['low', 'medium', 'high', 'critical'], description: 'Operational priority level' }),
}
