import { createInterface } from '../schema.js'

// Polymorphic contracts shared across unit types.
// Any unit implementing an interface inherits its sharedProperties
// and can be queried/acted on uniformly by the monitoring engine.
export const INTERFACES = {
  // The monitoring loop can watch and score any Observable unit
  Observable: createInterface({
    id: 'observable',
    label: 'Observable',
    description: 'Unit type the monitoring loop can watch, score, and surface findings for',
    sharedProperties: ['health_score', 'status', 'updated_at'],
  }),

  // Actions can be staged and approved against any Actionable unit
  Actionable: createInterface({
    id: 'actionable',
    label: 'Actionable',
    description: 'Unit type that can have actions staged against it in the execution queue',
    sharedProperties: ['owner_id', 'status', 'priority'],
  }),

  // Any unit pulled from an external integration carries provenance
  Sourced: createInterface({
    id: 'sourced',
    label: 'Sourced',
    description: 'Unit type pulled from an external integration with full provenance tracking',
    sharedProperties: ['source_system', 'source_record_id', 'sync_timestamp', 'confidence'],
  }),

  // Any unit that participates in causal relationships
  Linked: createInterface({
    id: 'linked',
    label: 'Linked',
    description: 'Unit type that participates in causal chains tracked by the causal engine',
    sharedProperties: ['health_score', 'tags'],
  }),

  // Financial objects with monetary value
  Financial: createInterface({
    id: 'financial',
    label: 'Financial',
    description: 'Unit type that carries monetary value and participates in financial reporting',
    sharedProperties: ['value_amount', 'status', 'created_at'],
  }),
}

export const INTERFACE_IDS = Object.fromEntries(
  Object.values(INTERFACES).map((i) => [i.id, i])
)
