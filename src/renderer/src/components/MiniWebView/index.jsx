/* eslint-disable prettier/prettier */
import { useMount } from 'ahooks'
import { useEffect, useRef, useState } from 'react'
import { sleep } from '../../utils/index';
import { Spin } from 'antd';
import { useUpdateEffect } from 'ahooks';

export default function MiniWebview({ ele, onRef, preloadPath, addRecord }) {
    const webviewRef = useRef(null)
    const [isFullscreen, setIsFullscreen] = useState(false)
    const [isDone, setIsDone] = useState(false)

    const MINI_ZOOM = 0.3

    const setCookie = async () => {
        await sleep(200)
        window.electronAPI.setWebviewCookie(ele.uid, ele.cookieObj)
        setIsDone(true)
    }

    useMount(() => {
        setCookie()
    }, [])

    useUpdateEffect(() => {
        const webview = webviewRef.current
        if (!webview) return

        onRef?.(ele.uid, webview)

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
    //     setTimeout(() => {
    //         webviewRef.current.openDevTools();
    //     }, 3000)
    // }, [])

    useUpdateEffect(() => {
        const webview = webviewRef.current;
        if (!webview) return;

        const handleIpcMessage = (event) => {
            if (event.channel === 'webview-message') {
                console.log('收到 webview preload 消息:', event.args[0].payload.msg);
                addRecord(event.args[0].payload)
            }
        };
        webview.addEventListener('ipc-message', handleIpcMessage);

        return () => {
            webview.removeEventListener('ipc-message', handleIpcMessage);
        };
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
            {
                isDone && <webview
                    ref={webviewRef}
                    src="https://creator.douyin.com/creator-micro/data/following/chat"
                    style={{ width: '100%', height: '100%' }}
                    preload={`file://${preloadPath}`}
                    partition={`temp:${ele.uid}`}
                />
            }
        </div>
    )
}