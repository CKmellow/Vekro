import { QueryClientProvider, type QueryClient } from '@tanstack/react-query'
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'
import { Toaster } from '@/views/components/ui/Toast'

export function AppProviders({ client, children }: { client: QueryClient; children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      {/* Safety net under each component's own fallback: with reduced motion on, motion skips
          transform and layout animations everywhere (opacity fades still run). */}
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domAnimation} strict>
          {children}
          <Toaster />
        </LazyMotion>
      </MotionConfig>
    </QueryClientProvider>
  )
}
