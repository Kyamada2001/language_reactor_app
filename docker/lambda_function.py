import json
from youtube_transcript_api import YouTubeTranscriptApi

def lambda_handler(event, context):
    videoId = event['videoId']
    transcript_list = YouTubeTranscriptApi.list_transcripts(videoId)
    response = []
    for transcript in transcript_list:
        response.append(transcript.fetch())

    return {
        "statusCode": 200,
        "body": json.dumps(response)
    }