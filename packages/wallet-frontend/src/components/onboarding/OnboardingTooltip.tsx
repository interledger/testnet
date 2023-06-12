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
  tooltipProps
}: OnboardingTooltipProps) => {
  const IconStep: (props: SVGProps<SVGSVGElement>) => JSX.Element =
    ONBOARDING_STEPS[index].Icon
  return (
    <div
      {...tooltipProps}
      className="flex max-w-sm flex-row items-center justify-center rounded-lg bg-white p-3 font-semibold text-green"
    >
      {IconStep && <IconStep className="mr-5" />}
      <div className="flex flex-col items-start">
        <div className="pb-4">{step.content}</div>
        {index === 0 && (
          <div className="text-center">
            <Button {...primaryProps}>Let's go</Button>
          </div>
        )}
        {(index === 2 ||
          index === 6 ||
          index === 8 ||
          index === 10 ||
          index === 13) && (
          <div className="text-center">
            <Button {...primaryProps}>
              {isLastStep ? `Let's go Home` : 'OK'}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
