export default function NotFound() {
  return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:'100vh' }}>
      <div style={{ textAlign:'center', padding:'0 24px' }}>
        <div style={{ fontSize:'clamp(3rem,12vw,7rem)', fontWeight:800, color:'rgba(255,45,107,.15)', letterSpacing:-4, lineHeight:1, marginBottom:8 }}>404</div>
        <div style={{ fontSize:14, color:'var(--pink)', fontWeight:700, marginBottom:6 }}>
          bash: <span style={{ color:'var(--text)' }}>гэтая-старонка</span>: command not found
        </div>
        <div style={{ fontSize:11, color:'var(--t3)', marginBottom:32 }}>No such file or directory</div>
        <a href="/" style={{
          display:'inline-flex', alignItems:'center', gap:8,
          background:'var(--pinka)', border:'1px solid var(--pinkb)',
          color:'var(--pink)', fontSize:12, fontWeight:700,
          padding:'9px 20px', borderRadius:8, textDecoration:'none',
        }}>cd ~</a>
      </div>
    </div>
  )
}
