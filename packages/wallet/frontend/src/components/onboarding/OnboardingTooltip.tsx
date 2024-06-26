import { Button } from '@/ui/Button'
import { SVGProps } from 'react'
import { TooltipRenderProps } from 'react-joyride'
import { ONBOARDING_STEPS } from './Onboarding'
import { useOnboardingContext } from '@/lib/context/onboarding'
import { useTheme } from 'next-themes'

type OnboardingTooltipProps = TooltipRenderProps

export const OnboardingTooltip = ({
  index,
  isLastStep,
  step,
  primaryProps,
  skipProps,
  tooltipProps
}: OnboardingTooltipProps) => {
  const theme = useTheme()
  const IconStep: (props: SVGProps<SVGSVGElement>) => JSX.Element =
    theme.theme === 'dark'
      ? ONBOARDING_STEPS[index].Icon.dark
      : ONBOARDING_STEPS[index].Icon.light

  const { setIsPaymentsSkipped } = useOnboardingContext()

  return (
    <div
      {...tooltipProps}
      className="flex flex-row max-w-xl items-center rounded-lg bg-white text-black dark:bg-purple dark:text-white p-3 font-medium"
    >
      <div className="pr-6 hidden sm:flex justify-center min-w-20">
        {IconStep && <IconStep />}
      </div>
      <div className="flex flex-col justify-center">
        <div className="pb-2">{step.content}</div>
        {(index === 0 || index === 24) && (
          <div className="text-center flex items-center justify-between text-[11px] sm:text-base">
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
          <div className="text-center flex items-center justify-between text-[11px] sm:text-base">
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
