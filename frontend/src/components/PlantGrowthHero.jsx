import React, { useRef, useEffect, useState } from 'react'
import { Box, Typography, Button } from '@mui/material'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const FRAME_COUNT = 175
// Same as reference: scene00001, scene00003, ... scene00349 (175 frames). Put frames in public/plant-growth/
const BASE_PATH = '/plant-growth'
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1920&q=80'

function getFramePath(index) {
  const num = String(2 * index + 1).padStart(5, '0')
  return `${BASE_PATH}/scene${num}.png`
}

function scaleImage(img, ctx) {
  if (!img || !ctx || !ctx.canvas) return
  if (!img.complete || !img.naturalWidth) return
  const canvas = ctx.canvas
  const hRatio = canvas.width / img.width
  const vRatio = canvas.height / img.height
  const ratio = Math.max(hRatio, vRatio)
  const centerShiftX = (canvas.width - img.width * ratio) / 2
  const centerShiftY = (canvas.height - img.height * ratio) / 2
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(
    img,
    0, 0, img.width, img.height,
    centerShiftX, centerShiftY,
    img.width * ratio, img.height * ratio
  )
}

export default function PlantGrowthHero() {
  const canvasRef = useRef(null)
  const sectionRef = useRef(null)
  const block1Ref = useRef(null)
  const block2Ref = useRef(null)
  const headingRef = useRef(null)
  const subheadingRef = useRef(null)
  const [useFallback, setUseFallback] = useState(false)
  const imagesRef = useRef([])
  const imageSeqRef = useRef({ frame: 0 })
  const scrollTriggerRef = useRef(null)
  const pinTriggerRef = useRef(null)

  // Preload images and set up scroll-driven frame animation (match reference script.js)
  useEffect(() => {
    const canvas = canvasRef.current
    const section = sectionRef.current
    if (!canvas || !section) return

    const ctx = canvas.getContext('2d')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight

    const images = []
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image()
      img.src = getFramePath(i)
      images.push(img)
    }
    imagesRef.current = images

    function render() {
      const frame = Math.round(imageSeqRef.current.frame)
      const img = images[frame]
      ctx.fillStyle = '#1a2e1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      if (img && img.complete && img.naturalWidth) {
        scaleImage(img, ctx)
      }
    }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      render()
    }

    let loadFailed = false
    const checkFirstLoad = () => {
      if (loadFailed) return
      if (!images[0].complete || !images[0].naturalWidth) return
      render()
      setScrollTrigger()
    }

    images[0].onerror = () => {
      loadFailed = true
      setUseFallback(true)
    }
    images[0].onload = checkFirstLoad

    // Timeout: if first frame doesn't load in 3s, show fallback
    const t = setTimeout(() => {
      if (!images[0].complete || !images[0].naturalWidth) {
        loadFailed = true
        setUseFallback(true)
      }
    }, 3000)

    function setScrollTrigger() {
      if (scrollTriggerRef.current) return
      imageSeqRef.current.frame = 0
      scrollTriggerRef.current = gsap.to(imageSeqRef.current, {
        frame: FRAME_COUNT - 1,
        snap: 'frame',
        ease: 'none',
        scrollTrigger: {
          scrub: 0.15,
          trigger: section,
          start: 'top top',
          end: '300% top',
          onUpdate: () => render(),
        },
      })
      pinTriggerRef.current = ScrollTrigger.create({
        trigger: section,
        pin: true,
        start: 'top top',
        end: '300% top',
      })
      ScrollTrigger.refresh()
    }

    window.addEventListener('resize', resize)
    render()

    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', resize)
      if (scrollTriggerRef.current?.scrollTrigger) scrollTriggerRef.current.scrollTrigger.kill()
      scrollTriggerRef.current?.kill()
      pinTriggerRef.current?.kill()
    }
  }, [])

  // Re-run scroll setup when section is in DOM (after fallback state settles)
  useEffect(() => {
    if (useFallback) return
    const canvas = canvasRef.current
    const section = sectionRef.current
    const images = imagesRef.current
    if (!canvas || !section || !images?.length) return
    const ctx = canvas.getContext('2d')
    const frame = Math.round(imageSeqRef.current.frame)
    const img = images[frame]
    if (img?.complete && img?.naturalWidth) {
      ctx.fillStyle = '#1a2e1a'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      scaleImage(img, ctx)
    }
  }, [useFallback])

  // Text block scroll effects: block1 moves up and fades, block2 moves up from below (match reference)
  useEffect(() => {
    const section = sectionRef.current
    const block1 = block1Ref.current
    const block2 = block2Ref.current
    if (!section || !block1 || !block2) return
    const vh = window.innerHeight
    gsap.set(block2, { y: vh * 0.5, opacity: 0 })
    const tween1 = gsap.to(block1, {
      y: -vh * 0.6,
      opacity: 0,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: '55% top', scrub: 0.35 },
    })
    const tween2 = gsap.to(block2, {
      y: 0,
      opacity: 1,
      ease: 'none',
      scrollTrigger: { trigger: section, start: 'top top', end: '55% top', scrub: 0.35 },
    })
    return () => {
      tween1.kill()
      tween2.kill()
      tween1.scrollTrigger?.kill()
      tween2.scrollTrigger?.kill()
    }
  }, [])

  // Hero text entrance on load
  useEffect(() => {
    const id = setTimeout(() => {
      const heading = headingRef.current
      const subheading = subheadingRef.current
      if (!heading || !subheading) return
      const lines = heading.querySelectorAll('.hero-line')
      if (!lines.length) return
      gsap.set([...lines, subheading], { y: -60 })
      const tl = gsap.timeline({ delay: 0.15 })
      tl.to(lines[0], { y: 0, duration: 0.5, ease: 'power2.out' })
      if (lines[1]) tl.to(lines[1], { y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
      tl.to(subheading, { y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.3')
    }, 50)
    return () => clearTimeout(id)
  }, [])

  return (
    <Box
      ref={sectionRef}
      sx={{
        position: 'relative',
        height: '100vh',
        width: '100%',
        overflow: 'hidden',
        bgcolor: '#1a2e1a',
      }}
    >
      {useFallback && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            zIndex: 1,
            background: `linear-gradient(rgba(26,46,26,0.75), rgba(26,46,26,0.7)), url(${FALLBACK_IMAGE}) center/cover`,
          }}
        />
      )}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 2,
          display: useFallback ? 'none' : 'block',
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          top: '38%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          zIndex: 10,
          textAlign: 'center',
          pointerEvents: 'none',
        }}
      >
        <Box ref={block1Ref} sx={{ willChange: 'transform, opacity', position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '100%', zIndex: 2 }}>
          <Box ref={headingRef} sx={{ overflow: 'visible', pt: 1 }}>
            <Typography
              component="h1"
              variant="h1"
              sx={{
                color: '#f5f5f5',
                fontFamily: '"Nunito", sans-serif',
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '5rem' },
                fontWeight: 500,
                lineHeight: 1.2,
              }}
            >
              <span className="hero-line" style={{ display: 'block' }}>Modify The Way</span>
              <span className="hero-line" style={{ display: 'block' }}>You Grow...</span>
            </Typography>
            <Typography
              ref={subheadingRef}
              variant="h5"
              sx={{
                color: '#f5f5f5',
                fontFamily: '"Nunito", sans-serif',
                mt: 2,
                fontSize: { xs: '1rem', sm: '1.5rem', md: '2rem' },
                fontWeight: 400,
              }}
            >
              From seed to success
              <br />
              Growing together in Agriculture.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '100%', zIndex: 1 }}>
          <Box ref={block2Ref} sx={{ willChange: 'transform, opacity', width: '100%', opacity: 0 }} style={{ transform: 'translateY(50vh)' }}>
            <Typography
              component="h1"
              variant="h1"
              sx={{
                color: '#f5f5f5',
                fontFamily: '"Nunito", sans-serif',
                fontSize: { xs: '2.5rem', sm: '3.5rem', md: '5rem' },
                fontWeight: 500,
                lineHeight: 1.2,
              }}
            >
              Connecting Farmers
            </Typography>
            <Typography
              variant="h5"
              sx={{
                color: '#f5f5f5',
                fontFamily: '"Nunito", sans-serif',
                mt: 2,
                fontSize: { xs: '1rem', sm: '1.5rem', md: '2rem' },
                fontWeight: 400,
                opacity: 0.9,
              }}
            >
              Knowledge, resources, and grow at your finger tips.
              <br />
              Backbone, so you can stay lean and keep focus.
            </Typography>
          </Box>
        </Box>
      </Box>
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          gap: 2,
          pointerEvents: 'auto',
        }}
      >
        <Button component={Link} to="/register" variant="contained" size="large" sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' } }}>
          Get started
        </Button>
        <Button component={Link} to="/login" variant="outlined" size="large" sx={{ borderColor: 'rgba(255,255,255,0.9)', color: 'white', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
          Login
        </Button>
      </Box>
    </Box>
  )
}
