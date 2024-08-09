import { Button } from '@/ui/Button'
import { SVGProps } from 'react'
import { TooltipRenderProps } from 'react-joyride'
import { ONBOARDING_STEPS } from './Onboarding'
import { useOnboardingContext } from '@/lib/context/onboarding'

type OnboardingTooltipProps = TooltipRenderProps

export const OnboardingTooltip = ({
  index,
  isLastStep,
  step,
  primaryProps,
  skipProps,
  tooltipProps
}: OnboardingTooltipProps) => {
  const IconStep: (props: SVGProps<SVGSVGElement>) => JSX.Element =
    ONBOARDING_STEPS[index].Icon

  const { setIsPaymentsSkipped } = useOnboardingContext()

  return (
    <div
      {...tooltipProps}
      className="flex max-w-xl flex-row items-center rounded-lg bg-white p-3 font-medium text-black dark:bg-purple dark:text-white"
    >
      <div className="hidden min-w-20 justify-center pr-6 sm:flex">
        {IconStep && (
          <IconStep className="text-pink-dark dark:text-yellow-neon" />
        )}
      </div>
      <div className="flex flex-col justify-center">
        <div className="pb-2">{step.content}</div>
        {(index === 0 || index === 24) && (
          <div className="flex items-center justify-between text-center text-[11px] sm:text-base">
            <Button {...primaryProps}>Let&apos;s go</Button>
            <Button {...skipProps} intent="outline">
              Skip Onboarding
            </Button>
          </div>
        )}
        {(index === 2 ||
          index === 6 ||
          index === 10 ||
          index === 11 ||
          index === 23 ||
          index === 31 ||
          index === 34) && (
          <div className="flex items-start text-center">
            <Button {...primaryProps}>
              {isLastStep || index === 23 ? `The End` : 'Continue'}
            </Button>
          </div>
        )}
        {(index === 7 || index === 15) && (
          <div className="flex items-center justify-between text-center text-[11px] sm:text-base">
            <Button
              {...primaryProps}
              intent="outline"
              onFocus={() => {
                setIsPaymentsSkipped(true)
              }}
            >
              Skip Onboarding for {index === 7 ? 'Send' : 'Request'} Money
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
