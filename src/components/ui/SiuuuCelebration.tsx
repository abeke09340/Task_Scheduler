import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useCelebration } from '../../stores/celebration'

interface Pose {
  /** Смещение по вертикали (отрицательное — прыжок вверх) */
  y: number
  /** Масштаб 3D-поворота по горизонтали: от 0.14 до 1 */
  flipScaleX: number
  /** Показывать ли лицо (иначе — спина с синей семёркой) */
  showFront: boolean
  /** Squash & stretch корпуса */
  squashX: number
  squashY: number
  /** Угол обеих рук (150° — подняты вверх, 38° — резкий взмах вниз-в стороны SIUUU) */
  armAngle: number
  /** Угол разведения ног (5° — в воздухе, 23° — широкая стойка при приземлении) */
  legAngle: number
  /** Интенсивность вихря вращения в воздухе (0..1) */
  spinWind: number
  /** Ударная волна под бутсами при приземлении (0..1) */
  impactProgress: number
  /** Масштаб надписи SIUUUUU! сверху */
  textScale: number
  /** Общая прозрачность сцены */
  opacity: number
}

interface ConfettiPiece {
  x: number
  y: number
  vx: number
  vy: number
  w: number
  h: number
  color: string
  rotation: number
  vRot: number
  tilt: number
  vTilt: number
  gravity: number
  drag: number
  shape: 'rect' | 'circle'
}

const CONFETTI_COLORS = [
  '#FFD400', // Жёлтый Аль-Наср
  '#1B4DDB', // Синий Аль-Наср
  '#FFD400',
  '#2563EB',
  '#5B6CFF',
  '#22C55E',
  '#F43F5E',
  '#FFFFFF',
]

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v))
const lerp = (a: number, b: number, t: number) => a + (b - a) * clamp(t, 0, 1)
const easeOutCubic = (t: number) => 1 - Math.pow(1 - clamp(t, 0, 1), 3)
const easeInQuad = (t: number) => {
  const c = clamp(t, 0, 1)
  return c * c
}
const easeInOutCubic = (t: number) => {
  const c = clamp(t, 0, 1)
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2
}

/** Пружинящий отскок для надписи SIUUUUU! и удара руками */
function easeOutBack(t: number, overshoot = 1.9): number {
  const c = clamp(t, 0, 1) - 1
  return 1 + (overshoot + 1) * c * c * c + overshoot * c * c
}

