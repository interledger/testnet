import { Account } from "@/lib/api/account";
import { WalletAddress } from "@/lib/api/walletAddress"

interface WalletAddressesTableProps {
    isWM: boolean;
    account: Account;
    walletAddresses: WalletAddress[]
}

interface WalletAddressRowProps {
    walletAddress: WalletAddress
    isWM: boolean
    idOnboarding: string
}

export const WalletAddressRow = ({ walletAddress, isWM, idOnboarding }: WalletAddressRowProps) => {
    return <tr
        className="[&>td]:p-4 [&>td]:border-b [&>td]:border-pink-neon"
        key={walletAddress.id}
    >
        <td>{walletAddress.url}</td>
        <td>View</td>
    </tr>
}

export const WalletAddressesTable = ({ account, walletAddresses, isWM }: WalletAddressesTableProps) => {
    return <div className="overflow-x-auto">
        <table className="min-w-[35rem] border-collapse">
            <tbody>
                {walletAddresses.map(
                    (walletAddress, idx) => (
                        <WalletAddressRow key={walletAddress.id} isWM={isWM} idOnboarding={account.assetCode === 'EUR' && idx === 0 ? 'viewTransactions' : ''} walletAddress={walletAddress} />
                    )
                )}
            </tbody>
        </table>
    </div>
}
