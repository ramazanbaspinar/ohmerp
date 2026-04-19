import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { ConfigProvider } from 'antd'
import trTR from 'antd/es/locale/tr_TR' 

import dayjs from 'dayjs'
import 'dayjs/locale/tr'
import updateLocale from 'dayjs/plugin/updateLocale'

dayjs.extend(updateLocale)
dayjs.locale('tr')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* 3. Tüm uygulamayı kapsayan Global Dil ve Konfigürasyon Şemsiyesi */}
    <ConfigProvider locale={trTR}>
      <App />
    </ConfigProvider>
  </StrictMode>,
)