/** Вычисление позы Роналду в каждый момент времени t (в секундах, 0..2.65) */
function computePose(t: number): Pose {
  const T_CROUCH = 0.16
  const T_PEAK = 0.50
  const T_LAND = 0.84
  const T_CHOP_END = 0.98
  const T_FADE_START = 2.25
  const T_END = 2.65

  // 1. Прыжок по Y и squash/stretch
  let y = 0
  let squashX = 1
  let squashY = 1

  if (t < T_CROUCH) {
    const p = easeOutCubic(t / T_CROUCH)
    y = lerp(0, 10, p)
    squashX = lerp(1, 1.08, p)
    squashY = lerp(1, 0.9, p)
  } else if (t < T_PEAK) {
    const p = easeOutCubic((t - T_CROUCH) / (T_PEAK - T_CROUCH))
    y = lerp(10, -118, p)
    squashX = lerp(1.06, 0.95, p)
    squashY = lerp(0.92, 1.06, p)
  } else if (t < T_LAND) {
    const p = easeInQuad((t - T_PEAK) / (T_LAND - T_PEAK))
    y = lerp(-118, 0, p)
    squashX = lerp(0.95, 0.98, p)
    squashY = lerp(1.06, 1.02, p)
  } else if (t < T_CHOP_END) {
    const p = (t - T_LAND) / (T_CHOP_END - T_LAND)
    const bounce = Math.sin(p * Math.PI)
    y = bounce * 7
    squashX = 1 + bounce * 0.1
    squashY = 1 - bounce * 0.09
  } else {
    // Лёгкое победное дыхание в стойке
    const breath = Math.sin((t - T_CHOP_END) * 5.5) * 0.014
    squashX = 1 - breath * 0.5
    squashY = 1 + breath
  }

  // 2. Разворот на 360°+ в воздухе: старт лицом (-180°), полный оборот в воздухе и приземление спиной с №7 (+360°)
  let spinDeg = 360
  let spinWind = 0
  if (t < T_CROUCH) {
    spinDeg = -180
  } else if (t < T_LAND) {
    const p = easeInOutCubic((t - T_CROUCH) / (T_LAND - T_CROUCH))
    spinDeg = lerp(-180, 360, p)
    spinWind = Math.sin(clamp((t - T_CROUCH) / (T_LAND - T_CROUCH), 0, 1) * Math.PI)
  } else {
    spinDeg = 360
  }

  const cosVal = Math.cos((spinDeg * Math.PI) / 180)
  const showFront = cosVal < 0
  const flipScaleX = Math.max(0.14, Math.abs(cosVal))

  // 3. Движение обеих рук: вверх в прыжке -> мощный двойной взмах вниз и в стороны при приземлении
  let armAngle = 38
  if (t < T_CROUCH) {
    armAngle = lerp(35, 75, easeOutCubic(t / T_CROUCH))
  } else if (t < T_LAND - 0.04) {
    const p = easeOutCubic((t - T_CROUCH) / (T_LAND - 0.04 - T_CROUCH))
    armAngle = lerp(75, 154, p)
  } else if (t < T_CHOP_END) {
    const p = easeOutBack((t - (T_LAND - 0.04)) / (T_CHOP_END - (T_LAND - 0.04)), 1.4)
    armAngle = lerp(154, 38, p)
  } else {
    armAngle = 38
  }

  // 4. Ноги: собраны в воздухе -> широкая фирменная стойка Роналду при приземлении
  let legAngle = 22
  if (t < T_CROUCH) {
    legAngle = lerp(8, 13, t / T_CROUCH)
  } else if (t < T_LAND - 0.06) {
    legAngle = 5
  } else if (t < T_LAND + 0.08) {
    const p = easeOutBack((t - (T_LAND - 0.06)) / 0.14, 1.3)
    legAngle = lerp(5, 23, p)
  } else {
    legAngle = 23
  }

  // 5. Ударная волна и текст SIUUUUU!
  const impactProgress = t >= T_LAND ? clamp((t - T_LAND) / 0.48, 0, 1) : 0
  const textScale = t >= T_LAND - 0.02 ? easeOutBack(clamp((t - (T_LAND - 0.02)) / 0.28, 0, 1), 2.1) : 0

  // 6. Плавное появление и исчезновение
  let opacity = 1
  if (t < 0.07) opacity = t / 0.07
  else if (t > T_FADE_START) opacity = 1 - clamp((t - T_FADE_START) / (T_END - T_FADE_START), 0, 1)

  return {
    y,
    flipScaleX,
    showFront,
    squashX,
    squashY,
    armAngle,
    legAngle,
    spinWind,
    impactProgress,
    textScale,
    opacity,
  }
}

function spawnConfetti(width: number, height: number): ConfettiPiece[] {
  const pieces: ConfettiPiece[] = []
  const cx = width / 2
  const cy = height / 2 + 10

  // Центральный взрыв из-за спины Роналду
  for (let i = 0; i < 110; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.35
    const speed = 7 + Math.random() * 15
    pieces.push({
      x: cx + (Math.random() - 0.5) * 40,
      y: cy + (Math.random() - 0.5) * 30,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      w: 7 + Math.random() * 6,
      h: 4 + Math.random() * 5,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.25,
      tilt: Math.random() * Math.PI,
      vTilt: 0.1 + Math.random() * 0.2,
      gravity: 0.26 + Math.random() * 0.1,
      drag: 0.985,
      shape: i % 5 === 0 ? 'circle' : 'rect',
    })
  }

  // Боковые залпы сверху для заполнения экрана
  for (let i = 0; i < 45; i++) {
    const fromLeft = i % 2 === 0
    pieces.push({
      x: fromLeft ? width * 0.15 : width * 0.85,
      y: height * 0.35,
      vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 10),
      vy: -8 - Math.random() * 9,
      w: 8 + Math.random() * 5,
      h: 5 + Math.random() * 4,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.22,
      tilt: Math.random() * Math.PI,
      vTilt: 0.12 + Math.random() * 0.18,
      gravity: 0.24 + Math.random() * 0.1,
      drag: 0.988,
      shape: 'rect',
    })
  }

  return pieces
}

