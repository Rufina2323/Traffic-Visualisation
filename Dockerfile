FROM python:3.12.6

WORKDIR /app

RUN adduser --disabled-password user
RUN chown -R user /app
USER user

COPY requirements.txt .

RUN python -m pip install -r requirements.txt

COPY ./app /app

CMD ["python", "-m", "gunicorn", "-k", "eventlet", "-b", "0.0.0.0:8000", "server:app"]
