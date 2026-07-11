import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const metricEdgesArtifact = readJson('metric-edges.v1.json')
const conceptGraph = readJson('causal-graph.v1.json')
const metricBindingsArtifact = readJson('metric-bindings.v1.json')

const metricEdges = Array.isArray(metricEdgesArtifact.edges) ? metricEdgesArtifact.edges : []
const bindings = metricBindingsArtifact.bindings ?? {}
const conceptEdges = Array.isArray(conceptGraph.concept_edges) ? conceptGraph.concept_edges : []
const motifs = Array.isArray(conceptGraph.motifs) ? conceptGraph.motifs : []
const conceptNodeIds = new Set(Object.keys(conceptGraph.nodes ?? {}))
const conceptEdgeIds = new Set(conceptEdges.map((edge) => edge.id))
const metricToConceptNodeIds = invertBindings(bindings)
const enrichedMetricEdges = buildEnrichedMetricEdgeIndex()

validateBindings()
validateMotifs()

function readJson(fileName) {
  return JSON.parse(readFileSync(path.join(__dirname, fileName), 'utf8'))
}

function invertBindings(bindingMap) {
  const byMetric = new Map()

  for (const [nodeId, metricKeys] of Object.entries(bindingMap)) {
    for (const metricKey of metricKeys || []) {
      if (!byMetric.has(metricKey)) byMetric.set(metricKey, new Set())
      byMetric.get(metricKey).add(nodeId)
    }
  }

  return byMetric
}

function buildEnrichedMetricEdgeIndex() {
  const byMetricPair = new Map()

  for (const conceptEdge of conceptEdges) {
    const metricKeys = new Set([
      ...(bindings[conceptEdge.from] || []),
      ...(bindings[conceptEdge.to] || []),
    ])

    for (const fromMetric of metricKeys) {
      for (const toMetric of metricKeys) {
        if (fromMetric === toMetric) continue
        const key = metricPairKey(fromMetric, toMetric)
        if (!byMetricPair.has(key)) byMetricPair.set(key, conceptEdge)
      }
    }
  }

  return new Map(
    metricEdges.map((edge) => {
      const conceptEdge = byMetricPair.get(metricPairKey(edge.from, edge.to))
      if (!conceptEdge) return [metricPairKey(edge.from, edge.to), edge]

      return [
        metricPairKey(edge.from, edge.to),
        {
          ...edge,
          sources: conceptEdge.sources,
          conditions: conceptEdge.conditions,
          delay: conceptEdge.delay,
          concept_edge_id: conceptEdge.id,
        },
      ]
    })
  )
}

function validateBindings() {
  for (const nodeId of Object.keys(bindings)) {
    if (!conceptNodeIds.has(nodeId)) {
      throw new Error(`[governance graph] Binding references missing concept node: ${nodeId}`)
    }
  }
}

function validateMotifs() {
  for (const motif of motifs) {
    for (const edgeId of motif.edges || []) {
      if (!conceptEdgeIds.has(edgeId)) {
        throw new Error(`[governance graph] Motif ${motif.id} references missing concept edge: ${edgeId}`)
      }
    }
  }
}

function metricPairKey(from, to) {
  return `${from}\u0000${to}`
}

export function getMetricEdges() {
  return metricEdges
}

export function getConceptGraph() {
  const { nodes, concept_edges, motifs } = conceptGraph
  return { nodes, concept_edges, motifs }
}

export function getBindings() {
  return bindings
}

export function getConceptEdgesForMetric(metricKey) {
  const nodeIds = metricToConceptNodeIds.get(metricKey)
  if (!nodeIds) return []

  return conceptEdges.filter((edge) => nodeIds.has(edge.from) || nodeIds.has(edge.to))
}

export function getEnrichedMetricEdge(from, to) {
  return enrichedMetricEdges.get(metricPairKey(from, to)) ?? null
}
