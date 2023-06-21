import { useRouter } from 'next/router'
import { SVGProps } from 'react'
import ReactJoyride, { CallBackProps, STATUS, Step } from 'react-joyride'
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
import { ThumbsUp } from '../icons/ThumbsUp'
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
    content: 'Add a name to your USD account.',
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
    content: `Let's add a payment pointer to your account.`,
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
    content: 'Send money using either payment pointer or incoming payment url.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: MoneyOut
  },
  {
    // 8
    target: '#sendReceive',
    content: `You have a Switch here, 'send' means you don't care about the fees, 'received', means you will pay the fees.`,
    disableOverlayClose: true,
    Icon: Switch
  },
  {
    // 9
    target: '#acceptQuote',
    content: `Here is your quote. Let's accept it to continue sending the money.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: ThumbsUp
  },
  {
    // 10
    target: '#redirectButtonSuccess',
    content: `Money sent, let's explore some more.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 11
    target: '#request',
    content: `You can also request money by creating a payment url, and share it with someone. But for now let's see your previous transaction.`,
    disableOverlayClose: true,
    Icon: MoneyCircle
  },
  {
    // 12
    target: '#usdAccount',
    content: 'Go inside your USD account.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Dollar
  },
  {
    // 13
    target: '#viewTransactions',
    content: `Let's view all your incoming and outgoing transactions.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: TransactionCircle
  },
  {
    // 14
    target: '#transactionsList',
    content: `This is your transaction list for this payment pointer. Now you are familiar with the basics of Testnet. Continue to play around.`,
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

  const handleOnboardingFinished = () => {
    setIsUserFirstTime(false)
    window.localStorage.removeItem('isUserFirstTimeOnTestnet')
  }

  const handleCallback = (data: CallBackProps) => {
    const { action, index, type, status } = data
    if (status === STATUS.SKIPPED || status === STATUS.FINISHED) {
      handleOnboardingFinished()
    } else if (type === 'step:after' && action === 'next') {
      if (index === 0 || index === 11) {
        setStepIndex(stepIndex + 1)
      } else {
        // stop the continuous run of the onboarding either because there is a route replace or there is user interaction needed
        setRunOnboarding(false)
      }

      // onboarding steps leading back to Home page
      if (index === 6 || index == 14) {
        router.replace('/')
      }

      // set onboarding to never be shown again after final step
      if (index === 14) {
        handleOnboardingFinished()
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
