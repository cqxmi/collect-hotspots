import { Button, message, Modal } from 'antd'
import styles from './main.module.less'
import { useImmer } from 'use-immer'
// import { useLatest } from 'ahooks'
import { useEffect, useRef } from 'react'
import api from '../../api'
import MiniWebview from '../../components/MiniWebView'
import urls from '../../utils/urls'

export default function Index() {
  const [account, setAccount] = useImmer([])
  const [isModalOpen, setIsModalOpen] = useImmer(false)
  const [preloadPaths, setPreloadPaths] = useImmer({})
  const webviewRefs = useRef({})
  // const latestCountRef = useLatest(account)

  const openWindow = () => {
    setIsModalOpen(true)
  }

  const toGetInfo = async (data) => {
    // 做一个识别
    const res = await api.addAccount({
      platform: data.type,
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

  const getUrls = async () => {
    const paths = await window.electronAPI.getPreloadPath()
    setPreloadPaths(paths)
  }

  const toDel = async (id) => {
    const res = await api.delAccount({ id })
    if (res.code === 0) {
      message.success('删除成功')
      getAccounts()
    } else {
      message.error(res.message)
    }
  }

  const getReply = async (id, pars) => {
    const res = await api.sendMsg({
      company: pars.company,
      msg: pars.msg
    })
    if (res.code === 0) {
      webviewRefs.current[id].send('reply', res.data)
    } else {
      message.error(res.message)
    }
  }

  useEffect(() => {
    getAccounts()
    getUrls()

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
            添加
          </Button>
          {account.length
            ? account.map((ele, idx) => {
                return (
                  <div key={ele.id} className={styles.columns}>
                    <div>{ele.platform}</div>
                    <div style={{ marginTop: '6px' }}>
                      {ele.ing ? (
                        <Button
                          danger
                          type="primary"
                          size="small"
                          onClick={() => {
                            if (webviewRefs.current[ele.id]) {
                              webviewRefs.current[ele.id].send('auto-click:stop', ele.id)
                            }
                            setAccount((draft) => {
                              draft[idx].ing = false
                            })
                          }}
                        >
                          停止
                        </Button>
                      ) : (
                        <>
                          <Button
                            style={{ marginRight: '12px' }}
                            size="small"
                            onClick={() => {
                              if (webviewRefs.current[ele.id]) {
                                webviewRefs.current[ele.id].send('auto-click:start', ele.id)
                              }
                              setAccount((draft) => {
                                draft[idx].ing = true
                              })
                            }}
                          >
                            开始
                          </Button>
                          <Button
                            danger
                            type="primary"
                            size="small"
                            onClick={() => {
                              toDel(ele.id)
                            }}
                          >
                            删除
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                )
              })
            : null}
        </div>
        <div className={styles.right}>
          <div className={styles.rightBox}>
            {account.map((ele) => {
              return (
                <div key={ele.id} className={styles.miniweb}>
                  <MiniWebview
                    ele={ele}
                    onRef={(id, el) => {
                      webviewRefs.current[id] = el
                    }}
                    preloadPaths={preloadPaths}
                    src={urls[ele.platform]}
                    getReply={(pars) => getReply(ele.id, pars)}
                  />
                </div>
              )
            })}
          </div>
        </div>
        <Modal
          open={isModalOpen}
          footer={null}
          onCancel={() => {
            setIsModalOpen(false)
          }}
        >
          <div className={styles.chooisePlace}>
            <Button
              type="primary"
              size="large"
              style={{ marginRight: '20px' }}
              onClick={() => {
                window.electronAPI.openChildWindow('dy', urls.dy)
                setIsModalOpen(false)
              }}
            >
              抖音
            </Button>
            <Button
              type="primary"
              size="large"
              onClick={() => {
                window.electronAPI.openChildWindow('dy', urls.dy)
                setIsModalOpen(false)
              }}
            >
              开放平台
            </Button>
          </div>
        </Modal>
      </div>
    </>
  )
}
