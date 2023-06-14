import { Chevron } from '@/components/icons/Chevron'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { SettingsTabs } from '@/components/SettingsTabs'
import { NextPageWithLayout } from '@/lib/types/app'
import { Disclosure, Transition } from '@headlessui/react'
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
                    <Disclosure.Button className="flex w-full justify-between">
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
                    <Disclosure.Panel as="dd" className="mt-2 bg-red-100 px-2">
                      {account.paymentPointers.map((paymentPointer) => (
                        <p key={paymentPointer.url} className="maxh- leading-7">
                          {paymentPointer.url}
                        </p>
                      ))}
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
              url: '$ilp.rafiki.money/pp1'
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
