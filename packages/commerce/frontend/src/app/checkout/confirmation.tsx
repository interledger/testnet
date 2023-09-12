import { AnimatedCheckMark } from '@/components/animated-check-mark.tsx'
import { AnimatedText } from '@/components/animated-text.tsx'
import { Button } from '@/components/ui/button.tsx'

import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

export function Component() {
  return (
    <div className="mt-36 flex min-h-full w-full flex-col items-center gap-y-5">
      <AnimatedCheckMark />
      <AnimatedText text="THANK YOU FOR YOUR ORDER!" />
      <motion.div
        initial="hidden"
        animate="visible"
        variants={{
          hidden: { opacity: 0 },
          visible: { opacity: 1, transition: { delay: 1.5 } }
        }}
      >
        <Button variant="secondary" aria-label="continue shopping" asChild>
          <Link to="/products">Continue shopping</Link>
        </Button>
      </motion.div>
    </div>
  )
}
