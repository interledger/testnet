import { Chevron } from '@/components/icons/Chevron'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { SettingsTabs } from '@/components/SettingsTabs'
import { NextPageWithLayout } from '@/lib/types/app'
import { Button } from '@/ui/Button'
import { CopyButton } from '@/ui/CopyButton'
import { Disclosure, Transition } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'

type DeveloperKeysProps = InferGetServerSidePropsType<typeof getServerSideProps>

const DeveloperKeys: NextPageWithLayout<DeveloperKeysProps> = ({
  accounts
}) => {
  return (
    <>
      <PageHeader title="Developer Keys" />
      <SettingsTabs />
      <div className="flex w-full flex-col md:max-w-lg">
        <dl className="space-y-6 divide-y divide-green/10">
          {accounts.map((account) => (
            <Disclosure as="div" key={account.name} className="pt-6">
              {({ open }) => (
                <>
                  <dt>
                    <Disclosure.Button className="flex w-full justify-between rounded-md bg-green-4 p-2 shadow-md">
                      <span className="font-semibold leading-7 text-green">
                        {account.name}
                      </span>
                      <span className="ml-6 flex items-center">
                        <Chevron
                          className="h-6 w-6 transition-transform duration-300"
                          direction={open ? 'down' : 'left'}
                        />
                      </span>
                    </Disclosure.Button>
                  </dt>
                  <Transition
                    className="overflow-hidden"
                    enter="transition-all ease-in-out duration-300"
                    enterFrom="transform max-h-0"
                    enterTo="transform max-h-96"
                    leave="transition-all ease-in-out duration-300"
                    leaveFrom="transform max-h-96"
                    leaveTo="transform max-h-0"
                  >
                    <Disclosure.Panel as="dd" className="mt-6 px-2">
                      <ul role="list" className="space-y-6">
                        {account.paymentPointers.map(
                          (paymentPointer, paymentPointerIdx) => (
                            <li
                              key={paymentPointer.url}
                              className="relative flex gap-x-4"
                            >
                              <div
                                className={cx(
                                  paymentPointerIdx ===
                                    account.paymentPointers.length - 1
                                    ? 'h-6'
                                    : '-bottom-6',
                                  'absolute left-0 top-0 flex w-6 justify-center'
                                )}
                              >
                                <div className="w-px bg-gray-200" />
                              </div>
                              <>
                                <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-white">
                                  <div
                                    className={cx(
                                      'h-1.5 w-1.5 rounded-full ring-1',
                                      paymentPointer.keyId
                                        ? 'bg-green-4 ring-green-3'
                                        : 'bg-gray-100 ring-gray-300'
                                    )}
                                  />
                                </div>
                                <div className="flex-auto space-y-2 py-0.5 leading-5 text-gray-500">
                                  <p className="font-medium text-gray-900">
                                    {paymentPointer.url}
                                  </p>
                                  <div className="flex-none py-0.5 text-sm leading-5 text-gray-500">
                                    {paymentPointer.keyId ? (
                                      <CopyButton
                                        size="sm"
                                        
                                        ctaText="Copy"
                                        afterCtaText="Copied"
                                        value={paymentPointer.keyId}
                                        aria-label="copy key id"
                                        className="w-20"
                                      ></CopyButton>
                                    ) : (
                                      <Button
                                        size="sm"
                                        aria-label="generate key"
                                        className="w-20"
                                      >
                                        Generate
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </>
                            </li>
                          )
                        )}
                      </ul>
                    </Disclosure.Panel>
                  </Transition>
                </>
              )}
            </Disclosure>
          ))}
        </dl>
      </div>
    </>
  )
}

export const getServerSideProps: GetServerSideProps<{
  accounts: {
    name: string
    paymentPointers: {
      url: string
      keyId?: string
    }[]
  }[]
}> = async (_ctx) => {
  return {
    props: {
      accounts: [
        {
          name: 'Account #1',
          paymentPointers: [
            {
              url: '$ilp.rafiki.money/pp1',
              keyId: 'kid1'
            },
            {
              url: '$ilp.rafiki.money/pp2'
            }
          ]
        },
        {
          name: 'Account #2',
          paymentPointers: [
            {
              url: '$ilp.rafiki.money/pp3'
            },
            {
              url: '$ilp.rafiki.money/pp4'
            }
          ]
        }
      ]
    }
  }
}

DeveloperKeys.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default DeveloperKeys
