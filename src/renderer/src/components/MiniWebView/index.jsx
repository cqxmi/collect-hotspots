/* eslint-disable react/no-unknown-property */
/* eslint-disable react/prop-types */
/* eslint-disable prettier/prettier */
import { useMount } from 'ahooks'
import { useRef, useState } from 'react'
import { sleep } from '../../utils/index'
import { useUpdateEffect } from 'ahooks'
import urls from '../../utils/urls'
// import api from '../../api'
// import { message } from 'antd'

export default function MiniWebview({ ele, onRef, preloadPaths, src, getReply }) {
  const webviewRef = useRef(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDone, setIsDone] = useState(false)

  const MINI_ZOOM = 0.3

  const setCookie = async () => {
    await sleep(200)
    window.electronAPI.setWebviewCookie(ele.id, urls[ele.platform], ele.cookie)
    setIsDone(true)
  }

  useMount(() => {
    setCookie()
  }, [])

  useUpdateEffect(() => {
    const webview = webviewRef.current
    if (!webview) return

    onRef?.(ele.id, webview)

    const handleDomReady = () => {
      webview.setZoomFactor(isFullscreen ? 1 : MINI_ZOOM)
    }

    webview.addEventListener('dom-ready', handleDomReady)

    return () => {
      webview.removeEventListener('dom-ready', handleDomReady)
    }
  }, [isFullscreen, isDone])

  const toggleFullscreen = () => {
    const webview = webviewRef.current
    if (!webview) return

    const next = !isFullscreen
    setIsFullscreen(next)
    webview.setZoomFactor(next ? 1 : MINI_ZOOM)
  }

  // useEffect(() => {
  //   setTimeout(() => {
  //     webviewRef.current.openDevTools()
  //   }, 3000)
  // }, [])

  // const getReply = async (pars) => {
  //   const res = await api.sendMsg({
  //     company: pars.company,
  //     msg: pars.msg
  //   })
  //   if (res.code === 0) {
  //   } else {
  //     message.error(res.message)
  //   }
  // }

  useUpdateEffect(() => {
    const webview = webviewRef.current
    if (!webview) return

    const handleIpcMessage = (event) => {
      if (event.channel === 'webview-message') {
        getReply(event.args[0].payload)
      }
    }
    webview.addEventListener('ipc-message', handleIpcMessage)

    return () => {
      webview.removeEventListener('ipc-message', handleIpcMessage)
    }
  }, [isDone])

  return (
    <div
      style={{
        position: isFullscreen ? 'absolute' : 'relative',
        width: isFullscreen ? '89vw' : 320,
        height: isFullscreen ? '100vh' : 180,
        zIndex: isFullscreen ? 9999 : 'auto',
        background: '#000',
        marginRight: isFullscreen ? null : 20,
        right: 0,
        top: 0
      }}
    >
      <button
        onClick={toggleFullscreen}
        style={{
          position: 'absolute',
          top: 6,
          right: 6,
          zIndex: isFullscreen ? 10000 : 9998
        }}
      >
        {isFullscreen ? '退出全屏' : '全屏'}
      </button>
      {isDone && (
        <webview
          ref={webviewRef}
          src={src}
          style={{ width: '100%', height: '100%' }}
          preload={`file://${preloadPaths[ele.platform]}`}
          partition={`temp:${ele.id}`}
        />
      )}
    </div>
  )
}
