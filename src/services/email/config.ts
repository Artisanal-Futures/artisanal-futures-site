export const emailConfig = {
  noRespondEmail:
    process.env.NO_RESPOND_EMAIL ??
    'Artisanal Futures <no-reply@artisanalfutures.org',
  paymentAdminEmail: process.env.ADMIN_EMAIL ?? 'a_hunn59@outlook.com',
  adminEmail: process.env.ADMIN_EMAIL ?? 'ahunn@umich.edu',
  requestEmail:
    process.env.REQUEST_EMAIL ??
    'Artisanal Futures Requests <requests@artisanalfutures.org',
  supportEmail:
    process.env.SUPPORT_EMAIL ??
    'Artisanal Futures Support <support@artisanalfutures.org',
  logo:
    process.env.LOGO_URL ??
    'https://storage.artisanalfutures.org/artisanal-futures/logo_mobile.png',
  baseURL: process.env.BASE_URL ?? 'https://artisanalfutures.org',
  signature: process.env.EMAIL_SIGNATURE ?? 'Team Artisanal Futures',
  storeName: process.env.STORE_NAME ?? 'Artisanal Futures',
  stripEmail: (email: string) => email.match(/<(.+)>/)?.[1] ?? email,
}
