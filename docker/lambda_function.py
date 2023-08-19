import json
from youtube_transcript_api import YouTubeTranscriptApi

def lambda_handler(event, context):

    transcript_list = YouTubeTranscriptApi.list_transcripts('lhr4Ax4C_-4')
    response = []
    for transcript in transcript_list:
        response.append(transcript.fetch())
        
    print(response)
    return {
        "statusCode": 200,
        "body": json.dumps(response)
    }