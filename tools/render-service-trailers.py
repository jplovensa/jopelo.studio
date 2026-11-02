"""Render the five JOPELO service films from existing work and original type/sound.

Requires Python 3, NumPy and FFmpeg (drawtext/libx264/AAC). Run from any directory.
Source downloads keep TLS verification; no synthetic photographic assets are created.
"""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen
import json
import subprocess
import wave
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.cache' / 'service-trailers'
OUT = ROOT / 'assets' / 'services'
FONT = ROOT / 'assets' / 'inter-black.ttf'
REGULAR = ROOT / 'assets' / 'inter-regular.ttf'
FPS, WIDTH, HEIGHT = 24, 1280, 720
SOURCES = {
    'fjall-hero.mp4': 'https://www.fjallgroup.com/assets/hero.mp4',
    'secha-hero.mp4': 'https://www.sechahome.com/assets/video/hero-dressing-room.mp4',
    'josephine.png': 'https://www.sechahome.com/studio/assets/designers/josephine.png',
    'fjall-logo.png': 'https://www.fjallgroup.com/assets/fjall-logo.png',
    'secha-logo.png': 'https://www.sechahome.com/assets/secha-logo.png',
    'retrofit-interior.webp': 'https://www.fjallgroup.com/assets/retrofit-interior.webp',
    'nuanu.webp': 'https://www.fjallgroup.com/assets/nuanu.webp',
}
CACHE.mkdir(parents=True, exist_ok=True)
OUT.mkdir(parents=True, exist_ok=True)


def run(args):
    result = subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', *map(str, args)], capture_output=True, text=True)
    if result.returncode:
        raise RuntimeError(result.stderr[-6000:])


def source(name):
    return CACHE / name


def title(text, size=88, color='f5f1e8', y=344):
    return {'text': text, 'size': size, 'color': color, 'y': y}


