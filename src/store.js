import SubX from 'subx'
import RingCentral from 'ringcentral-js-concise'
import localforage from 'localforage'
import * as R from 'ramda'

const redirectUri = window.location.origin + window.location.pathname
const rc = new RingCentral(process.env.RINGCENTRAL_CLIENT_ID, process.env.RINGCENTRAL_CLIENT_SECRET, RingCentral.PRODUCTION_SERVER)

const store = SubX.create({
  ready: false,
  token: undefined,
  authorizeUri: rc.authorizeUri(redirectUri),
  async init () {
    rc.on('tokenChanged', token => {
      this.token = token
    })
    const urlSearchParams = new URLSearchParams(new URL(window.location.href).search)
    const code = urlSearchParams.get('code')
    if (code) {
      await rc.authorize({ code, redirectUri })
    }
  },
  async load () {
    rc.token(await localforage.getItem('token'))
    if (R.isNil(rc.token())) {
      return
    }
    try { // make sure token is still usable
      await rc.get('/restapi/v1.0/account/~/extension/~')
    } catch (e) {
      if (e.data && (e.data.errors || []).some(error => /\btoken\b/i.test(error.message))) { // invalid token
        await localforage.clear()
        window.location.reload(false)
      }
    }
    const teams = await localforage.getItem('teams') || {}
    const prevPageToken = await localforage.getItem('prevPageToken')
    let r = await rc.get('/restapi/v1.0/glip/teams', { params: { recordCount: 250, pageToken: prevPageToken } })
    console.log(r.data)
    for (const team of r.data.records) {
      teams[team.id] = team
    }
    while (r.data.navigation.prevPageToken) {
      await localforage.setItem('prevPageToken', r.data.navigation.prevPageToken)
      r = await rc.get('/restapi/v1.0/glip/teams', { params: { recordCount: 250, pageToken: r.data.navigation.prevPageToken } })
      console.log(r.data)
      for (const team of r.data.records) {
        teams[team.id] = team
      }
      await localforage.setItem('teams', teams)
    }
  }
})

SubX.autoRun(store, async () => {
  if (store.token) {
    await localforage.setItem('token', store.token.toJSON())
  }
})

export default store
