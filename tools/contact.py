import sys,glob
from PIL import Image
fs=sys.argv[2:]
tiles=[]
for f in fs:
    im=Image.open(f).convert('RGBA');im.thumbnail((380,380))
    bg=Image.new('RGBA',(390,390),(255,0,255,255));bg.alpha_composite(im,(5,5));tiles.append(bg)
cols=4;rows=(len(tiles)+cols-1)//cols
sh=Image.new('RGB',(390*cols,390*rows),(40,40,40))
for i,t in enumerate(tiles): sh.paste(t.convert('RGB'),((i%cols)*390,(i//cols)*390))
sh.save(sys.argv[1])
