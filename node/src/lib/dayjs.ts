import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import tz from 'dayjs/plugin/timezone'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
// eslint-disable-next-line
import 'dayjs/locale/ja'

dayjs.extend(utc)
dayjs.extend(tz)
dayjs.tz.setDefault('Asia/Tokyo') // tz() の引数を省略できるようになる

// dayjs.extend(duration)
// dayjs.extend(relativeTime)
// dayjs.locale('ja')

export default dayjs
