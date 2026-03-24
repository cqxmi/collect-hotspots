import { Button } from "antd"
import styles from './main.module.less'
import { useImmer } from "use-immer"
import { useEffect, useRef } from "react"
import MiniWebview from "./components/MiniWebView"
import { useLatest } from "ahooks"
import { formatTimestamp } from './utils/index'
import { useMount } from "ahooks"
// import { useMount } from "ahooks"

function App() {

  const [account, setAccount] = useImmer([])
  const [record, setRecord] = useImmer([])
  const latestCountRef = useLatest(account);
  const webviewRefs = useRef({});
  const [preloadPath, setPreloadPath] = useImmer(null)

  const openWindow = () => {
    // 在这里做一个判断，当前account有没有值
    window.electronAPI.openChildWindow('https://creator.douyin.com/creator-micro/data/following/chat')
  }

  const bindFlag = useRef(false)

  const bindListener = () => {
    if (!bindFlag.current) {
      window.electronAPI.onChildWindowClosed((data) => {
        if (data && data.cookie) {
          console.log('传过来的数据', data)
          toGetInfo(data)
        }
      })
      bindFlag.current = true
    }
  }

  const toGetInfo = async (data) => {
    // 发请求拿实际的信息
    const res = await window.electronAPI.getEncodeRequest('https://creator.douyin.com/web/api/media/user/info/', data.cookie, null, {
      "user-agent": navigator.userAgent,
    });
    if (res && !res.status_code) {
      setAccount((draft) => {
        draft.push({
          ...res.user,
          cookieObj: data.cookieObj,
          cookie: data.cookie
        })
      })
      window.store.set('users', JSON.stringify([...latestCountRef.current, {
        ...res.user,
        cookieObj: data.cookieObj,
        cookie: data.cookie
      }])
      )
    }
  }

  const addRecord = (record) => {
    setRecord((draft) => {
      draft.push(record)
    })
  }

  useMount(() => {
    setTimeout(async () => {
      if (window.store.get('users')) {
        // 先拿路径
        setPreloadPath(await window.electronAPI.getPreloadPath())
        setAccount(JSON.parse(window.store.get('users')))
        console.log(JSON.parse(window.store.get('users')))
      }
      bindListener()
    }, 2000)
  }, []);

  return (
    <>
      <div className={styles.container}>
        <div className={styles.left}>
          <Button type="primary" onClick={openWindow} style={{ width: '100%', marginBottom: '20px' }}>添加账号</Button>
          <div className={styles.columns}>
            {
              account.map((ele, idx) => {
                if (!ele.ing) {
                  return <div key={ele.uid} className={styles.column} >
                    <div>{ele.nickname}</div>
                    <div>
                      <Button onClick={() => {
                        window.electronAPI.pwStart({
                          accountId: ele.uid,
                          cookies: JSON.parse(ele.cookieObj), // 从 webcookieObjview 拿到的 cookies
                          url: 'https://creator.douyin.com/creator-micro/data/following/chat'
                        });
                        setAccount(draft => {
                          draft[idx].ing = true
                        })
                      }}>开始</Button>
                      <Button onClick={() => {
                        let temp = account.filter(e => e.uid != ele.uid)
                        setAccount(temp)
                        window.store.set('users', JSON.stringify(temp))
                      }} type='primary' style={{ marginLeft: '12px' }}>删除</Button>
                    </div>
                  </div>
                } else {
                  return <div key={ele.uid} className={styles.column} onClick={() => {
                    window.electronAPI.pwStop({
                      accountId: ele.uid
                    });
                    setAccount(draft => {
                      draft[idx].ing = false
                    })
                  }}>
                    <div>{ele.nickname}</div>
                    <Button>停止</Button>
                  </div>
                }
              }
              )
            }
          </div>
        </div>
        <div className={styles.right}>
          <div className={styles.rightBox}>
            {/* {
              account.map((ele) => {
                return <div key={ele.uid} className={styles.miniweb}>
                  <MiniWebview
                    ele={ele}
                    onRef={(id, el) => {
                      webviewRefs.current[id] = el;
                    }}
                    preloadPath={preloadPath}
                    addRecord={addRecord}
                  />
                </div>
              }
              )
            } */}
          </div>
          <div style={{ width: '100%' }}>
            {record.map(ele => {
              return <div key={ele.msg}>{ele.msg}，{formatTimestamp(ele.time)}</div>
            })}
          </div>
        </div>
      </div>
    </>
  )
}

export default App
