import { AnimatePresence, motion } from 'motion/react'
import { TriangleAlert } from 'lucide-react'

/** Form-level error banner, announced to screen readers. */
export function FormAlert({ message }: { message: string | null }) {
  return (
    <div role="alert" aria-live="assertive">
      <AnimatePresence initial={false}>
        {message && (
          <motion.div
            className="form-alert"
            initial={{ opacity: 0, y: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TriangleAlert size={20} aria-hidden="true" />
            <p>{message}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
