export default {
  login(params) {
    return window.api.post('/auth/login', params)
  },
  getAccounts() {
    return window.api.get('/users/getAccounts')
  },
  addAccount(params) {
    return window.api.post('/account/add', params)
  }
}
