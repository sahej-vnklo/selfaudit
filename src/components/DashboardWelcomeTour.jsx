import React, { useEffect, useMemo, useRef } from 'react'
import prototypeHtml from '../../prototypes/onboarding-tour-demo.html?raw'

function extractBetween(source, startToken, endToken) {
  const start = source.indexOf(startToken)
  const end = source.indexOf(endToken, start + startToken.length)
  if (start === -1 || end === -1) return ''
  return source.slice(start + startToken.length, end)
}

const prototypeCss = extractBetween(prototypeHtml, '<style>', '</style>')
const prototypeBody = extractBetween(prototypeHtml, '<body>', '<script>')

function createScopedStyles() {
  return `
    ${prototypeCss}

    body {
      padding: 0;
      overflow: hidden;
    }

    .frame {
      width: 100%;
      height: 100dvh;
      min-height: 100dvh;
      border-radius: 0;
      border: none;
      box-shadow: none;
    }

    .demo-controls {
      display: none !important;
    }

    .nav-callout,
    .statement {
      font-family: "Titillium Web", -apple-system, "Helvetica Neue", "Inter", Arial, sans-serif;
      font-style: italic;
      letter-spacing: -0.01em;
    }

    .nav-callout {
      font-size: 18px;
      line-height: 1.45;
    }

    .statement {
      font-size: 24px;
      line-height: 1.45;
      max-width: 560px;
    }

    .click-hint {
      position: absolute;
      right: 24px;
      bottom: 22px;
      z-index: 35;
      min-height: 42px;
      padding: 0 16px;
      border-radius: 14px;
      border: 1px solid rgba(159, 181, 235, 0.16);
      background: rgba(10, 16, 29, 0.8);
      color: var(--text-soft);
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 30px rgba(0, 0, 0, 0.24);
      transition: opacity 0.22s ease, transform 0.22s ease;
    }

    .click-hint.hidden {
      opacity: 0;
      transform: translateY(8px);
      pointer-events: none;
    }
  `
}

