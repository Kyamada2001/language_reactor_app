import json
from youtube_transcript_api import YouTubeTranscriptApi

def lambda_handler(event, context):
    videoId = event['videoId']
    transcript_list = YouTubeTranscriptApi.list_transcripts(videoId)
    caption = []
    translate = []
    for transcript in transcript_list:
        caption.append(transcript.fetch())
        translate.append(transcript.translate('ja').fetch())

    # response = {
    #     "caption": json.dumps(caption),
    #     "translate_caption": json.dumps(translate)
    # }
    return {
        "statusCode": 200,
        "body": json.dumps({
            "caption": json.dumps(caption),
            "translate_caption": json.dumps(translate)
        })
    }