# Six two-second scenes per film: hook, work, detail, statement, proof, signature.
FILMS = {
    'strategy': {
        'name': 'Strategy & storytelling', 'category': 'DIRECTION', 'poster_time': 0.9,
        'shots': [
            {'color': 'eeeae2', 'title': title('STRATEGY &\nSTORYTELLING.', 84, '141414', 270), 'label': 'A CLEAR DIRECTION', 'light': True},
            {'image': source('josephine.png'), 'title': title('START WITH\nTHE QUESTION.', 72), 'label': 'JOSEPHINE / PURPOSE BEFORE EVERYTHING'},
            {'video': source('secha-hero.mp4'), 'seek': 3, 'label': 'CONNECT THE VISION TO EVERYDAY LIFE'},
            {'color': '101010', 'title': title('ONE CLEAR\nDIRECTION.', 104, 'c1472b', 250), 'label': 'POSITIONING / NARRATIVE / STRATEGY'},
            {'image': source('retrofit-interior.webp'), 'title': title('GIVE THE IDEA\nA WAY FORWARD.', 76), 'label': 'GARUDA SPARK / A NEW PURPOSE FOR EXISTING SPACE'},
            {'signature': True},
        ],
    },
    'web': {
        'name': 'Web experiences', 'category': 'DIGITAL', 'poster_time': 0.9,
        'shots': [
            {'split': True, 'title': title('WEB\nEXPERIENCES.', 84), 'label': 'DESIGN / BUILD / EXPERIENCE'},
            {'video': ROOT / 'assets/fjall-trailer.mp4', 'seek': 2, 'label': 'FJÄLL GROUP / DIGITAL IDENTITY'},
            {'video': source('secha-hero.mp4'), 'seek': 2, 'label': 'SECHA / A CLEARER JOURNEY'},
            {'video': ROOT / 'assets/secha-trailer.mp4', 'seek': 4, 'label': 'SECHA / DESIGN. FINANCE. RENOVATE.'},
            {'color': 'eeeae2', 'title': title('DESIGN. BUILD.\nMAKE A MARK.', 92, '141414', 260), 'label': 'EXPERIENCES WITH PURPOSE', 'light': True},
            {'signature': True},
        ],
    },
    'brand': {
        'name': 'Brand worlds', 'category': 'IDENTITY', 'poster_time': 0.9,
        'shots': [
            {'color': '101010', 'title': title('JOPELO\nSTUDIO.', 116, 'c1472b', 240), 'label': 'A BRAND WITH A POINT OF VIEW'},
            {'image': ROOT / 'assets/portrait.png', 'title': title('DISTINCT.\nHUMAN.\nREMEMBERED.', 68, 'f5f1e8', 260), 'label': 'THE PERSON. THE PRESENCE. THE STORY.'},
            {'logo': source('secha-logo.png'), 'color': 'eeeae2', 'label': 'SECHA / A SENSE OF HOME', 'light': True},
            {'logo': source('fjall-logo.png'), 'color': '101010', 'label': 'FJÄLL GROUP / CONNECTED THINKING'},
            {'color': 'ae3b27', 'title': title('ONE STORY.\nEVERY TOUCHPOINT.', 80, 'f5f1e8', 270), 'label': 'IDENTITY / VISUAL SYSTEMS / DIGITAL EXPRESSION'},
            {'signature': True},
        ],
    },
    'styling': {
        'name': 'Styling your space', 'category': 'INTERIORS', 'poster_time': 0.9,
        'shots': [
            {'image': ROOT / 'assets/styling/warm-modern-room.webp', 'title': title('STYLING\nYOUR SPACE.', 80), 'label': 'SECHA STUDIO+ / INTERIOR CONCEPTS'},
            {'video': source('secha-hero.mp4'), 'seek': 4, 'label': 'A ROOM FOR THE WAY YOU LIVE'},
            {'image': ROOT / 'assets/styling/soft-contemporary-room.webp', 'label': 'SOFT CONTEMPORARY / LIGHT. MATERIAL. RHYTHM.'},
            {'image': ROOT / 'assets/styling/earthy-retreat-room.webp', 'label': 'EARTHY RETREAT / WARMTH. TEXTURE. QUIET.'},
            {'image': ROOT / 'assets/styling/urban-studio-room.webp', 'title': title('MADE TO\nFEEL LIKE YOU.', 80), 'label': 'STUDIO+ / GENERATED INTERIOR CONCEPT'},
            {'signature': True},
        ],
    },
    'ventures': {
        'name': 'Ventures & real estate', 'category': 'ADVISORY', 'poster_time': 0.9,
        'shots': [
            {'video': source('fjall-hero.mp4'), 'title': title('VENTURES &\nREAL ESTATE.', 80), 'label': 'A COMMERCIAL PERSPECTIVE'},
            {'image': source('retrofit-interior.webp'), 'label': 'GARUDA SPARK / MALANG / FJÄLL GROUP'},
            {'image': source('nuanu.webp'), 'label': 'NUANU CREATIVE CITY / FJÄLL PROJECT STUDIES'},
            {'video': source('secha-hero.mp4'), 'seek': 6, 'label': 'SPACE. OPPORTUNITY. A PATH TO DELIVERY.'},
            {'color': 'eeeae2', 'title': title('FROM CODEBASES\nTO CONCRETE.', 88, '141414', 270), 'label': 'STRATEGY CONNECTED TO EXECUTION', 'light': True},
            {'signature': True},
        ],
    },
}


