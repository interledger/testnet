import { Tab } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { useKYCFormContext } from './context'
import Image from 'next/image'
import { VerifyIdentityForm } from './VerifyIdentityForm'
import { PersonalDetailsForm } from './PersonalDetailsForm'
import { Play } from '../icons/Play'
import { Button } from '@/ui/Button'

const tabs = [
  {
    name: 'Personal Details',
    id: 'personalInfo',
    title: 'Enter your details',
    contentForm: <PersonalDetailsForm />,
    imageMobile: 'personal-info-kyc.webp'
  },
  {
    name: 'ID proof',
    id: 'id',
    title: 'Choose document type',
    contentForm: <VerifyIdentityForm />,
    imageMobile: 'id-kyc.webp'
  },
  {
    name: 'Bank details',
    id: 'bank',
    title: 'Bank account details',
    contentForm: (
      <label>
        Work in progress. We are using play money for the time being.
      </label>
    ),
    imageMobile: 'bank-kyc.webp'
  }
]

export const Tabs = () => {
  const { tab, setTab, disabled } = useKYCFormContext()

  return (
    <>
      <div className="w-full max-w-md px-2 py-5 sm:px-0">
        <Tab.Group selectedIndex={tab} onChange={setTab}>
          <Tab.List className="flex space-x-6">
            {tabs.map((kycTab) => (
              <Tab
                disabled={disabled}
                key={kycTab.id}
                className={({ selected }) =>
                  cx(
                    'text-md group relative mx-auto w-full py-2.5 text-center font-semibold leading-5 outline-none',
                    selected ? 'text-green' : 'text-green-3 hover:text-green',
                    kycTab.id === 'personalInfo'
                      ? 'disabled:text-green'
                      : 'disabled:text-black/40'
                  )
                }
              >
                {({ selected }) => (
                  <>
                    {kycTab.name}
                    <div
                      className={cx(
                        'absolute inset-x-0 bottom-0 h-1 rounded-full',
                        selected
                          ? 'bg-green'
                          : 'bg-gradient-primary group-hover:bg-gradient-to-r group-hover:from-green group-hover:to-green'
                      )}
                    ></div>
                  </>
                )}
              </Tab>
            ))}
          </Tab.List>
          <Tab.Panels>
            {tabs.map((kycTab) => (
              <Tab.Panel key={kycTab.id}>
                <h2 className="py-8 text-xl font-semibold text-green-3">
                  {kycTab.title}
                </h2>
                {kycTab.contentForm}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
      <Image
        className="mt-auto object-cover md:hidden"
        src={`/${tabs[tab].imageMobile}`}
        alt="KYC"
        quality={100}
        width={500}
        height={200}
      />
    </>
  )
}

export const TabsNavigation = () => {
  const { tab, setTab } = useKYCFormContext()

  return (
    <div className="my-auto flex w-full flex-row-reverse justify-between px-5">
      {tab < tabs.length - 1 && (
        <button aria-label="login" onClick={() => setTab(tab + 1)}>
          <Play />
        </button>
      )}
      {tab === tabs.length - 1 && (
        <Button aria-label="submit" type="submit" className="mx-auto">
          Submit
        </Button>
      )}

      {tab > 0 && (
        <button
          aria-label="login"
          type="submit"
          onClick={() => setTab(tab - 1)}
        >
          <Play className="rotate-180" />
        </button>
      )}
    </div>
  )
}
