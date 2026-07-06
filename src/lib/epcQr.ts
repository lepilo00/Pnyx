// EPC069-12 "SEPA credit transfer" QR payload, understood by most
// European mobile banking apps. Version 002 allows an empty BIC.
export function buildEpcQrPayload(opts: {
  recipientName: string
  iban: string
  amountEur: number
  remittanceText?: string
}): string {
  return [
    'BCD',
    '002',
    '1', // charset: UTF-8
    'SCT',
    '', // BIC (optional in version 002)
    opts.recipientName.slice(0, 70),
    opts.iban.replace(/\s+/g, '').toUpperCase(),
    'EUR' + opts.amountEur.toFixed(2),
    '', // purpose code
    '', // structured reference (unused — we use unstructured text below)
    (opts.remittanceText ?? '').slice(0, 140),
  ].join('\n')
}
