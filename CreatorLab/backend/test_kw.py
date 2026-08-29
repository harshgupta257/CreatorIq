import sys, os
sys.stdout.reconfigure(encoding='utf-8')
os.chdir(r'C:\Users\harsh\OneDrive\Desktop\RESUMEEEEE\New folder\CreatorLab\backend')
from collections import Counter
from youtube_api import YouTubeAnalyzer

yt = YouTubeAnalyzer()
videos = yt.get_channel_videos('UCAxTVjkczLTAVRiwivm-z8g', max_results=20)

STOPWORDS = {
    'the','and','for','with','how','what','this','that','are','you',
    'your','new','our','why','was','has','its','get','can','but','not',
    'have','from','they','will','been','more','than','also','just','into',
    'about','when','there','their','which','would','could','should',
    'kya','hai','kyu','kyun','aap','main','mera','mere','kaise','kab',
    'yeh','iska','uska','hain','bhi','unka','wala','wali','nahi','iske',
    'video','hindi','english','channel','part','full','short','live',
    'subscribe','like','share','comment','watch','today',
}

BLACKLIST = {
    'interstellar','inspired','think','yourself','leave','stop',
    'back','time','again','know','good','great','best','mind',
    'real','true','life','love','feel','make','work','need',
    'past','future','reality','people','world','human','things',
    'thing','does','doing','being','become','always','never','every','other',
    'power','point','right','wrong','words','word','idea','each','even','still',
    'only','them','then','they','this','with','your','mine','here',
    'tips','ways','type','kind','fact','story','show','talk','tell','said','says','ask','answer','read',
}

wc = Counter()
for v in videos:
    for tag in (v.get('tags') or []):
        for word in tag.lower().split():
            word = word.strip('.,!?-"\'#@|()')
            if len(word) > 3 and word not in STOPWORDS and word.isalpha():
                wc[word] += 1
    for word in (v.get('title') or '').lower().split():
        word = word.strip('.,!?-"\'#@|()?!')
        if len(word) > 3 and word not in STOPWORDS and word.isalpha():
            wc[word] += 1

best = [(w, c) for w, c in wc.most_common(40) if len(w) >= 4 and w not in BLACKLIST]
print('Top keywords after blacklist:')
for w, c in best[:10]:
    print(f'  {w}: {c}')
print('Selected for trends:', [w for w, _ in best[:3]])
