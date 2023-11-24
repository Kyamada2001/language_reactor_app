import json
from youtube_transcript_api import YouTubeTranscriptApi
import time

def lambda_handler(event, context):

    videoId = event['videoId']
    transcript_list = YouTubeTranscriptApi.list_transcripts(videoId)
    captions = []
    translates = []

    for transcript in transcript_list:
        captions.append(transcript.fetch())
        translates.append(transcript.translate('ja').fetch())

    # try:
    tmp_caption = []
    for index, value in enumerate(captions[0]):
        if index % 2 == 0 and index < len(captions[0])-1:
            value['text'] += (' ' + captions[0][index+1]['text'])
            tmp_translate = [translate['text'] for translate in translates[0] if translate['start'] == value['start']]
            #完全一致の字幕がない場合は、時間範囲が当てはまる字幕を取得
            # TOOD:奇数の時に処理に入らない
            if not tmp_translate:
                filtered_translates = filter(lambda translate: float(translate['start']) <= float(value['start']) <= float(translate['start']) + float(translate['duration']), translates[0])
                tmp_translate = [translate['text'].replace(' ', '') for translate in filtered_translates]
            # if not tmp_translate:
            #     for translate in translates[0]:
            #         print(translate)
            #         translate_start = float(translate['start'])
            #         translate_end = translate_start + float(translate['duration'])
            #         captionTime = float(value['start'])
            #         if translate_start <= captionTime and captionTime <= translate_end:
            #             tmp_translate = translate['text'].replace(' ', '')
            tmp_translate_sec = [translate['text'].replace(' ', '') for translate in translates[0] if translate['start'] == captions[0][index+1]['start']]
            if not tmp_translate_sec:
                filtered_translates = filter(lambda translate: float(translate['start']) <= float(captions[0][index+1]['start']) <= float(translate['start']) + float(translate['duration']), translates[0])
                tmp_translate_sec = [translate['text'].replace(' ', '') for translate in filtered_translates]
            tmp_translate += ''.join(tmp_translate_sec)
            value['translate'] = ''.join(tmp_translate)
            tmp_caption.append(value)

    # tmp_translate = []
    # for index, value in enumerate(translates[0]):
    #     if index % 2 == 0 and index < len(translates[0])-1:
    #         # print(translates[0][3393]['text'])
    #         value['text'] += translates[0][index+1]['text']
    #         tmp_translate.append(value)
    # # print(captions)
    # print(tmp_caption)
    # except ZeroDivisionError as e:
    #     print('catch ZeroDivisionError:', e)

    print(tim)
    return {
        "statusCode": 200,
        "body": json.dumps({
            "caption": json.dumps(tmp_caption),
            "translate_caption": json.dumps(tmp_translate)
        })
    }