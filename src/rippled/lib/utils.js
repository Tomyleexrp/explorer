import { convertRippleDate, EPOCH_OFFSET } from './convertRippleDate'
import summarizeTransaction from './txSummary'
import { formatSignerList } from './formatSignerList'

const XRP_BASE = 1000000
const BILLION = 1000000000

const ACCOUNT_FLAGS = {
  0x00010000: 'lsfPasswordSpent',
  0x00020000: 'lsfRequireDestTag',
  0x00040000: 'lsfRequireAuth',
  0x00080000: 'lsfDisallowXRP',
  0x00100000: 'lsfDisableMaster',
  0x00200000: 'lsfNoFreeze',
  0x00400000: 'lsfGlobalFreeze',
  0x00800000: 'lsfDefaultRipple',
  0x01000000: 'lsfDepositAuth',
}
const NFT_FLAGS = {
  0x00000001: 'lsfBurnable',
  0x00000002: 'lsfOnlyXRP',
  0x00000008: 'lsfTransferable',
}
const hex32 = (d) => {
  const int = d & 0xffffffff
  const hex = int.toString(16).toUpperCase()
  return `0x${`00000000${hex}`.slice(-8)}`
}

const zeroPad = (num, size, back = false) => {
  let s = String(num)
  while (s.length < (size || 2)) {
    s = back ? `${s}0` : `0${s}`
  }

  return s
}

const buildFlags = (flags, flagMap) => {
  const bits = zeroPad((flags || 0).toString(2), 32).split('')

  return bits
    .map((value, i) => {
      const bin = zeroPad(1, 32 - i, true)
      const int = parseInt(bin, 2)
      return value === '1' ? flagMap[int] || hex32(int) : undefined
    })
    .filter((d) => Boolean(d))
}

const formatAccountInfo = (info, serverInfoValidated) => ({
  sequence: info.Sequence,
  ticketCount: info.TicketCount,
  ownerCount: info.OwnerCount,
  reserve: serverInfoValidated.reserve_base_xrp
    ? serverInfoValidated.reserve_base_xrp +
      info.OwnerCount * serverInfoValidated.reserve_inc_xrp
    : undefined,
  tick: info.TickSize,
  rate: info.TransferRate ? (info.TransferRate - BILLION) / BILLION : undefined,
  domain: info.Domain ? Buffer.from(info.Domain, 'hex').toString() : undefined,
  emailHash: info.EmailHash,
  flags: buildFlags(info.Flags, ACCOUNT_FLAGS),
  balance: info.Balance,
  gravatar: info.urlgravatar,
  previousTxn: info.PreviousTxnID,
  previousLedger: info.PreviousTxnLgrSeq,
  nftMinter: info.NFTokenMinter,
})

const formatTransaction = (tx) => {
  const txn = tx.tx || tx
  return {
    tx: {
      ...txn,
      metaData: undefined,
      meta: undefined,
      hash: undefined,
      inLedger: undefined,
      ledger_index: undefined,
      status: undefined,
      validated: undefined,
      date: txn.date ? convertRippleDate(txn.date) : undefined,
    },
    meta: tx.meta || tx.metaData,
    hash: txn.hash,
    ledger_index: txn.ledger_index,
    date: txn.date ? convertRippleDate(txn.date) : undefined,
  }
}

function RippledError(message, code) {
  Error.captureStackTrace(this, this.constructor)
  this.name = this.constructor.name
  this.message = message
  this.code = code
}

require('util').inherits(RippledError, Error)

const summarizeLedger = (ledger, txDetails = false) => {
  const summary = {
    ledger_index: Number(ledger.ledger_index),
    ledger_hash: ledger.ledger_hash,
    parent_hash: ledger.parent_hash,
    close_time: convertRippleDate(ledger.close_time),
    total_xrp: ledger.total_coins / 1000000,
    total_fees: 0,
    transactions: [],
  }

  ledger.transactions.forEach((tx) => {
    const d = formatTransaction(tx)
    summary.total_fees += Number(tx.Fee)
    summary.transactions.push(summarizeTransaction(d, txDetails))
  })

  summary.transactions.sort((a, b) => a.index - b.index)
  Object.assign(summary, { total_fees: summary.total_fees / 1000000 })
  return summary
}

function convertHexToString(hex, encoding = 'utf8') {
  return hex ? Buffer.from(hex, 'hex').toString(encoding) : undefined
}

const formatNFTInfo = (info) => ({
  NFTId: info.nft_id,
  ledgerIndex: info.ledger_index,
  owner: info.owner,
  isBurned: info.is_burned,
  flags: buildFlags(info.flags, NFT_FLAGS),
  transferFee: info.transfer_fee,
  issuer: info.issuer,
  NFTTaxon: info.nft_taxon,
  NFTSequence: info.nft_sequence,
  uri: info.uri,
  validated: info.validated,
  status: info.status,
  warnings: info.warnings,
})

export {
  XRP_BASE,
  RippledError as Error,
  convertRippleDate,
  formatTransaction,
  formatSignerList,
  formatAccountInfo,
  summarizeLedger,
  convertHexToString,
  formatNFTInfo,
  EPOCH_OFFSET,
}
