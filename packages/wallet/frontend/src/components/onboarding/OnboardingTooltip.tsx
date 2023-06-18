import { Button } from '@/ui/Button'
import { SVGProps } from 'react'
import { TooltipRenderProps } from 'react-joyride'
import { ONBOARDING_STEPS } from './Onboarding'

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
  return (
    <div
      {...tooltipProps}
      className="flex max-w-xl items-center rounded-lg bg-white p-3 font-semibold text-green"
    >
      {IconStep && <IconStep className="mr-4 w-20" />}
      <div className="flex flex-col">
        <div className="pb-4">{step.content}</div>
        {index === 0 && (
          <div className="flex items-center justify-between text-center">
            <Button {...primaryProps}>Let&apos;s go</Button>
            <Button {...skipProps} intent="outline">
              Skip Onboarding
            </Button>
          </div>
        )}
        {(index === 2 ||
          index === 6 ||
          index === 8 ||
          index === 10 ||
          index === 13) && (
          <div className="flex items-start text-center">
            <Button {...primaryProps}>
              {isLastStep ? `Let's go Home` : 'OK'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
