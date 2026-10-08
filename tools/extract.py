#!/usr/bin/env python3
"""Wycina sprity z arkuszy JPG z wypaloną szachownicą i robi z nich PNG z kanałem alfa."""
import sys, os, numpy as np
from PIL import Image
from scipy import ndimage as ndi
UP='/root/.claude/uploads/466c5cf4-4b60-5ff0-9953-81446d525846/'
OUT='/home/claude/helikopter/assets_src/'
os.makedirs(OUT,exist_ok=True)

def spans(idx,n):
    out=[];s=0
    groups=np.split(idx,np.where(np.diff(idx)>1)[0]+1) if len(idx) else []
    for g in groups:
        if g[0]-s>100: out.append((s,g[0]))
        s=g[-1]+1
    if n-s>100: out.append((s,n))
    return out or [(0,n)]
def panels(a):
    h,w,_=a.shape
    white=(a.min(axis=2)>235)
    rows=np.where(white.mean(axis=1)>.9)[0]
    res=[]
    for (y0,y1) in spans(rows,h):
        cols=np.where(white[y0:y1].mean(axis=0)>.75)[0]
        cs=spans(cols,w)
        if len(cs)==1 and (y1-y0)<1100 and w>=2000 and y0>0: cs=[(0,1024),(1024,w)]
        for (x0,x1) in cs: res.append((int(x0),int(y0),int(x1),int(y1)))
    return res

def fit_axis(prof):
    n=len(prof);best=(-1,41,0)
    for T in np.arange(39.0,43.0,.02):
        for ph in np.arange(0,T,.5):
            pos=np.arange(ph,n-1,T);i=np.round(pos).astype(int)
            s=(prof[np.clip(i,0,n-1)]+prof[np.clip(i-1,0,n-1)]).sum()/len(i)
            if s>best[0]: best=(s,T,ph)
    return best[1],best[2]

def cut(img,box,name,minfrac=.02,tile=False):
    a=np.asarray(img.convert('RGB')).astype(np.float32)
    x0,y0,x1,y1=box;a=a[y0:y1,x0:x1];h,w,_=a.shape
    L=a.mean(axis=2);chroma=a.max(axis=2)-a.min(axis=2)
    CH=3.6;g=122.0
    m1=ndi.uniform_filter(L,5);m2=ndi.uniform_filter(L*L,5);std=np.sqrt(np.maximum(m2-m1*m1,0))
    cand=(chroma<=2.8)&(std<=1.6)&((L<=10)|((L>=.08*g)&(L<=g+20)))
    cand=ndi.binary_closing(cand,iterations=2)
    black=L<=60
    lab,n=ndi.label(cand)
    border=set(np.unique(np.concatenate([lab[0],lab[-1],lab[:,0],lab[:,-1]])))-{0}
    bg=np.isin(lab,list(border))
    sizes=ndi.sum(cand,lab,range(1,n+1))
    for i in range(1,n+1):
        if i in border or sizes[i-1]<500: continue
        m=lab==i;fb=(m&black).sum()/m.sum()
        if .15<fb<.85: bg|=m
    # zamknięte kwadraty tła wewnątrz sprita (np. wirniki drona): duże, zwarte, neutralne
    objs=ndi.find_objects(lab)
    for i in range(1,n+1):
        if i in border or sizes[i-1]<400: continue
        sl=objs[i-1]
        if min(sl[0].stop-sl[0].start,sl[1].stop-sl[1].start)>=14: bg|=(lab==i)
    bg|=ndi.binary_dilation(bg,iterations=2)&(chroma<=CH)&(std>1.6)
    fg=~bg
    fg=ndi.binary_opening(fg,iterations=1)
    lab2,n2=ndi.label(fg)
    sz=ndi.sum(fg,lab2,range(1,n2+1));big=sz.max()
    chk=(chroma<=CH)&(L<=g+20)
    keep=[]
    for i,v in enumerate(sz):
        if v<minfrac*big: continue
        m=lab2==i+1
        if chk[m].mean()>.6 and v<.9*big: continue
        keep.append(i+1)
    keep2=[]
    for i in keep:
        yy,xx=np.where(lab2==i)
        if sz[i-1]<.2*big and xx.max()<160 and yy.max()<160: continue
        keep2.append(i)
    fg=np.isin(lab2,keep2)
    filled=ndi.binary_fill_holes(fg)
    if name=='drone':
        holes=filled&~fg;hl,hn=ndi.label(holes);hs=ndi.sum(holes,hl,range(1,hn+1))
        for i,v in enumerate(hs):
            if v<4000: fg|=(hl==i+1)
    else: fg=filled
    fg=ndi.binary_erosion(fg,iterations=2)
    alpha=ndi.gaussian_filter(fg.astype(float),.9)
    alpha=np.clip((alpha-.15)/.7,0,1)
    ys2,xs2=np.where(fg)
    y0b,y1b,x0b,x1b=ys2.min(),ys2.max()+1,xs2.min(),xs2.max()+1
    rgba=np.dstack([np.clip(a,0,255).astype(np.uint8),(alpha*255).astype(np.uint8)])[y0b:y1b,x0b:x1b]
    Image.fromarray(rgba,'RGBA').save(OUT+name+'.png')
    print(name,rgba.shape[1],rgba.shape[0],)

def run():
    sheets={'4264330e':'icons','8f40027c':'boss','76136155':'ground','8820111f':'air','62e79583':'wings','4bf3771b':'rotor','56b0aa0a':'heli'}
    for k,v in sheets.items():
        img=Image.open(UP+k+'-image.jpg').convert('RGB');a=np.asarray(img)
        pans=panels(a) if v in('boss','ground','air','wings') else [(0,0,2048,2048)]
        print(v,pans)
        names={'boss':['boss1','boss2','boss3','boss4'],'ground':['turret','tank','aa','bunker'],'air':['drone','jet','gunship','bomber'],'wings':['wing1','wing2','wing3','wing4'],'rotor':['rotor'],'heli':['heli']}.get(v)
        if v=='icons':
            cut(img,(0,0,1024,2048),'token');cut(img,(1024,0,2048,2048),'repair');continue
        for box,nm in zip(pans,names): cut(img,box,nm,minfrac=.02 if v!='ground' else .004)
only=sys.argv[1:] 
run()
