import { Button } from 'antd'
import styles from './main.module.less'
// import { useImmer } from 'use-immer'
// import { useLatest } from 'ahooks'
import { useEffect } from 'react'
import api from '../../api'

export default function Index() {
  // const [account, setAccount] = useImmer([])
  // const latestCountRef = useLatest(account)

  const openWindow = () => {
    window.electronAPI.openChildWindow('https://www.baidu.com/')
  }

  const toGetInfo = async (data) => {
    // 在这里做一个识别
    console.log(data)
  }

  const getAccounts = async () => {
    const res = await api.getAccounts()
    console.log(res)
  }

  useEffect(() => {
    getAccounts()

    const off = window.electronAPI.onChildWindowClosed((data) => {
      toGetInfo(data)
    })

    return () => {
      off()
    }
  }, [])

  return (
    <>
      <div className={styles.container}>
        <div className={styles.left}>
          <Button
            type="primary"
            onClick={openWindow}
            style={{ width: '100%', marginBottom: '20px' }}
          >
            添加账号
          </Button>
          <div className={styles.columns}></div>
        </div>
      </div>
    </>
  )
}
