import { useRouter } from 'next/router'
import { SVGProps } from 'react'
import ReactJoyride, { CallBackProps, Step } from 'react-joyride'
import { useOnboardingContext } from '../../lib/context/onboarding'
import { Dollar } from '../icons/Dollar'
import { HomeRooftop } from '../icons/HomeRooftop'
import { MoneyCircle } from '../icons/MoneyCircle'
import { MoneyHand } from '../icons/MoneyHand'
import { MoneyOut } from '../icons/MoneyOut'
import { PaperPlane } from '../icons/PaperPlane'
import { Person } from '../icons/Person'
import { PersonDoc } from '../icons/PersonDoc'
import { Plus } from '../icons/Plus'
import { Pointer } from '../icons/Pointer'
import { Switch } from '../icons/Switch'
import { TransactionCircle } from '../icons/TransactionCircle'
import { Wave } from '../icons/Wave'
import { OnboardingTooltip } from './OnboardingTooltip'

type StepWithIcon = Step & {
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
}

export const ONBOARDING_STEPS: StepWithIcon[] = [
  {
    // 0
    target: 'body',
    content: `Welcome to Testnet! Let's begin our journey.`,
    disableOverlayClose: true,
    placement: 'center',
    Icon: Wave
  },
  {
    // 1
    target: '#newAccount',
    content: `Let's create your first account.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 2
    target: '#createAccountForm',
    content: 'Add a name and create your USD account.',
    placement: 'center',
    disableOverlayClose: true,
    Icon: Person
  },
  {
    // 3
    target: '#redirectButtonSuccess',
    content: `Let's see inside your newly created account.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: PersonDoc
  },
  {
    // 4
    target: '#paymentPointer',
    content: `Let's add a payment pointer to your USD account.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Plus
  },
  {
    // 5
    target: '#fund',
    content: `Let's add play money to your account.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: MoneyHand
  },
  {
    // 6
    target: '#withdraw',
    content: `You can also withdraw money here, but for now let's send some money to Interledger.`,
    disableOverlayClose: true,
    Icon: PaperPlane
  },
  {
    // 7
    target: '#send',
    content: 'Send money using either payment pointer or payment url.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: MoneyOut
  },
  {
    // 8
    target: '#sendReceive',
    content: `You have a Switch here. When it's on 'send', you are sending money and you don't care about the fees.
     When it's on 'received', the amount entered will be exactly the one received by the other end, you might end up paying extra for fees.`,
    disableOverlayClose: true,
    Icon: Switch
  },
  {
    // 9
    target: '#redirectButtonSuccess',
    content: `Money sent, let's explore some more.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 10
    target: '#request',
    content: `You can also request money by creating a payment url, and share it with someone. But for now let's see your previous transaction.`,
    disableOverlayClose: true,
    Icon: MoneyCircle
  },
  {
    // 11
    target: '#usdAccount',
    content: 'Go inside your USD account.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Dollar
  },
  {
    // 12
    target: '#viewTransactions',
    content: `Let's view all your incoming and outgoing transactions.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: TransactionCircle
  },
  {
    // 13
    target: '#transactionsList',
    content: `That's it folks. Now you are familiar with Testnet. Continue to play around.`,
    disableOverlayClose: true,
    Icon: HomeRooftop
  }
]

const Onboarding = () => {
  const router = useRouter()
  const {
    runOnboarding,
    setRunOnboarding,
    stepIndex,
    setStepIndex,
    setIsUserFirstTime
  } = useOnboardingContext()

  const handleCallback = (data: CallBackProps) => {
    const { action, index, type } = data
    if (type === 'step:after' && action === 'next') {
      if (index === 0 || index === 10) {
        setStepIndex(stepIndex + 1)
      } else {
        // stop the continuous run of the onboarding either because there is a route replace or there is user interaction needed
        setRunOnboarding(false)
      }

      // onboarding steps leading back to Home page
      if (index === 6 || index == 13) {
        router.replace('/')
      }

      // set onboarding to never be shown again after final step
      if (index === 13) {
        setIsUserFirstTime(false)
        window.localStorage.removeItem('isUserFirstTimeOnTestnet')
      }
    }
  }

  return (
    <ReactJoyride
      steps={ONBOARDING_STEPS}
      tooltipComponent={OnboardingTooltip}
      stepIndex={stepIndex}
      callback={handleCallback}
      continuous
      run={runOnboarding}
    />
  )
}

export default Onboarding
