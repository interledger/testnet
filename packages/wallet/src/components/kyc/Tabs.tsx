import { Tab } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { useKYCFormContext } from './context'
import Image from 'next/image'
import { VerifyIdentityForm } from './VerifyIdentityForm'
import { PersonalDetailsForm } from './PersonalDetailsForm'
import { Play } from '../icons/Play'
import { Button } from '@/ui/Button'

const countries = [
  {
    name: 'Romania',
    value: 'RO'
  },
  {
    name: 'United Kingdom',
    value: 'UK'
  },
  {
    name: 'United States',
    value: 'US'
  },
  { name: 'Argentina', value: 'ARG' }
]

const tabs = [
  {
    name: 'Personal Details',
    id: 'personalInfo',
    title: 'Enter your details',
    contentForm: <PersonalDetailsForm countries={countries} />,
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
    contentForm: <label>TBD</label>,
    imageMobile: 'bank-kyc.webp'
  }
]

export const Tabs = () => {
  const { tab, setTab } = useKYCFormContext()

  return (
    <>
      <div className="w-full max-w-md px-2 py-5 sm:px-0">
        <Tab.Group selectedIndex={tab} onChange={setTab}>
          <Tab.List className="flex space-x-6">
            {tabs.map((kycTab) => (
              <Tab
                key={kycTab.id}
                className="text-md ui-selected:text-brand-green-4 group relative mx-auto w-full py-2.5 text-center font-semibold leading-5 text-brand-green-3 outline-none hover:text-brand-green-4"
              >
                {({ selected }) => (
                  <>
                    {kycTab.name}
                    <div
                      className={cx(
                        'absolute inset-x-0 bottom-0 h-1 rounded-full',
                        selected
                          ? 'bg-brand-green-4'
                          : 'bg-gradient-to-r from-[#00B1D8] to-[#6AC1B7] group-hover:from-brand-green-4 group-hover:to-brand-green-4'
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
                <h2 className="py-10 text-xl font-semibold text-brand-green-3">
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
