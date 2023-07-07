import { ErrorDialog } from '@/components/dialogs/ErrorDialog'
import { SuccessDialog } from '@/components/dialogs/SuccessDialog'
import { Chevron } from '@/components/icons/Chevron'
import { AppLayout } from '@/components/layouts/AppLayout'
import { PageHeader } from '@/components/PageHeader'
import { SettingsTabs } from '@/components/SettingsTabs'
import { Account, accountService } from '@/lib/api/account'
import { paymentPointerService } from '@/lib/api/paymentPointer'
import { useDialog } from '@/lib/hooks/useDialog'
import { NextPageWithLayout } from '@/lib/types/app'
import { Button } from '@/ui/Button'
import { CopyButton } from '@/ui/CopyButton'
import { Disclosure, Transition } from '@headlessui/react'
import { cx } from 'class-variance-authority'
import { useRouter } from 'next/router'
import { GetServerSideProps, InferGetServerSidePropsType } from 'next/types'

type DeveloperKeysProps = InferGetServerSidePropsType<typeof getServerSideProps>

const DeveloperKeys: NextPageWithLayout<DeveloperKeysProps> = ({
  accounts
}) => {
  const [openDialog, closeDialog] = useDialog()
  const router = useRouter()

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
                                      paymentPointer.keyIds
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
                                    {paymentPointer.keyIds ? (
                                      <div className="flex space-x-2">
                                        <Button
                                          size="sm"
                                          aria-label="revoke key"
                                          onClick={async () => {
                                            const response =
                                              await paymentPointerService.revokeKey(
                                                {
                                                  accountId:
                                                    paymentPointer.accountId,
                                                  paymentPointerId:
                                                    paymentPointer.id
                                                }
                                              )

                                            if (!response.success) {
                                              openDialog(
                                                <ErrorDialog
                                                  onClose={() => {
                                                    closeDialog()
                                                  }}
                                                  content={response.message}
                                                />
                                              )
                                              return
                                            }

                                            openDialog(
                                              <SuccessDialog
                                                title="Success"
                                                onClose={() => {
                                                  closeDialog()
                                                  router.replace(router.asPath)
                                                }}
                                                content={response.message}
                                              />
                                            )
                                          }}
                                        >
                                          Revoke key
                                        </Button>
                                        <CopyButton
                                          size="sm"
                                          ctaText="Copy"
                                          afterCtaText="Copied"
                                          value={paymentPointer.keyIds}
                                          aria-label="copy key id"
                                          className="w-20"
                                        />
                                      </div>
                                    ) : (
                                      <Button
                                        size="sm"
                                        aria-label="generate key"
                                        className="w-20"
                                        onClick={async () => {
                                          const response =
                                            await paymentPointerService.generateKey(
                                              {
                                                accountId:
                                                  paymentPointer.accountId,
                                                paymentPointerId:
                                                  paymentPointer.id
                                              }
                                            )

                                          if (!response.success) {
                                            openDialog(
                                              <ErrorDialog
                                                onClose={() => closeDialog()}
                                                content={response.message}
                                              />
                                            )
                                            return
                                          }

                                          if (response.data) {
                                            const { keyId, privateKey } =
                                              response.data

                                            openDialog(
                                              <SuccessDialog
                                                title="Success"
                                                size="lg"
                                                content={
                                                  <>
                                                    <p>The generated key ID:</p>
                                                    <code className="text-center">
                                                      {keyId}
                                                    </code>
                                                    <p className="text-xs">
                                                      (At any time, you can copy
                                                      the key ID from the
                                                      Developer Keys section.)
                                                    </p>
                                                    <div className="mt-4 space-y-2">
                                                      <h4 className="text-lg font-bold text-red-400">
                                                        IMPORTANT!
                                                      </h4>
                                                      <p className="text-base">
                                                        Please ensure to copy
                                                        the private key and
                                                        store it securely. This
                                                        is the only opportunity
                                                        to make a copy of it.
                                                      </p>
                                                      <CopyButton
                                                        ctaText="COPY PRIVATE KEY"
                                                        aria-label="copy private key"
                                                        value={privateKey}
                                                      />
                                                    </div>
                                                  </>
                                                }
                                                onClose={() => {
                                                  closeDialog()
                                                  router.replace(router.asPath)
                                                }}
                                              />
                                            )
                                          }
                                        }}
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
  accounts: Account[]
}> = async (ctx) => {
  const response = await accountService.list(
    ctx.req.headers.cookie,
    'paymentPointers'
  )

  if (!response.success || !response.data) {
    return {
      notFound: true
    }
  }

  const accounts = response.data.map((account) => ({
    ...account,
    paymentPointers: account.paymentPointers.map((pp) => ({
      ...pp,
      url: pp.url.replace('https://', '$')
    }))
  }))

  return {
    props: {
      accounts
    }
  }
}

DeveloperKeys.getLayout = function (page) {
  return <AppLayout>{page}</AppLayout>
}

export default DeveloperKeys
