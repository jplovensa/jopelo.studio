"""Render JOPELO's chat trailers and portfolio reveals from local media; no network needed.

Requires Python 3, Pillow, NumPy and FFmpeg (libx264/AAC).
Run: python tools/render-service-trailers.py [optional service IDs]
Copy is shared with the accessible browser transcripts in service-chat-content.js.
Graphics and animation are authored here. Keyboard audio is a credited public-domain physical recording; see assets/services/audio/source.json.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import json
import math
import subprocess
import sys
import wave
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'assets/services'
CACHE = ROOT / '.cache/service-chats'
CACHE.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)
FPS, WIDTH, HEIGHT, DURATION, RATE = 24, 1280, 720, 20, 48000
CREDIT_START = 12
REVEAL_START = 14
TYPE_RATE = 44  # The same timing drives text reveal and keyboard foley.
FILMS = json.loads((ROOT/'service-chat-content.js').read_text().removeprefix('export default ').strip().removesuffix(';'))
for film_id, film in FILMS.items():film['id']=film_id
REVEAL_SHOTS = {
    'strategy': [{'video':'assets/secha-trailer.mp4','seek':2,'duration':6}],
    'web': [{'video':'assets/fjall-trailer.mp4','seek':2,'duration':3}, {'video':'assets/secha-trailer.mp4','seek':3,'duration':3}],
    'brand': [{'image':'assets/services/reveals/jopelo-identity.png','duration':6}],
    'styling': [{'image':'assets/styling/warm-modern-room.webp','duration':3}, {'image':'assets/styling/soft-contemporary-room.webp','duration':3}],
    'ventures': [{'image':'assets/services/reveals/garuda-spark.webp','duration':6}],
}
FONT = ROOT/'assets/inter-regular.ttf'
BOLD = ROOT/'assets/inter-black.ttf'
PAPER, GREEN, INK = '#ebe8e0', '#183e33', '#16291f'
WHITE, BUBBLE = '#fffef9', '#d5f6bf'
FONTS = {n: ImageFont.truetype(str(FONT), n) for n in (20, 22, 24, 28, 44, 52)}
HEAVY = {n: ImageFont.truetype(str(BOLD), n) for n in (24, 28, 36, 48, 82)}


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
    d.text((WIDTH-38-d.textlength(label, font=HEAVY[36]), 30), label, font=HEAVY[36], fill=WHITE)
    d.text((38, 114), film['deliverables'], font=FONTS[28], fill=GREEN)
    d.line((38, 640, 1242, 640), fill='#c6c9bd', width=1)
    d.text((38, 665), 'fictional chat. actual services.', font=HEAVY[28], fill=GREEN)
    d.text((1065, 671), 'JOPELO / '+str(list(FILMS).index(next(k for k,v in FILMS.items() if v is film))+1).zfill(2), font=FONTS[22], fill=GREEN)
    return im


def bubble(draw, message, y, t, poster=False):
    outgoing = message['sender'] == 'jopelo'
    text = message['text']
    font = FONTS[44]
    lines = wrap(text, font, 1000)
    w = max(font.getlength(line) for line in lines)+52
    h = 30+len(lines)*46
    x = WIDTH-38-w if outgoing else 38
    age = max(0, t-message['at'])
    # A small 8 px settling movement rather than exaggerated elastic UI motion.
    y += round(8*max(0, 1-age/.16)**2)
    draw.rounded_rectangle((x, y, x+w, y+h), radius=17, fill=BUBBLE if outgoing else WHITE)
    if outgoing:
        draw.polygon(((x+w-20,y),(x+w+9,y),(x+w-2,y+22)), fill=BUBBLE)
    else:
        draw.polygon(((x+20,y),(x-9,y),(x+2,y+22)), fill=WHITE)
    count = len(text) if poster else max(0, int(age*TYPE_RATE))
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


def studio_credit(film, t):
    im=Image.new('RGB',(WIDTH,HEIGHT),'#101010')
    d=ImageDraw.Draw(im)
    age=t-CREDIT_START
    fade=min(1,max(0,age/.24))
    def ink(rgb):return tuple(round(v*fade) for v in rgb)
    paper=ink((245,241,232))
    muted=ink((183,178,170))
    def center(text,y,font,color):
        d.text(((WIDTH-d.textlength(text,font=font))/2,y),text,font=font,fill=color)
    center('A JOPELO ORIGINAL',214,FONTS[20],muted)
    center('JOPELO STUDIO',272,HEAVY[82],paper)
    text='PRESENTS';font=FONTS[28];tracking=10
    width=sum(font.getlength(c) for c in text)+tracking*(len(text)-1)
    x=(WIDTH-width)/2
    for c in text:
        d.text((x,389),c,font=font,fill=paper);x+=font.getlength(c)+tracking
    center(film['name'],477,HEAVY[28],paper)
    center('unserious chat. serious work.',543,FONTS[22],muted)
    return im


def prepare_work_reveal(film_id):
    for index,shot in enumerate(REVEAL_SHOTS[film_id]):
        if 'video' not in shot:continue
        directory=CACHE/(film_id+'-reveal-'+str(index))
        directory.mkdir(exist_ok=True)
        subprocess.run(['ffmpeg','-v','error','-y','-ss',str(shot.get('seek',0)),'-i',str(ROOT/shot['video']),'-t',str(shot['duration']),'-vf',f'fps={FPS},scale={WIDTH}:{HEIGHT}', '-q:v','2',str(directory/'%04d.jpg')],check=True)


def work_reveal(film, t):
    local=t-REVEAL_START
    index=0
    shots=REVEAL_SHOTS[film['id']]
    while index<len(shots)-1 and local>=shots[index]['duration']:
        local-=shots[index]['duration'];index+=1
    shot=shots[index]
    if 'video' in shot:
        number=min(int(shot['duration']*FPS),int(local*FPS)+1)
        path=CACHE/(film['id']+'-reveal-'+str(index))/f'{number:04d}.jpg'
        with Image.open(path) as source:im=source.convert('RGB').resize((WIDTH,HEIGHT))
    else:
        with Image.open(ROOT/shot['image']) as source:
            # A very small push into existing portfolio material; no generated scenes.
            scale=1+.018*min(1,local/shot['duration'])
            im=ImageOps.fit(source.convert('RGB'),(round(WIDTH*scale),round(HEIGHT*scale)))
            left=(im.width-WIDTH)//2;top=(im.height-HEIGHT)//2
            im=im.crop((left,top,left+WIDTH,top+HEIGHT))
    d=ImageDraw.Draw(im)
    d.rectangle((0,0,WIDTH,48),fill='#101010')
    d.text((38,12),'THE WORK / '+film['category'],font=FONTS[20],fill=WHITE)
    stamp='JOPELO STUDIO'
    d.text((WIDTH-38-d.textlength(stamp,font=FONTS[20]),12),stamp,font=FONTS[20],fill=WHITE)
    # Keep the project title and attribution above the native control overlay.
    d.rectangle((0,526,WIDTH,HEIGHT),fill='#101010')
    reveal=film['reveal']
    d.text((38,541),reveal['title'],font=HEAVY[36],fill=WHITE)
    detail=reveal['detail']
    if film['id']=='web':detail=('Fjäll Group' if index==0 else 'SECHA')+' / live website'
    elif film['id']=='styling':detail=('Warm Modern' if index==0 else 'Soft Contemporary')+' / Studio+ interior concept'
    d.text((38,594),detail,font=FONTS[28],fill='#c8c2b8')
    if t<REVEAL_START+.16:
        black=Image.new('RGB',(WIDTH,HEIGHT),'#101010')
        im=Image.blend(black,im,max(0,(t-REVEAL_START)/.16))
    return im


def frame(film, t):
    if t >= REVEAL_START:return work_reveal(film,t)
    if t >= CREDIT_START:return studio_credit(film,t)
    im = base(film, t)
    d=ImageDraw.Draw(im)
    y=166
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
    """Real keyboard recording, edited into natural bursts around each message.

    Recording: russiandoll / PDSounds 555 / public domain via Wikimedia Commons.
    No oscillators or synthesized key clicks; the studio-credit ending is quiet.
    """
    source=ROOT/'assets/services/audio/computer-keyboard.ogg'
    raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(source),'-map','0:a:0','-af','highpass=f=100','-ar',str(RATE),'-ac','1','-f','f32le','pipe:1'])
    keyboard=np.frombuffer(raw,dtype='<f4').astype(np.float64)
    mix=np.zeros((RATE*DURATION,2),dtype=np.float64)
    offset=list(FILMS).index(film_id)*9
    for index,m in enumerate(FILMS[film_id]['messages']):
        start=max(0,m['at']-.43)
        finish=m['at']+len(m['text'])/TYPE_RATE+.09
        n=int((finish-start)*RATE)
        source_start=int((3.1+offset+index*1.87)*RATE)
        clip=keyboard[source_start:source_start+n].copy()
        # Keep the real, irregular performance; only trim, fade and level it.
        ramp=min(int(.018*RATE),len(clip)//2)
        clip[:ramp]*=np.linspace(0,1,ramp)
        clip[-ramp:]*=np.linspace(1,0,ramp)
        pan=.12 if m['sender']=='jopelo' else -.12
        at=int(start*RATE)
        mix[at:at+len(clip),0]+=clip*math.sqrt((1-pan)/2)
        mix[at:at+len(clip),1]+=clip*math.sqrt((1+pan)/2)
    mix *= .70 / max(.001,np.max(np.abs(mix)))
    assert np.max(np.abs(mix))<.95
    path=CACHE/(film_id+'-real-keyboard.wav')
    with wave.open(str(path),'wb') as f:
        f.setnchannels(2);f.setsampwidth(2);f.setframerate(RATE)
        f.writeframes((mix*32767).astype('<i2').tobytes())
    return path


def render(film_id):
    film=FILMS[film_id]
    prepare_work_reveal(film_id)
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
        'format':'20 seconds / 1280×720 / 24fps / H.264 + AAC stereo',
        'direction':'Deadpan chat motion graphics, JOPELO STUDIO PRESENTS card, then existing portfolio work. Studio+ visuals remain labelled as interior concepts.',
        'copy':'../../service-chat-content.js',
        'renderer':'../../tools/render-service-trailers.py',
        'sound':'Physical keyboard recording by russiandoll (PDSounds 555), public domain via Wikimedia Commons. Edited into natural typing bursts; no synthesized keyboard clicks.',
        'sound_provenance':'audio/source.json',
        'ending':'12–14 seconds: JOPELO STUDIO PRESENTS; 14–20 seconds: selected portfolio work reveal.',
        'reveal_sources':REVEAL_SHOTS,
        'reveal_attribution':{k:v['reveal'] for k,v in FILMS.items()},
        'fonts':['../inter-regular.ttf','../inter-black.ttf'],
        'films':{k:{'name':v['name'],'file':k+'.mp4','poster':k+'.jpg'}for k,v in FILMS.items()},
        'icon':{'name':'Bootstrap Icons play-fill','source':'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/icons/play-fill.svg','license':'bootstrap-icons-LICENSE.txt'}
    }
    (OUT/'sources.json').write_text(json.dumps(provenance,indent=2,ensure_ascii=False)+'\n')

if __name__=='__main__':main()