function CartoonRonaldoSVG({ pose }: { pose: Pose }) {
  const { showFront, armAngle, legAngle } = pose

  const renderArm = (side: 'left' | 'right') => {
    const px = side === 'left' ? 96 : 164
    const py = 110
    const rot = side === 'left' ? armAngle : -armAngle
    return (
      <g transform={`rotate(${rot} ${px} ${py})`}>
        {/* Рукав жёлтой футболки Аль-Наср */}
        <path
          d={`M ${px - 10} ${py - 4} L ${px + 10} ${py - 4} L ${px + 9} ${py + 24} L ${px - 9} ${py + 24} Z`}
          fill="#FFD400"
          stroke="#1E293B"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Синяя окантовка рукава */}
        <rect
          x={px - 9.5}
          y={py + 19}
          width={19}
          height={6}
          rx={2}
          fill="#1B4DDB"
          stroke="#1E293B"
          strokeWidth="2"
        />
        {/* Предплечье */}
        <rect
          x={px - 6.5}
          y={py + 25}
          width={13}
          height={31}
          rx={6}
          fill="#DA9A6E"
          stroke="#1E293B"
          strokeWidth="2.3"
        />
        {/* Белый тейп на запястье CR7 */}
        <rect
          x={px - 7}
          y={py + 49}
          width={14}
          height={6}
          rx={2}
          fill="#FFFFFF"
          stroke="#1E293B"
          strokeWidth="2"
        />
        {/* Раскрытая ладонь SIUUU */}
        <circle
          cx={px}
          cy={py + 61}
          r={7.5}
          fill="#DA9A6E"
          stroke="#1E293B"
          strokeWidth="2.3"
        />
        <path
          d={`M ${px - 5} ${py + 66} L ${px - 7} ${py + 72} M ${px} ${py + 68} L ${px} ${py + 74} M ${px + 5} ${py + 66} L ${px + 7} ${py + 72}`}
          stroke="#1E293B"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>
    )
  }

  const renderLeg = (side: 'left' | 'right') => {
    const px = side === 'left' ? 114 : 146
    const py = 184
    const rot = side === 'left' ? legAngle : -legAngle
    const toeShift = side === 'left' ? -5 : 5
    return (
      <g transform={`rotate(${rot} ${px} ${py})`}>
        {/* Штанина синих шорт Аль-Наср */}
        <path
          d={`M ${px - 14} ${py - 4} L ${px + 14} ${py - 4} L ${px + 12} ${py + 32} L ${px - 12} ${py + 32} Z`}
          fill="#1B4DDB"
          stroke="#1E293B"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Жёлтая лампаса сбоку шорт */}
        <rect
          x={side === 'left' ? px - 13 : px + 9}
          y={py}
          width={4}
          height={30}
          fill="#FFD400"
        />
        {/* Колено и голень */}
        <rect
          x={px - 7.5}
          y={py + 32}
          width={15}
          height={20}
          rx={5}
          fill="#DA9A6E"
          stroke="#1E293B"
          strokeWidth="2.3"
        />
        {/* Жёлтые гетры Аль-Наср с синими полосками */}
        <rect
          x={px - 8}
          y={py + 48}
          width={16}
          height={32}
          rx={5}
          fill="#FFD400"
          stroke="#1E293B"
          strokeWidth="2.3"
        />
        <rect x={px - 7.5} y={py + 52} width={15} height={4} fill="#1B4DDB" />
        <rect x={px - 7.5} y={py + 58} width={15} height={3} fill="#1B4DDB" />
        {/* Белые бутсы CR7 с золотым акцентом */}
        <path
          d={`M ${px - 9} ${py + 78} L ${px + 9} ${py + 78} L ${px + 11 + toeShift} ${py + 90} L ${px - 11 + toeShift} ${py + 90} Z`}
          fill="#FFFFFF"
          stroke="#1E293B"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <line
          x1={px - 6 + toeShift * 0.5}
          y1={py + 84}
          x2={px + 6 + toeShift * 0.5}
          y2={py + 84}
          stroke="#F59E0B"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </g>
    )
  }

  return (
    <svg
      viewBox="0 0 260 300"
      className="h-[250px] w-[216px] overflow-visible select-none md:h-[280px] md:w-[242px]"
      aria-hidden="true"
    >
      {/* Ноги */}
      {renderLeg('left')}
      {renderLeg('right')}

      {/* Верхняя часть синих шорт (пояс) */}
      <path
        d="M 101 175 L 159 175 L 161 196 Q 130 201 99 196 Z"
        fill="#1B4DDB"
        stroke="#1E293B"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      {/* Жёлтый поясной кант шорт */}
      <line x1="103" y1="178" x2="157" y2="178" stroke="#FFD400" strokeWidth="2.5" />

      {/* Руки (рисуем до/вокруг торса) */}
      {renderArm('left')}
      {renderArm('right')}

      {/* Торс: жёлтая футболка Аль-Наср */}
      <path
        d="M 94 104 Q 130 97 166 104 L 159 178 L 101 178 Z"
        fill="#FFD400"
        stroke="#1E293B"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Лёгкая мультяшная тень по краю футболки */}
      <path d="M 151 105 L 164 105 L 157 176 L 148 176 Z" fill="#EAB308" opacity="0.45" />
      {/* Синие боковые вставки и плечевые полосы Аль-Наср */}
      <path d="M 96 104 L 114 101 L 114 106 L 96 109 Z" fill="#1B4DDB" />
      <path d="M 164 104 L 146 101 L 146 106 L 164 109 Z" fill="#1B4DDB" />
      <path d="M 100 132 L 104 132 L 105 176 L 101 176 Z" fill="#1B4DDB" />
      <path d="M 160 132 L 156 132 L 155 176 L 159 176 Z" fill="#1B4DDB" />

      {showFront ? (
        /* ПЕРЕДНЯЯ СТОРОНА ФУТБОЛКИ (видна в прыжке и на развороте 180°) */
        <g>
          {/* V-образный синий воротник */}
          <path
            d="M 116 101 L 130 116 L 144 101"
            fill="none"
            stroke="#1B4DDB"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Эмблема клуба на груди */}
          <circle cx="145" cy="124" r="6.5" fill="#1B4DDB" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="145" cy="124" r="2.5" fill="#FFD400" />
          {/* Спортивный логотип справа и синяя полоса спонсора */}
          <path d="M 112 124 Q 116 126 121 122" fill="none" stroke="#1B4DDB" strokeWidth="2.4" strokeLinecap="round" />
          <rect x="112" y="141" width="36" height="7" rx="3.5" fill="#1B4DDB" opacity="0.9" />
        </g>
      ) : (
        /* СПИНА ФУТБОЛКИ С СИНИМ НОМЕРОМ 7 (видна при приземлении SIUUUUU!) */
        <g>
          {/* Синий воротник сзади */}
          <path
            d="M 115 102 Q 130 109 145 102"
            fill="none"
            stroke="#1B4DDB"
            strokeWidth="5.5"
            strokeLinecap="round"
          />
          {/* Надпись RONALDO */}
          <text
            x="130"
            y="122"
            textAnchor="middle"
            fill="#1B4DDB"
            fontSize="9.5"
            fontWeight="900"
            letterSpacing="1.2"
            style={{ fontFamily: 'Inter Variable, system-ui, sans-serif' }}
          >
            RONALDO
          </text>
          {/* Крупная спортивная цифра 7 синего цвета */}
          <path
            d="M 115 128 L 146 128 L 146 137 L 129 170 L 118 170 L 135 137 L 115 137 Z"
            fill="#1B4DDB"
            stroke="#FFFFFF"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* Шея */}
      <rect
        x="121"
        y="89"
        width="18"
        height="14"
        rx="5"
        fill="#DA9A6E"
        stroke="#1E293B"
        strokeWidth="2.3"
      />

      {/* Уши + фирменная серьга-гвоздик Роналду */}
      <circle cx="103" cy="66" r="5.5" fill="#DA9A6E" stroke="#1E293B" strokeWidth="2.2" />
      <circle cx="157" cy="66" r="5.5" fill="#DA9A6E" stroke="#1E293B" strokeWidth="2.2" />
      <circle cx="102" cy="70" r="2" fill="#FFFFFF" />
      <circle cx="158" cy="70" r="2" fill="#FFFFFF" />

      {/* Голова */}
      <path
        d="M 105 56 C 105 38 155 38 155 56 L 154 75 C 154 89 142 95 130 95 C 118 95 106 89 106 75 Z"
        fill="#DA9A6E"
        stroke="#1E293B"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />

      {showFront ? (
        /* МУЛЬТЯШНОЕ ЛИЦО РОНАЛДУ */
        <g>
          {/* Причёска CR7 спереди (объёмный зачёс вверх) */}
          <path
            d="M 104 58 C 103 43 114 33 128 31 L 133 24 L 139 30 L 147 26 L 149 34 C 156 39 157 49 156 58 C 152 49 143 45 130 45 C 117 45 108 49 104 58 Z"
            fill="#1C1917"
            stroke="#1E293B"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Выбритая полоска пробора */}
          <line x1="113" y1="44" x2="119" y2="47" stroke="#DA9A6E" strokeWidth="2" strokeLinecap="round" />
          {/* Густые брови */}
          <path d="M 113 56 Q 120 52 126 55" fill="none" stroke="#1C1917" strokeWidth="3.2" strokeLinecap="round" />
          <path d="M 134 55 Q 140 52 147 56" fill="none" stroke="#1C1917" strokeWidth="3.2" strokeLinecap="round" />
          {/* Глаза с бликами */}
          <circle cx="119.5" cy="62.5" r="3.2" fill="#1C1917" />
          <circle cx="140.5" cy="62.5" r="3.2" fill="#1C1917" />
          <circle cx="120.7" cy="61.3" r="1.1" fill="#FFFFFF" />
          <circle cx="141.7" cy="61.3" r="1.1" fill="#FFFFFF" />
          {/* Нос */}
          <path d="M 130 62 L 128.5 70 L 132 70.5" fill="none" stroke="#B57449" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
          {/* Победный крик SIUUUUU! */}
          <path
            d="M 119 76 Q 130 74 141 76 Q 140 88 130 88 Q 120 88 119 76 Z"
            fill="#7F1D1D"
            stroke="#1E293B"
            strokeWidth="2.1"
          />
          {/* Белые зубы */}
          <path d="M 121 76.5 L 139 76.5 L 138 80.5 L 122 80.5 Z" fill="#FFFFFF" />
          <path d="M 125 86 Q 130 83 135 86" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
        </g>
      ) : (
        /* ЗАТЫЛОК РОНАЛДУ (высокий фейд CR7) */
        <g>
          {/* Нижняя зона фейда */}
          <path
            d="M 106 58 Q 130 52 154 58 L 152 78 Q 130 83 108 78 Z"
            fill="#8C6D58"
            opacity="0.55"
          />
          {/* Тёмная макушка с фирменным хохолком CR7 */}
          <path
            d="M 104 59 C 103 42 114 32 128 30 L 133 23 L 139 29 L 147 25 L 149 33 C 156 39 157 48 156 59 Q 143 66 130 66 Q 117 66 104 59 Z"
            fill="#1C1917"
            stroke="#1E293B"
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          {/* Выбритый зигзаг сбоку */}
          <path d="M 145 63 L 152 60" stroke="#DA9A6E" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      )}
    </svg>
  )
}

