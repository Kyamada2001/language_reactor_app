FROM public.ecr.aws/lambda/python:3.8

RUN pip install youtube-transcript-api

COPY lambda_function.py ${LAMBDA_TASK_ROOT}

CMD ["lambda_function.lambda_handler"]