"""Render JOPELO's text-message service trailers; no imagery or network needed.

Requires Python 3, Pillow, NumPy and FFmpeg (libx264/AAC).
Run: python tools/render-service-trailers.py [optional service IDs]
Copy is shared with the accessible browser transcripts in service-chat-content.js.
All graphics, animation and music are authored here; no third-party sound samples.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
import math
import subprocess
import sys
import wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/services'
CACHE = ROOT / '.cache/service-chats'
CACHE.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
FPS, WIDTH, HEIGHT, DURATION, RATE = 24, 1280, 720, 12, 48000
FILMS = json.loads((ROOT/'service-chat-content.js').read_text().removeprefix('export default ').strip().removesuffix(';'))
FONT = ROOT/'assets/inter-regular.ttf'
BOLD = ROOT/'assets/inter-black.ttf'
PAPER, GREEN, INK = '#ebe8e0', '#183e33', '#16291f'
WHITE, BUBBLE = '#fffef9', '#d5f6bf'
FONTS = {n: ImageFont.truetype(str(FONT), n) for n in (20, 22, 24, 28, 44, 52)}
HEAVY = {n: ImageFont.truetype(str(BOLD), n) for n in (24, 28, 36, 48)}


def wrap(text, font, width):
    lines, line = [], ''
    for word in text.split():
        candidate = (line+' '+word).strip()
        if font.getlength(candidate) > width and line:
            lines.append(line)
            line = word
        else:
            line = candidate
    return lines+[line]


def base(film, t, poster=False):
    im = Image.new('RGB', (WIDTH, HEIGHT), PAPER)
    d = ImageDraw.Draw(im)
    d.rectangle((0, 0, WIDTH, 102), fill=GREEN)
    d.ellipse((34, 21, 94, 81), fill=BUBBLE)
    d.text((49, 26), 'j.', font=HEAVY[36], fill=GREEN)
    d.text((115, 15), 'jopelo', font=HEAVY[36], fill=WHITE)
    typing = any(m['at']-.55 <= t < m['at'] for m in film['messages'])
    d.text((117, 62), 'typing...' if typing else 'online. doing the work.', font=FONTS[22], fill='#d5e7d9')
    label = film['name'].lower()
    d.text((WIDTH-38-d.textlength(label, font=FONTS[24]), 36), label, font=FONTS[24], fill=WHITE)
    d.text((38, 116), 'a fictional chat. actual services.', font=FONTS[20], fill='#687269')
    d.line((38, 640, 1242, 640), fill='#c6c9bd', width=1)
    d.text((38, 665), 'unserious chat. serious work.', font=HEAVY[28], fill=GREEN)
    d.text((1065, 671), 'JOPELO / '+str(list(FILMS).index(next(k for k,v in FILMS.items() if v is film))+1).zfill(2), font=FONTS[22], fill=GREEN)
    return im


def bubble(draw, message, y, t, poster=False):
    outgoing = message['sender'] == 'jopelo'
    text = message['text']
    font = FONTS[44]
    lines = wrap(text, font, 1000)
    w = max(font.getlength(line) for line in lines)+52
    h = 40+len(lines)*46
    x = WIDTH-38-w if outgoing else 38
    age = max(0, t-message['at'])
    # A small 8 px settling movement rather than exaggerated elastic UI motion.
    y += round(8*max(0, 1-age/.16)**2)
    draw.rounded_rectangle((x, y, x+w, y+h), radius=17, fill=BUBBLE if outgoing else WHITE)
    if outgoing:
        draw.polygon(((x+w-20,y),(x+w+9,y),(x+w-2,y+22)), fill=BUBBLE)
    else:
        draw.polygon(((x+20,y),(x-9,y),(x+2,y+22)), fill=WHITE)
    count = len(text) if poster else max(0, int(age*67))
    reveal = text[:count]
    # Wrap the full message first so letters don't jump between lines while typing.
    used = 0
    for row, line in enumerate(lines):
        visible = reveal[used:used+len(line)]
        draw.text((x+24, y+11+46*row), visible, font=font, fill=INK)
        used += len(line)+1
    if count < len(text) and int(t*7)%2 == 0:
        row = max(0, min(len(lines)-1, sum(len(line)+1 for line in lines[:1]) <= count))
        preceding = sum(len(line)+1 for line in lines[:row])
        cursor_x = x+24+font.getlength(reveal[preceding:])
        draw.line((cursor_x,y+20+46*row,cursor_x,y+52+46*row),fill=GREEN,width=2)
    # Read receipts are drawn as two understated strokes; only on completed replies.
    if outgoing and count >= len(text):
        for offset in (0, 8):
            cx,cy=x+w-34+offset,y+h-14
            draw.line((cx-4,cy-3,cx,cy,cx+7,cy-8),fill='#43867a',width=2)
    return h


def frame(film, t):
    im = base(film, t)
    d=ImageDraw.Draw(im)
    y=150
    for m in film['messages']:
        if t < m['at']:
            if t >= m['at']-.55:
                x=WIDTH-140 if m['sender']=='jopelo' else 38
                d.rounded_rectangle((x,y,x+102,y+58),radius=18,fill=BUBBLE if m['sender']=='jopelo' else WHITE)
                for j in range(3):
                    lift=3*math.sin(t*10-j*1.3)
                    d.ellipse((x+22+j*22,y+25+lift,x+30+j*22,y+33+lift), fill='#738a74')
            break
        y += bubble(d,m,y,t)+9
    if y>634:
        raise ValueError('Conversation exceeds safe frame: '+film['name'])
    return im


def poster(film):
    im=base(film, 3.8, True)
    d=ImageDraw.Draw(im)
    y=180
    for i,m in enumerate(film['messages'][:2]):
        font=FONTS[52]
        lines=wrap(m['text'],font,1000)
        w=max(font.getlength(line) for line in lines)+60
        h=42+len(lines)*64
        x=WIDTH-38-w if i else 38
        d.rounded_rectangle((x,y,x+w,y+h),radius=20,fill=BUBBLE if i else WHITE)
        for j,line in enumerate(lines):
            d.text((x+29,y+12+j*64),line,font=font,fill=INK)
        y+=h+36
    return im


def sound_design(film_id):
    """Dry plucked bass + toy-keyboard motif, woodblocks and message pops. 100 BPM."""
    rng=np.random.default_rng(43)
    mix=np.zeros((RATE*DURATION,2),dtype=np.float64)
    transpose={'strategy':0,'web':2,'brand':5,'styling':-2,'ventures':-5}[film_id]
    def add(when, signal, gain, pan=0):
        start=int(when*RATE)
        n=min(len(signal),len(mix)-start)
        if n<=0:return
        mix[start:start+n,0]+=signal[:n]*gain*math.sqrt((1-pan)/2)
        mix[start:start+n,1]+=signal[:n]*gain*math.sqrt((1+pan)/2)
    def pluck(note, duration=.3, bass=False):
        t=np.arange(int(duration*RATE))/RATE
        hz=440*2**((note+transpose-69)/12)
        env=(1-np.exp(-t*700))*np.exp(-t*(9 if bass else 16))
        return (np.sin(2*np.pi*hz*t)+.32*np.sin(2*np.pi*hz*2.003*t)+.13*np.sin(2*np.pi*hz*3*t))*env
    for beat in range(20):
        when=beat*.6
        add(when,pluck([36,43,40,43][beat%4],.4,True),.19,-.1)
        if beat%2:
            t=np.arange(int(.08*RATE))/RATE
            wood=(np.sin(2*np.pi*780*t)+.3*np.sin(2*np.pi*1220*t))*np.exp(-65*t)
            add(when+.035,wood,.055,.3)
    melody=[(0.3,72),(.9,76),(1.8,79),(2.7,76),(3.0,74),(3.9,71),(4.5,72),(5.4,67),(6.3,72),(6.9,76),(7.8,79),(8.7,78)]
    for i,(when,note) in enumerate(melody):
        add(when,pluck(note,.28),.105,(-1 if i%2 else 1)*.25)
    # A short, quiet downward wobble after the last reply; intentionally underplayed.
    t=np.arange(int(.55*RATE))/RATE
    frequency=330*2**(transpose/12)*np.exp(-1.1*t)
    phase=np.cumsum(2*np.pi*frequency/RATE)
    add(10.1,(np.sin(phase)+.2*np.sin(3*phase))*np.exp(-5*t)*np.minimum(1,t/.012),.095,.1)
    for m in FILMS[film_id]['messages']:
        t=np.arange(int(.06*RATE))/RATE
        pop=np.sin(2*np.pi*(650*t-1800*t*t))*np.exp(-75*t)*np.minimum(1,t/.002)
        add(m['at'],pop,.07,.25 if m['sender']=='jopelo' else -.25)
        for when in (m['at']-.35,m['at']-.23,m['at']-.1):
            tt=np.arange(int(.018*RATE))/RATE
            add(max(0,when),rng.normal(0,1,len(tt))*np.exp(-400*tt),.012)
    mix*=np.minimum(1,np.arange(len(mix))/RATE/.08)[:,None]
    mix*=np.minimum(1,(len(mix)-np.arange(len(mix)))/RATE/.22)[:,None]
    mix *= 3.0  # Audible at the player's 65% volume, with headroom for AAC encoding.
    assert np.max(np.abs(mix))<.95
    path=CACHE/(film_id+'-original-chat-score.wav')
    with wave.open(str(path),'wb') as f:
        f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE)
        f.writeframes((mix*32767).astype('<i2').tobytes())
    return path


def render(film_id):
    film=FILMS[film_id]
    score=sound_design(film_id)
    cmd=['ffmpeg','-hide_banner','-loglevel','error','-y','-f','rawvideo','-pix_fmt','rgb24','-s',f'{WIDTH}x{HEIGHT}','-r',str(FPS),'-i','pipe:0','-i',str(score),'-map','0:v','-map','1:a','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-threads','2','-c:a','aac','-b:a','128k','-t',str(DURATION),'-movflags','+faststart',str(CACHE/(film_id+'-render.mp4'))]
    process=subprocess.Popen(cmd,stdin=subprocess.PIPE,stderr=subprocess.PIPE)
    try:
        for i in range(FPS*DURATION):
            process.stdin.write(frame(film,i/FPS).tobytes())
        process.stdin.close()
        error=process.stderr.read().decode()
        if process.wait():raise RuntimeError(error)
    except BaseException:
        process.kill();process.wait();raise
    (CACHE/(film_id+'-render.mp4')).replace(OUT/(film_id+'.mp4'))
    poster(film).save(OUT/(film_id+'.jpg'),quality=93)
    print('Rendered '+film_id,flush=True)


def main():
    ids=sys.argv[1:] or list(FILMS)
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(render,ids))
    provenance={
        'format':'12 seconds / 1280×720 / 24fps / H.264 + AAC stereo',
        'direction':'Original text-only messaging motion graphics. Fictional exchanges, real service offerings. No photographic imagery.',
        'copy':'../../service-chat-content.js',
        'renderer':'../../tools/render-service-trailers.py',
        'sound':'Original 100 BPM plucked bass, toy-keyboard melody, woodblocks, message pops and a small descending synth. Authored with NumPy; no samples or borrowed music.',
        'fonts':['../inter-regular.ttf','../inter-black.ttf'],
        'films':{k:{'name':v['name'],'file':k+'.mp4','poster':k+'.jpg'}for k,v in FILMS.items()},
        'icon':{'name':'Bootstrap Icons play-fill','source':'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/icons/play-fill.svg','license':'bootstrap-icons-LICENSE.txt'}
    }
    (OUT/'sources.json').write_text(json.dumps(provenance,indent=2,ensure_ascii=False)+'\n')

if __name__=='__main__':main()
