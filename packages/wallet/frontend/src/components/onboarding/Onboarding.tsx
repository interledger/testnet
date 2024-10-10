import { useRouter } from 'next/router'
import { SVGProps } from 'react'
import ReactJoyride, { CallBackProps, STATUS, Step } from 'react-joyride'
import { useOnboardingContext } from '../../lib/context/onboarding'
import { OnboardingTooltip } from './OnboardingTooltip'
import { Wave } from '../icons/Wave'
import { New } from '../icons/New'
import { Person } from '../icons/Person'
import { PersonDoc } from '../icons/PersonDoc'
import { Request } from '../icons/Request'
import { MoneyHand } from '../icons/MoneyHand'
import { Send } from '../icons/Send'
import { Pointer } from '../icons/Pointer'
import { Switch } from '../icons/Switch'
import { ThumbsUp } from '../icons/ThumbsUp'
import { Euro } from '../icons/Euro'
import { TransactionCircle } from '../icons/TransactionCircle'
import { HomeRooftop } from '../icons/HomeRooftop'
import { Key } from '../icons/Key'
import { createPortal } from 'react-dom'
import { useMenuContext } from '@/lib/context/menu'
import { THEME } from '@/utils/constants'

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
    Icon: New
  },
  {
    // 2
    target: '#createAccountForm',
    content:
      'All accounts need a name, so please add a name for your new EUR account.',
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
    content: `In order to send and receive money, all accounts need at least one payment pointer, so let's add a payment pointer to your account.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: New
  },
  {
    // 5
    target: '#fund',
    content:
      'Your balance is currently €0. To make your first transaction please add play money.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Request
  },
  {
    // 6
    target: '#balance',
    content: 'Congratulations, you have money in your account.',
    disableOverlayClose: true,
    Icon: MoneyHand
  },
  {
    // 7
    target: '#send',
    content:
      'Now that you have created your account and added a payment pointer, we can start making your first Interledger transaction.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Send
  },
  {
    // 8
    target: '#mobile_send',
    content:
      'Now that you have created your account and added a payment pointer, we can start making your first Interledger transaction.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Send
  },
  {
    // 9
    target: '#selectAccount',
    content:
      'Select any of your existing accounts you want to send money from.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 10
    target: '#selectWalletAddress',
    content:
      'Select a payment pointer from the above accounts list of payment pointers.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 11
    target: '#addRecipientWalletAddress',
    content:
      'For your first transaction, we already added a recipient payment pointer. For your future transactions here you can add the recipients payment pointer, or a received incoming payment URL.',
    disableOverlayClose: true,
    Icon: Pointer
  },
  {
    // 12
    target: '#sendReceive',
    content: `You have to pay some fees in order to send payments. 'send' means that the fees will be deducted from the amount in the input, and receiver will get the rest. 'receive' means that the receiver will get the exact amount from the input and you will be paying a small fee in addition to that.`,
    disableOverlayClose: true,
    Icon: Switch
  },
  {
    // 13
    target: '#addAmount',
    content:
      'Set the amount you want to send, add a description for the payment, if you want, then Review your transaction.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 14
    target: '#acceptQuote',
    content: `You can review your payment details before sending the money.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: ThumbsUp
  },
  {
    // 15
    target: '#redirectButtonSuccess',
    content: `Congratulations, you have made your first Interledger transaction. Now let's explore your account some more.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 16
    target: '#request',
    content: `Let's request money by creating a payment url, and sharing it with someone.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Request
  },
  {
    // 17
    target: '#mobile_request',
    content: `Let's request money by creating a payment url, and sharing it with someone.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Request
  },
  {
    // 18
    target: '#selectAccountRequest',
    content:
      'Select any of your existing accounts you want to receive money into.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 19
    target: '#selectWalletAddressRequest',
    content:
      'Select a payment pointer from the above accounts list of payment pointers.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 20
    target: '#addAmountRequest',
    content:
      'Set the amount you want to receive. Then, if you want, you can add a description for the request, and set the expiration time, then click on the Request button.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 21
    target: '#copyIncomingPaymentUrl',
    content:
      'You can copy your incoming payment URL request, and share it with someone who needs to send you money.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 22
    target: '#redirectButtonSuccess',
    content: `Congratulations, the URL is copied to the clipboard. Save it, and let's explore your account some more.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 23
    target: '#eurAccount',
    content: 'Go inside your EUR account.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Euro
  },
  {
    // 24
    target: '#viewTransactions',
    content: 'You can view all your incoming and outgoing transactions.',
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: TransactionCircle
  },
  {
    // 25
    target: 'body',
    content: `Here you can see the transaction list for this payment pointer. Now you are familiar with the basics of Test Wallet. Continue to play around.`,
    disableOverlayClose: true,
    placement: 'center',
    Icon: HomeRooftop
  },

  // DEV KEYS Onboarding steps
  // 26
  {
    target: '#devKeysInfo',
    content: (
      <>
        Need some help with Developer Keys? Go through the Onboarding steps and
        visit the{' '}
        <a
          href="https://openpayments.dev/snippets/before-you-begin/#obtain-a-public-private-key-pair-and-key-id"
          target="/"
          className="underline hover:text-pink-dark dark:hover:text-teal-neon"
        >
          Open Payments docs
        </a>{' '}
        for more details.
      </>
    ),
    disableOverlayClose: true,
    Icon: Wave
  },
  {
    // 27
    target: '#accountsList',
    content: `On this page you have a list of all your accounts. Expand an account to see all your payment pointers and the developer keys.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 28
    target: '#generateKey',
    content: `You can generate or upload as many keys as you want for a payment pointer. Let's generate a set of keys for this one.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Key
  },
  {
    // 29
    target: '#nickname',
    content: `It's important to add a nickname for the set of Developer Keys, as it will be easier to organize if you have multiple. Add a nickname, then click on Generate keys button.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: PersonDoc
  },
  {
    // 30
    target: '#copyKey',
    content: `The private key has been downloaded to your machine. You can copy it to the clipboard, or copy the Base64 encoded version here.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 31
    target: '#closeButtonSuccess',
    content: `The private key is copied to the clipboard. You can paste it somewhere and then let's go see your generated keys.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 32
    target: '#keysList',
    content: `Here you have a list of all your keys organized by nickname. Expand a section to see your developer keys details.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 33
    target: '#keysDetails',
    content: `Here you can copy your Key ID, see your Public Key, and also Revoke your keys, if you don't need them anymore. For now, let's see how you can also upload public keys.`,
    disableOverlayClose: true,
    Icon: Key
  },
  {
    // 34
    target: '#uploadKey',
    content: `Click on the Upload key button.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Pointer
  },
  {
    // 35
    target: '#nicknameUpload',
    content: `Add a nickname, use the provided Base64 encoded Public Key (or use a new one if you get an error), and click on the Upload key button. The new key will appear in the list.`,
    disableOverlayClose: true,
    spotlightClicks: true,
    Icon: Key
  },
  {
    // 36
    target: 'body',
    content: (
      <>
        That&apos;s it for Developer Keys Onboarding. If you need more insight,
        don&apos;t forget to visit the{' '}
        <a
          href="https://openpayments.dev/snippets/before-you-begin/#obtain-a-public-private-key-pair-and-key-id"
          target="/"
          className="underline hover:text-pink-dark dark:hover:text-teal-neon"
        >
          Open Payments docs.
        </a>
      </>
    ),
    disableOverlayClose: true,
    placement: 'center',
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
    setIsUserFirstTime,
    setIsDevKeysOnboarding,
    isPaymentsSkipped,
    setIsPaymentsSkipped
  } = useOnboardingContext()

  const { setSidebarIsOpen } = useMenuContext()
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
        index === 12 ||
        index === 26 ||
        index === 33
      ) {
        // there is a button on these tooltips, the click of the button increases the onboarding step index
        setStepIndex(stepIndex + 1)
      } else if (isPaymentsSkipped) {
        // added Skip option for Sending or Requesting payments
        if (index === 7) {
          setStepIndex(16)
        }
        if (index === 8) {
          setStepIndex(17)
        }
        if (index === 16) {
          setStepIndex(23)
        }
        if (index === 17) {
          setStepIndex(23)
        }
        setIsPaymentsSkipped(false)
      } else if (
        index !== 1 &&
        index !== 15 &&
        index !== 21 &&
        index !== 24 &&
        index !== 30
      ) {
        // 21, 30 -> request copy URL and copy private key, step can continue to button on the same dialog window
        // stop the continuous run of the onboarding either because there is a route replace or there is user interaction needed
        setRunOnboarding(false)
      }

      // mobile skips and tricks
      if ((index === 6 || index === 15) && window.innerWidth <= 767) {
        setRunOnboarding(false)
        setSidebarIsOpen(true)
        setStepIndex(index + 1)
      }

      // onboarding steps leading back to Home page
      if (index === 6 || index === 15 || index === 25) {
        router.replace('/')
      }
      // set onboarding to never be shown again after final step in user first time onboarding, or for the developer keys onboarding
      if (index === 25 || index === 36) {
        handleOnboardingFinished()
      }
    }
  }

  return createPortal(
    <ReactJoyride
      steps={ONBOARDING_STEPS}
      tooltipComponent={OnboardingTooltip}
      stepIndex={stepIndex}
      callback={handleCallback}
      continuous
      run={runOnboarding}
      styles={{
        options: {
          arrowColor: THEME === 'dark' ? '#470c6e' : '#ffffff'
        }
      }}
    />,
    document.body
  )
}

export default Onboarding
