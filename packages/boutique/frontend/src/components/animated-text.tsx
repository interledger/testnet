import { motion } from 'framer-motion'

interface AnimatedTextProps {
  text: string
}

export const AnimatedText = ({ text }: AnimatedTextProps) => {
  return (
    <motion.div
      className="flex overflow-hidden text-center text-xl font-['DejaVuSansMonoBold'] tracking-tight sm:text-3xl"
      variants={{
        hidden: { opacity: 0 },
        visible: () => ({
          opacity: 1,
          transition: { staggerChildren: 0.2, delayChildren: 0.5 }
        })
      }}
      initial="hidden"
      animate="visible"
    >
      {text.split(' ').map((word, index) => (
        <motion.span
          className="mr-1 uppercase"
          variants={{
            visible: {
              opacity: 1,
              y: 0,
              transition: {
                type: 'spring',
                damping: 12,
                stiffness: 100
              }
            },
            hidden: {
              opacity: 0,
              y: 20,
              transition: {
                type: 'spring',
                damping: 12,
                stiffness: 100
              }
            }
          }}
          key={index}
        >
          {word}
        </motion.span>
      ))}
    </motion.div>
  )
}
