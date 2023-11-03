import json
from youtube_transcript_api import YouTubeTranscriptApi

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
            value['text'] += captions[0][index+1]['text']
            tmp_translate = [translate['text'] for translate in translates[0] if translate['start'] == value['start']]
            value['translate'] = ' '.join(tmp_translate)
            print(value['translate'])
            # value['translate'] += (translate['text'] for translate in translates[0] if translate['start'] == captions[0][index+1]['start'])
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

    # print(tmp_caption)
    return {
        "statusCode": 200,
        "body": json.dumps({
            "caption": json.dumps(tmp_caption),
            "translate_caption": json.dumps(tmp_translate)
        })
    }