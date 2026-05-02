const express = require('express')
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid')
const app = express()
app.use(express.json())
const config = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV || 'sandbox'],
  baseOptions: { headers: { 'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID, 'PLAID-SECRET': process.env.PLAID_SECRET } }
})
const plaidClient = new PlaidApi(config)
let accessTokens = []
app.get('/', (req, res) => res.json({ status: 'Clearview backend running' }))
app.post('/v1/plaid/link-token', async (req, res) => {
  try {
    const r = await plaidClient.linkTokenCreate({ user: { client_user_id: 'demo' }, client_name: 'Clearview', products: ['auth','transactions'], country_codes: ['US'], language: 'en' })
    res.json({ link_token: r.data.link_token })
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.post('/v1/plaid/exchange-token', async (req, res) => {
  try {
    const r = await plaidClient.itemPublicTokenExchange({ public_token: req.body.public_token })
    accessTokens.push(r.data.access_token)
    res.json({ success: true })
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.get('/v1/balances', async (req, res) => {
  try {
    if (accessTokens.length === 0) return res.json([])
    const all = []
    for (const token of accessTokens) {
      const r = await plaidClient.accountsBalanceGet({ access_token: token })
      all.push(...r.data.accounts)
    }
    res.json(all)
  } catch(e) { res.status(500).json({ error: e.message }) }
})
app.listen(process.env.PORT || 3000, () => console.log('Clearview backend running'))
