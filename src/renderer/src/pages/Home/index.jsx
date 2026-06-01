import { Button, message } from 'antd'
import styles from './main.module.less'
import { useImmer } from 'use-immer'
// import { useLatest } from 'ahooks'
import { useEffect } from 'react'
import api from '../../api'
import MiniWebview from '../../components/MiniWebView'

export default function Index() {
  const [account, setAccount] = useImmer([])
  // const latestCountRef = useLatest(account)

  const openWindow = () => {
    window.electronAPI.openChildWindow('https://www.baidu.com/')
  }

  const toGetInfo = async (data) => {
    // 做一个识别
    const res = await api.addAccount({
      platform: data.domain,
      cookie: data.cookie
    })
    if (res.code === 0) {
      message.success('添加成功')
      getAccounts()
    } else {
      message.error(res.message)
    }
  }

  const getAccounts = async () => {
    const res = await api.getAccounts()
    if (res.code === 0) {
      setAccount(res.data)
    } else {
      message.error(res.message)
    }
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
          {account.length
            ? account.map((ele) => {
                return (
                  <div key={ele.id} className={styles.columns}>
                    <div>{ele.platform}</div>
                    <div style={{ marginTop: '6px' }}>
                      <Button style={{ marginRight: '12px' }} size="small">
                        开始
                      </Button>
                      <Button danger type="primary" size="small">
                        删除
                      </Button>
                    </div>
                  </div>
                )
              })
            : null}
        </div>
        <div className={styles.right}>
          <div className={styles.rightBox}>
            {/* {account.map((ele) => {
              return (
                <div key={ele.id} className={styles.miniweb}>
                  <MiniWebview
                    ele={ele}
                    onRef={(id, el) => {
                      webviewRefs.current[id] = el
                    }}
                    preloadPath={preloadPath}
                  />
                </div>
              )
            })} */}
          </div>
        </div>
      </div>
    </>
  )
}