export function SiuuuCelebration() {
  const burstId = useCelebration((s) => s.burstId)
  const dismiss = useCelebration((s) => s.dismiss)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [pose, setPose] = useState<Pose | null>(null)

  useEffect(() => {
    if (burstId === 0) return

    const start = performance.now()
    const anim = { raf: 0, confettiFired: false, pieces: [] as ConfettiPiece[] }

    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d') ?? null

    const syncCanvasSize = () => {
      if (!canvas) return
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    syncCanvasSize()
    window.addEventListener('resize', syncCanvasSize)

    const tick = (now: number) => {
      const elapsed = (now - start) / 1000

      if (elapsed >= 2.65) {
        setPose(null)
        dismiss()
        return
      }

      const nextPose = computePose(elapsed)
      setPose(nextPose)

      // Залп конфетти ровно в момент мощного приземления Роналду
      if (!anim.confettiFired && elapsed >= 0.82) {
        anim.confettiFired = true
        anim.pieces = spawnConfetti(window.innerWidth, window.innerHeight)
      }

      if (ctx && canvas) {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight)
        for (const p of anim.pieces) {
          p.x += p.vx
          p.y += p.vy
          p.vy += p.gravity
          p.vx *= p.drag
          p.vy *= p.drag
          p.rotation += p.vRot
          p.tilt += p.vTilt

          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(p.rotation)
          ctx.scale(1, Math.cos(p.tilt))
          ctx.fillStyle = p.color
          ctx.globalAlpha = elapsed > 2.2 ? Math.max(0, 1 - (elapsed - 2.2) / 0.45) : 1

          if (p.shape === 'circle') {
            ctx.beginPath()
            ctx.arc(0, 0, p.w * 0.45, 0, Math.PI * 2)
            ctx.fill()
          } else {
            ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
          }
          ctx.restore()
        }
      }

      anim.raf = requestAnimationFrame(tick)
    }

    anim.raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(anim.raf)
      window.removeEventListener('resize', syncCanvasSize)
    }
  }, [burstId, dismiss])

  if (burstId === 0) return null

  return createPortal(
    <div
      className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
      aria-live="polite"
      aria-label="Цель выполнена! SIUUUUU!"
    >
      {/* Холст конфетти на весь экран */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {pose && (
        <div
          className="relative flex flex-col items-center"
          style={{ opacity: pose.opacity }}
        >
          {/* Взрывная надпись SIUUUUU! сверху */}
          <div
            className="mb-1 select-none"
            style={{
              transform: `scale(${Math.max(0, pose.textScale)}) rotate(-3deg)`,
              opacity: pose.textScale > 0.02 ? 1 : 0,
            }}
          >
            <div className="relative flex items-center justify-center">
              {/* Лучи комикс-вспышки вокруг слова */}
              <svg
                viewBox="0 0 320 100"
                className="absolute -inset-x-6 -inset-y-4 h-[96px] w-[310px] overflow-visible"
                aria-hidden="true"
              >
                <g stroke="#FFD400" strokeWidth="3.5" strokeLinecap="round">
                  <line x1="160" y1="6" x2="160" y2="-10" />
                  <line x1="70" y1="16" x2="54" y2="2" />
                  <line x1="250" y1="16" x2="266" y2="2" />
                  <line x1="18" y1="52" x2="-2" y2="50" />
                  <line x1="302" y1="52" x2="322" y2="50" />
                </g>
              </svg>
              <span
                className="relative px-4 py-1 text-[44px] leading-none font-black tracking-wider italic md:text-[54px]"
                style={{
                  color: '#FFD400',
                  WebkitTextStroke: '3px #1B4DDB',
                  paintOrder: 'stroke fill',
                  textShadow: '0 5px 0 #1338A8, 0 10px 24px rgba(27, 77, 219, 0.32)',
                }}
              >
                SIUUUUU!
              </span>
            </div>
          </div>

          {/* Сцена персонажа */}
          <div className="relative flex items-center justify-center">
            {/* Кольца вихря при вращении на 360° в воздухе */}
            {pose.spinWind > 0.05 && (
              <svg
                viewBox="0 0 220 120"
                className="pointer-events-none absolute w-[220px]"
                style={{
                  transform: `translateY(${pose.y - 10}px)`,
                  opacity: pose.spinWind * 0.85,
                }}
                aria-hidden="true"
              >
                <ellipse
                  cx="110"
                  cy="55"
                  rx="86"
                  ry="20"
                  fill="none"
                  stroke="#FFD400"
                  strokeWidth="4"
                  strokeDasharray="48 26"
                />
                <ellipse
                  cx="110"
                  cy="75"
                  rx="72"
                  ry="16"
                  fill="none"
                  stroke="#1B4DDB"
                  strokeWidth="3.5"
                  strokeDasharray="38 24"
                />
              </svg>
            )}

            {/* Тень на газоне + ударная волна при приземлении */}
            <div className="pointer-events-none absolute bottom-2 flex items-center justify-center">
              <div
                className="rounded-full bg-ink/20"
                style={{
                  width: `${clamp(116 + pose.y * 0.45, 48, 130)}px`,
                  height: '16px',
                }}
              />
              {pose.impactProgress > 0 && pose.impactProgress < 1 && (
                <div
                  className="absolute rounded-full border-[3px] border-[#FFD400]"
                  style={{
                    width: `${90 + pose.impactProgress * 150}px`,
                    height: `${20 + pose.impactProgress * 34}px`,
                    opacity: 1 - pose.impactProgress,
                  }}
                />
              )}
            </div>

            {/* Фигура мультяшного Роналду */}
            <div
              style={{
                transform: `translateY(${pose.y}px) scale(${pose.flipScaleX * pose.squashX}, ${pose.squashY})`,
                transformOrigin: 'center bottom',
              }}
            >
              <CartoonRonaldoSVG pose={pose} />
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body,
  )
}