export default function DashboardWelcomeTour({ onComplete }) {
  const hostRef = useRef(null)
  const completionTriggeredRef = useRef(false)
  const content = useMemo(() => prototypeBody, [])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    const root = host.shadowRoot || host.attachShadow({ mode: 'open' })
    root.innerHTML = ''

    const fontPreconnect = document.createElement('link')
    fontPreconnect.rel = 'preconnect'
    fontPreconnect.href = 'https://fonts.googleapis.com'

    const fontStylesheet = document.createElement('link')
    fontStylesheet.rel = 'stylesheet'
    fontStylesheet.href = 'https://fonts.googleapis.com/css2?family=Caveat:wght@500;600&display=swap'

    const style = document.createElement('style')
    style.textContent = createScopedStyles()

    const mount = document.createElement('div')
    mount.innerHTML = content

    const clickHint = document.createElement('div')
    clickHint.className = 'click-hint hidden'

    root.append(fontPreconnect, fontStylesheet, style, mount, clickHint)

    const welcomeLayer = root.getElementById('welcomeLayer')
    const sequenceLayer = root.getElementById('sequenceLayer')
    const navCalloutLayer = root.getElementById('navCalloutLayer')
    const arrowSvg = root.getElementById('arrowSvg')
    const chrome = root.getElementById('chrome')
    const topbar = root.getElementById('topbar')
    const statement = root.getElementById('statement')
    const statementLine = root.getElementById('statementLine')
    const restartBtn = root.getElementById('restartBtn')
    const frame = root.getElementById('frame')

    if (
      !welcomeLayer ||
      !sequenceLayer ||
      !navCalloutLayer ||
      !arrowSvg ||
      !chrome ||
      !topbar ||
      !statement ||
      !statementLine ||
      !frame
    ) {
      return undefined
    }

    const navSequence = [
      { selector: '[data-item="home"]', text: 'This is your <span class="highlight">command centre</span>.' },
      { selector: '[data-item="reports"]', text: '<span class="highlight">Reports</span> — Every audit, stored. Nothing forgotten.' },
      { selector: '[data-item="brief"]', text: '<span class="highlight">Intelligence Brief</span> — What matters right now, always at hand.' },
      { selector: '[data-item="know"]', text: '<span class="highlight">What We Know</span> — Everything SelfAudit knows about your business.' },
      { selector: '[data-item="connectors"]', text: '<span class="highlight">Connectors</span> — Real data, not self-reported.' },
      { selector: '[data-item="agent"]', text: '<span class="highlight">Ask SelfAudit</span> investigates before answering.' },
      { selector: '[data-item="billing"]', text: '<span class="highlight">Billing</span> manages your plan.' },
      { selector: '[data-item="account"]', text: '<span class="highlight">Account</span> controls your workspace.' },
    ]

    const cardSequence = [
      { selector: '[data-card="health"]', text: 'Your score, updated after every audit.' },
      { selector: '[data-card="issues"]', text: "What's still unresolved." },
      { selector: '[data-card="opps"]', text: 'Where AI moves the needle for you.' },
      { selector: '[data-card="digest"]', text: 'What changed since your last audit.' },
    ]

    const recommendedSequence = [
      { selector: '[data-card="recommended"]', text: 'The one thing to do this week.' },
    ]

    let stage = 'welcome'
    let typingTimer = null
    let sequenceTimer = null

    const cleanupTimers = () => {
      if (typingTimer) window.clearTimeout(typingTimer)
      if (sequenceTimer) window.clearTimeout(sequenceTimer)
      typingTimer = null
      sequenceTimer = null
    }

    const typeHtmlInto = (target, html, done, speed = 26) => {
      target.innerHTML = ''
      const tmp = document.createElement('div')
      tmp.innerHTML = html
      const finalHtml = tmp.innerHTML
      let i = 0

      const step = () => {
        i += 1
        target.innerHTML = finalHtml.slice(0, i)
        if (i < finalHtml.length) {
          typingTimer = window.setTimeout(step, speed)
        } else {
          typingTimer = null
          done()
        }
      }

      step()
    }

    const getOffsetInFrame = (el) => {
      let top = 0
      let left = 0
      let cur = el
      while (cur && cur !== frame) {
        top += cur.offsetTop
        left += cur.offsetLeft
        cur = cur.offsetParent
      }
      return { top, left, width: el.offsetWidth, height: el.offsetHeight }
    }

    const resetElements = () => {
      root.querySelectorAll('.nav-item, .bottom-item, .account, .card, .followup, .recommended').forEach((el) => {
        el.classList.remove('visible', 'active')
      })
      const home = root.querySelector('[data-item="home"]')
      if (home) home.classList.add('active')
      topbar.classList.remove('visible')
      chrome.classList.remove('sidebar-open', 'zeroed')
      navCalloutLayer.innerHTML = ''
      arrowSvg.querySelectorAll('path').forEach((p) => p.remove())
      statement.classList.remove('visible', 'tail-left', 'cards-band', 'center-x')
      statementLine.innerHTML = ''
    }

    const drawNavArrow = (targetEl, centerY, calloutX) => {
      const { left: navLeft, width: navWidth } = getOffsetInFrame(targetEl)
      const sx = calloutX - 10
      const sy = centerY - 5
      const ex = navLeft + navWidth - 10
      const ey = centerY
      const cp1x = sx - 20
      const cp1y = sy - 22
      const cp2x = ex + 26
      const cp2y = ey - 18

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      path.setAttribute('d', `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${ex} ${ey}`)
      path.setAttribute('stroke', '#DCB878')
      path.setAttribute('stroke-opacity', '0.65')
      path.setAttribute('stroke-width', '1.6')
      path.setAttribute('fill', 'none')
      path.setAttribute('stroke-linecap', 'round')
      path.setAttribute('marker-end', 'url(#arrowHead)')
      arrowSvg.appendChild(path)

      const len = path.getTotalLength()
      path.style.strokeDasharray = `${len}`
      path.style.strokeDashoffset = `${len}`

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          path.style.transition = 'stroke-dashoffset 0.5s cubic-bezier(.4,0,.2,1)'
          path.style.strokeDashoffset = '0'
        })
      })
    }

    const appendNavLine = (item, done) => {
      const target = root.querySelector(item.selector)
      const line = document.createElement('div')
      line.className = 'nav-callout'

      if (target) {
        const { top, height } = getOffsetInFrame(target)
        const centerY = top + height / 2
        const sidebar = root.querySelector('.sidebar')
        const calloutX = (sidebar?.offsetWidth || 220) + 36
        line.style.top = `${centerY}px`
        line.style.left = `${calloutX}px`
        navCalloutLayer.appendChild(line)
        window.requestAnimationFrame(() => line.classList.add('visible'))
        typeHtmlInto(line, item.text, () => {
          drawNavArrow(target, centerY, calloutX)
          done()
        }, 28)
      } else {
        navCalloutLayer.appendChild(line)
        window.requestAnimationFrame(() => line.classList.add('visible'))
        typeHtmlInto(line, item.text, done, 28)
      }
    }

    const positionStatement = (item, options = {}) => {
      const { tail = true, cardsBand = false } = options
      const target = root.querySelector(item.selector)
      statement.classList.remove('tail-left', 'center-x')
      statement.classList.toggle('cards-band', cardsBand)

      if (target) {
        const { top, left, width, height } = getOffsetInFrame(target)
        if (cardsBand) {
          statement.style.left = `${left + width / 2}px`
          statement.style.top = `${top + height + 18}px`
          statement.classList.add('center-x')
        } else {
          statement.style.left = `${left + width / 2}px`
          statement.style.top = `${top + 36}px`
          statement.classList.add('center-x')
        }
      }

      if (tail) statement.classList.add('tail-left')
    }

    const clearStatement = () => {
      statement.classList.remove('visible', 'tail-left', 'cards-band', 'center-x')
    }

    const setClickHint = (text = '') => {
      if (!text) {
        clickHint.textContent = ''
        clickHint.classList.add('hidden')
        return
      }
      clickHint.textContent = text
      clickHint.classList.remove('hidden')
    }

    const runSequence = (items, callback, options = {}) => {
      const { accumulate = false, hold = 1200, speed = 26 } = options
      let index = 0

      const next = () => {
        if (index >= items.length) {
          callback()
          return
        }

        const item = items[index]
        const target = root.querySelector(item.selector)
        if (target) target.classList.add('visible', 'active')

        const finishTyping = () => {
          sequenceTimer = window.setTimeout(() => {
            if (target && item.selector !== '[data-item="home"]') target.classList.remove('active')
            index += 1
            next()
          }, hold)
        }

        if (accumulate) {
          appendNavLine(item, finishTyping)
        } else {
          positionStatement(item, {
            tail: options.tail ?? true,
            cardsBand: options.cardsBand ?? false,
          })
          statement.classList.add('visible')
          typeHtmlInto(statementLine, item.text, finishTyping, speed)
        }
      }

      next()
    }

    const startNavSequence = () => {
      stage = 'nav-sequence'
      setClickHint('')
      welcomeLayer.classList.add('hidden')
      chrome.classList.remove('zeroed')
      sequenceLayer.classList.remove('hidden')
      topbar.classList.add('visible')
      chrome.classList.add('sidebar-open')
      sequenceTimer = window.setTimeout(() => {
        runSequence(navSequence, () => {
          stage = 'nav-wait'
          setClickHint('Click anywhere to continue')
        }, {
          accumulate: true,
          hold: 1580,
          speed: 30,
        })
      }, 540)
    }

    const startCardSequence = () => {
      stage = 'card-sequence'
      setClickHint('')
      navCalloutLayer.innerHTML = ''
      arrowSvg.querySelectorAll('path').forEach((p) => p.remove())
      clearStatement()
      sequenceTimer = window.setTimeout(() => {
        runSequence(cardSequence, () => {
          stage = 'cards-wait'
          clearStatement()
          setClickHint('Click anywhere to continue')
        }, {
          accumulate: false,
          hold: 1550,
          speed: 28,
          tail: false,
          cardsBand: true,
        })
      }, 560)
    }

    const startRecommendedSequence = () => {
      stage = 'recommended-sequence'
      setClickHint('')
      clearStatement()
      sequenceTimer = window.setTimeout(() => {
        runSequence(recommendedSequence, () => {
          stage = 'recommended-wait'
          clearStatement()
          setClickHint('Click anywhere to continue')
        }, {
          accumulate: false,
          hold: 1650,
          speed: 28,
          tail: false,
          cardsBand: false,
        })
      }, 560)
    }

    const showZeroState = () => {
      stage = 'done'
      clearStatement()
      chrome.classList.add('zeroed')
      setClickHint('Click anywhere to enter dashboard')
    }

    const finishTour = () => {
      if (completionTriggeredRef.current) return
      completionTriggeredRef.current = true
      onComplete?.()
    }

    const restartDemo = () => {
      cleanupTimers()
      completionTriggeredRef.current = false
      stage = 'welcome'
      setClickHint('Click anywhere to begin')
      welcomeLayer.classList.remove('hidden')
      chrome.classList.remove('zeroed')
      sequenceLayer.classList.remove('hidden')
      resetElements()
    }

    const handleFrameClick = (event) => {
      if (restartBtn && event.target === restartBtn) return
      if (stage === 'welcome') {
        startNavSequence()
      } else if (stage === 'nav-wait') {
        startCardSequence()
      } else if (stage === 'cards-wait') {
        startRecommendedSequence()
      } else if (stage === 'recommended-wait') {
        showZeroState()
      } else if (stage === 'done') {
        finishTour()
      }
    }

    frame.addEventListener('click', handleFrameClick)
    restartBtn?.addEventListener('click', restartDemo)
    restartDemo()

    return () => {
      cleanupTimers()
      frame.removeEventListener('click', handleFrameClick)
      restartBtn?.removeEventListener('click', restartDemo)
    }
  }, [content, onComplete])

  return <div ref={hostRef} style={styles.host} />
}

const styles = {
  host: {
    width: '100%',
    height: '100dvh',
    overflow: 'hidden',
    background: '#09111c',
  },
}