def sound_design():
    """An original low-volume instrumental pulse, no samples or borrowed music."""
    rate, duration = 44100, 12
    t = np.arange(rate * duration) / rate
    rng = np.random.default_rng(20261102)
    bed = .018 * np.sin(2*np.pi*55*t) + .012*np.sin(2*np.pi*82.4069*t) + .008*np.sin(2*np.pi*110*t)
    bed *= .65 + .35 * np.sin(np.pi * t / duration)
    for beat in [0, 2, 4, 6, 8, 10]:
        dt = np.maximum(t - beat, 0)
        active = (t >= beat) & (t < beat + .8)
        kick = np.sin(2*np.pi*(42*dt + 4*(1-np.exp(-dt*22)))) * np.exp(-dt*8) * .11
        air = rng.normal(0, 1, len(t)) * np.exp(-dt*24) * .008
        bed += (kick + air) * active
    for beat in [1.75, 3.75, 5.75, 7.75, 9.75]:
        dt = t - beat
        envelope = np.clip(dt/.20, 0, 1) * np.clip((.25-dt)/.08, 0, 1)
        bed += .006 * np.sin(2*np.pi*(180*dt + 640*dt*dt)) * envelope
    envelope = np.minimum(1, t/.25) * np.minimum(1, (duration-t)/.6)
    left = np.tanh(bed * 1.3) * envelope
    right = np.tanh((bed + .003*np.sin(2*np.pi*73.416*t)) * 1.3) * envelope
    audio = (np.stack([left, right], axis=1).clip(-.3, .3) * 32767).astype('<i2')
    path = CACHE / 'original-studio-pulse.wav'
    with wave.open(str(path), 'wb') as f:
        f.setnchannels(2); f.setsampwidth(2); f.setframerate(rate); f.writeframes(audio.tobytes())
    return path


def text_filter(work, name, text, *, size, color, x='64', y='344', moving=True):
    path = work / (name + '.txt')
    path.write_text(text)
    alpha = "min(1,t/0.12)*min(1,(2-t)/0.12)"
    if moving:
        x = f"{x}+60*pow(max(0,1-t/0.45),3)"
    return f"drawtext=fontfile={FONT}:textfile={path}:fontsize={size}:fontcolor=0x{color}:line_spacing=6:x='{x}':y='{y}':alpha='{alpha}'"


def render_shot(film_id, index, shot):
    film = FILMS[film_id]
    work = CACHE / film_id
    work.mkdir(exist_ok=True)
    destination = work / f'{index:02}.mp4'
    args = ['-threads', '2', '-filter_threads', '1', '-filter_complex_threads', '1']
    light = shot.get('light', False)
    if shot.get('signature'):
        shot = {'color': '101010', 'label': film['name'].upper(), 'signature': True}
    if shot.get('split'):
        args += ['-stream_loop','-1','-i',source('fjall-hero.mp4'),'-stream_loop','-1','-i',ROOT/'assets/secha-trailer.mp4']
        graph = '[0:v]scale=1280:720,crop=640:720:220:0,setsar=1[l];[1:v]crop=800:720:0:0,scale=640:576,pad=640:720:0:72:color=black,setsar=1[r];[l][r]hstack=inputs=2,fps=24,format=yuv420p'
        base = '[base]'
    elif shot.get('logo'):
        args += ['-f','lavfi','-i',f"color=c=0x{shot['color']}:s={WIDTH}x{HEIGHT}:r=24",'-loop','1','-i',shot['logo']]
        graph = "[1:v]scale=600:360:force_original_aspect_ratio=decrease,format=rgba[logo];[0:v][logo]overlay=x='(W-w)/2+24*sin(t*1.3)':y='(H-h)/2',fps=24,format=yuv420p"
        base = '[base]'
    elif shot.get('video'):
        args += ['-stream_loop','-1','-ss',str(shot.get('seek',0)),'-i',shot['video']]
        graph = '[0:v]scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1,fps=24,eq=saturation=.93:contrast=1.025:brightness=-.012'
        base = '[base]'
    elif shot.get('image'):
        args += ['-loop','1','-i',shot['image']]
        graph = "[0:v]scale=1440:900:force_original_aspect_ratio=increase,crop=1440:900,zoompan=z='1.03+on*0.001':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1280x720:fps=24,setsar=1,eq=saturation=.93:contrast=1.025:brightness=-.012"
        base = '[base]'
    else:
        args += ['-f','lavfi','-i',f"color=c=0x{shot.get('color','101010')}:s={WIDTH}x{HEIGHT}:r=24"]
        graph = '[0:v]format=yuv420p'
        base = '[base]'
    graph += ',noise=alls=2:allf=t+u' + base + ';'
    filters = []
    if shot.get('title') and (shot.get('image') or shot.get('video') or shot.get('split')):
        filters.append('drawbox=x=0:y=300:w=iw:h=376:color=black@0.27:t=fill')
    if not light:
        filters += ['drawbox=x=0:y=0:w=iw:h=44:color=black:t=fill','drawbox=x=0:y=ih-44:w=iw:h=44:color=black:t=fill']
    ink = '141414' if light else 'f5f1e8'
    filters.append(text_filter(work,f'{index}-owner','JOPELO STUDIO  /  '+film['category'],size=14,color=ink,y='17',moving=False))
    if shot.get('signature'):
        filters.append(text_filter(work,f'{index}-signature','JOPELO.',size=132,color='f5f1e8',x='(w-text_w)/2',y='(h-text_h)/2-25'))
        filters.append(text_filter(work,f'{index}-tag','THINK. BUILD. MAKE A MARK.',size=18,color='b9b3a8',x='(w-text_w)/2',y='470',moving=False))
    elif shot.get('title'):
        item=shot['title']
        filters.append(text_filter(work,f'{index}-title',item['text'],size=item['size'],color=item['color'],y=str(item['y'])))
    filters.append(text_filter(work,f'{index}-label',shot.get('label',''),size=13,color=ink,y='688',moving=False))
    graph += '[base]' + ','.join(filters) + '[out]'
    script = work / f'{index}-filters.txt'; script.write_text(graph)
    args += ['-filter_complex_script',script,'-map','[out]','-t','2','-an','-c:v','libx264','-preset','fast','-crf','22','-pix_fmt','yuv420p','-r','24','-g','48','-threads','2',destination]
    run(args)
    return destination


