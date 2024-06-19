import { Button } from '@/ui/Button'
import { SVGProps, useMemo } from 'react'
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

  const iconClassName = useMemo(() => {
    return `mr-4 ${index === 11 ? 'w-48' : 'w-20'}`
  }, [index])

  return (
    <div
      {...tooltipProps}
      className="flex max-w-xl items-center rounded-lg bg-white p-3 font-semibold text-green"
    >
      {IconStep && <IconStep className={iconClassName} />}
      <div className="flex flex-col justify-center">
        <div className="pb-2">{step.content}</div>
        {(index === 0 || index === 24) && (
          <div className="text-centers flex items-center justify-between text-[11px] sm:text-base">
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
          index === 14 ||
          index === 23 ||
          index === 31 ||
          index === 34) && (
          <div className="flex items-start text-center">
            <Button {...primaryProps}>
              {isLastStep ? `The End` : 'Continue'}
            </Button>
          </div>
        )}
        {(index === 7 || index === 15) && (
          <div className="text-centers flex items-center justify-between text-[11px] sm:text-base">
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
