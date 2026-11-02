import { Gamepad2 } from 'lucide-react'
import DuoGame from '../../duo/DuoGame'
import { useDuo } from '../../duo/DuoContext'
import ChatBox from '../../duo/ChatBox'
import { Label, ScreenBackground, TAB_BAR_H } from '../ui'

/** The two-player game: both of you on your own phones, in the same room. */
export default function PlayScreen() {
  const { state, partner } = useDuo()
  const playing = state?.phase === 'play'
  return (
    <div className="absolute inset-0 overflow-hidden">
      <ScreenBackground glow="rgba(225, 6, 0, .08)" />
      <div className={`no-scrollbar absolute inset-0 z-10 overflow-y-auto px-5 ${playing ? 'pt-[84px]' : 'pt-[96px]'}`} style={{ paddingBottom: TAB_BAR_H + (partner ? 84 : 24) }}>
        <div className={`a-up ad-400 ${playing ? 'hidden' : 'mb-5'}`}>
          <Label icon={Gamepad2}>Play together, from anywhere</Label>
          <h2 className="mt-1 text-[48px] font-normal leading-[0.95] tracking-[-0.05em] text-white">
            Love
            <br />
            Match
          </h2>
        </div>
        <div className="a-up ad-600">
          <DuoGame />
        </div>
      </div>
      {partner && <ChatBox />}
    </div>
  )
}
