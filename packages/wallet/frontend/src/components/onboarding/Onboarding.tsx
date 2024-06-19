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
import { Key } from '../icons/Key'
import { Home } from '../icons/Home'
import { CopyButton } from '@/ui/CopyButton'
import { BASE64_PUBLIC_KEY } from '@/utils/constants'

type StepWithIcon = Step & {
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element
}

export const ONBOARDING_STEPS: StepWithIcon[] = [
  {
    // 0
    target: 'body',
    content: `Welcome to Test Wallet! Test Wallet is a Rafiki playground, where you can add multiple accounts and make Interledger transactions with play money. Let's begin our journey.`,
    disableOverlayClose: true,
    placement: 'center',
    Icon: Wave
  },
  {
    // 1
    target: '#newAccount',
    content: `You need an account in order to deposit money and start transacting. Let's create your first account.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 2
    target: '#createAccountForm',
    content:
      'All accounts need a name, so please add a name for your EUR account.',
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
    target: '#walletAddress',
    content: `In order to send and receive money, all accounts need at least a payment pointer, so let's add a payment pointer to your account.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Plus
  },
  {
    // 5
    target: '#fund',
    content:
      'Your balance is currently $0. In order to make your first transaction, you need to add money to your account.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: MoneyHand
  },
  {
    // 6
    target: '#balance',
    content: 'Congratulations, you have money in your account.',
    disableOverlayClose: true,
    placement: 'center',
    Icon: PaperPlane
  },
  {
    // 7
    target: '#send',
    content:
      'Now that you have created your account and added a payment pointer, we can start making your first Interledger transaction.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: MoneyOut
  },
  {
    // 8
    target: '#sendReceive',
    content: `You have to pay some fees in order to send payments. 'receive' means that the receiver will get the exact amount from the input and you will be paying a small fee in addition to that. 'send' means that the fees will be deducted from the amount in the input, and receiver will get the rest.`,
    disableOverlayClose: true,
    Icon: Switch
  },
  {
    // 9
    target: '#acceptQuote',
    content: `You can review your payment details before sending the money. For now, let's continue the transaction.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: ThumbsUp
  },
  {
    // 10
    target: '#redirectButtonSuccess',
    content: `Congratulations, you have made your first Interledger transaction. Now let's explore your account some more.`,
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
    target: '#eurAccount',
    content: 'Go inside your EUR account.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Dollar
  },
  {
    // 13
    target: '#viewTransactions',
    content: 'You can view all your incoming and outgoing transactions.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: TransactionCircle
  },
  {
    // 14
    target: '#transactionsList',
    content: `Here you can see the transaction list for this payment pointer. Now you are familiar with the basics of Test Wallet. Continue to play around.`,
    disableOverlayClose: true,
    Icon: HomeRooftop
  },

  // DEV KEYS Onboarding steps
  // 24
  {
    target: '#devKeysInfo',
    content: (
      <>
        Need some help with Developer Keys? Go through the Onboarding steps and
        visit the{' '}
        <a
          href="https://openpayments.dev/snippets/before-you-begin/#obtain-a-public-private-key-pair-and-key-id"
          target="/"
          className="underline hover:text-turqoise"
        >
          Open Payments docs
        </a>{' '}
        for more details .
      </>
    ),
    disableOverlayClose: true,
    Icon: Wave
  },
  {
    // 25
    target: '#accountsList',
    content: `On this page you have a list of all your accounts. Expand an account to see all your payment pointers and the developer keys.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 26
    target: '#generateKey',
    content: `You can generate or upload as many keys as you want for a payment pointer. Let's generate a set of keys for this one. `,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Key
  },
  {
    // 27
    target: '#nickname',
    content: `It's important to add a nickname for the set of Developer Keys, as it will be easier to organize if you have multiple. Add a nickname, then click on Generate keys button.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: PersonDoc
  },
  {
    // 28
    target: '#copyKey',
    content: `The private key has been downloaded to your machine. You can copy it to the clipboard, or copy the Base64 encoded version here.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 29
    target: '#closeButtonSuccess',
    content: `The private key is copied to the clipboard. You can paste it somewhere and then let's go see your generated keys.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 30
    target: '#keysList',
    content: `Here you have a list of all your keys organized by nickname. Expand a section to see your developer keys details.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 31
    target: '#keysDetails',
    content: `Here you can copy your Key ID, see your Public Key, and also Revoke your keys, if you don't need them anymore. For now, let's see how you can also upload public keys.`,
    disableOverlayClose: true,
    Icon: Key
  },
  {
    // 32
    target: '#uploadKey',
    content: `Click on the Upload key button.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 33
    target: '#nicknameUpload',
    content: `Add a nickname, use the provided Base64 encoded Public Key, or use a new one, and click on the Upload key button. The new key will appear in the list.`,
    disableOverlayClose: true,
    Icon: Key
  },
  {
    // 34
    target: 'body',
    content: (
      <>
        That&apos;s it for Developer Keys Onboarding. If you need more insight,
        don&apos;t forget to visit the{' '}
        <a
          href="https://openpayments.dev/snippets/before-you-begin/#obtain-a-public-private-key-pair-and-key-id"
          target="/"
          className="underline hover:text-turqoise"
        >
          Open Payments docs
        </a>{' '}
        .
      </>
    ),
    disableOverlayClose: true,
    placement: 'center',
    Icon: Home
  }
]

const Onboarding = () => {
  const router = useRouter()
  const {
    runOnboarding,
    setRunOnboarding,
    stepIndex,
    setStepIndex,
    setIsUserFirstTime,
    setIsDevKeysOnboarding
  } = useOnboardingContext()

  const handleOnboardingFinished = () => {
    setIsUserFirstTime(false)
    setIsDevKeysOnboarding(false)
    setRunOnboarding(false)
    window.localStorage.removeItem('isUserFirstTimeOnTestnet')
  }

  const handleCallback = (data: CallBackProps) => {
    const { action, index, type, status } = data
    if (status === STATUS.SKIPPED || status === STATUS.FINISHED) {
      handleOnboardingFinished()
    } else if (type === 'step:after' && action === 'next') {
      if (
        index === 0 ||
        index === 11 ||
        index === 24 ||
        index === 25 ||
        index === 31
      ) {
        setStepIndex(stepIndex + 1)
      } else if (index !== 28) {
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
