import { Fragment, useEffect, useRef } from 'react'
import { ORIGIN_AREAS, ORIGIN_CONNECTIONS } from './originMapData'
import './OriginMap.css'

const DESIGN_WIDTH = 1664
const DESIGN_HEIGHT = 1010

// Origin's causal-structure diagram — fixed-px design, uniformly scaled to
// fill whatever width it's embedded at (its own container, not the window,
// so it behaves correctly inside a bounded frame). Ported from
// mockups/foundation-map.html.
export default function OriginMap() {
  const outerRef = useRef(null)
  const scaleWrapRef = useRef(null)

  useEffect(() => {
    const outer = outerRef.current
    const scaleWrap = scaleWrapRef.current
    if (!outer || !scaleWrap) return
    const fit = () => {
      const s = outer.clientWidth / DESIGN_WIDTH
      scaleWrap.style.transform = `scale(${s})`
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(outer)
    return () => ro.disconnect()
  }, [])

  return (
    <div className="origin-map-outer" ref={outerRef}>
      <div className="origin-scale-wrap" ref={scaleWrapRef}>
        <main className="foundation-shell" aria-label="SelfAudit business foundation map">
          <section className="foundation-map">
            <svg
              className="connections"
              viewBox={`0 0 ${DESIGN_WIDTH} ${DESIGN_HEIGHT}`}
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <defs>
                <marker id="originArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
                  <path d="M0,0 L8,4 L0,8" fill="none" stroke="#C9CCD1" strokeWidth="1.2" />
                </marker>
              </defs>
              {ORIGIN_CONNECTIONS.map((c, i) => (
                <path key={i} className="connection" markerEnd={c.arrow ? 'url(#originArrow)' : undefined} d={c.d} />
              ))}
            </svg>

            {ORIGIN_AREAS.map((area) => (
              <article key={area.id} id={area.id} className={`area-card ${area.cls}`}>
                <div className="card-head">
                  <span className="icon">{area.icon}</span>
                  <h3>
                    {area.title.map((line, i) => (
                      <Fragment key={i}>
                        {line}
                        {i < area.title.length - 1 && <br />}
                      </Fragment>
                    ))}
                  </h3>
                </div>
                <ul>
                  {area.items.map((item) => <li key={item}>{item}</li>)}
                </ul>
              </article>
            ))}
          </section>
        </main>
      </div>
    </div>
  )
}
