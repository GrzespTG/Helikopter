#!/usr/bin/env python3
"""Skaluje wycięte sprity i kafle terenu i pakuje je do src/assets.js (base64)."""
import base64, io, json, numpy as np
from PIL import Image
from scipy import ndimage as ndi
SRC='/home/claude/helikopter/assets_src/';UP='/root/.claude/uploads/466c5cf4-4b60-5ff0-9953-81446d525846/'
A={};META={}
def put(key,im,fmt='WEBP',q=84):
    b=io.BytesIO()
    if fmt=='JPEG': im.convert('RGB').save(b,'JPEG',quality=q,optimize=True)
    else: im.save(b,'WEBP',quality=q,method=6)
    mime='image/jpeg' if fmt=='JPEG' else 'image/webp'
    A[key]='data:%s;base64,%s'%(mime,base64.b64encode(b.getvalue()).decode())
    META[key]=[im.width,im.height]
    print(key,im.width,im.height,len(b.getvalue())//1024,'KB')
def load(n): return Image.open(SRC+n+'.png').convert('RGBA')
def fit(im,longest=None,width=None,height=None,rot=0,flipv=False):
    if rot: im=im.rotate(rot,expand=True,resample=Image.BICUBIC)
    if flipv: im=im.transpose(Image.FLIP_TOP_BOTTOM)
    if longest: s=longest/max(im.size)
    elif width: s=width/im.width
    else: s=height/im.height
    return im.resize((max(1,round(im.width*s)),max(1,round(im.height*s))),Image.LANCZOS)
# gracz
heli=load('heli');put('heli',fit(heli,height=340))
put('rotor',fit(load('rotor'),longest=330))
for i in range(1,5): put('wing%d'%i,fit(load('wing%d'%i),width=230,flipv=True))
# wrogowie powietrzni (nos w dół)
put('drone',fit(load('drone'),longest=116));put('jet',fit(load('jet'),longest=180))
put('gunship',fit(load('gunship'),longest=250,rot=180));put('bomber',fit(load('bomber'),longest=380,rot=180))
# naziemni
put('turret',fit(load('turret'),longest=132));put('barrel',fit(load('barrel') if False else Image.open(SRC+'barrel.png'),longest=150))
put('tank',fit(load('tank'),height=196));put('aa',fit(load('aa'),height=172));put('bunker',fit(load('bunker'),width=190))
# bossowie
for i,rot in zip(range(1,5),[0,180,0,180]): put('boss%d'%i,fit(load('boss%d'%i),longest=620,rot=rot))
put('token',fit(load('token'),longest=100));put('repair',fit(load('repair'),longest=100))
# kafle terenu
im=Image.open(UP+'ebcfc5c3-image.jpg').convert('RGB')
boxes=[(49,693,416,1357),(446,689,816,1360),(844,690,1206,1363),(1235,691,1603,1357),(1627,691,1997,1355)]
for i,(x0,y0,x1,y1) in enumerate(boxes):
    t=im.crop((x0+8,y0+8,x1-8,y1-8));t=t.resize((360,round(360*t.height/t.width)),Image.LANCZOS)
    put('tile%d'%i,t,'JPEG',82)
open('/home/claude/helikopter/src/assets.js','w').write('const ASSETS='+json.dumps(A)+';\nconst ASSET_META='+json.dumps(META)+';\n')
print('razem',sum(len(v) for v in A.values())//1024,'KB base64')
