import styles from './index.module.less'
import { Button, Form, Input, message } from 'antd'
import api from '../../api'
import { useNavigate } from 'react-router-dom'

export default function Index() {
  const nav = useNavigate()

  const onFinish = async (values) => {
    const res = await api.login(values)
    if (res.code === 0) {
      window.store.set('token', res.data.access_token)
      message.success('登录成功')
      setTimeout(() => {
        nav('/home')
      }, 500)
    } else {
      message.error(res.message)
    }
  }

  return (
    <div className={styles.container}>
      <Form onFinish={onFinish} autoComplete="off" layout="vertical">
        <Form.Item
          label="Password"
          name="password"
          rules={[{ required: true, message: 'Please input your password!' }]}
        >
          <Input.Password style={{ width: '400px' }} />
        </Form.Item>

        <div className={styles.btn}>
          <Button type="primary" htmlType="submit" size="large">
            Submit
          </Button>
        </div>
      </Form>
    </div>
  )
}