def render_film(item, score):
    film_id, film = item
    work = CACHE / film_id; work.mkdir(exist_ok=True)
    clips = [render_shot(film_id, i, shot) for i,shot in enumerate(film['shots'])]
    playlist = work / 'edit.txt'
    playlist.write_text(''.join(f"file '{path}'\n" for path in clips))
    destination = OUT / (film_id+'.mp4')
    run(['-f','concat','-safe','0','-i',playlist,'-i',score,'-map','0:v','-map','1:a','-c:v','copy','-c:a','aac','-b:a','128k','-t','12','-movflags','+faststart',destination])
    run(['-ss',str(film['poster_time']),'-i',destination,'-frames:v','1','-q:v','2',OUT/(film_id+'.jpg')])
    print(f"Rendered {film_id}: {destination.stat().st_size:,} bytes",flush=True)


def main():
    for name,url in SOURCES.items():
        path=source(name)
        if not path.exists():
            with urlopen(url,timeout=60) as response:
                path.write_bytes(response.read())
    score=sound_design()
    with ThreadPoolExecutor(max_workers=2) as pool:
        list(pool.map(lambda item:render_film(item,score),FILMS.items()))
    provenance={'format':'12 seconds / 1280×720 / 24fps / H.264 + original AAC stereo sound design','photographic_assets':'Existing user portfolio footage, photography and Studio+ concepts; no newly generated photographic scenes','sources':SOURCES,'sound':'Original synthesized instrumental pulse; no third-party samples or Netflix audio','films':{k:{'name':v['name'],'file':k+'.mp4','poster':k+'.jpg'}for k,v in FILMS.items()}}
    provenance['icon']={'name':'Bootstrap Icons play-fill','source':'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.13.1/icons/play-fill.svg','license':'bootstrap-icons-LICENSE.txt'}
    (OUT/'sources.json').write_text(json.dumps(provenance,indent=2)+'\n')


if __name__=='__main__':
    main()
