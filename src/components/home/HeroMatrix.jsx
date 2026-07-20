import { useEffect, useRef } from 'react'
import { HERO_DATA, HERO_COLORS, HERO_SHORT_LABELS, HERO_CHAIN_ORDER, HERO_SPECIAL, HERO_TIER_BY_COL } from './heroData'
import './HeroMatrix.css'

// Animated matrix grid behind the hero headline — one column per business
// pillar, cards unfold top-to-bottom in left-to-right tiers, then a slow
// random-flip loop keeps a couple of cells alive. Ported 1:1 from
// mockups/hero-section.html (imperative DOM build, not React state) so the
// carefully-tuned stagger/easing timings don't drift during conversion.
export default function HeroMatrix() {
  const matrixRef = useRef(null)
  const heroCopyRef = useRef(null)

  useEffect(() => {
    const matrix = matrixRef.current
    const heroCopy = heroCopyRef.current
    if (!matrix) return

    const keys = Object.keys(HERO_DATA.pillars)
    keys.forEach((key, colIndex) => {
      const col = document.createElement('div')
      col.className = 'column'
      col.style.setProperty('--col', HERO_COLORS[key] || '#888')
      const title = document.createElement('div')
      title.className = 'column-title'
      title.textContent = HERO_SHORT_LABELS[key] || HERO_DATA.pillars[key]
      col.appendChild(title)
      ;(HERO_DATA.nodesByPillar[key] || []).forEach((node, rowIndex) => {
        const card = document.createElement('div')
        card.className = 'card'
        card.dataset.row = rowIndex
        card.dataset.col = colIndex
        card.dataset.id = node.id
        if (HERO_SPECIAL[node.id]) card.classList.add(HERO_SPECIAL[node.id][0])
        const body = document.createElement('span')
        body.className = 'label'
        body.textContent = node.name
        if (HERO_SPECIAL[node.id]) {
          const wrap = document.createElement('span')
          wrap.appendChild(body)
          const metric = document.createElement('span')
          metric.className = 'metric'
          metric.textContent = HERO_SPECIAL[node.id][1]
          wrap.appendChild(metric)
          card.appendChild(wrap)
        } else {
          card.appendChild(body)
        }
        col.appendChild(card)
      })
      matrix.appendChild(col)
    })

    // mark the cascade path so it pulses in causal sequence
    HERO_CHAIN_ORDER.forEach((id, i) => {
      const el = matrix.querySelector(`.card[data-id="${id}"]`)
      if (el) el.classList.add('chain', `c${i + 1}`)
    })

    const allCards = [...matrix.querySelectorAll('.card')]
    const byCol = {}
    allCards.forEach((el) => {
      (byCol[el.dataset.col] = byCol[el.dataset.col] || []).push(el)
    })
    Object.values(byCol).forEach((colEls) => colEls.sort((a, b) => +a.dataset.row - +b.dataset.row))

    // build once — every column unfolds top to bottom, columns clustered into
    // left-to-right tiers (finance/ops/tech and scale/data/risk-control share
    // one tier), no re-collapse loop
    function build() {
      const baseDelay = 386
      const rowStep = 251
      const groupStep = rowStep * 1.5
      let maxFinish = 0
      Object.keys(byCol).forEach((colKey) => {
        const col = Number(colKey)
        const colEls = byCol[colKey]
        const groupIndex = HERO_TIER_BY_COL[col] ?? 0
        const colStart = baseDelay + groupIndex * groupStep
        colEls.forEach((el, i) => setTimeout(() => el.classList.add('revealed'), colStart + i * rowStep))
        maxFinish = Math.max(maxFinish, colStart + (colEls.length - 1) * rowStep)
      })
      return maxFinish
    }

    function isUnderHeroCopy(el) {
      if (!heroCopy) return false
      const pad = 28
      const t = heroCopy.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      return (
        r.right > t.left - pad && r.left < t.right + pad &&
        r.bottom > t.top - pad && r.top < t.bottom + pad
      )
    }

    function randomFlipLoop() {
      const pool = allCards.filter(
        (el) => !el.classList.contains('flipping') && !el.classList.contains('flipping-back') && !isUnderHeroCopy(el)
      )
      if (!pool.length) return
      const cell = pool[Math.floor(Math.random() * pool.length)]
      cell.classList.add('flipping')
      const onFlip = (e) => {
        if (e.animationName !== 'cellflip') return
        cell.removeEventListener('animationend', onFlip)
        cell.classList.remove('flipping')
        cell.classList.add('flipping-back')
        const onFlipBack = (ev) => {
          if (ev.animationName !== 'cellflipback') return
          cell.removeEventListener('animationend', onFlipBack)
          cell.classList.remove('flipping-back')
        }
        cell.addEventListener('animationend', onFlipBack)
      }
      cell.addEventListener('animationend', onFlip)
    }

    let intervalId
    const timeouts = []
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches

    if (!reduceMotion) {
      const buildDuration = build()
      timeouts.push(
        setTimeout(() => {
          randomFlipLoop()
          intervalId = setInterval(randomFlipLoop, 2875)
        }, buildDuration + 2000)
      )
    } else {
      allCards.forEach((el) => el.classList.add('revealed'))
    }

    return () => {
      timeouts.forEach(clearTimeout)
      if (intervalId) clearInterval(intervalId)
      matrix.innerHTML = ''
    }
  }, [])

  return (
    <section className="hero-matrix" aria-label="SelfAudit Enterprise Intelligence hero">
      <div className="matrix-shell" aria-hidden="true">
        <div className="matrix" ref={matrixRef} />
      </div>
      <div className="hero-copy" ref={heroCopyRef}>
        <h1>Enterprise Intelligence<br />for Every Business.</h1>
        <p className="sub">For the decisions that shape the business</p>
      </div>
    </section>
  )
}
