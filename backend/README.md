# Limit Break API

## Setup

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_questions
python manage.py runserver 8000
```

The frontend reads `VITE_API_URL` and defaults to `http://localhost:8000/api`.
The questions endpoint is `GET /api/questions/?topic=Limits`.

Each response randomizes the four choices and updates `correct_answer_index` to
match the new order. Questions with an attached diagram return an `image_url`
served from `/media/question-images/`.
