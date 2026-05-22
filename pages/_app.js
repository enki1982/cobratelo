import CookieBanner from '../components/CookieBanner'
import '../styles/globals.css'

export default function App({ Component, pageProps }) {
  return <>
      <Component {...pageProps} />
      <CookieBanner />
    </>
}
