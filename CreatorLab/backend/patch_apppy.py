"""Patch app.py: fix interest unpacking and add keywords_in_data to response."""
import sys
sys.stdout.reconfigure(encoding='utf-8')

content = open('app.py', encoding='utf-8').read()

# Fix 1: unpack 3-tuple
old1 = 'interest, rl1 = gt.get_interest_over_time(topic_keywords, timeframe=timeframe)'
new1 = 'interest, kws_in_data, rl1 = gt.get_interest_over_time(topic_keywords, timeframe=timeframe)'
if old1 in content:
    content = content.replace(old1, new1, 1)
    print('Fix1 applied: unpacking 3-tuple')
else:
    print('Fix1 NOT NEEDED (already applied?)')

# Fix 2: add keywords_in_data to response
old2 = '                "topic_keywords":      topic_keywords,\n                "timeframe":           timeframe,'
new2 = '                "topic_keywords":      topic_keywords,\n                "keywords_in_data":    kws_in_data,\n                "timeframe":           timeframe,'
if old2 in content:
    content = content.replace(old2, new2, 1)
    print('Fix2 applied: added keywords_in_data')
else:
    # check if already there
    if 'keywords_in_data' in content:
        print('Fix2 NOT NEEDED (already applied)')
    else:
        print('Fix2 NOT FOUND')

open('app.py', 'w', encoding='utf-8').write(content)
print('Saved.')
