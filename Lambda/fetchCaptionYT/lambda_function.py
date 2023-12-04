import json
from youtube_transcript_api import YouTubeTranscriptApi
import time

def lambda_handler(event, context):
    print(event)
    try:
        params = json.loads( event['body'] )#本番Lambda用
        videoId = params['videoId']#本番Lambda用
        transcript_list = YouTubeTranscriptApi.list_transcripts(videoId)
        captions = []
        translates = []

        for transcript in transcript_list:
            captions.append(transcript.fetch())
            translates.append(transcript.translate('ja').fetch())

        tmp_caption = []
        for index in range(0, len(captions[0]), 2):
            tmp_translate = [translate['text'] for translate in translates[0] if translate['start'] == captions[0][index]['start']]
            #完全一致の字幕がない場合は、時間範囲が当てはまる字幕を取得
            # if not tmp_translate:
            #     filtered_translates = filter(lambda translate: float(translate['start']) <= float(captions[0][index]['start']) <= float(translate['start']) + float(translate['duration']), translates[0])
            #     # filtered_translates = filter(lambda translate: float(translate['start']) <= float(captions[0][index]['start']) <= float(translate['start']) + (float(translate['duration']) if float(translate['duration']) < 5 else 4), translates[0])
            #     tmp_translate = [translate['text'].replace(' ', '') for translate in filtered_translates]

            if index < len(captions[0]) - 1: #字幕数が奇数の時に処理に入らないように
                captions[0][index]['text'] += (' ' + captions[0][index+1]['text']) #元データを修正してしまうので良くないかもしれない

                tmp_translate_sec = [translate['text'].replace(' ', '') for translate in translates[0] if translate['start'] == captions[0][index+1]['start']]
                # if not tmp_translate_sec:
                #     filtered_translates = filter(lambda translate: float(translate['start']) <= float(captions[0][index+1]['start']) <= (float(translate['start']) + float(translate['duration'])), translates[0])
                #     # filtered_translates = filter(lambda translate: float(translate['start']) <= float(captions[0][index+1]['start']) <= float(translate['start']) + (float(translate['duration'] if float(translate['duration']) < 5 else 4)), translates[0])
                #     tmp_translate_sec = [translate['text'].replace(' ', '') for translate in filtered_translates]
                if not tmp_translate == tmp_translate_sec:
                    tmp_translate += ''.join(tmp_translate_sec)
                captions[0][index]['translate'] = ''.join(tmp_translate)
                captions[0][index]['duration'] = (float(captions[0][index+1]['start']) - float(captions[0][index]['start']) - float(captions[0][index]['duration'])) + float(captions[0][index]['duration']) + float(captions[0][index+1]['duration']) #正しい時間まで表示されるようdurationを設定
                tmp_caption.append(captions[0][index])
        return {
            "body": json.dumps({
                "statusCode": 200,
                "caption": json.dumps(tmp_caption)
            })
        }
    except Exception as e:
        print("以下エラー内容")
        print(str(type(e)))
        return {
            "body": json.dumps({
                "statusCode": 500,
                "caption": ''
            })
        }