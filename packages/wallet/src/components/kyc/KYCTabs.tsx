import { Tab } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { useState } from 'react'
import { Play } from '../Icons/Play'
import { Button } from '@/ui/Button'
import { PersonalDetailsForm } from './PersonalDetailsForm'
import { IdentificationForm } from './IdentificationForm'

const kycTabs = [
  {
    name: 'Personal Details',
    id: 'personalInfo',
    title: 'Enter your details',
    contentForm: <PersonalDetailsForm />
  },
  {
    name: 'ID proof',
    id: 'id',
    title: 'Choose document type',
    contentForm: <IdentificationForm />
  },
  {
    name: 'Bank details',
    id: 'bank',
    title: 'Bank account details',
    contentForm: <label>TBD</label>
  }
]

export const KYCTabs = () => {
  const [selectedIndex, setSelectedIndex] = useState(0)

  const Navigation = () => {
    return (
      <div className="my-auto flex w-full justify-between">
        {selectedIndex > 0 && (
          <button
            aria-label="login"
            type="submit"
            onClick={() => setSelectedIndex(selectedIndex - 1)}
          >
            <Play className="rotate-180" />
          </button>
        )}
        {selectedIndex === kycTabs.length - 1 && (
          <Button aria-label="submit" type="submit" className="mx-auto">
            Submit
          </Button>
        )}
        {selectedIndex < kycTabs.length - 1 && (
          <button
            aria-label="login"
            onClick={() => setSelectedIndex(selectedIndex + 1)}
          >
            <Play />
          </button>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="w-full max-w-md px-2 py-5 sm:px-0">
        <Tab.Group selectedIndex={selectedIndex} onChange={setSelectedIndex}>
          <Tab.List className="flex space-x-6">
            {kycTabs.map((kycTab) => (
              <Tab
                key={kycTab.id}
                className="text-md group relative mx-auto w-full py-2.5 text-center font-semibold leading-5 text-brand-green-3 outline-none hover:text-brand-green-4 ui-selected:text-brand-green-4"
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
            {kycTabs.map((kycTab) => (
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
      <Navigation />
    </>
  )
}
